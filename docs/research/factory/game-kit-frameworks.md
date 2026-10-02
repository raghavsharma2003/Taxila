# Game kit frameworks, and the Taxila Game SDK

**Date:** 2026-10-02 · **Question:** which game runtime should the Forge builder write against (Phaser 3/4, KAPLAY, PixiJS v8, Excalibur, LittleJS, three.js / Babylon.js, Matter.js / Rapier, Howler)? And what is the SDK the agent must use: telemetry, pedagogy hooks, Hinglish voice cues, accessibility, a level schema, and eight archetypes where the learning is the mechanic?
**Builds on, does not repeat:** `factory/coding-agent-harnesses.md` (Forge loop, GameSpec, validators V0–V7, "templates beat freedom", `window.__forge` state injection), `tech-and-market.md` §3 (T0–T3 tiers, sandbox iframe + CSP, bridge v1), `content/maths-engines.md` §1 (R1–R10) and §3 (bridge v2, `MathValue`, probes, misconception ids), `content/science-engines.md` §2 (salience, facts not prose, low-end budget), `design/kids-ux-ages.md` §4 (hit targets, holdover guard), `learning-science.md` §2.4 (seductive details, rewards).

| tag | meaning |
|---|---|
| **[V]** | verified this session: measured here (scripts and raw numbers in this folder), or read in the installed package source / changelog |
| **[S]** | secondary: paper page, abstract or index; not checked against full text |
| **[M]** | from memory of the source; not re-checked this session |
| **[U]** | our design hypothesis or estimate; measure before relying on it |

> **Model note.** The brief lists `taxila-opus` / `taxila-sonnet`. `context/decisions.md#azure-only-compute` (same day) records both deployments **deleted** and Claude excluded from builds (`rejected.md#claude-on-foundry-credits`). Every familiarity number below is therefore measured on the actual Forge builder, **`taxila-codex` (gpt-5.3-codex)**. Nothing in the kit choice depends on the model family; if Claude returns, rerun the probe (§2.4) with `--model`.

---

## 0. TL;DR (decisions)

1. **Runtime: Phaser 4 (pin `phaser@4.2.1`, MIT), behind a Taxila facade, `@taxila/game-kit` ("tgk@1"). Phaser 3.90 is the pre-approved fallback, switchable by a kit build flag.** Why Phaser:
   - **Familiarity.** It is the only 2D framework that is both a full game framework and heavily represented in public code: 1.53M npm downloads/month and 2,228 Stack Overflow questions **[V]**. Every other 2D *game* framework has under 36k downloads/month **[V]**.
   - **Probe result.** On our builder (gpt-5.3-codex, n = 8 per framework) Phaser 4 passed **8/8** functional checks, the same as vanilla Canvas 8/8 and PixiJS 8/8. Phaser 3 scored 7/8, LittleJS 7/8, three 7/8, KAPLAY 6/8 and Excalibur **3/8** (§2.4) **[V]**.
   - **Features.** It ships scenes, pointer and touch, tweens, Arcade and Matter physics, WebAudio sound, a loader and a scale manager. These are the parts an agent would otherwise hand-roll, and hand-rolled plumbing is where the agents studied in OpenGame and WebGameBench fail **[S]**.
   - **Agent support.** The npm package ships **28 official agent "skills"** (545 kB of markdown), including a v3→v4 migration skill **[V, `node_modules/phaser/skills/`]**.
2. **Why v4 rather than 3.90, and why the call stays open until real devices are measured.**
   - **The sibling decision.** `factory/llm-game-generation.md` (same day) builds on OpenGame's Phaser 3.90 templates.
   - **For v4:**
     - v3 is end-of-line (3.90, 2025-05-23) **[V]**.
     - v4 adds WebGL context restoration, which matters in an Android WebView that loses GL when the app is backgrounded **[V changelog; M for the Android behaviour]**.
     - As an esbuild ESM bundle (the way the kit ships), v4 reached first frame in **840 / 1,026 / 873 ms vs 1,877 / 1,748 / 1,723 ms** for v3, over three runs of n = 5–6 **[V]**.
   - **Against v4:**
     - With the official UMD `dist/phaser.min.js` builds the boot advantage disappears (1,173–1,439 vs 1,099–1,421 ms). Boot time is a build-pipeline property, not a version property.
     - Under host CPU contention, v4 held **27–49 fps vs v3's 58–59** on SwiftShader, so v4's renderer costs more CPU under software GL **[V]**. Whether that holds on a real Mali GPU is unknown. Real-device fps p10, v3 vs v4, is gate M-K2.
   - **Why it is cheap to defer.** The facade's stable subset (§4.2) plus the V0 ban list (§4.10) make agent code **identical on both versions**. The choice is one kit build flag, not a rewrite, and OpenGame's v3.90 template code ports through the same lint.
3. **Size: the kit is precached once, and a game is a 10–60 kB delta.**
   - **Footprint.** Phaser is the heaviest runtime measured: 352 kB gz for the v4 dist, 315 kB for v3, and 235 kB for a v4 WebGL-only core custom build **[V]**.
   - **Why it is acceptable.** It is downloaded once per kit version. What matters per game is parse and first frame on a ₹8–10k phone: about 0.85–1.4 s at 6× desktop throttle **[V]**, inside the teacher's spoken preamble of about 3 s (tech-and-market §3.5).
   - **Shipped profile:** WebGL only, Arcade plus Matter, no tilemaps or Canvas renderer **[U ≈ 280–320 kB gz]**.
   - **v3 drift.** Most public Phaser code is v3. v4's breaking changes sit in rendering: pipelines, FX, masks, tint, `Geom.Point`, `Mesh`, and `Math.TAU`, which silently changed from π/2 to 2π **[V, migration guide]**. V0 bans them, and the error message names the v4 replacement. In the probe, 0 of 8 Phaser 4 generations used a removed API **[V]**, but the probe tasks did not exercise rendering features.
4. **Physics: Phaser Arcade for motion games, Matter.js (bundled with Phaser) for sandbox puzzles, and the law judges while the physics only animates.** Correctness is computed by kit maths (exact rationals, maths-engines R7), never read back from a float simulation.
   - **Fallback.** Planck.js (45.9 kB gz, Box2D-accurate) is the reversal if Matter jitter fails sandbox keypoints.
   - **Rapier is rejected for the default build.** The `-compat` build is **1.29 MB gz** because the WASM is inlined **[V]**.
   - **The probe shows why.** Both of KAPLAY's task-B failures, and Phaser 3's single failure, walked the player onto the flag (x = 344) without firing the win: overlap or collision API misuse that no compiler sees **[V]**. Answer-bearing events must not depend on physics callbacks the agent writes.
5. **3D: three.js r186, lazy, only where the objective is 3D** (solids, sky).
   - **Familiarity.** It has by far the most public code: 70.2M downloads/month and 20,867 SO questions **[V]**.
   - **Size and boot.** Its minimal bundle is 133 kB gz vs Babylon's 257 kB, and it booted in 421 ms vs 690 ms **[V]**.
   - **Babylon is rejected.** Apache-2.0 is fine, but it is about 2× the size and has a far smaller corpus (465 SO questions).
6. **Audio: Phaser's WebAudio sound manager plus a 2 kB kit voice channel; no Howler.** Howler (10 kB gz, MIT) is solid, but its last release was 2023-09 **[V]** and it duplicates the runtime. Voice is not game audio; it is routed by the host (§4.6).
   - **Rejected as the primary kit:**
     - **KAPLAY:** no stable release since 2025-06; v4000 has been in alpha for more than a year; 28.6 fps on our 200-sprite scene vs about 59 for Phaser, Pixi and three; probe 6/8 **[V]**.
     - **Excalibur:** pre-1.0; slowest boot (1,235 ms); 35 fps; probe **3/8**, with 2 of 8 failing to build because the model imported a `Physics` export that 0.32 no longer has **[V]**. This is version drift caught in the act.
     - **PixiJS v8:** a renderer with no scenes, physics, audio or tweens, so the kit would rebuild Phaser. Its API knowledge on codex is fine (8/8), so the rejection is about features, not familiarity **[V]**.
     - **LittleJS:** the smallest and fastest (40.6 kB gz, 281–313 ms, probe 7/8) but rarely used (3.5k downloads/month) **[V]**. It is the reversal if the Phaser profile's real-device first frame exceeds 2 s.
7. **"World in canvas, words in DOM."** All text, answer tiles, captions and the accessibility mirror are kit-owned DOM above the canvas. That gives crisp Devanagari shaping, real buttons with `aria-label`, and screen-reader and switch access, none of which Phaser provides (its source has no ARIA layer **[V, grep]**). Pixi's `AccessibilitySystem` (shadow DOM divs) is the prior art copied **[V]**.
8. **One registration, four uses.** `api.target(obj, action)` binds a touch target to a *semantic action*. The same action drives four things:
   - the tap;
   - the DOM accessibility button;
   - the `__forge.act()` test hook;
   - telemetry.

   Pointer handlers in agent code may only call `api.act()`; V0 enforces this (§4.10). The test hook is therefore the real code path, which is what makes GameGen-Verifier-style keypoint tests valid **[S, 92.2% vs 58.8%]**.
9. **Pedagogy lives in the level schema, where it can be checked.**
   - Every level has exactly one `objectiveId` and a `role` (`intro | practice | trigger | repair | transfer | challenge`).
   - `difficulty` is monotone apart from one dip after a `trigger`.
   - Every `trigger` level is built so that a named misconception produces a predictable wrong action, and the game shows its *consequence*. It does not punish.
   - **Reward = visible progress toward the objective**: a journey path and a mastery strip. There are no coins, points, streaks or leaderboards (learning-science rule 27; Deci et al. 1999 d ≈ −0.28 to −0.40 for expected tangible rewards **[S]**).
10. **The learning is the core verb.** All 8 archetypes are *intrinsically integrated*. Habgood & Ainsworth (2011, *J. Learning Sciences* 20(2):169–206, Zombie Division) found the intrinsic version gave better learning and more voluntary play than the same maths used as a sugar coating **[S]**. The quiz-gate pattern ("answer to jump") is banned, and the platformer's jump *is* a number-line magnitude (§5.1).
11. **Voice cues are ids, never sentences.** Code emits `api.cue("mistake", {misc})`. The host routes it in one of two ways:
    - During a live lesson it becomes a salience-2 *fact* line, which the realtime teacher voices in her own Hinglish.
    - In solo play it is a pre-rendered `gpt-4o-mini-tts` clip of planner-authored, content-safety-checked text, rendered at publish time.

    This follows the inherited law that sentence-shaped prompt text gets recited.

---

## 1. What the runtime choice actually controls

In the Forge design the agent never writes engine plumbing. It writes `src/mechanic.ts`, `src/levels.json` and `src/theme.json` on top of a kit (harnesses doc, principle 2). The runtime choice therefore matters in four places only:

| lever | why it matters for Forge | measured here |
|---|---|---|
| **API error rate of the builder** | every wrong method name is a repair round, at about 8–20 s and about $0.05 each (harnesses §5.10) | §2.4 probe (functional pass rate per framework on gpt-5.3-codex) |
| **Feature coverage** | anything the runtime lacks (pointer hit-testing, tweens, physics, scale manager), the agent or the kit must write | §2.5 matrix |
| **Boot cost on low-end Android WebView** | the child taps "play" while the teacher is mid-sentence; parse and first frame happen on a slow CPU | §2.2 sizes, §2.3 boot benchmark |
| **Licence and maintenance** | we ship to children for years and fork nothing | §2.1 |

What it does **not** control is per-game download size. The kit runtime is versioned, precached by the sandbox origin's service worker (and bundled into the APK), and shared by every game. A game package is mechanic code (5–30 kB), levels and voice JSON (2–15 kB), and sprites made with gpt-image-2 (WebP, at most 150 kB) **[U]**. Bundle size enters as **parse/compile time and memory**, not as megabytes downloaded per game.

---

## 2. Evidence

### 2.1 Versions, licences, maintenance (npm registry, 2026-10-02) **[V]**

| package | latest | released | licence | downloads, Sep 2026 | SO tag questions | status note |
|---|---|---|---|---|---|---|
| `phaser` | **4.2.1** | 4.0.0 on 2026-04-10; 4.2.1 on 2026-07-09 | MIT | 1,526,429 | 2,228 (`phaser-framework`) | v3 line ended at 3.90 (2025-05-23); v4 ships `skills/` for AI agents |
| `kaplay` | 3001.0.19 | 2025-06-15 (`next` = 4000.0.0-alpha.27.1, 2026-05-12) | MIT | 29,709 | 44 (`kaboom`) | `kaboom` (Replit) 7,625/mo, superseded |
| `pixi.js` | 8.22.0 | 2026-10-01 | MIT | 4,463,286 | 1,032 | renderer and scene graph; ships an `accessibility` module |
| `excalibur` | 0.32.0 | 2025-12-23 (`next` 0.33 alpha) | BSD-2-Clause | 35,531 | none found | TypeScript-first; pre-1.0 |
| `littlejsengine` | 1.23.1 | 2026-10-02 | MIT | 3,522 | none | tiny, js13k heritage; optional Box2D WASM plugin |
| `three` | r186 (0.186.1) | 2026-09-24 | MIT | 70,221,349 | 20,867 | |
| `@babylonjs/core` | 9.29.0 | 2026-10-01 | Apache-2.0 | 1,502,540 | 465 | |
| `matter-js` | 0.20.0 | 2024-06 | MIT | 1,249,880 | 321 | bundled inside Phaser (`Phaser.Physics.Matter`) |
| `planck` | 1.5.0 | 2026-04 | MIT | 633,467 | none | Box2D port, pure JS |
| `@dimforge/rapier2d-compat` | 0.21.0 | 2026-09-25 | Apache-2.0 | 151,013 | none | Rust/WASM; cross-platform determinism option **[M]** |
| `howler` | 2.2.4 | 2023-09-19 | MIT | 4,326,477 | 237 | stable, unmaintained-looking |

