# Round 4 · Games feasibility: real-game quality, assembled live from the lesson, on a ₹10k phone, Azure-only

**Date:** 2026-10-10 · **Status:** research + one prototype. Nothing here has met a child or run on a phone.
**Question (owner, 2026-10-10, verbatim):** "the games that we are creating have to be minecraft ,space fighter level or
atleast around that proper game games i mean and everything need to be build on the go and depending on the overall
understanding of the student and the ongoing convo/lecture with the duplex way."

**Labels.** [M] measured here today (method and n beside it) · [R] measured earlier in this repo (context id or file) ·
[S] published source (URL in §10) · [E] estimate (reasoning shown) · [U] unmeasured. **Every browser number in this
file is a proxy**: headless Chromium on a shared 4-core x86 container with SwiftShader (software GL). It is not a phone
and its GPU is not a Mali, Adreno or PowerVR. §5.3 explains what the proxy can and cannot say.

---

## 0. The answer on one screen

**Yes, in a bounded form, and the hard part is not the graphics.**

1. **The graphics bar is reachable on our stack.** A three.js 3D space-flight slice where aiming *is* placing a
   fraction on the number line runs with **25 draw calls, about 3,300 triangles, 4 textures and a 6-8 MB JS heap** [M].
   three.js is already in the repo (0.180.0, used by `src/avatar/three`), so it needs no new dependency. Tree-shaken to
   what a game imports, it is **99 KB brotli** [M]. Cold load to the first frame at 4x CPU throttle [M, emulated]:
   - **813 ms** on 10 Mbps / 60 ms;
   - **1,384 ms** on 3 Mbps / 150 ms;
   - **2,528 ms** on 1.2 Mbps / 300 ms.

   The frame-rate proxy cannot judge a phone GPU. SwiftShader rasterizes on the CPU, which caps the proxy at 30 fps at
   DPR 1.5 whether or not the CPU is throttled. Our own JS takes 3.4-4.2 ms of a 16.7 ms frame at 4x throttle [M]. The
   game's frame-time governor stepped DPR from 1.5 to 1.0 and reached **59.9 fps** median on the same proxy [M]. The
   real-phone number stays owner-dependent (O-R4).

   The scene is far lighter than GFXBench T-Rex (about a quarter of its 1080p pixels and 3.3k triangles), which
   Mali-G52 MC2 phones run at a 42.5 fps median offscreen [S]. That supports ≥ 60 fps on a ₹10k phone, but as an
   estimate [E], not a measurement.
2. **"Minecraft level" means a bounded build world, not an infinite one.** A 6 x 6-chunk voxel world (96 x 96 x 24) with
   naive face-culled meshing holds 106,831 voxels. It draws 25.8k triangles in 19 draw calls (36 chunks, frustum-culled),
   meshes a chunk in 7.7 ms p50 and re-meshes after an edit in 8.2 ms p50 / 19.1 ms p95 at 4x throttle, on a contended
   host [M]. Re-meshing belongs in a worker with greedy meshing before it ships. That is enough for a build world sized
   to a lesson. It is not an endless procedural continent, which is not needed (§1.3).
3. **"Built on the go" splits three ways, by what can be verified in time.** The table is §3.1.
   - **Built offline, reviewed once:** the **engine**, its feel and its art packs. That is every pixel, sound and shader.
   - **Live, in code:** the **level**, built in **0.07 ms p50 / 0.8 ms p95** [M, n = 1,520 levels], solver-proven and
     shortcut-free. Code computes every number and every grade. No model ever grades.
   - **Live, from a model:** the **dress**. It is a closed-enum delta (theme, story wrapper, music mood, pace, teacher
     move, language). `taxila-fast-bg` wrote this prototype's delta from a lesson context in **p50 1,133 ms / p90
     1,442 ms**, 12/12 schema-valid at 40 tokens [M, n = 12]. Round 3's richer delta took 1.3-1.9 s p90
     [R `dec-r3-model-writes-delta-not-spec`].

   If the delta is late or invalid, the base dress plays. Everything a 2025-26 "AI game generator" does freely takes
   tens of seconds to minutes and is unverified:
   - free LLM games 36.7-54.2 s p50 [R];
   - world models are 720p, minutes-consistent and garble text [S];
   - images 6-47 s [R].

   They stay in the offline library lane (`forge-live-codegen-race`, `generated-media-carries-facts` stand).
4. **The architecture is a library of deep engines that are VIEWS over the round-3 laws, plus a live Game Director.**
   - **Round 3 already owns the hard part:** laws, solvers, mal-rules, shortcut proofs, server replay, signed evidence
     and ledger folding (`src/play`, `server/play`).
   - **Round 4 adds 3D game engines** that render a family's law as a real game. Antariksh renders Nishana (the number
     line) and angles. Khand renders Nazariya and Todo-Jodo as a voxel build world. Seven engines in all (§3.3, §4).
   - **The Director** composes level, dress, art and the teacher's move from the lesson state, the misconception just
     classified and the child's interests (§3.2).
   - **Evidence is unchanged:** raw acts go to a server replay, then an HMAC-signed token, then `kt_evidence` with
     `via: "game"` at weight 0.5. It never counts as the delayed check.
5. **NEVER MANIPULATE in real-game genres** (§6). This follows the main session's delegated option B
   (`dc-r4-gamification-b`):
   - no currency or points carried across sessions (an in-run score that ends with the run is allowed; the prototype
     shows none);
   - no lives that gate learning (a miss leaves a visible consequence and costs nothing);
   - no countdown pressure on new skills: the world flies in real time but **waits for the decision**, and fast action
     is a mode only for skills the ledger calls secure;
   - no unlocks (doors, not locks), no random drops, ranks or streaks.

   Three things real games have still need an **owner decision**:
   - a music bed (here it hard-ducks under her voice);
   - dense environment art (G12's sprite budget);
   - a "shooting" verb for classes 4-5.

   The ban is enforced on copy only today (`r4p-economy-ban-copy-only`). Engines therefore need a logic-level lint
   (§6).
6. **What round 4 can honestly ship:** one cloud session (3-4 days) can productionise **one engine (Antariksh) over the
   existing Nishana law** for its 18 admitted skills (12 topics, `data/play/coverage.json`), at three viewports, with the evidence path. A second engine
   (Khand, voxel) can reach a playable state but not certification (§7). The other five are later. The learning claim is
   unproven until a child pilot (mechanics.md §12).

```
lesson events ─┐ (skill now, classified answer + kit misconception id, duplex partial intent "game khelna hai",
               │  beat, child's interest tags, device tier + box)
               ▼
   GAME DIRECTOR (server, pure code, < 50 ms)  ── admit by skill (coverage.json) → engine + family law
               │      level = law.generate(skill, focus misconception, fade, band, seed, box)   [code, solver-proven]
               │      base dress = rotation rules (never same look twice)                        [code]
               ├──► taxila-fast delta (enums only, ≤ 1.9 s p90) ─► validate ─► dressed spec (else base dress)
               ▼
   spec rides the turn response ─► device: engine chunk (cached) + art pack (cached) ─► layout solve at the real box
               ▼                                                                       ─► reveal at a turn-point
   CHILD PLAYS (touch / closed voice grammar) ─► raw acts ─► server replays the SAME law ─► signed evidence token
               │                                                     │
               ▼                                                     ▼
   teacher at play turn-points (authored, conditioned bank;     lesson turn folds token → kt_evidence via "game" (w 0.5)
   full turns at seams)                                          → next level = best experiment on the updated beliefs
```

---

## 1. What "Minecraft / space-fighter level" means, as a bar a build can be held to

### 1.1 The polish markers (each one checkable)

Round 3's judges put the play families above Prodigy and below DragonBox (`docs/design/round3/play/RESULTS.md` §5).
The owner's complaint is about a different axis: they look like apps, not games. These are the markers that separate
a "game" from an "interactive", written as checks:

| # | marker | what "game-level" means | check (instrument) |
|---|---|---|---|
| Q1 | **A world with depth** | 3D or 2.5D space with parallax, a horizon, a place you are *in* (not a panel) | ≥ 3 depth layers moving at different rates; camera with perspective |
| Q2 | **Real-time continuous control** | the thing you steer responds within one frame, with inertia | input → visible change ≤ 1 frame; spring or velocity model, not teleport |
| Q3 | **Motion physics** | weight, banking, overshoot and settle; no linear tweens on the player | the ship's roll ∝ lateral velocity; a critically damped spring |
| Q4 | **Juice** | particles, screen shake, hit-stop, flash, squash, all caused by the act and scaled to it | Kao 2020 medium-high, not extreme [S via `game-mechanics.md`]; limits in `src/play/core/juice.ts` (shake ≤ 6 px, hit-stop ≤ 80 ms, ≤ 90 particles in 2D) |
| Q5 | **Sound design** | layered SFX per event, an engine bed, pitch that follows position, no buzzer | every act has a sound; a miss is a soft "thup" (`sound.ts` rule) |
| Q6 | **Music** | an adaptive bed that changes with the scene | **owner decision O-G2** (§6): G12 forbids music under the teacher |
| Q7 | **Progression you move through** | sectors, gates, a journey; the next level arrives *in the world* (warp), not as a new screen | no modal between levels; door choice is diegetic |
| Q8 | **Fail forward** | a mistake has a visible consequence and the game goes on | no lives and no game over (G6) |
| Q9 | **Frame stability** | 60 fps target, 30 floor, p95 frame ≤ 33 ms on the floor phone | rAF histogram on device (M-LE-2) |
| Q10 | **Load like a game** | first playable frame ≤ 3 s on 4G; no visible spinner (`design-v3-no-visible-build`) | cold-load timing under network emulation, then on Jio and Airtel |
| Q11 | **Legible at the child's size** | text ≥ 16 px (≥ 18 numerals), targets ≥ 48 px, Devanagari ≥ 16 px | DOM audit at 360 / 412 / 1366 (C4) |
| Q12 | **Art direction** | one coherent look per world, with themes as variants | blind craft rating ≥ 4/5 by two judge families (advisory) + owner |

### 1.2 What the device budget is

**The phones.** The repo's design floor is the Helio G35 (8x A53, PowerVR GE8320, 4 GB; `docs/research/design/low-end-offline.md` tier C
[R]). Today's ₹10k phones (mid-2026 listings [S]) are a step up. Examples: the Redmi A4 5G (Snapdragon 4s Gen 2,
Adreno 613); the realme Narzo N65 / C63 5G (Dimensity 6300, Mali-G57 MC2); the Moto G06 Power (Helio G81, Mali-G52 MC2).

| GPU (SoC) | GFXBench Manhattan 3.1 offscreen | T-Rex offscreen | 3DMark Wild Life | source |
|---|---|---|---|---|
| PowerVR GE8320 (Helio G35/G37, design floor) | 6.7 fps avg (3.7-8.4) | ~20 fps avg | — | Notebookcheck [S] |
| Mali-G52 MC2 (Helio G81/G85) | 14.3 avg / 15 median | 42.5 median | — | Notebookcheck [S] |
| Adreno 613 (Snapdragon 4 Gen 2 class) | 19 | 54 | — | Notebookcheck [S] |
| Mali-G57 MC2 (Dimensity 6300, Helio G99) | 23.8 avg / 25 median | — | 1,212 median (Unlimited) | Notebookcheck [S] |

Read as ratios: a 2026 ₹10k phone has about **2-3.5x the GPU of the design floor**. Manhattan 3.1 is a heavy ES 3.1
scene at 1080p offscreen, so 6.7 fps on the floor GPU does **not** mean games are impossible there. It means the budget
must be about 1/20th of Manhattan. WebGL 2 reaches 97.13% of global users (caniuse [S]).

**The budget I propose** (tier B = a ₹10k phone of 2025-26; tier C = Helio G35 class). The existing tier C caps are from
`docs/research/design/low-end-offline.md` §3 [R]. The scene column is this prototype's measurement [M].

| budget item | tier B | tier C | this prototype | basis |
|---|---|---|---|---|
| draw calls / frame | ≤ 80 | ≤ 40 | **25** | instancing; [E] from the T-Rex ratios above |
| triangles / frame | ≤ 150k | ≤ 60k | **~3,300** | [E] |
| DPR cap | 2.0 | 1.5 (governor steps down to 1.0) | 1.5 → 1.0 governed | `tier.dpr` [R]; the PlayCanvas forum's Android DPR fix [S] |
| GPU textures | ≤ 96 MB | ≤ 64 MB | ~0.6 MB of textures + ~7.6 MB of framebuffers [E: 540 × 882 × (4 + 4) B × 2] | [R] tier C ≤ 64 MB |
| JS heap | ≤ 160 MB | ≤ 120 MB | **5.6-7.7 MB** | [R] tier C ≤ 120 MB |
| JS work per frame | ≤ 6 ms | ≤ 8 ms at 30 fps | **3.4-4.2 ms at 4x throttle** | world draw ≤ 8 ms (`live-tech.md` §4.5) [R] |
| first-load JS (engine + game) | ≤ 250 KB br | same | 99 KB three (tree-shaken) + 21 KB game code [M] | §2 |
| first playable frame, 4G | ≤ 3 s | ≤ 4 s | 813 / 1,384 ms (2,528 at 1.2 Mbps) [M, emulated, contended host] | instant-game guidance: start < 5 s, < 3 s preferred [S via Defold] |
| initial download | ≤ 5 MB with art | ≤ 3 MB | 193 KB (three.js not tree-shaken; ≈ 150 KB with the tree-shaken build) | Poki-style 5-8 MB [S, third-party] |