Downloads and Stack Overflow counts stand in for how much code a model has seen. They are proxies, not measures, so §2.4 measures familiarity directly.

### 2.2 Bundle size (esbuild 0.2x `--bundle --minify`, gzip −9; minimal "create a game, draw a thing" entry; this machine) **[V]**

| runtime | min | **gzip** | note |
|---|---|---|---|
| Canvas 2D (no lib) | — | 0.5 kB | baseline for the benchmark |
| LittleJS 1.23 (`production` export) | — | **40.6 kB** | the default (non-min) export tree-shakes to 100.8 kB; condition matters |
| KAPLAY 3001 | 188 kB | **69.3 kB** | |
| Excalibur 0.32 | 493 kB | **125.5 kB** | |
| three r186 (renderer, box, standard material, light) | 534 kB | **133.0 kB** | tree-shaken |
| PixiJS 8.22 (`Application.init`, Text, Graphics) | 564 kB | **164.4 kB** | with `--splitting`: about 170 kB across chunks, with WebGL and WebGPU renderers lazy |
| Babylon 9.29 (ES6 deep imports, box, camera, light) | 1,087 kB | **264.9 kB** | 256.7 kB in the benchmark build |
| Phaser 3.90 (`dist/phaser.min.js`) | 1,196 kB | **314.9 kB** | arcade-only dist 282.3 kB |
| Phaser 4.2.1 (`dist/phaser.min.js`) | 1,376 kB | **352.2 kB** | arcade-only dist 319.7 kB; ESM bundle 369 kB (not tree-shakable) |
| Phaser 4.2.1 **custom** from `src/phaser-core.js`, `CANVAS_RENDERER=false` | — | **234.8 kB** | no physics; add Arcade and Matter for the shipped profile **[U ≈ +50–90 kB]** |
| matter-js 0.20 | 86 kB | 27.5 kB | already inside the Phaser full build |
| planck 1.5 | 210 kB | 45.9 kB | |
| rapier2d-compat 0.21 | 3,405 kB | **1,287.7 kB** | WASM inlined as base64; the non-compat build plus a separate `.wasm` is smaller **[U]** |
| howler 2.2.4 | 37 kB | 10.2 kB | |

### 2.3 Boot and frame rate: 200 moving sprites plus one text label, 360×640 at DPR 2, Chromium 153 headless shell, **6× CPU throttle**, SwiftShader WebGL; n = 5 cold loads per runtime (run 1) **[V]**

| runtime | gz kB | **first frame, median ms** (range) | fps median | JS heap MB |
|---|---|---|---|---|
| Canvas 2D | 0.5 | 101 (89–124) | 41.4* | 1.7 |
| LittleJS | 40.6 | **281** (279–331) | 51.0 | 2.8 |
| three r186 (200 cubes, lit) | 133.4 | 421 (341–796) | 58.2 | 4.1 |
| KAPLAY | 69.6 | 499 (482–536) | **28.6** | 18.3 |
| PixiJS v8 | 164.7 | 679 (634–881) | 58.8 | 4.8 |
| Babylon (200 instances) | 256.7 | 690 (661–742) | 59.2 | 7.1 |
| **Phaser 4.2.1** | 369.5 | **840** (821–978) | 58.8 | 6.9 |
| Excalibur | 125.8 | 1,235 (1,042–1,282) | 35.2 | 35.1 |
| Phaser 3.90 | 330.1 | 1,877 (1,772–2,394) | 58.6 | 6.3 |

- **Method.** The harness and the entry files are in `factory/game-kit-bench/`. "First frame" runs from navigation start to the first update callback after the scene is live. Throttling uses CDP `Emulation.setCPUThrottlingRate(6)`.
- **Caveats.**
  - WebGL here is SwiftShader (CPU-rasterised), so fps measures **CPU-side engine overhead plus software raster**. It is not Mali GPU throughput. *The Canvas 2D fps is low for the same reason (software arcs at DPR 2).
  - A desktop core at 6× throttle is only a rough proxy for a Helio G35 / Unisoc T606 class phone **[U]**.
- **What transfers.** The relative ordering of boot cost, and two outliers:
  - KAPLAY and Excalibur lose frames at 200 objects even with GPU raster out of the picture.
  - The Phaser 3 vs 4 boot gap in this table belongs to the esbuild path, not to the versions (see reruns below).
- **Decision value.** Phaser 4's 840 ms fits under the teacher's about-3 s preamble with margin. It stays the choice unless the real-device run (M-K2) exceeds 2 s.

**Reruns, v3 vs v4 (same harness, 6× throttle; host load average 6.5–10.9 on 4 cores, shared with other agents).** Run 3 interleaves the runtimes to cancel drift.