**The network.** Ookla's median Indian mobile download was 131.77 Mbps in August 2025 [S]. That figure blends in 5G.
4G medians were far lower (13.30 Mbps in Ookla's January 2023 5G-vs-4G comparison [S]). Opensignal's 2026 India
report was not readable here (HTTP 403). I emulated three links I assume a child meets: 10 Mbps / 60 ms, 3 Mbps / 150 ms
and 1.2 Mbps / 300 ms. Real Jio and Airtel runs are owner-side (M-LE-1).

**Context loss.** Low-RAM Android Chrome reclaims GPU memory from background tabs, and a WebGL context can be lost
[S]. The engine must handle `webglcontextlost` (the prototype falls to the board twin, the round-3 degradation
ladder) and rebuild on restore (not built in the prototype).

### 1.3 What we should not try to match

- **Infinite procedural worlds, multiplayer servers and long open-world sessions.** The lesson segment is minutes long,
  and a game outside a lesson is a parked owner question (BUILD-PLAN §3.1 "the yard path").
- **Photo-real art.** Clark 2016: schematic g 0.48 vs realistic −0.01 [R via `game-mechanics.md`]. The look to aim for
  is stylised low-poly with strong lighting and colour (Monument Valley, Alto's Odyssey, Astroneer), not AAA.
- **Generated 3D characters with faces on game pieces.** G12 rules them out, and `rj-world-talking-residents` [R]
  rejects talking residents.

---

## 2. Engines and libraries (licence, size measured, phone evidence)

Sizes [M]: minified builds from jsDelivr (versions as listed), gzip -9 and brotli q11 measured with node zlib,
2026-10-10. "three (game set)" is a rolldown tree-shaken bundle of the 40 exports a game like the prototype imports,
built from the repo's own `node_modules/three` 0.180.0.

| library | licence | version | min KB | gzip KB | brotli KB | kind | phone evidence | verdict |
|---|---|---|---|---|---|---|---|---|
| **three.js (game set)** | MIT | 0.180.0 (in repo) | 493 | 121 | **99** | 3D renderer | Rosebud's generated 3D games run on it [S]; this prototype [M proxy] | **use** (already a dependency, no new package) |
| three.js (all exports) | MIT | 0.180.0 | 684 | 171 | 138 | | | |
| Babylon.js (full UMD) | Apache-2.0 | 9.30.0 | 8,418 | 1,816 | 1,270 | 3D engine | powers noa / bloxd.io [S] | too heavy as a UMD; tree-shaken ES modules are smaller [U] |
| PlayCanvas engine | MIT (the editor is a paid SaaS; the engine is free) | 2.23.2 | 2,491 | 642 | 499 | 3D engine | vendor test: ~60 fps on low-end phones (2016, pre-WebGL2) [S]; forum: Android slowdowns from DPR and shadows [S] | strong engine, 5x three's size, adds a second 3D stack |
| Phaser | MIT | 4.2.1 | 1,344 | 346 | 276 | 2D framework | a Phaser 4 single-file codegen probe: 6/6 functional on six of eight Azure models, 4/6 on the other two [R `game-code-probe-models-2026-10-02`] | not needed: the play families already have a Canvas2D stage |
| PixiJS | MIT | 8.22.0 | 821 | 232 | 185 | 2D renderer (WebGL) | — | only if a 2D engine needs > 2k sprites |
| Rapier 3D (compat, wasm inlined) | Apache-2.0 | 0.21.0 | 4,239 | 1,606 | 1,168 | physics (wasm) | the repo already carries 0.12.0 transitively | too heavy for a lesson; only for rigid-body-heavy engines |
| Rapier 2D (compat) | Apache-2.0 | 0.21.0 | 3,330 | 1,252 | 923 | physics | | same |
| cannon-es (minified here) | MIT | 0.20.0 | 120 | 34 | 29 | 3D physics (JS) | | **use only where rigid bodies are the skill** (Yantra) |
| matter-js | MIT | 0.20.0 | 82 | 25 | 22 | 2D physics | | Yantra 2D variant |
| planck.js (Box2D) | MIT | 1.5.0 | 290 | 54 | 44 | 2D physics | | alternative to matter |
| noa-engine | MIT | 0.33.0 | ~216 (unminified source) | | | voxel engine (Babylon 6 peer) | bloxd.io and Minecraft Classic are listed users [S]; last push 2023-07 [S] | **do not adopt** (pulls Babylon, stale); build Khand on three with our own mesher (§5.4) |
| Howler | MIT | 2.2.4 | 35 | 9 | 8 | audio files | | not needed (procedural WebAudio, as `sound.ts`) |
| Tone.js (minified here) | MIT | 15.1.22 | 334 | 77 | 65 | music/synth | | not needed: the prototype's 30-line sequencer does the music bed |

**Recommendation:** three.js plus our own small kits.
- A view kit: DOM labels over WebGL, a layout solve, a frame governor.
- Spring and AABB motion.
- Procedural WebAudio for sound and music.
- cannon-es or matter only inside the one engine whose skill is rigid-body physics.

The reasons:
- three is already in the repo, with types (`@types/three` 0.180.0). It is the smallest serious 3D renderer here.
- It has the largest body of LLM-written examples, which matters for agent-built engines.
- WebGPU is on its roadmap (`three.webgpu.js` ships).

What three costs us: no editor, no built-in physics and no scene tooling. We write the engine layer ourselves. That
layer is a few hundred lines per engine, as the prototype shows.

---

## 3. "Built on the go": what is live, what is pre-built, and the architecture

### 3.1 What can be generated in seconds vs what must be pre-built

| artefact | how | latency | truth-safe? | live? |
|---|---|---|---|---|
| level numbers, positions, keys | the family law in code (`law.generate`) | **0.07 ms p50, 0.81 ms p95** [M, n = 1,520 levels, node]; compose incl. dress validation 0.65-0.75 / 0.88-1.52 ms [M, n = 200 × 3 runs] | yes: solver-proven, shortcut-checked, discriminating | **yes, per level, on device or server** |
| dress (theme, wrapper, music, pace, teacher move, language) | `taxila-fast-bg` strict-schema enums, effort none | **this prototype's schema: p50 1,133 / p90 1,442 / max 1,759 ms, 12/12 valid, 40 output tokens** [M, n = 12, US → eastus2]; round 3's richer delta p50 1.3-1.5 s / p90 1.5-1.9 s, ~$0.0002 [R `ms-r3-live-delta-probe-2026-10-09`, n = 24 + 12] | yes: enums only; a model string is never shown | **yes, per segment**; the base dress if late |
| teacher's in-play lines | authored bank, filled by code; DragonHD pre-synthesis | first byte 228 ms [R] | yes: conditioned, guarded (`r3p-reaction-shape-conditions`) | yes |
| a full game spec (a model writing params) | Studio v2 catalogue | 6.2 s p50 / 11.9 s p90; 19% needed a fix pass [R `ms-r3-catalogue-spec-latency-2026-10-09`] | no: needs validators | no (library lane) |
| a game written as code (Lovable / Rosebud / Astrocade style) | codex / sol builds + gate | 36.7-54.2 s p50 per build + gate 4.8-11.6 s [R live-studio bench]; Forge G2 ≈ $0.20 per build and 166-223 s [R] | no: human review required before a child (`forge-live-codegen-race`) | **no**; offline library only |
| 2D art (skyboxes, textures, sprites, posters) | gpt-image-2, FLUX.2-pro, MAI-Image (Direct from Azure [S]) | gpt-image-2 low 16-23 s, FLUX.2-pro ~6 s, MAI-Image-2.6-Flash ~17 s; gpt-image-2 quota 4 RPM [R] | only text-free, reviewed (`generated-media-carries-facts`) | no; pre-generated packs |
| 3D meshes | TRELLIS.2 (MIT, open weights) on an Azure GPU we host | ~3 s at 512³, 17 s at 1024³ on an H100 [S] | no facts may live in a mesh | no; offline, reviewed, and an **owner decision** (self-hosted open weights on Azure compute, `rj-nc-data-and-weights-in-product` licence check) |
| music | no music model is sold Direct from Azure (catalogue updated 2026-10-08 [S]) | — | — | procedural (the prototype) or commissioned |
| a whole playable world from a prompt | Genie 3: 720p, 24 fps, a few minutes consistent, ~1 min visual memory, text legible only if prompted, research preview [S]; Muse/WHAM: 300 × 180 at ~10 fps, Azure Foundry Labs research [S] | real time, but | **no**: pixels cannot carry an exact fraction; no answer key | **no**: not Direct-from-Azure (Genie) / research-only (Muse); rejected for curriculum truth |

**What the 2025-26 generators are, and what transfers.** Rosebud says it turns prompts into three.js games
(company-reported 1M+ games [S]). Astrocade uses a multi-agent pipeline (art, sound, mechanics, UI) that produces a
playable game "in minutes", with 20M users claimed and a $56M raise in May 2026 [S]. Both optimise the "make *a* game
from a sentence" path. Neither verifies the game's truth, proves levels, models a learner or hits a 3 s window.

The round-4 product teardown reached the same conclusion independently. No product generates real games live inside a
child's lesson. The closest is TutorFlow Games, a teacher-side beta from August 2026: one sentence, then a plan, then
browser game code, then an automated play test before delivery, taking "a few minutes"
(`r4p-no-live-game-generation-in-session` [R]). Its play-before-ship gate is worth copying per composed instance.
Here that gate is the device's offscreen self-check plus the bot-played certification of every engine × skill pair.

What transfers:
1. **The engine + parameters pattern.** A trusted runtime with a declarative spec is A2UI's "catalogue of trusted
   components" [R via live-tech §2.1]. Rosebud's speed comes from a fixed, known stack.
2. **Remixing.** A child (or the teacher) remixes an existing proven world. That is round 3's build-a-level / *Ghar ki
   paheli*.
3. **Multi-agent offline production of engines and art packs.** This is exactly how our parallel cloud sessions should
   build the library. It is not how a lesson should get a game.

### 3.2 The Game Director

**Inputs**, all already produced by the lesson stack:
- `skillId` of the current beat (the Director's plan);
- the **kit misconception id** the classifier gave the child's last answer (`misconception_seen`, migration 023 [R]);
- the ledger's misconception posteriors, fade stage and band;
- the duplex partial intent (an ask to play, from the closed intent taxonomy `conv2-intent-layer` [R]);
- the child's stored interest tags (closed list);
- the last engine and theme shown (for variety);
- the device tier and the real box (`box-contract.json`, S0.5).

**Steps:**
1. **Admit by skill** (`dec-r3fix-play-admission-by-skill`). `coverage.json` names the family and mode; the engine
   table names which engine renders that family/mode (Antariksh for Nishana `place`/`compare`/`round`). No admission
   means no game: she draws on the board.
2. **Level** = `law.generate({skill, focusMal, fade, seed, box})`, deterministic from its parameters. The server can
   therefore rebuild the exact level from `(skill, focus, fade, seed, box)` and never trusts a device's level. The
   prototype's ladder: the exact ask, then the next fade that can show the belief, then drop the focus, then null (board
   twin). Never a wrong level.
3. **Base dress** by code rules: the theme rotates and is never the same twice running; wrapper and pace follow the
   engine defaults.
4. **Delta** (in parallel with 2-3; nomination usually starts from the duplex partial, before the child finishes).
   One `taxila-fast` call with a strict schema of the **closed enums** in
   `docs/research/round4/games/proto/specs/dress.schema.json`. Validated field by field. A non-enum value is dropped,
   never repaired. Arrives in ≤ 1.9 s p90 or is discarded.
5. **Ship** on the turn response (forge's live path). The device has the engine chunk and art pack cached (prefetched
   at lesson start for the admitted engines). It solves the layout at the real box and reveals at a turn-point
   (`dec-r3-play-duplex-turn-points`).
6. **During play.** The world persists: the next level is generated while the warp plays, in ≤ 1 ms on device. A spoken
   act in the closed grammar is graded like a touch (`r3p-voice-closed-grammar`). The teacher speaks only at turn-points
   from the conditioned bank, and takes full turns at seams. A new misconception classified mid-segment, from her talk
   with the child, becomes the next level's `focusMal`. That is how the "ongoing convo" steers the game.

**What makes it personal** without letting a model touch truth:
- **Which belief** the level tests: the misconception just seen.
- **Which band**: first-try 70-85% from the ledger.
- **Which fade**: concrete ticks, then ticks at another denominator, then none.
- **Which wrapper and theme**: the child's interests through the enums.
- **The teacher's move**: noticing, or a ghost demonstration first.

The prototype does belief, fade and dress live. Band moves only through the child's door choice; the ledger's band
estimate is not wired. The ghost demonstration is in the enum, and the model chose it 3/3 for a first-time child, but
the engine does not perform it yet. In the prototype the dress comes from the URL; the probe in
§5.2 shows `taxila-fast-bg` writing the same dress from a lesson context. The round-4 tutor research's measured
`LearnerHow` state (`r4t-learner-how-state`: H3 representation responsiveness, H8 interest hooks) is the right source
for the "which wrapper / which representation" inputs once it is written.

### 3.3 The evidence path (unchanged from round 3)

`law.js` is pure and runs in both the browser and node. The prototype's harness saved the browser's act log, and
`test-law.mjs` re-graded every level in node: **16/16** levels re-graded identically [M]. That is the property the
server replay needs. In production:
1. the device posts raw acts to `POST /api/play/act`;
2. the server rebuilds the level from its parameters and replays the acts through the same law (`server/play/grade.js`);
3. it returns an HMAC evidence token bound to child and lesson (`server/play/evidence.js`);
4. the lesson turn verifies the token and folds it once per level as `kt_evidence` with `via: "game"`, `grader: "code"`,
   SOURCE_WEIGHT 0.5;
5. a game event is never the delayed check and never "unaided". Only a bare item outside the game makes a skill secure
   (`in-game-success-as-mastery`).

The prototype's grader counts only the **first** shot at each value, so the reveal can never be "learned" by re-firing.
It ignores forged or malformed acts: 5/5 junk patterns × 1,520 levels changed no grade [M]. Time is not an input.

---

## 4. Intrinsic integration: the skill must be the mechanic

### 4.1 What the research says

- **Habgood & Ainsworth 2011** (*J. Learning Sciences* 20(2)): Zombie Division, ages 7-11. With the maths in the
  core mechanic (the sword's divisor splits the enemy), children learned more in fixed time (n = 58). Given a free
  choice, they played that version **7x longer** (n = 16). The extrinsic version gated play with a quiz [S].
- **Clark, Tanner-Smith & Killingsworth 2016:** games vs non-games g = 0.33. Teacher-provided scaffolding g = 0.58
  vs success/fail feedback 0.26. Schematic 0.48 vs realistic −0.01. Single-player non-competitive 0.45 vs competitive
  −0.06 [R].
- **DragonBox:** 3.5 h in grades 7-8 gave no gain on paper equations (Long & Aleven 2014) [R]. A great mechanic does
  not transfer by itself, hence the fade to the symbol and the bare item.
- **FH2T and DragonBox 12+** beat immediate-feedback problem sets in a 3,600-student grade-7 RCT (Decker-Woodrow 2023)
  [R].
- **Refraction** (splitting lasers is fractions): a 7-week pilot, n = 35, gained on a fraction test (Martin, Smith,
  Andersen, Liu & Popović 2012) [S]. Off-path coins cut median progress from 20 to 17 levels (Andersen 2011) [R].
- **Number-line games** are the closest evidence for the prototype. Kiili, Moeller & Ninaus 2018, n = 95 fourth
  graders, five 30-minute sessions: improved conceptual rational-number knowledge, driven by **magnitude estimation and
  ordering**; in-game performance predicted the post-test [S].
- **Prodigy, the quiz in costume.** The battle is gated by unrelated questions. A 2021 complaint by 22 advocacy groups
  to the US FTC [S] made three points: home players saw up to 4x as many ads as maths questions; the game pushed a
  Premium membership on children; and its efficacy claims were unsubstantiated. Round 3's judges placed our families
  above it on most dimensions [R].
- **Math Blaster (1983 →)** is the classic shoot-the-right-answer drill [S]. A space shooter is exactly where this
  anti-pattern lives.
- **Seductive details hurt learning.** Sundararajan & Adesope 2020: g = −0.33 over 58 studies, worst next to relevant
  diagrams and for novices [S]. Rey 2012 found medium negative effects [S]. Environment art must never sit on or
  compete with the learning objects (§6).

### 4.2 The test every engine × skill must pass

1. **The controller is the concept's operation** (L1, `r3g-idea-is-the-controller`). Aim at a magnitude, turn by an
   amount, build to a size, set a rate. Not "pick the asteroid with the answer".
2. **A child holding the misconception acts differently in the world**, so the level diagnoses (L4, mal-rules).
3. **The world's response is the law** (L2), and a wrong act shows the misconception's own consequence.
4. **Remove-the-game / remove-the-learning** (G2). Remove the learning and nothing playable is left. Remove the game
   and the task is still the same skill.
5. **The commit is not a pick from a list** (round-3 B3 failures: compare/predict/round ended in buttons).

Legend below: ✓ intrinsic (passes 1-5) · ◐ partial (the mechanic carries the setup but the commit is a choice, or the
skill is only partly in the verb) · ✗ quiz in costume (do not build).

### 4.3 Seven engines × class 4-7 NCERT skills

Topic ids are from `data/curriculum/c[4-7]-*.json`. The family each engine renders is round 3's
(`docs/design/round3/game/concepts/mechanics.md` §4).

**E1 Antariksh (space flight / shooter): renders F3 Nishana + angles. Verbs: aim along a line, turn by an amount, set
thrust.**

| topic | the mechanic | |
|---|---|---|
| c5-maths-ch02-t01 Fractions on the number line | aim the cannon at the cloaked mine at 2/3; it decloaks at the truth (**the prototype**) | ✓ |
| c6-maths-ch07-t02 Fractions on the line and mixed fractions | mines at 7/4 and 2 1/3 on 0-3; `all-less-than-one` shows as a shot squeezed under 1 | ✓ |
| c7-maths-ch03-t01 / t03 Tenths and hundredths; locating and comparing decimals | aim at 0.05 and 0.35 on 0-1: the `decimal-place` belief puts 0.05 at 0.5; where 0.305 and 0.35 land shows `longer-bigger` | ✓ |
| c6-maths-ch10-t02 Integers on the number line | line −10 to 10: the `neg-order-line` belief (negatives written left to right from the far end) puts −7 at −4 | ✓ |
| c4-maths-ch04-t03 / c5-maths-ch01-t02 Nearest hundred/thousand | place 3,449 on 3,000-4,000, then fly into the nearer landmark gate (a spatial commit, not a button); the `round-chain` belief flies to 4,000 | ✓ |
| c5-maths-ch03-t01 Angles as amount of turning | rotate the ship by ¼ / ½ / ¾ turn to face a beacon; the beam shows the turn swept | ✓ |
| c6-maths-ch02-t03 Measuring and drawing angles | set the cannon to 55° to reach a target; protractor ticks fade by stage | ✓ |
| c7-maths-ch05-t03 Transversals: corresponding / alternate angles | bank the beam off two parallel rails; predict the exit angle | ◐ (needs a careful level grammar) |
| c7-science-ch08-t02 Speed | set thrust so the ship meets a drifting beacon at a marked point (predict-run; no clock) | ◐ |
| (any) times tables as "shoot the asteroid labelled 56" | Math Blaster | ✗ |

**E2 Khand (voxel build world, "Minecraft"): renders F8 Nazariya + F1 Todo-Jodo arrays. Verbs: place and remove
blocks, walk around, look from a side.**

| topic | the mechanic | |
|---|---|---|
| c4-maths-ch02-t01 Top, front and side views | build the structure whose three views are given; the law projects your build and lights mismatched cells | ✓ |
| c4-maths-ch01-t01 Faces, edges and corners of 3D shapes | build a cuboid; predict the count of faces / edges before the world highlights them | ◐ |
| c4-maths-ch09-t01 Multiplication facts and patterns | fill a 6 × 8 gap in a wall exactly; the array is the product | ✓ |
| c5-maths-ch11-t01 / t03 Area by counting squares; same area, different shapes | lay floors of area 24 in different shapes | ✓ |
| c6-maths-ch06-t01 / t02 Perimeter and area of rectangles | fence vs floor with a fixed fence; `m-same-perimeter-area` produces a smaller field | ✓ |
| c6-maths-ch01-t01 Square and cube numbers | build the 1, 8, 27 cubes; the next is predicted, then built | ✓ |
| c4-maths-ch11-t02 / c6-maths-ch09-t01 Symmetry | build half; the mirror plane completes it; mismatches glow | ✓ |
| c7-maths-ch14-t02 Tilings | tile a courtyard with given tiles | ◐ |
| c5-maths-ch14-t01 Directions and routes | walk a route by directions on a block map | ◐ |
| (any) "mine a block, answer a question to get the ore" | quiz gate | ✗ |

Persisting a child's build across sessions is allowed (G5 `artifact`, shown to the parent). A Minecraft-like world the
child owns is compliant as long as nothing is unlocked, counted or decays.

**E3 Daud (racer / runner): renders F4 Chalao rates. Verb: set a rate, then watch the run.** The racer's own verb
(steering) is not a maths operation, so this genre is narrow.

| topic | the mechanic | |
|---|---|---|
| c7-science-ch08-t02 Speed | set the speed so the car is at the bridge when the ferry is there (predict-run) | ✓ |
| c7-science-ch08-t03 Uniform and non-uniform motion | the car lays a distance-time trail; make the run uniform | ✓ |
| c5-maths-ch05-t02 Comparing distances | choose a route by its distance on the map | ◐ |
| c5-maths-ch12-t02 Comparing timings | order the finishers (a sort, not a mechanic) | ◐ |
| c4-maths-ch12-t02 Elapsed time | a race clock is a timer (G10) | ✗ in this genre |

**E4 Kila (turn-based tower defence): renders F5 Niyam periodicity. Verb: place a tower with a period on a numbered
path.** The enemies advance one step per beat **only when the child presses "next beat"**. That makes it a
deterministic strategy puzzle (as in Into the Breach), not a timed TD.

| topic | the mechanic | |
|---|---|---|
| c5-maths-ch13-t01 Multiples and common multiples | towers hit every 3rd / 4th square; cover the gate at 12 | ✓ |
| c7-maths-ch11-t02 Lowest common multiple | when do both towers fire together? the path shows coincidences | ✓ |
| c6-maths-ch05-t01 Common factors and common multiples | choose periods that cover the path | ✓ |
| c6-maths-ch05-t05 Divisibility tests | a tower that hits multiples of 9; predicting the hits by digit sum is a check, not the verb | ◐ |
| c6-maths-ch01-t01 Number sequences | wave patterns follow a rule; place the next tower | ◐ |
| a TD where answering a question earns a tower | Prodigy-style | ✗ |

**E5 Chadhai (2.5D platformer): renders integer and sequence laws. Verb: a jump is an operation.**

| topic | the mechanic | |
|---|---|---|
| c6-maths-ch10-t03 Adding and subtracting integers | jump pads +5 / −3; reach floor −2 from +4 | ✓ |
| c6-maths-ch10-t01 Integers in everyday life | floors above and below ground, the lift as the line | ✓ |
| c7-maths-ch10-t01 Multiplying integers | a flip pad (× −1) reverses the direction of every later jump | ◐ |
| c6-maths-ch01-t01 / c4-maths-ch03-t02 Number patterns | platform heights follow a rule; build the next platform | ◐ |
| a runner with a question at each gate | quiz gate | ✗ |

**E6 Yantra (puzzle-physics): renders F6 Kyun-Lab laws + optics. Verb: place and rotate parts, then run.** cannon-es
or matter is used only where the motion must look physical. The outcome comes from a law the solver knows, and
approximate numbers say "lagbhag".

| topic | the mechanic | |
|---|---|---|
| c7-science-ch11-t03 Reflection and plane mirrors | rotate mirrors to route a beam; angle in = angle out | ✓ |
| c7-science-ch11-t02 Shadow formation | move the lamp to make the shadow fit a gate | ✓ |
| c6-science-ch04-t02 Poles, attraction and repulsion | place magnets to steer a rolling ball | ✓ |
| c7-science-ch08-t01 Simple pendulum | set the length so the swing hits a beat (T = 2π√(L/g), exact) | ✓ |
| c7-science-ch03-t01 / t02 Closed circuits and switches | wire the board; the bulb lights only on a closed loop | ✓ |
| c7-science-ch03-t03 Conductors and insulators | bridge the gap with materials | ✓ (overlaps the bijli lab) |
| c4-evs-ch07-t01 Floating and sinking | load a boat; the physics decides | ✓ |
| c5-maths-ch03-t02 Right, acute and obtuse angles | set ramp angles for a ball run | ◐ |

**E7 Nagar (city / system sim): renders F7 Karkhana. Verb: set flows and run the system.**

| topic | the mechanic | |
|---|---|---|
| c7-science-ch07-t04 The water cycle and groundwater | run the town's water: pumping vs recharge; wells dry when pumping beats recharge | ✓ |
| c4-evs-ch03-t02 Who eats what | run a food web; remove a species and watch the cascade | ✓ |
| c6-science-ch11-t02 Renewable and non-renewable resources | deplete or regenerate stocks over seasons the child advances | ✓ |
| c7-science-ch09-t01 Digestion in humans | Karkhana's "Andar ki Yatra" factory line | ✓ |
| c5-evs-ch07-t02 Saving energy | budget the town's energy | ◐ |
| c5-maths-ch15-t02 / c7-maths-ch13-t02 Bar graphs; mean, median, mode | the town's census as bars the child builds; set a value to move the median | ◐ |
| a city builder where answers earn coins to build | currency (G4) | ✗ |

**Not mapped to these genres:** English, Hindi and SST interactives (BUILD-PLAN lane 1D) and the c7 adolescence topics
(a safety register, excluded). Forcing a word-order task into a shooter would be the costume.

---

## 5. The prototype: *Antariksh Nishana*

`docs/research/round4/games/proto/` (no package.json change; three@0.180.0 from one pinned jsDelivr URL, the same
version as the repo).

| file | what |
|---|---|
| `index.html` | play-mode layout: teacher strip (48 px face placeholder + caption), the world, the goal rail, the dock |
| `game.js` | the engine (three.js): flight, aim, bolt, decloak, gap, doors as warp gates, warp, particles, shake, hit-stop, FOV kick, governor, bot, perf read-out |
| `law.js` | the pure law: generator, mal-rule regions, shortcut check, solver, grader, evidence rows (runs in node and browser) |
| `director.js` | compose(lesson state, model dress) → spec; the dress enums; validation; the fallback ladder |
| `bank.js` | the teacher's conditioned lines (Hinglish / English / Hindi) and UI words |
| `audio.js` | procedural SFX, engine hum, the music bed that hard-ducks under her voice |
| `specs/` | `dress.schema.json` (the strict schema a model fills) and three example deltas |
| `test-law.mjs` | node checks; replays a browser act log |
| `measure/run.mjs` | the Playwright harness (fps / rerun / sweep / load / shots / video / voxel / replay) |
| `measure/dress-probe.mjs` | the Azure delta probe: `taxila-fast-bg` writes the dress from a lesson context |
| `voxel/index.html` | the voxel micro-benchmark (§5.4) |
| `shots/`, `results/` | screenshots (JPEG), one webm, the raw JSON |

**Run:** serve the repo root (e.g. `npx vite` from `/home/user/Taxila`, or any static server), then open
`/docs/research/round4/games/proto/index.html?skill=s2&mis=count-marks&fade=2`. To measure:
`PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers node docs/research/round4/games/proto/measure/run.mjs all`. To check the law:
`node docs/research/round4/games/proto/test-law.mjs [results/replay-acts-mis.json]`. The model probe (costs about
$0.001): `node --env-file=.env.local docs/research/round4/games/proto/measure/dress-probe.mjs 12`.

### 5.1 What the child does

1. The lesson state arrives: skill `c5-maths-ch02-t01-s2`, misconception just seen `c5-maths-ch02-t01-m-count-marks`,
   fade 2. The Director builds a line from 0 to 1 cut in quarters with two cloaked mines at **2/3** and 3/8. Neither
   value is labelled anywhere, and the curtain shimmers over the whole line so nothing leaks a position.
2. She says (caption, Hinglish): "Is line pe mine chhupi hain. Pehli 2/3 pe hai."
3. The child drags anywhere. The ship banks and slides on a spring, and the volt reticle moves along the line with a
   soft position-pitched tick. The child presses **Daago**.
4. A child holding the count-marks belief reads the second of three marks as 2/3 and fires at **0.5**. The bolt lands
   there. The mine decloaks at the true 2/3, and the gap between the shot and the mine is drawn as a bar labelled
   "lagbhag 1/6". She says the conditioned line: "Line 4 hisson mein kati hai. Nishaan nahi, hisse gino." The mine
   stays visible. Nothing is lost, and re-firing clears it but earns no grade.
5. A hit gives hit-stop (60 ms), a three-colour particle burst, a shockwave ring, a small shake, a bass thump with a
   rising arpeggio and a short vibration.
6. When both mines are cleared, two warp gates rise: *garam* (more like this) and *teekha* (a bit harder). The child
   steers into one and presses *Chalo*. The warp has star streaks, a FOV kick and a whoosh, and the next sector's level
   is composed on the device during the jump. Its focus is the misconception the last level confirmed.

Evidence for that level, as produced in the smoke run:
`{"skillId":"c5-maths-ch02-t01-s2","outcome":"incorrect","misconceptionId":"c5-maths-ch02-t01-m-count-marks"}`, then
`{"outcome":"correct"}` for 3/8 [M].

### 5.2 Measured (all proxy; `results/*.json`)

| measure | value | n · method | load avg (4 cores) |
|---|---|---|---|
| level generation (law) | **0.07 ms p50 / 0.81 ms p95** | n = 1,520 feasible levels (3 skills × 3 fades × 4 foci × 40 seeds × 2 boxes), node 22 | — |
| compose incl. dress validation (director) | 0.65-0.75 ms p50 / 0.88-1.52 ms p95 | n = 200 per run, 3 runs, node | — |
| law checks (solvable, shortcut-free, focus discriminated, ≥ 8 px tolerance, mal-rule → kit id, junk acts ignored, evidence rows) | **11,288 pass / 0 fail** | `test-law.mjs` | — |
| server-replay agreement | **16/16** browser levels re-graded identically in node, 5 of them graded to a kit misconception | act logs from 8 browser runs (`results/replay-acts*.json`) | — |
| dress delta written by an Azure model | **p50 1,133 / p90 1,442 / max 1,759 ms**, 12/12 schema-valid, 40 output tokens; language followed 12/12; music `off` for the anxious child 3/3; `ghost-first` for the first-time child 3/3 | n = 12, `taxila-fast-bg`, strict json_schema, effort none, US sandbox → eastus2, `measure/dress-probe.mjs` | — |
| draw calls / triangles / textures | 25-29 / 3,258-4,638 / 4 | `renderer.info`, every run | — |
| JS heap | 5.6-7.7 MB | CDP `Performance.getMetrics` | — |
| our JS per frame (simulation, particles, labels, render submission) | **3.4-3.5 ms p50 at 4x CPU throttle**; 0.8 ms unthrottled | 3 runs × 12 s | ≤ 2.4 (own browser only) |
| fps, 360 × 800, DPR 1.5, 4x throttle | **29.9 / 29.9 / 29.9** (p95 frame 50 ms) | 3 runs × 12 s, bot play | ≤ 2.4 |
| fps, DPR 2, 4x | 20.0 / 20.0 / 20.0 (p95 67-83 ms); JS 4.0-4.2 ms | 3 runs × 12 s | ≤ 3.5 |
| fps, governor on (DSF 2, starts at DPR 1.5) | stepped **1.5 → 1.25 → 1.0**, then **59.9** median | 1 run × 12 s | ~4 |
| fps, DPR 1.5, unthrottled | 30.0 (JS 0.8 ms) | 1 run × 12 s | ~4 |
| DPR sweep (4x) | 0.5: **59.9** · 0.75: 30.0 · 1.0: 29.9 · 1.5: 15.0 · 2.0: 12.0; unthrottled 0.5: 59.9 (p95 16.8 ms) · 1.5: 20.0; 6x at 1.5: 12.0 (JS 8.8 ms) | 8 s each | 8.3-9.5 (contended) |
| paired re-runs (baseline, then the configuration) | baseline 15 / mistake path 15 · baseline 15 / 412 × 915 12 · baseline 15 / 1366 × 768 at DPR 1 15 | 8 s each | 5.7-8.1 (contended) |
| cold load to first frame, 4x CPU, cache off, brotli | 10 Mbps / 60 ms: **813 ms** (753-1,274) · 3 Mbps / 150 ms: **1,384 ms** (1,353-1,413) · 1.2 Mbps / 300 ms: **2,528 ms** (2,509-2,586) | 3 runs per profile, CDP network emulation, local server | ~6 (contended) |
| bytes for a cold load | **193 KB**: three.js as the CDN files (not tree-shaken) 144 KB br, game code 21 KB br, Latin font 21 KB (Devanagari 100 KB only when Hindi is used) | resource timing | — |
| legibility | min text **16 px**, min Devanagari **16 px**, tick numerals 20 px, fire button 328 × 60 px, no horizontal overflow | DOM audit, 8 screens at 360 / 412 / 1366 | — |

Screens (JPEG, 54-141 KB each): `shots/01-aim-360`, `02-mistake-countmarks-360` (the shot at 2/4, the mine at 2/3, "lagbhag 1/6", her count-the-parts line), `03-hit-360`, `04-doors-360` (warp gates as the door choice, laal-grah theme), `05-warp-360`, `06-hindi-mistake-360` (Devanagari caption and labels, the all-less-than-one shot squeezed under 1), `07-phone-412`, `08-laptop-1366`, `09-voxel-360`. Video: `shots/play-360.webm` (1.9 MB, 13 s, misconception bot, unthrottled; recording itself costs frames).

### 5.3 How to read these numbers (honesty)

- **The frame-rate proxy measures SwiftShader, not our game.** During the runs Chromium's GPU process used 188-209% CPU
  doing software rasterization. CDP's CPU throttle slows the renderer's main thread, not that process. So the
  unthrottled reference gives the same 30 fps as the 4x-throttled run at DPR 1.5. The DPR sweep shows fps rising as
  pixels fall (DPR 0.5 gives 59.9 fps, DPR 1.5 gives 15 and DPR 2 gives 12 under the same contention, while our JS
  stays at 2.3-5.6 ms). On a phone the GPU rasterizes. The frame is 25 draws, ~3.3k triangles and ~3-4 full-screen
  layers at 540 × 882: about a quarter of T-Rex's 1080p pixels and far less geometry (T-Rex's triangle count was not
  verified here). **Estimate [E]: ≥ 60 fps on a Mali-G52 MC2 at DPR 1.5, and ≥ 30 on the GE8320 floor.** Only a USB
  run on a real phone can confirm it (O-R4, M-LE-2).
- **What the proxy does say:**
  - our JS (simulation, particles, label projection, render submission) costs **3.4-4.2 ms per frame at 4x
    throttle**;
  - the scene's draw-call, triangle, texture and heap numbers are exact properties of the build;
  - the governor works: it stepped DPR 1.5 → 1.25 → 1.0 when p95 frame time exceeded 24 ms and held 59.9 fps.
- **Contention.** Another session's production test (`tests/prod/owner-1-grading.mjs`, with its own browser) started
  at 07:59 UTC. The rows marked with a load average above 4 ran during it. They were re-run when the machine was quieter
  (paired with a baseline under the same contention: the mistake path ran at 15 fps against a 15 fps baseline, so the first run's 12 fps was contention, not the code path).
- **What this prototype does not prove:**
  - fun;
  - learning;
  - that a 10-year-old finds it "cool";
  - real-phone fps, heat or battery;
  - touch precision on a real screen;
  - Asha's real face and voice in the strip (a placeholder circle and captions here);
  - the server round-trip (the law is shared, but no server route was built);
  - a production level grammar: 3 skills × 3 kit misconceptions, against Nishana's 15 mal-rules and 16 admitted
    skills;
  - art direction beyond one programmer's procedural look.

  Craft was judged only by me, by eye. Blind judges and the owner should rate it before anyone calls it "game-level".

### 5.4 Voxel micro-benchmark (Khand feasibility)

`voxel/index.html` uses the same three.js. It is a value-noise terrain of 16 × 24 × 16 chunks with naive face-culled
meshing (one merged BufferGeometry and one draw call per chunk, vertex-coloured Lambert), an orbiting camera at
360 × 800 and DPR 1.5. It optionally re-meshes the touched chunk every 250 ms, as a building child would.

| configuration (360 × 800, DPR 1.5) | voxels | triangles drawn | draws (of chunks) | mesh per chunk p50 / p95 | re-mesh after an edit p50 / p95 | fps (proxy) | heap |
|---|---|---|---|---|---|---|---|
| 6 × 6 chunks, 4x throttle | 106,831 | 25,824 | 19 of 36 (frustum) | 7.7 / 33.4 ms | — | 20 | 10.0 MB |
| 6 × 6 + an edit every 250 ms, 4x | 106,878 | 25,952 | 19 of 36 | 7.7 / 31.7 ms | **8.2 / 19.1 ms** (n = 34) | 20 | 22.6 MB |
| 4 × 4 chunks, 4x | 53,407 | 16,488 | 11 of 16 | 7.2 / 41.7 ms | — | 20 | 9.4 MB |
| 6 × 6, unthrottled | 106,831 | 25,824 | 19 of 36 | 3.4 / 12.5 ms | — | 30 | 12.6 MB |

All four rows ran while another session's browser was loading the host (load average ~7), so the fps column is doubly
pessimistic. The first run of this bench drew holes: a signed XOR in the value-noise hash gave negative heights. That is
fixed (unsigned), and these rows are from the fixed build.

Reading: a bounded build world sized to a lesson (6 × 6 chunks or fewer) meshes and re-meshes well inside a frame on
the proxy's throttled main thread. Greedy meshing would cut triangles by roughly 3-10x if the floor phone needs it
[E]. As with the space slice, fps on the proxy is SwiftShader-bound.

---

## 6. NEVER MANIPULATE and the safety floor in real-game genres

**Where the rule comes from.** `r4p-economy-ban-copy-only` traces the lineage:
1. the Meera persona's NEVER MANIPULATE;
2. the gurukul safety-floor-teacher fear-and-obligation test;
3. `motivation-without-rewards.md` (`mw-no-reward-economy`, `mw-no-time-grids`; neither id is in `graph.json`);
4. `design-v3-no-streaks-mastery` (2026-10-04; it allows in-run HUD numbers);
5. `r3p-world-ledger-view` and live-tech §0.8;
6. BUILD-PLAN C8 ("no points, coins, streaks, timers or locks").

Alongside these stand the binding wrapper rules G1-G14 (`docs/research/content/game-mechanics.md` §2: G4 currency,
G6 lives, G7 opponents, G10 timers, G12 assets and music) and the rejections `rj-world-locked-places`,
`rj-world-collection-counter` and `rj-timed-help-lockout`.

**Current reading.** On 2026-10-10 the main session, as the owner's delegated decision maker, chose **option B**
(`dc-r4-gamification-b`). Allowed:
- real games where the skill is the mechanic;
- a world that changes as understanding grows;
- personal collections opened **only by secured skills**;
- co-op goals with no individual tallies;
- **fast action only on secure skills**;
- in-run scores that end with the run.

Still banned: carried currency or points, streaks, leagues, energy or lives that gate learning, random drops,
countdown pressure on new skills, and anything that punishes absence. The table applies that reading to real-game
genres.

| real-game feature | status under option B | compliant variant (in the prototype?) | owner decision |
|---|---|---|---|
| score / points | in-run only, never carried or totalled | none shown; the consequence and her notice are the reward (yes). An in-run "clean hits" count is allowed but adds nothing here | none |
| health, lives, game over | banned where they gate learning (G6) | a miss leaves the mine visible with the gap drawn; re-try free; no fail screen (yes) | none |
| countdowns / time pressure | banned on new skills | **the world waits**: flight is real time, decisions are untimed (yes). A *fast mode* (mines drift in, `pace: brisk`) is admissible only when the ledger marks the skill secure (not built) | none (decided by option B) |
| enemies | environment only, no faces (G7, G12) | mines, rocks and drones; nothing alive is destroyed (yes) | **O-G4**: is a "shoot / daago" verb acceptable for classes 4-5, or should it read "scan / tag / beam" (words and SFX only)? |
| music | G12 "no music under the teacher"; `sound.ts` "never music" | adaptive bed, hard-ducks to 0 in ~120 ms whenever she speaks; `music: off` in the enum, which the model chose for the anxious child 3/3 (yes) | **O-G2**: allow a music bed at all, and is it off by default for classes 4-5? |
| dense environment art | G12 "≤ 6 non-semantic sprites"; seductive details g −0.33 | scenery kept off the learning objects; learning objects always drawn on top (`depthTest: false`) in reserved hues; labels on backing pills (yes) | **O-G1**: relax G12's sprite budget for 3D worlds, with a seductive-details arm in the pilot (plain vs dressed world, same delayed bare items) |
| unlocks / level-select gates | banned (`rj-world-locked-places`) | every sector open; the doors choose the next level and never lock one (yes) | none |
| collections / cosmetics | allowed only when opened by a secured skill | not in the prototype; a ship livery per secured skill would qualify, never bought, never random, never lost | none |
| persistence | the child's own builds and capability statements (G5) | Khand builds persist as artefacts shown to the parent | none |
| multiplayer, leaderboards, chat | banned (G7, safety floor) | none | none |
| daily returns, streaks | banned | none | none |

**A logic-level lint for engines** (the gap `r4p-economy-ban-copy-only` names). Every engine module must pass a
static and runtime check:
- no persisted counters except the G5 whitelist;
- no wall-clock reads in the progress path (G1, G3);
- no timer that can end or penalise a level on a skill not marked secure;
- no RNG after a level is generated;
- every state change traced to a child act or the law.

The prototype passes by construction: `law.js` has no clock or RNG after generation, and `grade()` ignores `t`.
Nothing in it enforces the rule, though, and the production lint does not exist yet.

**The child-safety floor is unchanged.**
- The stop check-in and the real goodbye work mid-level (play-duplex keeps safety pre-emption).
- Distress words are never game acts (`r3p-voice-closed-grammar`).
- No user-generated content leaves the family.
- No model writes a child-facing string in play.
- AI disclosure, Childline 1098 and Tele-MANAS 14416 stay in the lesson shell.

**Labels.**
- Hinglish (`lang="hi-Latn"`), English and Hindi (`lang="hi"`, Mukta from `public/fonts`).
- Devanagari is never under 16 px: the smallest Devanagari text in the Hindi run was 16 px [M].
- Numerals ≥ 18 px (tick labels 20 px) and international digits (PD-G14).

**What children play.** `r4p-india-kids-games-data-gap`: there is no published data on what Indian 9-14-year-olds play
or call babyish. Ormax 2021 (urban kids) lists Ludo King, Subway Surfers and Free Fire among their most-trusted media
brands. A runner (Daud) and a shooter (Antariksh) are therefore genres such children know, but Taxila must ask its own
children.

---

## 7. Effort, and what one cloud session can deliver in 3-4 days

**Basis.**
- The round-3 play stream built 4 families / 16 modes with solvers, mal-rules, views, a server and tests in about one
  stream-day (`docs/design/round3/play/RESULTS.md`). Its quality was "below DragonBox" and its fps was short on 10/16
  modes.
- This prototype took one agent about 2 hours of wall time for one engine slice on one skill set.
- `mechanics.md` §10.6's 3-6 agent-weeks per family was an unmeasured estimate. The play stream's actuals came in far
  below it, but at a lower quality bar.

The table assumes the family laws already exist.

| work item | agent-days [E] | depends on |
|---|---|---|
| **Shared 3D play core**: the three.js stage inside `src/play` (canvas at the real box, DOM labels over WebGL, layout solve, frame governor, context-loss → board twin, tier detection, reduced motion), procedural audio + music bed, engine chunk prefetch, the dress schema + validation in the Director, cert harness at 3 viewports | 3-4 | none |
| **E1 Antariksh** over Nishana (`line.logic.ts` as the law, not the prototype's): place / compare / round as aim, fly-into-gate and decloak; 18 admitted skills / 12 topics; reaction-bank lines per moment; art: 3 themes | 2-3 | core |
| E1 angles (turn / set angle): a new small law + solver + mal-rules (turn direction, protractor scale) | 2 | E1 |
| **E2 Khand** voxel: chunk mesher (greedy), build / remove / walk controls on touch, view-projection law (views), arrays, area / perimeter, symmetry; artefact persistence | 5-7 | core, Nazariya law (1B lane) |
| E3 Daud racer (rate setting, trail) | 3-4 | core, Chalao rate law |
| E4 Kila turn-based TD (periodicity law, tower placement) | 3-4 | core, Niyam law |
| E5 Chadhai platformer (integer pads, sequence platforms) | 3-4 | core |
| E6 Yantra puzzle-physics (mirrors, magnets, pendulum, circuits; cannon-es or matter where needed) | 5-7 | core, Kyun-Lab laws |
| E7 Nagar city / system sim | 6-8 | core, Karkhana law (1C lane) |
| per engine: art packs (pre-generated skyboxes / textures via FLUX.2 or gpt-image-2, text-free, reviewed) + sound palette | 1 each | |
| per engine: certification (C1-C10), bots, judges, owner review | 1 each | |

**One parallel cloud session, 3-4 days, realistically delivers:**
1. the shared 3D core (day 1-2);
2. **E1 Antariksh over the existing Nishana law**, for its admitted skills (fractions, decimals and integers on the
   line, rounding), at 360 / 412 / 1366, through the server grade and signed evidence into the ledger, with the C9
   lesson loop (day 2-3);
3. the Director's dress delta wired to `taxila-fast` with the base-dress fallback (day 3);
4. a USB phone run if the owner can connect a device; otherwise proxy only, labelled (day 4);
5. if time is left, a playable but uncertified Khand slice for c4 views.

**Not in 3-4 days:** E3-E7, a learning or fun claim, an art direction signed off by the owner, or real-phone numbers
without the owner's device.

**Later (round 5+):**
- the remaining engines;
- greedy-meshed Khand with artefact persistence;
- Yantra physics;
- the Nagar sim;
- the child pilot with a plain-vs-dressed-world arm (O-G1) and a teacher-ablation arm (mechanics.md §12).

---

## 8. Risks

| risk | what would show it | mitigation |
|---|---|---|
| the 3D dress becomes the seductive detail and learning drops | the pilot's dressed arm learns less on the delayed bare items | the plain arm in the pilot; scenery never on learning objects; O-G1 |
| real-phone fps far below the estimate (driver issues on PowerVR / Mali) | M-LE-2 on G35 / G81 / D6300 phones | the governor (DPR 1.0, fewer particles), then a Canvas2D twin of the same law (round-3 views) |
| the shooter verb reads as violent for class 4 | owner / parent review | O-G4: the "scan / tag" variant needs no code change beyond words and SFX |
| one engine per family multiplies maintenance | engineer-days per topic inside an engine ≥ a fresh archetype (`r3g-eight-deep-families` reversal) | engines are views over shared laws; skills are added as law grammar, not engine code |
| children game the cloak (e.g. fire anywhere to reveal, then clear) | first-try outcome rates near chance with high re-fire rates | only the first shot is evidence; G13 rapid-guess floors at runtime |
| quota: `taxila-fast` 429 during peaks | 429 rate on the delta lane | base dress for the lesson (no retry on the hot path) |

## 9. Proposed context entries

In `context/inbox/r4-research-games.json` (the main loop merges): the measured sizes, the proxy fps and its bound, load,
the voxel bench, law latency and replay agreement; the decisions (engines as views over family laws; three.js as the
3D renderer; live = level + dress only; the world waits; the music bed duck); the rejections (world models and free
codegen as live games; noa-engine; Babylon or PlayCanvas UMD as a second stack; shoot-the-answer); and the owner
decisions O-G1, O-G2 and O-G4 (O-G3, a timed mode, is settled by option B: fast action on secure skills only).

## 10. Sources

- Notebookcheck GPU pages:
  - Mali-G57 MP2: https://www.notebookcheck.net/ARM-Mali-G57-MP2-GPU-Benchmarks-and-Specs.537758.0.html
  - PowerVR GE8320: https://www.notebookcheck.net/PowerVR-GE8320-Graphics-Card-Benchmarks-and-Specs.372646.0.html
  - Mali-G52 MP2: https://www.notebookcheck.net/ARM-Mali-G52-MP2-GPU-Benchmarks-and-Specs.466940.0.html and
    https://www.notebookcheck.it/ARM-Mali-G52-MP2.576309.0.html
  - Adreno 613: https://www.notebookcheck.net/Qualcomm-Adreno-613-Benchmarks-and-Specs.855460.0.html and
    https://notebookcheck.it/Qualcomm-Adreno-613.856589.0.html
- ₹10k phone listings, mid-2026: https://www.gizbot.com/best-phones-under-10000%20%20/ ,
  https://www.digit.in/top-products/top-10-phones-under-rs-10-000-19.html/amp/ ,
  https://smartprix.com/mobiles/best-android-phones-under-10000-in-india-list
- caniuse WebGL 2.0 (97.13% global): https://caniuse.com/webgl2
- Ookla, India median mobile 131.77 Mbps (Aug 2025):
  https://www.voicendata.com/broadband/indias-mobile-internet-speeds-reach-new-highs-in-august-2025-10501159 ;
  5G vs 4G (338.12 vs 13.30 Mbps): https://www.gsma.com/get-involved/gsma-membership/gsma_resources/5g-in-india-25-times-faster-than-4g/
- Opensignal India Feb 2026 (not readable here, HTTP 403): https://insights.opensignal.com/reports/2026/02/india/mobile-network-experience
- Web game size and load guidance (third-party summaries): https://defold.com/manuals/optimization-size ,
  https://defold.com/extension-poki-sdk/best-practices , https://sdk.poki.com/new-requirements
- WebGL context loss on mobile: https://www.khronos.org/webgl/public-mailing-list/public_webgl/1204/msg00118.php ,
  https://bugnet.io/blog/fix-webgl-game-context-lost-after-tab-switch-mobile-chrome
- PlayCanvas vs Unity WebGL (vendor, 2016): https://blog.playcanvas.com/playcanvas-versus-unity-webgl ; Android DPR
  forum thread: https://forum.playcanvas.com/t/solved-very-low-fps-on-android-devices-due-to-device-pixel-ratio/34071
- noa-engine: https://github.com/fenomas/noa , https://cdn.jsdelivr.net/npm/noa-engine@0.33.0/README.md ,
  https://awesome.ecosyste.ms/projects/github.com%2Ffenomas%2Fnoa
- Genie 3 (DeepMind): https://deepmind.google/discover/blog/genie-3-a-new-frontier-for-world-models/ ; Project Genie
  access: https://letsdatascience.com/news/deepmind-opens-project-genie-for-interactive-worlds-eb2fec7e
- Muse / WHAM (Microsoft): https://www.microsoft.com/en-us/research/blog/introducing-muse ,
  https://labs.ai.azure.com/innovations/muse/ , https://www.etcentric.org/muse-could-be-a-gamechanger-for-xbox-players-developers/
- Models sold Direct by Azure (updated 2026-10-08): https://learn.microsoft.com/en-us/azure/foundry/foundry-models/concepts/models-sold-directly-by-azure ;
  FLUX on Azure: https://bfl.ai/blog/flux-azure-ai-foundry
- TRELLIS.2 (MIT): https://huggingface.co/microsoft/TRELLIS.2-4B
- Rosebud: https://lab.rosebud.ai/blog/vibe-coding-is-eating-game-development ,
  https://lab.rosebud.ai/blog/best-free-3d-game-makers-in-2026-compared
- Astrocade: https://www.pocketgamer.biz/astrocade-raises-56m-to-expand-ai-powered-games-creation-platform/ ,
  https://superdatascience.com/997
- Habgood & Ainsworth 2011: https://shura.shu.ac.uk/3556/ ;
  https://www.kqed.org/mindshift/20765/whats-the-secret-sauce-to-a-great-educational-game
- Refraction pilot (Martin et al., AERA 2012): https://convention2.allacademic.com/one/aera/aera12/online_program_direct_link/view_paper/534474/
- Kiili, Moeller & Ninaus 2018: https://researchportal.tuni.fi/en/publications/evaluating-the-effectiveness-of-a-game-based-rational-number-trai/
- Prodigy FTC complaint (Fairplay, 2021): https://fairplayforkids.org/feb-19-2021-advocates-to-ftc-prodigy-math-game-preys-on-kids-and-families/ ,
  https://www.edweek.org/technology/popular-interactive-math-game-prodigy-is-target-of-complaint-to-federal-trade-commission/2021/02
- Math Blaster: https://en.wikipedia.org/wiki/Math_Blaster!
- Seductive details (Sundararajan & Adesope 2020; Rey 2012): https://news.wsu.edu/2020/03/19/seductive-details-inhibit-learning/ ,
  https://inspire.acu.edu.au/articles/seductive-details
- In-repo: `docs/design/round3/play/{RESULTS,DESIGN,GRAMMAR}.md`, `docs/design/round3/game/concepts/{mechanics,live-tech}.md`,
  `docs/design/round3/forge/RESULTS.md`, `docs/research/content/game-mechanics.md`, `docs/research/design/low-end-offline.md`,
  `context/measurements.md` (image, codegen, delta latency rows), `context/decisions.md` (design-v3, r3g, r3p rows).