| build | run 1 (n = 5) | run 2 (n = 5) | run 3, interleaved (n = 6) |
|---|---|---|---|
| Phaser 4, esbuild ESM (the kit's shipping path) | 840 ms · 58.8 fps | 1,026 ms · 27.0 fps | 873 ms · 43.0 fps |
| Phaser 3, esbuild (package `browser` field) | 1,877 ms · 58.6 fps | 1,748 ms · 58.0 fps | 1,723 ms · 58.8 fps |
| Phaser 4, official `dist/phaser.min.js` (classic script) | — | 1,242 ms · 32.2 fps | 1,173 ms · 49.6 fps |
| Phaser 3, official `dist/phaser.min.js` | — | 1,421 ms · 57.6 fps | 1,099 ms · 59.4 fps |
| PixiJS 8 / LittleJS (control) | 679 / 281 ms | — | 683 / 313 ms |

Two findings are consistent across runs:
- **Boot time follows the build path, not the version.** v4 ESM beats v3 ESM by about 2×, while the official UMD builds tie.
- **v4 loses frames under CPU contention with software GL; v3 does not.** That points to a heavier per-frame CPU cost in v4's render-node pipeline under SwiftShader **[V]**. On a real GPU it may vanish **[U]**.

This is the open v3-vs-v4 question that M-K2 settles on phones.

### 2.4 Builder familiarity probe, M-K0 (gpt-5.3-codex, `taxila-codex`, Responses API, effort `medium`) **[V]**

`factory/game-kit-probe.mjs` asks the builder for one single-file module per (framework × task × sample), bundles it with esbuild **against the real installed version**, runs it in headless Chromium at 360×640 with touch, and checks:

- **build**: it resolves against the installed package;
- **boot**: no `pageerror` or `console.error` within 4 s;
- **func**: the behaviour, driven by real CDP touch events.

The two tasks:

- **Task A (UI and input):** a question, two tappable answer buttons and a decorative bouncing ball. Tapping `yes` then `no` must call `reportAnswer("yes")`, then `reportAnswer("no")`.
- **Task B (physics and held touch):** a player falls onto the ground; holding the right half of the screen walks it to a flag, and touching the flag must call `reportWin()` exactly once.

Run 2026-10-02, n = 4 per (framework × task), so 8 per framework, 64 generations in total. Spend was 19.4k input and 169k output tokens, **≈ $2.40** at codex list prices.

| framework (pinned) | build | boot | **func A** (tap UI) | **func B** (physics + held touch) | **func total** | gen time, median s | output tok, median (reasoning) | failure notes |
|---|---|---|---|---|---|---|---|---|
| Canvas 2D (no lib) | 8/8 | 8/8 | 4/4 | 4/4 | **8/8** | 22 | 2,119 (782) | — |
| **Phaser 4.2.1** | 8/8 | 8/8 | 4/4 | 4/4 | **8/8** | 23 | 2,152 (1,211) | 0 removed-API uses; all 8 used `import Phaser from 'phaser'` |
| Phaser 3.90 | 8/8 | 8/8 | 4/4 | 3/4 | 7/8 | 20 | 2,092 (1,126) | reached the flag (x = 344) and `reportWin` never fired: overlap misuse |
| PixiJS 8.22 | 8/8 | 8/8 | 4/4 | 4/4 | **8/8** | 26 | 2,514 (1,308) | — |
| three r186 | 7/8 | 7/8 | 3/4 | 4/4 | 7/8 | 24 | 2,648 (1,189) | 1 syntax error (unbalanced paren) |
| LittleJS 1.23 | 7/8 | 7/8 | 4/4 | 3/4 | 7/8 | 27 | 3,001 (1,591) | assigned to an ES-module import binding (`LJS.canvasFixedSize = …`), a global-script idiom |
| KAPLAY 3001 | 8/8 | 8/8 | 4/4 | 2/4 | 6/8 | 30 | 2,824 (1,906) | 2× reached the flag without the win event (collision tags/`onCollide` misuse) |
| Excalibur 0.32 | 6/8 | 6/8 | 3/4 | 0/4 | **3/8** | 32 | 3,172 (2,122) | 2× imported a non-existent `Physics` export (API moved); 1× player fell through the floor (y → 83,254); 1× no win; 1× task A recorded no taps |

Notes on the checks:
- The `render` check (screenshot PNG > 6 kB) produced false negatives on dark, simple scenes, so it is not used for conclusions. Raw values are in the JSON.
- Generation time and reasoning tokens rise as familiarity falls: Excalibur and KAPLAY needed about 1.7–2.7× the reasoning tokens of Canvas 2D. Unfamiliarity costs money even when the code works **[V]**.
- **Statistics, honestly.** With n = 8 per framework, Phaser 4, Pixi and Canvas (8/8) cannot be separated from Phaser 3, three or LittleJS (7/8). Excalibur's 3/8 is reliably worse (Fisher exact vs 8/8, p ≈ 0.03), and KAPLAY's 6/8 is not significant (p ≈ 0.47).

Reading it:
- The probe measures *API knowledge under a pinned version*. It does not measure game quality, so it is a floor test.
- It supports the claim in §0.1 that Phaser 4 costs no extra repair rounds compared with vanilla canvas. It does not show that Phaser games are better.
- **The probe's own failures reproduce the literature's.** Every task-B failure outside Excalibur was "entity reaches goal, the win logic never fires": silent logic failure, the OpenGame puzzle/UI failure class **[S]**. This is why the kit owns win and judge plumbing (§4.2) and why V4 replays solutions.
- Per-run results, notes and token usage are in `game-kit-probe-2026-10-02.json`, and all 64 generated sources are in `game-kit-probe-out-2026-10-02/`.

### 2.5 Capability matrix (what the kit would otherwise have to write) **[V source / M where marked]**

| capability | Phaser 4 | PixiJS 8 | KAPLAY | Excalibur | LittleJS | three |
|---|---|---|---|---|---|---|
| scenes and lifecycle | yes | no (DIY) | yes | yes | minimal | no |
| pointer/touch hit-testing on objects | yes, `setInteractive`, drag | yes (federated events) | yes (`area()`) | yes | manual | raycaster (DIY) |
| default touch pointers | **1** (more via `activePointers`) **[V]**, which suits children's palms | all | all **[M]** | all **[M]** | 1 **[M]** | n/a |
| tweens and timelines | yes | no | yes (`tween`) | actions | no | no |
| physics | Arcade (`fixedStep: true` default **[V]**) and Matter | none | simple body | built-in (arcade/realistic) | AABB plus optional Box2D | none |
| audio | WebAudio manager | none | yes | yes | ZzFX synth | positional |
| scale/resize manager | yes (FIT, RESIZE) | DIY | letterbox | display modes | fixed size | DIY |
| WebGL context-loss restore | **yes (v4 headline)** **[V]** | yes **[M]** | ? | ? | ? | yes **[M]** |
| Canvas2D fallback | deprecated in v4 **[V]** | added back in v8.x (chunk present **[V]**) | no **[M]** | yes | Canvas2D native | no |
| built-in accessibility layer | **no** | **yes** (`AccessibilitySystem`, DOM shadow) **[V]** | no | no | no | no |
| official LLM docs | **28 SKILL.md files in the package** **[V]** | llms.txt **[M]** | ? | ? | ? | ? |

### 2.6 Physics, decided per archetype

| need | engine | why |
|---|---|---|
| jumps, runs, lanes, falling items | **Phaser Arcade** | AABB, fixed step, deterministic in one browser; trajectories for *answer-bearing* motion are computed analytically by the kit, not integrated |
| stacking, levers, ramps, floating, collisions you can "see" | **Matter.js via Phaser** | already in the runtime; has a Phaser skill, so the builder knows it; adequate for ≤ 60 bodies **[U]** |
| stable stacking or precise joints (fallback) | Planck.js | Box2D-accurate; 45.9 kB gz; the reversal if Matter jitter fails keypoints (M-K4) |
| cross-device bit-exact replays | Rapier (non-compat) | not needed: validators run in one Chromium, and replays are of *semantic actions*, not physics frames |

**Rule P1, physics never judges.**
- A physics sandbox has a *law evaluator* that computes the outcome exactly before the simulation runs:
  - `balance`: Σ left torque vs Σ right torque, in integer units;
  - `float`: density vs 1.0 g/cm³;
  - `ramp`: slope rank.
- The simulation is then nudged to agree with the law: Matter bodies are settled to the evaluated end state, and a snap tween runs if they drift more than 4 px.
- The child is judged on the law. This keeps the chaotic nature of rigid-body simulation out of the learning signal, and keeps keypoint tests stable.

### 2.7 3D: three.js, lazily and rarely

- Use 3D only where the objective is 3D: maths-engines E22 `solids`, science `sky@1` (optional 3D, with a 2D fallback), and nets folding into solids.
- three.js wins on every axis that matters here: familiarity (70M downloads/month; 20,867 SO questions), size (133 kB vs 257 kB gz), and boot time (421 ms vs 690 ms) **[V]**.
- Kit rule: a 3D level runs inside the same Phaser scene as a DOM-overlaid three canvas, loaded with dynamic `import()` from the kit origin (allowed: same origin, inside CSP `script-src 'self'`). It is capped at 30 fps with `setPixelRatio(min(dpr, 1.5))` **[U]**.

### 2.8 Audio

- **SFX:** Phaser's WebAudio sound manager, playing kit-owned UI sounds (tick, soft "hmm", pop) at ≤ 30 kB total, with the Opus/OGG plus M4A fallback that Phaser's loader handles. **Background music is off by default** (kids-ux §8.4: it competes with ASR and costs data).
- **Voice:** a separate kit channel (§4.6). Its rules:
  - Never two voices at once.
  - SFX ducks by −12 dB while voice plays.
  - Timers pause while a blocking cue speaks.
- **Unlock:** Android WebView needs a user gesture before AudioContext starts. The child's "play" tap on the host is that gesture. The kit calls `sound.unlock()` on the first `pointerdown` inside the iframe and queues earlier cues **[M]**.
- **Howler is not needed,** because nothing here requires its HTML5-audio fallback. Rejected to save a dependency.

---

## 3. Decision record (for `context/decisions.md` via `context/inbox/`)

| id | decision | reverse if |
|---|---|---|
| `game-kit-runtime` | Forge games target **`tgk@1` = Phaser 4.2.x (pinned, custom WebGL+Arcade+Matter build) + Taxila facade + DOM word layer** | (a) M-K2 shows v4 fps p10 on the reference phones ≥ 15% below v3.90 at the same scene, or context-restore gives no measurable benefit → flip the kit flag to **3.90** (agent code unchanged); (b) M-K1: Phaser-arm ship rate < vanilla-canvas-plus-kit arm by ≥ 10 pp on the same briefs; (c) M-K2: p50 first frame > 2 s after V8 code cache → LittleJS kit profile; (d) a Phaser 4.x minor breaks the facade |
| `game-kit-physics` | Arcade for motion, Matter for sandboxes, the law evaluator judges | M-K4: > 5% of sandbox keypoints flaky across 20 reruns → Planck |
| `game-kit-3d` | three r186, lazy, ≤ 1 3D view per game | if ≥ 15% of planned objectives need 3D (unlikely in K-9) → evaluate a 3D-first kit |
| `game-kit-audio` | Phaser sound + kit voice channel; no Howler, no background music | parent/teacher feedback demands music (and M-K6 shows no ASR harm) |
| `game-kit-words-in-dom` | all text, answer tiles, captions and the a11y mirror are DOM, not canvas | DOM overlay costs > 4 ms/frame on the reference phone |

**Rejections (for `context/rejected.md`):**

- `kaplay-as-kit`: no stable release since 2025-06, v4000 has been in alpha for over a year, 28.6 fps vs 58.8 on the same scene, and 44 SO questions.
- `excalibur-as-kit`: pre-1.0 API churn, the slowest boot measured (1.24 s at 6×), and 35 fps.
- `pixi-as-kit`: a renderer without scenes, physics, audio or tweens, so the kit would rebuild Phaser badly. Codex knows the v8 API well (probe 8/8), so this is about features, not familiarity. Its accessibility design is borrowed instead.
- `rapier-compat`: 1.29 MB gz.
- `howler`: redundant.
- `babylon`: 2× three's size, with a much smaller public corpus.

Each of these is a measured or verified reason, not taste.

---

## 4. The Taxila Game SDK (`@taxila/game-kit`, id `tgk@1`)

### 4.1 Layers and ownership

```
host app (React, app origin)                                           │ owned by
  └─ <iframe sandbox="allow-scripts" src="https://play.taxila.app/tgk@1/run.html#pkg=<artifactId>">  │ app
       ├─ service worker: precache tgk@1 runtime (+ fonts, SFX); LRU cache of game packages (≤ 30)    │ kit
       ├─ tgk runtime  = Phaser 4 custom build + kit core (bridge v2, telemetry, ramp controller,     │ kit (read-only
       │                 voice channel, word layer, a11y mirror, test hooks, theme loader)           │  to the agent)
       ├─ archetype template  (one of 8, §5)  = scene layout, input grammar, level flow, judge shell  │ kit
       └─ game package (Forge output):  mechanic.ts · levels.json · voice.json · theme.json · assets/ │ AGENT + planner
```

- The bridge is v2 (science-engines §2.2): `ModuleEventV2` with `seq`, `cause`, `src` and `salience`, and a flat payload of ≤ 12 keys.
- The tgk runtime emits game events *as* bridge-v2 events, namespaced `game.*` (§4.4), so the teacher's observer, the learner model and the dashboards work unchanged.
- The sandbox origin, CSP and nonce rules are exactly those in tech-and-market §3.4. `connect-src 'none'` still holds: the service worker caches what the *host* tells it to prefetch, through `postMessage` from the host-controlled `run.html`, and the game code itself has no network **[U, verify the SW + opaque-origin iframe combination in Capacitor's WebView, M-K5]**.

### 4.2 The agent's surface (everything it may import)

The agent imports only from `@taxila/game-kit`. Phaser is reachable as `api.phaser` (the live `Phaser.Scene`) for drawing only.

```ts
// @taxila/game-kit — public types (KIT.md renders these; ≤ 6k tokens incl. examples)
export type L10n = { en: string; hi: string; "hi-Latn"?: string };
export type MiscId = `MC.${string}`;                       // shared with maths/science engines and the item bank
export type MathValue = import("@taxila/engines").MathValue;   // exact: int, frac{n,d}, dec{s}, money{paise}, time{min}…
export type Action = { type: string } & Record<string, string | number | boolean>;   // semantic, flat
export type Prim = string | number | boolean;

export interface Mechanic<P, S> {
  id: string;                                   // "numberline-jump", "balance-pan", …
  archetype: ArchetypeId;
  paramsSchema: import("zod").ZodType<P>;       // levels.json params are validated against this at build AND load
  create(api: LevelApi<P>): S;                  // build the level: draw with api.phaser, register targets with api.target
  act(s: S, a: Action, api: LevelApi<P>): ActResult;   // THE ONLY place learning state changes
  judge(s: S, api: LevelApi<P>): Judgement | null;     // pure; null = not committed yet
  update?(s: S, dtMs: number, api: LevelApi<P>): void; // animation only; must not change judged state
  getState(s: S): Record<string, unknown>;      // JSON; with setState makes keypoint tests possible (R10)
  setState(s: S, j: Record<string, unknown>, api: LevelApi<P>): void;
  facts(s: S): Record<string, Prim>;            // ≤ 12 keys, for the teacher's eyes (science-engines §2.4)
}
export type ActResult = { ok: true; commit?: boolean } | { ok: false; reason: "locked" | "invalid" | "no_effect" };
export type Judgement =
  | { outcome: "correct"; item: string; value: MathValue | string }
  | { outcome: "misc"; item: string; value: MathValue | string; misc: MiscId }
  | { outcome: "other"; item: string; value: MathValue | string };

export interface LevelApi<P> {
  phaser: Phaser.Scene;                         // drawing, tweens, physics bodies; NOT input
  level: LevelRuntime<P>;                       // id, role, stage, difficulty, params, items, rng (seeded)
  band: "B1" | "B2" | "B3" | "B4";              // kids-ux bands → hit sizes, choices.max, timeouts
  target(obj: Phaser.GameObjects.GameObject | Rect, action: Action, label: L10n, opts?: TargetOpts): TargetHandle;
  drag(obj: Phaser.GameObjects.GameObject, onDrop: (dropZoneId: string) => Action, label: L10n): TargetHandle; // always has a tap-tap twin
  tiles(spec: TileSpec): TileHandle;            // DOM answer tiles (words in DOM): options → actions
  text(slot: string, key: string, vars?: Record<string, Prim>): void;   // shows levels.json strings ONLY (by key)
  act(a: Action): ActResult;                    // route an action (used by timers/ai-free scripted demos)
  cue(id: CueId, slots?: Record<string, Prim>, opts?: { blocking?: boolean }): void;   // §4.6
  hint(): HintRung | null;                      // advances the level's hint ladder; kit emits game.hint
  feedback(kind: "tick" | "shake" | "consequence", at?: Rect): void;   // kit-owned, ≤ 400 ms, no confetti
  progress(fraction: number): void;             // within-level progress strip; NOT a score
  math: KitMath;                                // exact rationals, compare, add, toNumberLine(x), paise ops
  law: KitLaws;                                 // balance/torque, density/float, ramp, circuit-lite, unit rate
}
```

**Stable-subset rule.** Inside `create` and `update` the agent may use the following parts of `api.phaser`:

- `add.image/sprite/rectangle/circle/graphics/container/text`. Text is only for numerals that live inside the world (a number on a platform). Words go through `api.text`.
- `tweens.add`, `time.delayedCall`, `physics.arcade.*`, `matter.add.*`, `cameras.main.pan/zoom`.

That surface is identical in v3 and v4 apart from the identifiers V0 bans (§4.10), so the builder's v3-heavy priors are harmless **[V vs migration checklist]**.

### 4.3 Package and level schema (what the planner writes and the harness checks)

This extends `GameSpec` and `LevelSpec` from harnesses §5.4. Fields marked ★ are new.

```ts
export interface GamePackage {
  kit: "tgk@1"; archetype: ArchetypeId; mechanic: string;          // mechanic = file src/mechanic.ts default export id
  objectiveIds: string[];                                          // union of level objectives
  title: L10n; band: "B1" | "B2" | "B3" | "B4";
  lang: "en" | "hi" | "hi-Latn+en"; numerals: "latn" | "deva";
  theme: { skin: string; palette: PaletteId; motifs: string[] };  // ★ palettes are kit tokens (kids-ux §4.3); motifs from interests
  strings: Record<string, L10n>;                                   // ★ EVERY visible word; content-safety checked (V6)
  voice: Record<CueKey, VoiceLine>;                                // ★ solo-play clips; rendered to audio at publish (S6)
  levels: LevelSpec[];                                             // 3–7; see ramp rules §4.5
  assets: { id: string; kind: "sprite" | "bg"; file: string; bytes: number; prompt_hash: string }[];
  adaptivity: { promoteAfter: 3; demoteAfterErrors: 2; maxInserted: 2 };   // ★ same thresholds as maths-engines §3.4
}
export interface LevelSpec {
  id: string;
  role: "intro" | "practice" | "trigger" | "repair" | "transfer" | "challenge";   // ★
  objectiveId: string;                                             // ★ exactly one per level
  stage: "concrete" | "pictorial" | "abstract"; linked: boolean;    // concreteness fading (R1, R4)
  difficulty: number;                                              // ★ 0..1, planner-assigned, checked by ramp rule
  params: unknown;                                                 // validated by mechanic.paramsSchema
  items: { id: string; key: MathValue | string; distractors?: { value: MathValue | string; misc: MiscId }[] }[];
  targetMisc?: MiscId;                                             // ★ required when role = "trigger" | "repair"
  hints: { rung: 1 | 2 | 3; kind: "glow" | "cue" | "demo"; target?: string; cue?: CueKey; demo?: Action[] }[];
  variants?: { id: string; difficulty: number; params: unknown; items: LevelSpec["items"] }[];   // ★ easier inserts for the ramp controller
  timing: { mode: "untimed" | "gentle" | "paced"; secondsPerItem?: number };   // ★ B1–B2: untimed or gentle only
  solution: Action[]; miscPaths: { misc: MiscId; actions: Action[]; expect: { event: "game.mistake"; misc: MiscId } }[];
  keypoints: Keypoint[];                                           // harnesses §5.4 shape
  successRule: { itemsCorrect: number; ofItems: number; maxHintsForMastery: 0 | 1 };   // ★
}
```

**Worked example: one `trigger` level of the number-line platformer (§5.1), as the planner writes it.**

```jsonc
{ "id": "L3", "role": "trigger", "objectiveId": "MATH6.FRAC.ADD", "stage": "pictorial", "linked": true,
  "difficulty": 0.55, "targetMisc": "MC.FRAC.ADD_ACROSS",
  "params": { "line": { "from": {"t":"int","v":0}, "to": {"t":"int","v":1}, "ticks": 6, "labels": "after_commit" },
              "start": {"t":"frac","n":1,"d":2}, "platforms": [{"at":{"t":"frac","n":2,"d":5},"kind":"sag"},{"at":{"t":"frac","n":5,"d":6},"kind":"flag"}],
              "tiles": [{"op":"+","v":{"t":"frac","n":1,"d":3}},{"op":"+","v":{"t":"frac","n":1,"d":6}}] },
  "items": [{ "id": "i1", "key": {"t":"frac","n":5,"d":6},
              "distractors": [{ "value": {"t":"frac","n":2,"d":5}, "misc": "MC.FRAC.ADD_ACROSS" }] }],
  "hints": [{ "rung": 1, "kind": "glow", "target": "tile:+1/3" },
            { "rung": 2, "kind": "cue", "cue": "hint.r2:L3" },
            { "rung": 3, "kind": "demo", "demo": [{ "type": "refine", "to_d": 6 }] }],
  "timing": { "mode": "untimed" },
  "solution":  [{ "type": "pick_tile", "tile": "+1/3" }, { "type": "jump" }],
  "miscPaths": [{ "misc": "MC.FRAC.ADD_ACROSS", "actions": [{ "type": "aim", "at": "2/5" }, { "type": "jump" }],
                  "expect": { "event": "game.mistake", "misc": "MC.FRAC.ADD_ACROSS" } }],
  "keypoints": [{ "id": "k1", "setup": { "pos": "1/2" }, "actions": [{ "type": "pick_tile", "tile": "+1/3" }, { "type": "jump" }],
                  "assert": [{ "path": "pos", "op": "eq", "value": "5/6" }, { "path": "events", "op": "emitted", "value": "game.level_complete" }] }],
  "successRule": { "itemsCorrect": 1, "ofItems": 1, "maxHintsForMastery": 1 } }
```

Answer keys (`items[].key`) are never trusted from the planner. At S1 the harness recomputes every key with `KitMath` / `KitLaws` and fails the spec on any mismatch. Where a verified teaching kit exists (`data/kits/*.json`, which holds blind-solved keys), items are drawn from it. This applies the inherited law "a model never grades" to the game as well as to the lesson.

### 4.4 Telemetry API (kit-emitted; the agent cannot forge or skip it)

Events are derived from the `act → judge` pipeline and from level-flow changes. Mechanics never call `track()` directly, so a builder cannot forget an event or report a wrong `correct` flag.

| event (`game.*`) | payload (flat, ≤ 12 keys) | emitted when | salience |
|---|---|---|---|
| `level_start` | `level, role, objective, stage, difficulty, attempt_no, inserted` | the kit mounts a level (or an inserted variant) | 1 |
| `attempt` | `level, item, n` | first action on an item since its last judgement | 0 |
| `answer` | `level, item, value, outcome (correct\|misc\|other), latency_ms, changes, hints_used` | `judge()` returns non-null | 1 (correct), 2 (2nd consecutive wrong) |
| `mistake` | `level, item, value, misc (id or "none"), strength (weak\|strong), count_session` | outcome is `misc` or `other`; `misc` maps 1:1 to bridge-v2 `misc_signal` | 2 if `misc` and `count_session ≥ 2`, else 1 |
| `hint` | `level, item, rung, kind, source (child\|teacher\|auto)` | `api.hint()` or host `reveal_hint` | 1 |
| `level_complete` | `level, objective, items, first_try_correct, hints, ms, mastered (bool by successRule)` | success rule met | **2** |
| `quit` | `level, reason (back\|hidden\|teacher\|idle_timeout\|crash), progress, ms` | exit before completion; `visibilitychange` counts after 30 s hidden | 2 |
| `idle` | `level, ms` | no action for 20 s (R3), or 12 s for B1–B2 **[U]** | 2 |
| `gaming` | `level, pattern (rapid_guess\|cycling\|hint_spam)` | P22 detector: ≥ 3 answers < 1.5 s with alternating options, or ≥ 3 hints within 10 s | 1, and it discounts that level's evidence |
| `perf` | `fps_p10, long_tasks, boot_ms, ctx_lost` | every 10 s and on quit | 0 |
| `ready` / `error` | v1 semantics | boot / exception (the kit catches it and degrades) | 2 |

Rules:
- `latency_ms` is a tie-breaker only (maths-engines §3.2) and never a mastery signal. `mastered` is a *claim*: the learner model, not the game, decides mastery, after delayed checks (learning-science §7).
- The host debounces salience-1 events into one fact line every 1.5–3 s, for example `[game g_41 numberline-jump L3 trigger] item=i2 value=2/5 misc=MC.FRAC.ADD_ACROSS count=2 hints=1`. Salience 2 may request a teacher turn when the child is not speaking, at most once per 4 s (science-engines §2.2).
- The teacher's eyes: `facts()` is pulled when the host sends `snapshot`, so the teacher can say "yeh wala platform kyun?" with deixis via `focus`.

### 4.5 Pedagogy hooks (checked by validators, not suggested by prompts)

1. **One objective per level.** A level has one `objectiveId` and its success rule tests that objective only. Mixed review happens in `challenge` levels, which list the objectives they reuse.
2. **Ramp rule (V3 spec check).**
   - `difficulty` is non-decreasing over the level sequence, with one allowed dip of ≤ 0.2 immediately after a `trigger` (the `repair` level).
   - The sequence starts at `intro` or `practice` and ends at `transfer` or `challenge`.
   - The first level's `stage` follows mastery and age (R1). The game must end at stage `abstract` on at least one item, because "a concept ends on symbols" (Fyfe 2015; maths-engines R1) **[S]**.
3. **Misconception-triggering levels.** A `trigger` level is designed so that a child holding `targetMisc` makes a specific, predictable wrong move (its `miscPaths` entry). The game then shows the **consequence inside the world**:
   - the platform at 2/5 sags because it is not where 1/2 + 1/3 lands;
   - the "heavier" stone floats because it is a small pumice block.

   It shows no red X and no penalty. This is cognitive conflict (POE), and the harness replays the misc path and requires `game.mistake{misc}` (V4). A `repair` level then gives a contrast item that differs only in the target feature (maths-engines probe P8).
4. **Inline adaptivity, kit-owned** (the ramp controller):
   - `demoteAfterErrors` (2) consecutive wrong judgements insert the next easier `variant`, or demote the stage, with at most `maxInserted` (2) inserts.
   - `promoteAfter` (3) first-try correct answers with no hints skip the remaining practice items.
   - Every change emits `level_start{inserted:true}`. The planner supplies the variants and the kit decides when to use them, so the decision is deterministic and replayable.
5. **Hint ladder.** The rungs are glow (rung 1), teacher cue (rung 2) and worked demo of the next step (rung 3, which plays `demo` actions through `act`, so the world really moves). Using rung 3 makes the item ineligible for `mastered` when `maxHintsForMastery: 0`.
6. **Reward = progress, not coins.**
   - The visible reward is a **journey path** of the level nodes, and a **mastery strip** per objective that fills only on first-try correct answers or a correct answer after repair.
   - At the end the kit shows a recap card, rendered from `strings`, in the form "you can now ⟨objective noun phrase⟩". Its shape is informative, not evaluative (learning-science rule 27).
   - Banned (V0 and V5): currencies, points, scores, timers that punish, streaks, leaderboards, lootboxes, "lives" for B1–B2, confetti, and mascot cheering inside the play area (R6, seductive details: d = −0.30 retention, −0.48 transfer **[S]**).
   - "Lives" are allowed in B3–B4 `challenge` levels only, and never on the first attempt.
7. **Interests are motifs, not mechanics.** Cricket, trains or Bollywood skin the world between levels, in backgrounds and story frames. The *manipulated* objects stay bland (maths-engines R2/R3), and V5 checks this.
8. **Spaced return.** `level_complete` carries item ids. The Conductor schedules a 1-item comeback (the same objective, a new number) for the next day's session. The game does not do this itself.

### 4.6 Hinglish voice cue hooks

```ts
export type CueId =
  | "level.intro" | "level.goal" | "item.prompt" | "feedback.correct" | "feedback.consequence"
  | "mistake" | "hint.r2" | "level.done" | "game.recap" | "idle.nudge";
export type CueKey = `${CueId}:${string}`;            // e.g. "mistake:MC.FRAC.ADD_ACROSS", "item.prompt:L3.i2"
export interface VoiceLine { "hi-Latn": string; en: string; deva?: string; maxWords: number; safety: "pass" }
```

Routing (host-side; the game never knows which path ran):

| situation | path | latency |
|---|---|---|
| live lesson, teacher connected | the cue becomes a salience-2 **fact line** (`cue=mistake misc=MC.FRAC.ADD_ACROSS item=…`). The realtime teacher phrases it herself. The game's `VoiceLine` is **not** sent, so planner prose cannot be recited | realtime turn (target ≤ 800 ms) |
| solo play (homework, offline) | pre-rendered clip `voice/<CueKey>.ogg` (gpt-4o-mini-tts, rendered at S6 publish; a fixed teacher voice and instructions) plus a DOM caption with word highlighting | 0 (local file) |
| clip missing (new variant, render failed) | caption only plus the soft SFX; logged | 0 |

Rules:
- `maxWords` follows kids-ux `speech.turn.maxWords` (15 / 20 / 30 / 40 by band) and is validated at S1.
- Numbers inside lines are **slots**, formatted by the host per `lang`: "teen-chauthai" or "three by four", and Latin or Devanagari digits. A line never bakes a number into prose.
- `blocking: true` pauses timers and input until the clip ends, or until the teacher's turn ends in a live lesson.
- Every `VoiceLine` passes Azure AI Content Safety and the band reading-level check (V6).

### 4.7 Accessibility (kit-owned; the agent gets it for free by using `api.target` / `api.tiles`)

- **Word layer.** Text, tiles and captions are DOM. The kit bundles a Noto Sans Devanagari subset and waits for `document.fonts.load()` before the first level, so matras never clip (kids-ux §8.2).
- **Accessibility mirror.** Every `target` gets a positioned, transparent `<button aria-label=L10n>` over its canvas bounds. Bounds are synced at 10 Hz, and only on change. Its uses:
  - TalkBack users and switch access can play;
  - keyboard order follows registration order;
  - the same buttons serve as the Playwright selectors for the GUI tests.
- **Hit targets by band:** `hit.min` 64 / 64 / 48 / 48 dp; answer tiles 112 / 96 / 64 / 64 dp; 10 mm forgiveness (kids-ux §4.1). The kit inflates every target's hit area to the band minimum, whatever its sprite size. V5 measures the result at 360 px width.
- **Gestures:** tap, and drag with a tap-tap twin (`api.drag` always registers both). Nothing else for B1–B2. There is no long-press, pinch or multi-touch, and Phaser runs with one active pointer.
- **Holdover guard:** taps within 400 ms (B1–B2) or 250 ms (B3–B4) after a level transition, landing within one target width of the previously activated target, are dropped (Anthony et al., via kids-ux).
- **Feedback at finger-down** with sound (Sesame, via kids-ux).
- **Time:** B1–B2 are `untimed` or `gentle` only, and `paced` requires B3–B4. The parent can turn "no time pressure" on everywhere.
- **Motion:** `prefers-reduced-motion`, or the parent setting, gives 1 ms tweens, no camera shake and no parallax. Flashes stay ≤ 3 per second (WCAG 2.3.1) **[M]**.
- **Colour:** kit palettes pass 4.5:1 for text and 3:1 for non-text (kids-ux §4.3). No information is carried by colour alone: shape, pattern or label accompanies it, so colour-blind children can play.
- **Audio-off playable:** every cue has a caption, and every sound has a visual twin.
- **Reading support:** any `api.text` slot is tappable to hear it (solo play) or to ask the teacher (live).

### 4.8 Performance and offline budgets **[U unless marked]**

| budget | value | enforced by |
|---|---|---|
| kit runtime (precached once) | ≤ 340 kB gz JS, plus 80 kB fonts, plus 30 kB SFX | kit CI |
| game package (excluding sprites) | ≤ 60 kB gz | V0 |
| sprites per game | ≤ 150 kB WebP total, ≤ 1024 px longest side | V0 |
| first frame after tap, reference phone | ≤ 1.5 s p50 (bench: 840 ms at 6× desktop **[V]**) | M-K2 |
| frame time | ≤ 16 ms p90 at a 30 fps cap on low-end (`perf.lowEnd`), 60 fps elsewhere | V2 (4× throttle) |
| DPR | `min(devicePixelRatio, 2)`; 1.5 on low-end | kit |
| objects on screen | ≤ 150 sprites, ≤ 40 Matter bodies | V2 |
| lifecycle | pause on `visibilitychange`; restore on WebGL context loss (v4) with a `getState/setState` round-trip | kit |

**Offline.**
- The APK bundles `tgk@1` in Capacitor's assets.
- The web sandbox origin's service worker precaches the runtime and keeps an LRU of the last 30 game packages, including voice clips.
- The host prefetches the next lesson's games during lesson planning (tech-and-market §3.5).
- Telemetry is queued in the host, not the iframe, and flushed when the device is back online.

### 4.9 Test hooks (test builds only; stripped from production by a define)

```ts
window.__forge = {
  getState(): object, setState(s: object): void,       // via Mechanic.getState/setState for the current level
  act(a: Action): ActResult,                           // same path as a tap
  level(id: string): Promise<void>,                    // jump to level (keypoints)
  step(ms: number): void,                              // advance the fixed clock (Phaser loop paused in tests)
  events(): ModuleEventV2[],                           // everything emitted so far
  targets(): { id: string; action: Action; label: L10n; rect: DOMRect }[],   // for GUI taps & V5 hit-size check
};
```

V4 runs each `solution` twice: once through `act()`, and once by tapping `targets()` rects with CDP touch events, the method the M-K0 probe already uses. It requires identical event streams. A pointer handler that bypasses `act()` makes the two streams diverge, and the build fails.

### 4.10 V0 rules specific to the kit (acorn AST, on agent files only)

- **Imports:** only `@taxila/game-kit`. No direct `phaser`, `three` or DOM APIs: `document.*`, `window.*` and `innerHTML` are banned. The kit owns the DOM.
- **Input:** the agent may not call `setInteractive`, `input.on`, `addEventListener` or `pointer*` APIs. Input goes through `api.target`, `api.drag` and `api.tiles` only.
- **Phaser v3-isms**, which are absent or changed in v4 **[V, `changelog/v4/4.0/MIGRATION-GUIDE.md`]**:
  - `setPipeline`, `preFX`, `postFX`, `BitmapMask`, `createBitmapMask`, `setTintFill`, `Geom.Point`, `Math.PI2`, `Math.TAU` (its meaning changed), `Struct.Set`, `Struct.Map`, `add.mesh`, `add.plane`, `Textures.generate`.
  - Each error message names the v4 replacement, for example `setTint(c).setTintMode(Phaser.TintModes.FILL)`.
- **Strings:** no string literal over 2 characters reaches `api.text`, `add.text`, `cue` or `tiles` unless it is a key into `strings` / `voice`. On-screen numerals inside the world are allowed.
- **Seductive details:** no `particles`, no `cameras.main.shake` (outside `feedback`), no confetti, no score variables, so no `score`, `coins`, `points` or `streak` identifiers. V5 then checks frames for decorative motion.
- **Determinism:** `Math.random` and `Date` are banned. Randomness comes from `api.level.rng`, and time from `dtMs`.

---

## 5. The eight archetypes (learning = the core verb)

Each archetype is a kit **template**: scene layout, input grammar, level flow, judge shell and three golden mechanics. The agent writes a `Mechanic` for the template. A new *mechanic* goes through V7 human review before the library takes it; a new *level set* for an existing mechanic does not (harnesses §5.1, the human-review default).

**Reconciliation with `factory/llm-game-generation.md` (same day).** That doc defines eight `GameFamily` ids from the OpenGame lineage. The brief's eight archetypes map onto them as follows. The main loop should merge them into one id list before the kit is built.

| this doc (brief's archetypes) | sibling `GameFamily` | note |
|---|---|---|
| platformer-quiz (number-line platformer) | `track-jump` | same idea: the jump is the magnitude |
| physics-sandbox | `sim-challenge` | |
| shop-sim | `story-choice` / `sim-challenge` | shop needs DOM tiles plus customer flow; propose a distinct id `shop-sim` |
| tower-build | `sort-build` | |
| runner-gates | `catch-lane` | |
| detective-spot-error | none | new: P6 probe as a game |
| rhythm-chant | none | new; verbatim content only |
| card-match | `memory-match` | face-up match by default (§5.8) |
| none | `grid-path`, `defend-path` | keep: grid logic (coding, coordinates) and path-defence are good fits the brief did not list |

Notation: **verb** = what the child's hands do; **concept** = why doing that verb *is* the learning; **trigger** = how a misconception shows up as a predictable wrong move with a visible consequence.

### 5.1 `platformer-quiz` → **number-line platformer** (Arcade)

- **Verb.** Choose a jump (an operator tile such as +3/4, −2 or ×10), then the character jumps exactly that far along a world that *is* a number line. Platforms sit at values; the flag sits at the target.
- **Concept.** Magnitude and operations as movement on a linear line. It is the hub representation (maths-engines §0.5), and linear number-board games have the best evidence base (Siegler & Ramani 2009; Nelson 2025 **[S]**). This is *not* "answer a question, then jump"; quiz-gates are banned.
- **Ramp.**
  1. intro: whole steps with a ticked line;
  2. practice: unit fractions;
  3. trigger: unlike denominators;
  4. repair: refine the line into sixths;
  5. transfer: an unticked line, scored by PAE;
  6. challenge: two-jump plans.
- **Trigger example.** `MC.FRAC.ADD_ACROSS` for 1/2 + 1/3: the planner places a platform at 2/5. A child who adds across lands short on it, and it sags; the flag at 5/6 stays out of reach. The consequence is visible and there is no penalty.
- **Other uses.** Integers (Bela's lift building: floors −5 to +6, from NCERT 6 Ch 10), decimals, place-value scaled lines, and elapsed time on a clock line.
- **Physics.** The arc is analytic: x(t) is a tween to `toNumberLine(value)`, and Arcade handles only landing and sag. The judge compares exact rationals.
- **Telemetry extras.** `answer.value` holds the chosen jump expression, and `facts` gives `pos=1/2 target=5/6 jumps=2`.
- **Agent writes.** Platform layout from params, the tile set, and the sag animation. About 150–250 lines **[U]**.

### 5.2 `physics-sandbox` puzzle → **predict, place, run** (Matter plus law evaluator)

- **Verb.** Place or choose objects (weights on a balance, a fulcrum position, a log or stone in water, a ramp angle, a magnet), **commit a prediction**, press run, and watch.
- **Concept.** The law is the puzzle: torque balance (Class 6–8 levers; maths `balance` for equality), density and floating (science E15), friction and ramp, and magnetic or non-magnetic. Each run is a POE cycle (science-engines §3.1).
- **Ramp.** intro (a demo run) → practice (the predict-only step) → trigger → repair (contrast pair) → transfer (a new context, such as a seesaw becoming a tarazu) → challenge (construct: make it balance with ≥ 2 solutions).
- **Trigger examples.** `MC.FLOAT.HEAVY_SINKS`: a big wooden log versus a small iron nail. `MC.EQ.OPERATOR`: the balance shows 8 + 4 = □ + 5 and a child places 12.
- **Physics.** The law evaluator computes the end state first (P1, §2.6). Matter animates within at most 3 s of simulated time, and the result snaps to the evaluated state.
- **Agent writes.** Object set, layout, the evaluator *call* (from `api.law`) and the reveal choreography.

### 5.3 `shop-sim` → **chai stall / sabzi mandi** (Arcade plus DOM tiles)

- **Verb.** Customers queue with orders. The child makes totals and change by tapping coins and notes (stylised rupee drawings, maths-engines E14), sets prices, or picks the better deal.
- **Concept.** Money as decimal place value; addition and subtraction with regrouping; unit rate, profit and loss, and discount (Class 7–8 percentages). Integer paise are used internally (R7).
- **Ramp.** exact payment → change from ₹10 → change from ₹100 → trigger → unit price comparison → percentage discount (B3+).
- **Trigger examples.** `MC.DEC.PLACE_ALIGN` (₹2.50 + ₹1.75 read as 2.125). `MC.PCT.SAME_BASE` (+20% then −20% returns the original price): the customer counts the change back aloud through a cue and the shortfall is visible in the drawer.
- **Pacing.** Customers wait indefinitely in B1–B2. In B3–B4 `gentle` mode they show patience as a slowly filling cup, never as a frowning face.
- **Agent writes.** The order generator (from `items`), drawer layout, and customer flow.

### 5.4 `tower-build` → **build to spec** (Arcade with snap grid)

- **Verb.** Compose a structure from units so that it meets a numeric spec. Examples:
  - a tower of height 346 from hundreds, tens and ones blocks;
  - a garden of area 24 with the least fence;
  - a wall of exactly 1 from fraction bricks;
  - an array showing 12 = 3 × 4 = 2 × 6.
- **Concept.** Composition and decomposition: place value (E03), area and perimeter (E08), fraction equivalence (E04), factors and multiples (E05). The structure *is* the representation, and a live symbol readout appears from the pictorial stage (R4).
- **Ramp.** build-to-number → build-to-number with constraints (fewest blocks) → trigger → repair (contrast) → transfer (reverse: read the number from a tower) → challenge (two ways).
- **Trigger examples.** `MC.PV.ZERO_PLACEHOLDER`: "four hundred six" built as 4 hundreds and 6 tens, so the tower is visibly too tall against the target line. `MC.AREA.PERIM_CONFUSION`: two gardens with the same area and different fences.
- **Agent writes.** The unit set, snap rules, the spec readout, and the `judge` function using `api.math`.

### 5.5 `runner-gates` → **lane runner** (Arcade)

- **Verb.** The runner moves forward. The child switches lanes to pass through the gate that satisfies the rule ("> 1/2", "multiple of 6", "conductor", "living", "noun").
- **Concept.** Classification and fluent retrieval *after* accuracy exists. It is a practice-phase format (learning-science F6), and retrieval practice has strong evidence (learning-science §3.5) **[S]**.
- **Pace.**
  - B1–B2 use **gate-stop**: the runner stops before each gate and waits.
  - B3–B4 may use `paced`. Speed is never raised after a mistake.
  - Latency is logged but never judged. Speed pressure must not create maths anxiety **[M]**.
- **Ramp.** one rule with 2 lanes → 3 lanes → trigger → mixed rules → transfer (a new representation on the gates: a picture instead of a numeral).
- **Trigger example.** `MC.FRAC.BIGGER_DENOM`: gates show 1/8 and 1/4 under the rule "bigger". Passing the 1/8 gate shows both fractions as bars on the gate arch after the pass.
- **Gaming detector.** Lane cycling counts toward `gaming{cycling}`.
- **Agent writes.** The gate generator from `items`, and the lane rule predicate (via `api.math` / taxonomy tags).

### 5.6 `detective-spot-error` → **find the slip** (DOM-heavy; Phaser for the scene)

- **Verb.** A worked solution, an experiment set-up or a sentence is presented as a "case". The child taps the wrong step (or the uncontrolled variable), then fixes it by choosing a replacement step.
- **Concept.** Error detection with self-explanation. This is probe P6 `spot_error`, used only after basic mastery (maths-engines §3.1), and the "teacher makes a deliberate mistake" pattern (learning-science §1.7). Science uses it for fair tests (CVS, science-engines §3.2); languages use it for grammar.
- **Ramp.** obvious slip → subtle slip → trigger (the planted error *is* the child's misconception: the case is solved the way they would solve it) → repair (fix it, then predict the corrected result) → transfer (a new problem with the same error class).
- **Telemetry.** `answer.value` = the tapped step id. A correct find with a wrong fix becomes `mistake{misc}`.
- **Agent writes.** The case renderer (a list of steps or a scene with tappable objects) and the fix options.

### 5.7 `rhythm-chant` → **call and response on a beat** (WebAudio clock plus DOM tiles)

- **Verb.** A beat plays. On each "call" (a voice clip or caption), the child taps the correct "response" tile in the beat window. Examples:
  - a table chant: 7 × 3 → 21;
  - the next skip-count number;
  - Hindi number names, which are largely irregular from 1 to 99 (maths-engines R9);
  - Virahanka rhythms from Ganita Prakash;
  - verb forms.
- **Concept.** Verbatim memory with rhythm. Songs help when they are *about* the content (learning-science §2.4); this archetype exists only for verbatim content, and V5 rejects it for conceptual objectives.
- **Timing.**
  - Scheduling uses `AudioContext.currentTime`.
  - The first 4 beats calibrate the tap offset per device **[U]**: Android touch-to-audio latency is unknown on our reference phones (M-K6).
  - Windows are ±350 ms (B1–B2) or ±200 ms (B3–B4).
  - B1–B2 can use `untimed`, where the beat waits for the tap.
- **Ramp.** echo (call and response shown) → recall (response hidden) → trigger → reverse (21 → 7 × 3) → mixed.
- **Trigger example.** `MC.MULT.ADD_CONFUSION` (7 × 3 → 10): the tile for 10 sits on the wrong beat, and the mistake replays the array visual for 2 s.
- **Voice.** The calls are pre-rendered TTS clips in solo play. In a live lesson the teacher does not sing; the beat game is solo-mode only by default.

### 5.8 `card-match` → **representation match / sort** (DOM cards plus Phaser board)

- **Verb.** Pair cards across representations (3/4 ↔ a bar with 3 of 4 shaded ↔ a point on a line ↔ "teen-chauthai"), or sort cards into bins (solid / liquid / gas, prime / composite, a state or UT ↔ capital).
- **Concept.** Translation between representations (probe P14 `translate`) and categorisation. The board is a *match*, not a memory test: all cards face up by default. "Concentration" (face-down) is only a B2–B3 `challenge` variant, because it tests memory rather than the objective.
- **Ramp.** 2 representations → 3 → trigger → bins with a near-miss distractor → transfer (build the missing card).
- **Trigger example.** `MC.FRAC.PART_COUNT` (1/3 paired with a picture of 1 of 3 *unequal* parts): the paired cards slide together and the unequal parts are highlighted.
- **Maps** must follow Survey of India boundaries (tech-and-market §3.2) **[U, legal]**. Card art comes from the kit library or pre-generated sprites, and labels are DOM (§4.7).
- **Agent writes.** The card set from `items` and the pairing predicate.

### 5.9 Archetype × NCERT coverage (seed; the planner's choice table)

| archetype | strongest maths topics | strongest science/EVS | languages / SST |
|---|---|---|---|
| number-line platformer | integers, fractions, decimals, rounding, elapsed time | temperature scales | timelines (years as a line) |
| physics sandbox | equality, simple equations, mean as balance | levers, floating, friction, magnets, circuits-lite | — |
| shop sim | money, decimals, %, profit/loss, unit rate | — | market vocabulary |
| tower/build | place value, area/perimeter, fractions, factors, volume (B4) | — | word building (morphology) |
| runner-gates | comparison, divisibility, classification | living/non-living, materials, states | parts of speech, spelling |
| detective | algebra steps, column operations | fair tests (CVS), food tests | grammar, map errors |
| rhythm-chant | tables, skip counting, number names (hi) | — | poems, verb forms |
| card-match | multiple representations, units | habitats, organs and functions | states and capitals, synonyms |

---

## 6. How the builder is prompted against the kit (structure, not lines)

Order follows the inherited "position is mechanism" law. Stable prefix first, so the cache holds; binding rules last.

1. Role line: implement one `Mechanic` for archetype X.
2. `KIT.md`: the interfaces from §4.2 verbatim; three golden mechanics of *this* archetype (≤ 150 lines each); the stable-subset list; the V0 ban list *with replacements*.
3. The relevant Phaser skill excerpts, at most 2 of the 28 in `node_modules/phaser/skills` (e.g. `tweens`, `physics-arcade`). They are trimmed to the stable subset and frozen per kit version, never fetched live.
4. FORGE.md pitfalls (harnesses §5.7).
5. `spec.json` (the GamePackage minus assets) and the handoff.
6. Binding rules, last:
   - only `api.*` for input and words;
   - `act` is the only state mutator;
   - no `Math.random` or `Date`;
   - `judge` uses `api.math` / `api.law`;
   - stop when `submit` accepts.

The planner (taxila-brain) gets the archetype table (§5.9), each archetype's `describe()` (≤ 600 chars), the misconception catalogue excerpt and the band tokens. It writes levels, strings, voice lines, solutions and misc paths, never code.

---

## 7. Cost and latency implications **[U; measure in M-K1]**

| item | effect of the kit |
|---|---|
| builder output | a mechanic is about 150–300 lines, against about 600–1,200 for a free-form Phaser game, so roughly 3× fewer output tokens per build. At codex prices ($14 / MTok out, harnesses §5.10) that saves about $0.3–0.5 per fresh build |
| repair rounds | V0 catches v3-isms and input bypasses *before* boot, in milliseconds; telemetry cannot be wrong by construction, so V4's "required telemetry seen" class of failure disappears |
| reskin path | a new theme, interests, numbers or misconception gives a new `levels.json` and `strings` only, with no builder call: one planner call at about $0.01–0.03 plus V3–V6 (≈ 30 s) plus TTS clips |
| TTS at publish | about 15–30 cue lines × gpt-4o-mini-tts; the cost is small and the latency parallel (the clip count is bounded by `voice` keys) |
| child-side | 0 bytes of runtime per game after the first; package ≤ 60 kB plus sprites; first frame ≈ 1 s on low-end **[U]** |

---

## 8. Measurements to run next (log each in `context/measurements.md` with n, method, date)

1. **M-K0, done today:** the familiarity probe (§2.4). Rerun on every runtime bump (`phaser@4.x`) and on any builder model change.
2. **M-K1, kit vs raw.** 20 briefs × 3 arms on Forge:
   - (a) `tgk@1` facade;
   - (b) raw Phaser 4 with the kit only for telemetry;
   - (c) vanilla canvas with the kit.

   Measure ship rate, repair rounds, $ and wall clock. This is the reversal test for `game-kit-runtime`.
3. **M-K2, real-device boot.** Three reference phones (₹7–10k: Helio G35/G36 class, Unisoc T606, Snapdragon 4 Gen 1) in Capacitor's WebView. Measure first frame, cold and warm (V8 code cache), for the Phaser custom profile vs LittleJS; fps p10 with 150 sprites; WebGL availability; context-loss recovery after backgrounding. n ≥ 10 loads per phone.
4. **M-K3, accessibility mirror.** TalkBack and switch access complete one level of each archetype. Check the DOM-overlay frame cost on the reference phone.
5. **M-K4, physics flake.** 20 reruns × all keypoints of 10 sandbox levels under Matter. If more than 5% are non-identical, move to Planck.
6. **M-K5, offline.** Check service worker plus sandboxed opaque-origin iframe inside the Capacitor WebView: does the SW control `play.taxila.app` frames, and do cached packages load in airplane mode? Fallback: serve the kit from Capacitor's local server and accept a weaker origin separation **[U]**.
7. **M-K6, touch-to-audio latency** on the reference phones (rhythm windows), and whether SFX or music hurts ASR during a live lesson.
8. **M-K7, learning, the only one that matters.** For 4 objectives, run kit games vs engine-only (T1) practice. Outcome is next-day delayed items plus near transfer (learning-science §7 reward rule). A game that passes every gate can still teach nothing (harnesses §8).

---

## 9. Risks and open questions

- **WebGL-less devices.** Phaser 4's Canvas renderer is deprecated **[V]**. If WebGL init fails, the kit reports `error{webgl}` and the host falls back to the T1 engine for the same objective (Canvas2D/SVG engines). The share of our users' devices this affects is unknown (M-K2).
- **v4's renderer costs more CPU under software GL** (§2.3 reruns). Low-end Mali/PowerVR GPUs and WebView GPU blocklists may behave like the SwiftShader case. Until M-K2, keep the 3.90 build of the kit compiled and tested in CI, so the flag flip is real.
- **Phaser 4 is six months old.** 4.0 shipped 2026-04-10, and 4.1 and 4.2 followed within 3 months **[V]**. Pin the exact version. Bump only with a rerun of M-K0, M-K1 and the golden mechanics.
- **The facade can leak.** If agents need Phaser input for a legitimate mechanic (continuous drawing, a pinch-free slider), add a kit primitive (`api.trace`, `api.slider`). Never relax the V0 rule.
- **Interest theming vs bland manipulatives.** This tension is inherited (harnesses §8), and the motifs-between-levels rule is the current answer. V5 has to judge it, which is a model judgement. Audit by sampling (V7).
- **Rhythm games need a working audio clock and calibrated latency.** Until M-K6 is done, ship rhythm-chant in `untimed` mode only.
- **Probe scope.** M-K0 tests one-file generation from scratch. Forge builds against a kit doc, which should help the less familiar frameworks more than Phaser. The probe therefore *understates* how close the frameworks are, and it cannot show that a kit on LittleJS would be worse. M-K1 arm (c) is the honest test.

---

## Sources

**Measured or read this session [V]:**
- npm registry metadata and download API (`registry.npmjs.org`, `api.npmjs.org/downloads/point/last-month/*`), 2026-10-02.
- Stack Overflow tag counts via `api.stackexchange.com/2.3/tags/{phaser-framework;pixi.js;three.js;babylonjs;matter.js;howler.js;kaboom;p5.js}/info`, 2026-10-02.
- Installed packages: `phaser@4.2.1`, read from:
  - `README.md` ("AI-ready", skills);
  - `skills/*/SKILL.md` (28 skills);
  - `CHANGELOG.md` and `changelog/v4/4.0/{CHANGELOG-v4.0.0,MIGRATION-GUIDE}.md`;
  - `src/physics/arcade/World.js` (`fixedStep` default true);
  - `src/renderer/webgl/WebGLRenderer.js` (context-loss handlers);
  - `src/input/InputManager.js` (1 default touch pointer).

  Also `phaser@3.90.0`, `pixi.js@8.22.0` (`lib/accessibility/AccessibilitySystem.mjs`), `kaplay@3001.0.19`, `excalibur@0.32.0`, `littlejsengine@1.23.1` (`dist/`, `package.json` exports), `three@0.186.1`, `@babylonjs/core@9.29.0`, `matter-js@0.20.0`, `planck@1.5.0`, `@dimforge/rapier2d-compat@0.21.0`, `howler@2.2.4`.
- Bundle-size and boot benchmark: esbuild bundles plus Playwright 1.63 / Chromium headless shell 153.0.8010.12, CDP CPU throttle 6×, n = 5 (this doc §2.2–2.3).
- Familiarity probe: `docs/research/factory/game-kit-probe.mjs`; raw results `docs/research/factory/game-kit-probe-2026-10-02.json`.

**Papers and pages:**
- OpenGame: *Open Agentic Coding for Games*, arXiv 2604.18394. It targets Phaser 3 because web 2D frameworks "provide a purely programmatic API surface highly amenable to LLMs". It reports five template families and genre IA (platformer 76.8 … puzzle/UI 52.6) **[S, html v1]**. https://arxiv.org/html/2604.18394v1
- Habgood, M. P. J. & Ainsworth, S. E. (2011). *Motivating children to learn effectively: exploring the value of intrinsic integration in educational games.* J. Learning Sciences 20(2):169–206, doi 10.1080/10508406.2010.508029. Metadata via Crossref **[V]**; abstract via Semantic Scholar **[S]**; 621 citations.
- GameGen-Verifier, arXiv 2605.07442 (via harnesses doc) **[S]**.
- Deci, Koestner & Ryan 1999; Rey 2012; Siegler & Ramani 2009; Fyfe, McNeil & Borjas 2015; Anthony et al. (children's touch); Sesame Workshop guidelines: all via `learning-science.md`, `maths-engines.md`, `kids-ux-ages.md` **[S as cited there]**.
- WCAG 2.2 §2.3.1 (three flashes) **[M]**.

---

## Principal review

**Reviewer stance:** adversarial principal engineer, 2026-10-02. **Question:** will `tgk@1` produce fun, correct, bug-free games for a 9-year-old within minutes, on Azure, safely?

**Short answer.** The *runtime choice* survives: Phaser behind a facade, words in DOM, kit-owned telemetry, the rejections. The *SDK as specified* does not survive yet. It has two security problems specific to this kit and four correctness bugs, one of them in the doc's own worked example. Its benchmark under-measures the device it targets. Its fun policy contradicts two sibling reviews. And it never states an end-to-end build latency, which is the owner's actual question.

Cross-cutting findings already made by sibling reviews are **referenced, not repeated**:
- CSP `connect-src 'none'` breaks Phaser's XHR loader: `llm-game-generation` P1, `sandboxes-per-student` R1.
- AST lint is not a boundary: `coding-agent-harnesses` C7, `llm-game-generation` P12.
- Grading must be kit-owned: harnesses C2, llm-game-gen P7.
- Ship the tested bundle: llm-game-gen P9.
- Content Safety is not validated for Hindi: harnesses C10.
- PII in public builds: sandboxes R13.
- G2 cannot land inside one lesson: harnesses C4, llm-game-gen P5.

Each of those findings applies to this doc as written. Here §4.1, §4.9 and §4.10 still carry the broken versions.

Tags: **[V-R]** means re-verified in this review, in installed package source (`scratchpad/kitsize/node_modules/{phaser@4.2.1, phaser3@3.90.0, pixi.js@8.22.0, matter-js@0.20.0}`), in the bench files, or in a sibling's raw probe JSON.

### What was re-verified and holds

| claim | check | verdict |
|---|---|---|
| `Phaser.Math.TAU` changed from π/2 to 2π | v3 `src/math/const.js:29` `TAU: Math.PI * 0.5`, `PI2: Math.PI*2`; v4 `const.js:16` `TAU: Math.PI * 2`, no `PI2` | [V-R] correct, and the V0 ban is justified |
| one default touch pointer | v4 `Config.js:281` `input.activePointers` default 1 | [V-R] correct. The *interpretation* is wrong; see K7 |
| Fisher p ≈ 0.03 (Excalibur), p ≈ 0.47 (KAPLAY) | hypergeometric, two-sided: 0.026 and 0.467 | [V-R] correct |
| probe spend ≈ $2.40 | 19.4k × $1.75/M + 169k × $14/M = $2.40 | [V-R] consistent |
| Phaser loader uses XHR in v4 too | v4 `Config.js:579` `loader.imageLoadType` default `'XHR'` | [V-R]. So §4.1 "`connect-src 'none'` still holds" is **false for this kit** (sibling P1/R1) |
| the runtime pick (Phaser 4 + facade, 3.90 flag) | §2.1–2.4 | holds. Nothing below changes the framework |

### P0: blocks the design as written

**K1. `api.phaser` hands the agent the whole engine, so the stable-subset rule is unenforceable.**
- `LevelApi.phaser` is the live `Phaser.Scene`. Through it the agent can reach:
  - `.input`, which bypasses `api.target`, breaks "one registration, four uses", and lets V4's two streams agree while TalkBack and the mirror miss the target;
  - `.load`, which fetches arbitrary URLs once `connect-src` is opened to `'self'` per the sibling fix;
  - `.scene`, which hijacks level flow;
  - `.sys.game`, which reaches the renderer, the canvas and the kit's other scenes.
- Every GameObject the agent creates carries a `.scene` back-reference, so even a filtered scene handle leaks.
- An AST ban on literal names (`setInteractive`, `input.on`) misses `obj.scene.input`, `api.phaser['in'+'put']` and a destructured `const {input} = api.phaser`.
- **Fix, by construction rather than by lint:**
  1. The agent's scene is created with Scene settings `plugins: ['Clock','TweenManager']`. Phaser installs `DefaultScene` plugins (`Clock, DataManagerPlugin, InputPlugin, Loader, TweenManager, LightsPlugin`) *unless* `plugins` is given **[V-R, `plugins/DefaultPlugins.js:91`, `scene/Settings.js:79`]**. Then `scene.input` and `scene.load` **do not exist**. All textures are loaded by a kit boot scene into the shared `TextureManager`.
  2. Replace `phaser: Phaser.Scene` with a kit `draw` object that holds the stable subset only: `image/sprite/rect/circle/graphics/container/numeral`, `tween`, `after`, `arcade`, `matter`, `camera.pan/zoom`.
  3. Extend the V0 allowlist (harnesses C7) so that the member names `scene`, `sys`, `game`, `plugins`, `registry`, `renderer`, `canvas`, `input`, `load`, `cache` and `textures` are rejected on *any* object. Computed member access with a non-literal key is rejected anywhere in agent files. Agent files are 150–300 lines, so the false-positive cost is small.
  - Run the scan on esbuild output of agent modules, since acorn does not parse TS (llm-game-gen P12).

**K2. Same-realm telemetry forgery. "The agent cannot forge or skip it" (§4.4) is false.**
- Kit core and `mechanic.ts` share one JS realm. Agent code (buggy, or steered by an injected brief) can monkeypatch the intrinsics the kit uses on the way out (`Array.prototype.push`, `JSON.stringify`, `Object.assign`) or wrap the bridge's `postMessage`. That lets it emit `level_complete{mastered:true}`, or drop `mistake` events.
- Kit-owned grading (K3) narrows this, but does not close it while the outbound path itself is patchable.
- **Fix:**
  - (a) At boot, before the agent module is evaluated, the kit captures `parent.postMessage`, `JSON.stringify` and its own queues in closures. It then hardens intrinsics: `Object.freeze` the prototypes of `Array, Object, Function, JSON, Promise, Map, Set, EventTarget`, the SES `lockdown()` pattern **[M]**. Run this *after* Phaser has finished its import-time polyfills. Measure the boot-time cost in M-K2.
  - (b) The host recomputes every grade from raw `{item, value}` against the spec (llm-game-gen P7) and rate-limits answers (≤ 5/s).
  - (c) V2 includes a **tamper test**: a seeded mechanic that tries each of these patches must fail to change the host-side event stream.

**K3. The agent still authors the grade. `Judgement.outcome` is agent-written, and the doc's own law is "a model never grades".**
- §4.2 has `judge()` returning `{outcome:"correct"|"misc"|"other", misc}`. §4.3 recomputes the *keys*, but the mapping from child action to outcome is generated code.
- The tests cannot catch it. V4 replays only `solution` (→ correct) and `miscPaths` (→ misc). A judge that returns `correct` for every committed value passes V4.
- **Fix:** replace the `Mechanic` shape with a **reducer plus view** split. This also deletes three agent-written functions that are classic bug sources: `getState`, `setState` and `judge`.

```ts
// tgk@1.1 — replaces Mechanic<P,S> in §4.2
type Json = null | boolean | number | string | Json[] | { [k: string]: Json };
export interface Observation { item: string; value: MathValue | string }   // a raw fact; NO outcome field
export type Effect = { kind: string } & Record<string, Prim | MathValue>; // e.g. {kind:"jump", to:{t:"frac",n:5,d:6}}

export interface MechanicV11<P, M extends Json, V> {
  id: string; archetype: ArchetypeId; paramsSchema: ZodType<P>;
  init(p: P, ctx: PureCtx): M;                                        // pure; the kit deep-freezes the result
  reduce(m: Readonly<M>, a: Action, ctx: PureCtx):                    // pure; THE only state transition
    { model: M; observe?: Observation[]; effects?: Effect[] } | { reject: "locked" | "invalid" | "no_effect" };
  targets(m: Readonly<M>): TargetSpec[];                              // declarative: world rect + action + label key
  mount(m: Readonly<M>, draw: DrawApi): V;                            // view objects; may hold Phaser GameObjects
  render(m: Readonly<M>, v: V, fx: Effect[], draw: DrawApi): void;    // animation only; it never sees an Action
  facts(m: Readonly<M>): Record<string, Prim>;                        // ≤ 12 keys
}
interface PureCtx { math: KitMath; law: KitLaws; rng: SeededRng /* state lives in M */; params: unknown }
```

How the reducer shape fixes the rest:
- The kit grades each `Observation` against `items[].key` and the distractor/`MC.*` table, using executable misconception rules (harnesses C2). Telemetry, `mastered`, the hint ladder and the ramp controller are all computed from those grades.
- `getState`/`setState` become kit serialisation of `M`.
- WebGL context-loss restore becomes `mount(M)` again.
- Keypoints assert on `M`.
- The rule "`update` must not change judged state" (§4.2) becomes true by construction: `render` has no route to `M`, because it is frozen.
- Determinism means `reduce` is pure and seeded.
- The **negative-path sweep** (llm-game-gen P7) becomes cheap. For every item, `reduce` is driven with every distractor and with 50 random legal actions, and the kit grade must match an oracle computed from params alone.

**K4. The doc's own worked example cannot express its target misconception.**
- §4.3 L3 gives the child two tiles, `+1/3` and `+1/6`. The kit then computes `1/2 + 1/3` exactly and jumps to 5/6.
- A child who "adds across" picks `+1/3` and **lands correctly**, because the *game* did the addition. The only wrong move, `+1/6`, lands at 2/3, which is not a platform and has no misconception.
- The `miscPaths` entry uses an `aim` action that exists nowhere in the level's input grammar: the solution uses only `pick_tile` and `jump`. So V4 either fails this level or passes it on an action the child can never make.
- **Fix (verb redesign):** the child **predicts the landing first**. They drag or tap a marker on the line, which snaps to ticks, then commit, then the jump plays the true operation.
  - The observation is the *predicted value*. ADD_ACROSS shows up as a prediction of 2/5.
  - The consequence is that the character lands at 5/6, away from the child's marker. The sag platform goes under the *marker*, not under a fixed 2/5.
- **Grammar rule for the kit:** S1 rejects any `miscPaths` or `hints.demo` action whose `type` is not produced by some `TargetSpec` of that level.

**K5. Matter cannot do what §5.2 asks of it, and "snap if drift > 4 px" is visible cheating.**
- matter-js 0.20 has **no buoyancy or fluid model** at all **[V-R, no `buoyan|fluid` in `matter-js/src` or Phaser's bundled copy]**. So `float` cannot be simulated; it can only be scripted.
- A seesaw that balances by the law sits in neutral or unstable equilibrium as a rigid body. Solver jitter tips it within seconds, and the kit then snaps it back.
- Children notice objects teleporting. A sim that visibly disobeys itself and then corrects is the opposite of the POE "watch what happens" moment.
- **Fix:** law-judged sandboxes (balance, float, ramp rank, circuits-lite) are **kinematic choreography**. The law evaluator computes the end state and the timeline (tip angle, sink depth, roll order), and kit tweens with tuned easing play it out.
  - Matter is used only where *nothing is judged*: free-build stacking, toppling for fun, "make it fall".
  - M-K4 (Matter flake) then mostly disappears.
  - Rule P1 stays: physics never judges, and now it doesn't animate the judged outcome either.

### P1: wrong, unmeasured or missing

**K6. The benchmark did not render at the DPR the kit ships.**
- `bench.mjs` sets `deviceScaleFactor: 2`, but `entries/phaser4.js` creates `new Phaser.Game({width:360,height:640})`. Phaser has no DPR handling: the only `devicePixelRatio` reads in `src/` are `OS.pixelRatio` detection and Matter's debug renderer **[V-R]**. So the backing store was 360×640, upsampled by the compositor.
- §4.8 ships `min(dpr, 2)`. That means 4× the pixels, 4× the fill and 4× the canvas memory, and none of it was measured. Under SwiftShader, fill is exactly the term that dominates.
- "First frame" is also the first `update()` callback, not the first presented frame.
- **Fix:** rerun §2.3 with the kit's real DPR path: game size `360·dpr × 640·dpr` with camera zoom `dpr`, or Scale.FIT on a DPR-sized canvas. Measure to first `requestAnimationFrame` after the first WebGL `drawArrays`. Report fps p10, not the median.

**K7. 6× throttle is not a ₹8–10k phone, and the host was contended.**
- The host is an "Intel Xeon @ 2.10 GHz", 4 vCPU, with load average 6.5–10.9 during the runs (§2.3).
- Helio G35 Geekbench 6 single-core is about 180–190 **[S, 91mobiles / nanoreview]**. A cloud Xeon core is roughly 1,500–2,000 **[M]**. So the honest ratio is about **8–11×, not 6×**.
- Contention inflated the desktop numbers too, so the error goes both ways and the 840 ms cannot be scaled with confidence.
- Expect Phaser cold first frame on a G35 of about 1.2–2.0 s *before* WebView cold start **[U]**. That puts the §4.8 budget of ≤ 1.5 s p50 at risk.
- **Fixes:**
  - (a) Calibrate once: run the same boot page on one real G35/T606 phone (an afternoon's work) and derive the throttle multiplier. Use that in V2.
  - (b) **Pre-warm the kit iframe.** When the Director schedules a game, mount the kit iframe hidden and paused, with Phaser parsed, the WebGL context up and a blank scene, during a teacher speaking turn. Tap → first frame then costs only package parse plus `mount()`, about 50–200 ms **[U]**. The memory cost is about 30–60 MB on a 2–3 GB phone; measure it in M-K2 and tear the iframe down if it is not used within the lesson.

**K8. The game iframe shares the host's main thread on Android, so one infinite loop freezes the teacher.**
- Android WebView has no OOPIF / site isolation (`avatar/performance-android.md` line 135: "not yet supported in Android WebView" [V]). The sandboxed iframe therefore runs on the **same renderer main thread** as the React host, the avatar's lip path and the realtime session's JS.
- A `while` loop in `mechanic.ts`, or a 400 ms GC storm, stalls the whole app. A host watchdog cannot fire, because it is blocked on the same thread.
- V2 only exercises tested paths. The ramp controller's inserted variants and setState fuzz reach untested ones.
- **Fixes:**
  - (a) A **build-time loop guard**, the CodePen/JSBin "loop protect" pattern: an esbuild plugin on agent modules only. It injects a budget check on every loop back-edge and every recursive call, and throws `ForgeBudget` once a single `reduce` or `render` call exceeds 8 ms (B1–B2) or 16 ms of wall time, or 10⁶ iterations.
  - (b) The kit wraps every agent callback. Three budget throws, or 5 frames over 50 ms in a row, puts the game into `error{budget}` → teardown → T1 fallback.
  - (c) In a **live lesson**, cap at 30 fps and *sleep the loop when nothing animates* (`game.loop.sleep()` / `wake()`). That frees CPU for the realtime audio and the avatar. Add M-K9: audio underruns and avatar frame drops with a game open, on the reference phone.

**K9. WebGL context budget across host avatar, Phaser and the three overlay.**
- §2.7 overlays a second WebGL canvas (three) on Phaser. The host may also be running the 3D tutor avatar (`avatar/`).
- That is three live contexts on a 2 GB Mali device. Chromium evicts the oldest context when over its limit **[M]**, and the oldest is likely the avatar's.
- **Fix:**
  - At most **one** WebGL context in the iframe. A 3D level is a separate T1 three engine module, not an overlay inside a Phaser game.
  - The host deliberately suspends the avatar renderer while a game is foreground, and restores it on `quit`.
  - M-K2 adds a test: context loss and restore with avatar + game, after backgrounding.

**K10. The audio unlock path is wrong for a cross-origin sandboxed iframe.**
- User activation propagates *up* to ancestors, not *down* into a cross-origin child **[M, HTML user-activation model]**. The host's "play" tap therefore does not unlock the iframe's `AudioContext`.
- The `level.intro` cue, which plays before the first in-game tap, will be silent in solo mode.
- **Fix:**
  - Solo-mode **voice clips play in the host frame**, which is already activated by the mic permission flow. The host owns the "never two voices" rule, and it sends `voice_start`/`voice_end` over the bridge so the kit can duck its SFX.
  - SFX stay in the iframe, unlocked by the first in-frame tap. The kit's own full-screen "start" tile doubles as the holdover guard.
  - Add `allow="autoplay"` delegation **only** if M-K6 shows it is needed. Never delegate `microphone`.

**K11. "One pointer suits children's palms" is backwards.**
- With `activePointers: 1`, the first contact owns the pointer. A resting palm, or the other hand holding the phone edge, *captures* it, and the real finger tap is ignored. This is the commonest "it doesn't work!" complaint in young children's play.
- The DOM mirror, meanwhile, receives real multi-touch from the browser, so the same tap behaves differently on the two layers.
- **Fix: the DOM hit layer is the single input path for every discrete target.**
  - The mirror buttons get `pointer-events:auto`, are kit-positioned from `targets(M)` every frame (not at 10 Hz) and are inert while an effect animates.
  - The canvas takes input only for kit `drag`/`trace` primitives.
  - Palm rejection runs in the kit: ignore touches with `Touch.radiusX/Y` above about 12 mm where reported **[M]**, and touches that start in the outer 8 mm edge band.
  - This also settles a contradiction. Pixi's AccessibilitySystem, which §0.7 copies, is plain `div`s (not shadow DOM). It sits in a `pointer-events:none` container and activates only on Tab or when a screen reader focuses an off-screen touch-hook button **[V-R, `AccessibilitySystem.mjs:92–136`]**. That container cannot also be the tap path and the Playwright selector, which §4.7 asks of it.

**K12. V4's "identical event streams" can never pass as specified.**
- `answer.latency_ms`, `level_complete.ms` and `perf` differ between any two runs.
- The holdover guard drops GUI taps within 400 ms of a level transition.
- The gaming detector fires `rapid_guess` on instant `act()` replays, and discounts the level.
- **Fix:**
  - Drive both runs with Playwright `page.clock` (sandboxes R5).
  - Insert `step(guard + 100 ms)` after every level transition and ≥ 1.6 s between answers.
  - Compare streams **modulo timing fields**: `latency_ms`, `ms`, `perf.*`, `seq` gaps. The equality that matters is (type, item, value, kit grade, misc).

**K13. Determinism bans miss Phaser's own unseeded randomness.**
- `Phaser.Math.Between`, `FloatBetween`, `RandomXY*`, `Utils.Array.Shuffle`, `GetRandom` and `RemoveRandomElement` call `Math.random` directly **[V-R]**. They are among the most common calls in v3 code.
- `Phaser.Math.RND` is seeded from `Date.now() * Math.random()` unless the config passes `seed` **[V-R, `Config.js:168`]**.
- **Fix:** the kit sets `seed` per level from the spec. V0 bans those six helpers and `Phaser.Math.RND` in agent files, and the error message names `ctx.rng`. Add `performance.now`, `setTimeout`, `setInterval`, `requestAnimationFrame` and `crypto.getRandomValues` (llm-game-gen P10).

**K14. The planner's output schema cannot be produced under strict structured outputs as typed.**
- Measured on `taxila-brain` and `taxila-fast` (`content/genui-azure-limits-*.json`): **"13 levels of nesting exceeds limit of 10"** **[V-R]**.
- `GamePackage → levels[] → LevelSpec → variants[] → variant → items[] → item → distractors[] → d → value{t,n,d}` reaches depth **10**, which is at the limit.
- `params: unknown` and `Record<string, L10n>` / `Record<CueKey, VoiceLine>` (dynamic keys) are not expressible in strict mode, which requires closed objects **[M]**.
- **Fix:**
  - The planner emits **intent only**: archetype, mechanic, objective, band, knobs per level role, motif ids and string keys. That is about 1–2k tokens.
  - A kit generator/solver expands it into `LevelSpec` deterministically (harnesses C2).
  - Strings and voice become arrays of `{key, hi-Latn, en, deva?}`.
  - This is also the main latency fix (K16).

**K15. Pre-rendered voice cannot carry runtime slots.**
- §4.6 says numbers are slots "formatted by the host". But solo clips are rendered **at publish**.
- Slot values known only at runtime (an inserted variant's numbers, `count_session`, a predicted value) have no clip. Splicing number clips breaks prosody.
- Hindi number names are irregular from 1 to 99, and fractions have special forms (aadha, pauna, sawa, dhai, teen-chauthai), so splicing would also need a large clip bank.
- **Fix:**
  - At S6, enumerate every (cue × slot-tuple) reachable from `levels + variants`. This set is finite, because items are finite, and each tuple is rendered as a whole line.
  - Ban runtime-only slots in `VoiceLine`; those cues are caption-only.
  - Cache clips by `sha(text, voice, instructions)` across games, since the same "shabash, ab agla" lines recur.
  - Use the **same voice id and persona instructions as the realtime teacher** **[M: gpt-4o-mini-tts and realtime share most voice names]**. Otherwise solo play has a different-sounding "teacher", which breaks the exactly-human-teacher premise.

**K16. No end-to-end latency, and "within minutes" holds for only one path.** Here is the missing table, using measured throughput of about 165 tok/s on `taxila-brain` and about 230 tok/s on `taxila-fast` (2,008 tokens in 12.2 s / 8.7 s, structured output, same probe) **[V-R, n = 1 each]**:

| path | critical path | p50 | p90 | $ / game |
|---|---|---|---|---|
| **in-lesson: reviewed mechanic + intent planner (K14) + library sprites** | fast planner ~1–2k tok (8–15 s) → kit expand+solve (< 1 s) → V3–V6 on a warm pool (20–40 s) ∥ TTS clips (5–15 s, cache hits) | **≈ 45–75 s [U]** | ≈ 2 min | ≈ $0.01–0.05 |
| in-lesson as §6 is written: full-spec planner | brain ~6–9k out plus reasoning (60–100 s) → S1 mismatch retries → validators ∥ TTS ∥ per-child gpt-image-2 sprites (about 23 s each, RPM-bound) | 2–4 min [U] | > 5 min | ≈ $0.05–0.2 |
| new mechanic (codex) | llm-game-gen P5 | 12–15 min | > 20 min | ≈ $1.2–2 |

- State it in the TL;DR: **the in-lesson game is row 1.** A new mechanic is never built live, and never reaches a child before V7 human review plus a real-child playtest (harnesses P3.4).
- §5's sentence "a new mechanic goes through V7 before the library takes it" is ambiguous about *child exposure*. Make it explicit.

**K17. Fun: the doc's bans contradict two sibling reviews, and its citations do not support the bans.**
- §4.5.6 and §4.10 ban particles, camera shake, confetti and any celebration. `coding-agent-harnesses` P3 and `llm-game-generation` B9 both require a **kit-owned juice and feel layer**.
- **Deci, Koestner & Ryan 1999:** *expected tangible* rewards undermine intrinsic motivation, and do so more for children. **Positive informational feedback enhanced free-choice behaviour (d = 0.33)**, though less for children than for college students **[S, Psych. Bull. 125:627; abstract]**. That supports response-contingent, competence-informing feedback, not a ban on it.
- **Rey 2012 (seductive details)** is about interesting-but-irrelevant *content* added to multimedia lessons. A landing puff on the correct jump is feedback on the core verb, not a seductive detail.
- **Fix:**
  - Keep every ban **for agent code** (V0).
  - Add a human-tuned `kit.feel` per archetype: squash and stretch, landing dust, a correct-intent sparkle ≤ 400 ms, a consequence animation, and a ≤ 1.5 s level-complete ceremony on the journey path.
  - Keep currencies, points, streaks and leaderboards banned.
  - Allow **unexpected** mastery cosmetics (a sticker on the hero), which Deci finds non-undermining.
  - Two archetypes collapse into quizzes in B1–B2:
    - "gate-stop" runner-gates is a 2-choice quiz with a walking animation, which is the quiz-gate pattern §0.10 bans;
    - `untimed` rhythm-chant is flashcards.
    - Mark both as B3+ only, or redesign them: a self-paced sorting conveyor for B1–B2.
  - Add **M-K8, fun**: level-1 completion, voluntary "play again", time to quit and rage taps per mechanic (harnesses P3.3), with a bandit that demotes mechanics below threshold.

### P2: smaller corrections

- **`MC.DEC.PLACE_ALIGN` example (§5.3) is wrong.** ₹2.50 + ₹1.75 both have two decimals, so place-misalignment *cannot* occur. Neither "2.125" nor any standard error rule produces it. Adding whole and decimal parts separately gives **3.125**, which is a different misconception.
  - In a money context, where paise always have 2 places, PLACE_ALIGN is nearly unreachable. Use ₹2.5 vs ₹1.75 in a decimals context, where misalignment gives 2.00 or 0.425.
  - This is direct evidence that misconception examples must be **executable rules** in the catalogue, never planner prose (harnesses C2).
- **Hit-area inflation without a layout rule overlaps targets.** Integers −5…+6 on a 300 px line are 25 px apart, against a 64 dp B1–B2 minimum and 48 dp for B3–B4.
  - The kit must resolve overlaps (nearest centre wins).
  - V5 must fail any level whose inflated areas overlap by more than 20%. The fallback is drag-a-marker with snap and a magnifier, or camera zoom per segment.
- **Devanagari font subset.** The reskin path adds strings *without* a kit rebuild, so the subset must be the **whole Devanagari block** (U+0900–097F, plus U+A8E0–A8FF, ZWJ/ZWNJ, U+25CC and ₹ U+20B9 in both fonts), kept with full GSUB/GPOS (`pyftsubset --layout-features='*'`). A glyph-used subset breaks conjuncts on the first new string.
- **Fonts, module scripts and the lazy `import()` of three (§2.7) are CORS-mode fetches from an opaque origin** (`Origin: null`). They need `Access-Control-Allow-Origin: *` on the kit and blob responses (sibling R1). They are not "same origin". The CSP `'self'` matching inside a sandboxed document must be measured (sandboxes R5).
- **Offline (§4.8, M-K5):**
  - Do not depend on a service worker controlling an opaque-origin frame **[M: expect it not to]**.
  - Web: rely on the HTTP cache with immutable, content-hashed URLs.
  - APK: download packages natively to app storage and serve them through Capacitor's local server. This drops "LRU of 30 in a SW".
- **`blocking: true` cues (§4.6) need a timeout.** If the teacher's realtime turn never comes (busy, network), input stays locked forever. Unlock after `max(clip length, 6 s)` with the caption shown.
- **§4.9 "stripped from production by a define"** contradicts llm-game-gen P9 (ship the tested bytes). Keep the hooks in, inert until a one-time harness token arrives.
- **§4.1 CSP:** replace `connect-src 'none'` with the path-scoped policy of llm-game-gen P1, and set `loader.imageLoadType: 'HTMLImageElement'` as the kit default (sandboxes R1).
- **Model note (§ header):** the brief again lists `taxila-opus`/`taxila-sonnet` as live. `CLAUDE.md`'s binding directive (2026-10-02, no Anthropic-on-Foundry) wins until the owner says otherwise. The kit is model-neutral. Rerun M-K0 with `--model` only if the directive changes.
- **"Phaser 4 is known to the builder":** Phaser 4.0 final (2026-04-10) is probably after gpt-5.3-codex's training data **[M]**. The 8/8 shows the v3-compatible subset works, which is what the facade exposes. Ship the 2 trimmed `SKILL.md` excerpts (§6.3) for every v4-only API the facade adds.

### Measurements to add (append to §8)

| id | what | pass bar |
|---|---|---|
| M-K2b | rerun §2.3 at the real DPR path (K6), throttle calibrated against one real G35/T606 phone (K7); pre-warmed vs cold iframe | p50 tap → first frame ≤ 1.5 s cold, ≤ 300 ms pre-warmed |
| M-K8 | fun per mechanic from telemetry (K17), the first 200 child plays | level-1 completion ≥ 80%; "play again" ≥ 30% **[U, set from base rate]** |
| M-K9 | live-lesson contention: audio underruns and avatar fps with a game open; loop-guard overhead (K8) | 0 audible underruns; guard ≤ 3% frame time |
| M-K10 | negative-path grading sweep on 24 seeded-bug mechanics under MechanicV11 (K3) | 24/24 caught |
| M-K11 | tamper battery (K2): intrinsic patching and bridge wrapping | host stream unchanged in 100% of attempts |
| M-K12 | planner intent → kit expansion: share of intents that expand and solve on the first try; wall clock (K14, K16) | ≥ 95%; p50 ≤ 20 s |

### Proposed context entries (for the main loop to merge via `context/inbox/`)

- **decision `tgk-reducer-mechanic`.** Mechanics are pure `reduce` + view `render`, and the kit grades raw observations. *Reverse never*; this is the "a model never grades" law.
- **decision `tgk-dom-hit-layer`.** The DOM hit layer is the only discrete-input path, and the agent scene has no `InputPlugin` or `Loader`. *Reverse if* DOM sync costs > 4 ms/frame on the reference phone.
- **decision `tgk-kinematic-law-sandboxes`.** Judged physics is choreographed from the law evaluator, and Matter is used for unjudged play only. *Reverse if* a future engine gives stable buoyancy and equilibrium with 0 snaps over 20 reruns.
- **rejection `matter-for-float-and-balance`.** There is no buoyancy model in matter-js 0.20, and rigid-body equilibrium is unstable.
- **rejection `bench-dpr2-without-backing-store`.** §2.3 fps and first frame were measured at 1× backing store.
- **measurement:** brain ≈ 165 tok/s and fast ≈ 230 tok/s structured output (n = 1); strict-schema nesting limit 10.

**Sources added in this review:**
- installed package sources, as cited inline [V-R];
- Deci, Koestner & Ryan 1999, *Psych. Bull.* 125(6):627–668, abstract and summary via https://pubmed.ncbi.nlm.nih.gov/10589298 and https://home.ubalt.edu/tmitch/642/articles%20syllabus/Deci%20Koestner%20Ryan%20meta%20IM%20psy%20bull%2099.pdf [S];
- Helio G35 Geekbench 6 single-core: https://www.91mobiles.com/processor/mediatek-helio-g35-pdp and https://nanoreview.net/en/soc/mediatek-helio-g35 [S].
