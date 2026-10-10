# Round 4 · games core · CORE-API (`core3d@1`)

**Stream:** G1 (`claude/r4-games-core`). **Date:** 2026-10-10. **Status:** contract, pushed on day 0 so G2 (Khand) can
build against it. The implementation lands in `src/play/engines/core3d/**` on this branch; until main merges G1, G2 keeps
its own thin adapter (BUILD-PLAN-V2 §3).

**The TypeScript contract is `src/play/engines/core3d/api.ts`.** This file explains it. Where they differ, the `.ts` file
wins and this file is fixed.

## 0. The one rule

A 3D engine is a **view over a family law**. It owns pixels, sound and feel, never truth:

| concern | owner | the engine may |
|---|---|---|
| the level (numbers, positions, keys, tolerance) | the family law's generator on the server (`server/play/levels.js`, solver-proven, shortcut-free) | read `level.params` |
| what a child's decision means | the law's `apply()` through `PlayController.dispatch(act)` | dispatch acts; animate the returned moments |
| the grade and the evidence | the server's replay of the raw acts (`server/play/grade.js`) → HMAC token → lesson turn → `kt_evidence` `via: "game"` × 0.5 | nothing |
| her words | the authored, guarded reaction bank (`data/play/reactions.json`), served per act | nothing (it renders `caption` it is given) |
| the dress (theme, wrapper, music, pace, teacher move, language) | base rotation in code + a validated `taxila-fast` delta (`validateDelta`, `dressFor`) | wear it |

So the lesson seam does not change: `PlayStudioRenderer` → `PlaySession` → `PlayStage` → (3D engine **or** the round-3 2D
view) with the same `PlayController`, the same control ids, the same `/api/play/act` posts, the same signed tokens,
`lessonBridge`, voice verbs and turn-points.

## 1. Mount at the real box

`PlayStage` asks the registry (`src/play/engines/registry.ts`) for an engine that renders `(level.family, level.mode,
level.goal)`. If there is one and the tier (§6) is not `2d`, it calls `mountStage3D(host, entry, opts)`
(`core3d/stage3d.ts`), which returns the same `StageHandle` the 2D stage returns (`canvas`, `audit`, `perf`, `setArt`,
`resize`, `invalidate`, `dispose`). Otherwise it mounts the 2D view exactly as in round 3.

- The canvas is the world box's real size: 1 layout px = 1 CSS px; the backing store is at the governed DPR. A
  `ResizeObserver` on the host calls `engine.layout(box)`. **Nothing is drawn in a fixed world and scaled down** (the
  181 × 113 px defect, live-tech §1.1).
- The box is the Desk's play-mode world box (stream 2's `docs/design/round4/build/box-contract.json` when it lands; until
  then the `/dev/desk` play-mode box, measured and stated in RESULTS.md). `MIN_BOX` (`core/box.ts`) still applies: below it
  `PlayStudioRenderer` refuses and the Studio stage shows the board twin.
- The engine chunk is a dynamic import (`EngineEntry.load`), so the lesson bundle does not carry three.js; `prefetch(ids)`
  warms it at lesson start for the admitted engines.

## 2. Layout solve

`engine.layout({ w, h })` decides where learning objects sit **for this box**. Primitives: `core.worldPerPx(z)`,
`core.project(p)`, `core.unproject(x, y, planeZ)`. The rule the prototype proved: solve the learning object's on-screen
size in CSS px first (e.g. the number line spans `min(0.84 w, 720)` px), then convert to world units at its depth. Every
learning object must also fit at 360 × (Desk world box) with its labels inside the box (C4 is measured, §3).

## 3. DOM labels over WebGL

`core.label(spec)` → a handle. Labels are DOM (crisp at any DPR, real fonts, Devanagari via Mukta, readable by a screen
reader), positioned by the core after each render from a world anchor (projected) or a fixed box point, on a backing pill
(O-G1). The core:
- clamps sizes **up** to the floor for the kind: numerals ≥ 18 px, text ≥ 14 px (≥ 16 px for classes 4-5); Devanagari
  never under 16 px;
- records each visible label's rect and computed size in `audit.texts`, counts any label outside the box or overlapping
  another learning label in `audit.clipped` (must be 0);
- sets `lang` on every label (`hi-Latn`, `hi`, `en`).

No child-facing word is ever drawn into a texture.

## 4. The frame governor

The core owns the loop (`requestAnimationFrame`, paused while `document.hidden`). Every ~2 s it reads the frame-interval
p95; above 24 ms it steps DPR down 0.25 at a time to the tier's `dprFloor`, then halves the particle budget once. **It
never steps back up in a session** (a ratchet, like the face governor in `src/avatar/tier.ts`). `perf()` returns
`Perf3D`: fps, p50/p95 frame, our JS work per frame (p50/p95), DPR and its steps, draw calls, triangles, textures,
geometries, tier, particle scale. That is the C10 instrument.

## 5. Context loss → the board twin

`webglcontextlost` → `preventDefault()` → `opts.onFail("context_lost")`. `PlayStage` then mounts the 2D view of the same
`(family, mode)` **with the same `PlayController`**, so the level, its state and every act survive. A restored context is
used at the next level, never mid-level. Three frame errors inside 1 s do the same (`"frame_errors"`). A second loss in a
session pins the tier to `2d` for the rest of it. Never a blank stage.

## 6. Tier detection

`detectTier(facts)` (`core3d/tier.ts`, pure) → `"3d" | "3d-lite" | "2d"`:
- `2d`: no WebGL2; a known-bad or software renderer (SwiftShader, llvmpipe, Mali-4xx/T6-8xx, Adreno 3-5xx, PowerVR SGX,
  GE8100/8300); `failIfMajorPerformanceCaveat`; two context losses; `force: "2d"`.
- `3d-lite`: a lite GPU (GE8320, Mali-G52 MC1, G31, G51, Adreno 610-613), data saver, one context loss.
- `3d`: everything else.
- `force: "3d"` is the harness override that lets SwiftShader through so the proxy can measure the engine (labelled as a
  proxy every time). Budgets per tier are `TIER_BUDGET`.

## 7. Reduced motion

`core.reduced` is true for `prefers-reduced-motion: reduce` or the host's prop. Engines then: no shake, no particles, no
FOV kick, no idle spin; a warp is a fade cut; springs settle in one frame. The **learning consequence still shows**
(the gap, the decloak), only without motion.

## 8. The audio bus, with voice ducking

`core.audio` (`core3d/audio.ts`, procedural WebAudio, no files): `sfx(ev, { x, c })` for acts and law answers (≤ 400 ms,
a miss is a soft "thup", never a buzzer), `hum(level)` for an engine bed, `music(mood)` for the adaptive bed and
`duck(on)`.
- **Music** (O-G2) plays only if the dress allows it (`DressedSpec.musicAllowed`: classes 4-5 default OFF, the child can
  turn it on with the play music toggle, a per-device preference) and `dress.music !== "off"`.
- **Ducking:** whenever the teacher speaks, music goes to 0 within 120 ms and SFX to 35%. The signal is `engine.speaking`
  / `core.audio.duck`, driven by the host from (a) her caption being shown in play and (b) the lesson's
  `taxila:teacher-speaking` window event (`{ on: boolean }`; a one-line patch to `src/lesson/runtime.ts`, owned by stream
  3, listed in `games-core/patches/APPLY.md`).
- Audio unlocks on the child's first gesture; nothing autoplays.

## 9. Input, including the closed voice grammar

- **Pointer:** one active pointer, CSS px in the box, `engine.pointer(kind, x, y)`. Drag-anywhere engines register the
  world as one target per layout.
- **Keys:** arrows nudge, space / enter commit (`engine.key`).
- **DOM controls:** `engine.controls()` with the **stable ids the voice grammar maps to** (`core/voice.ts pressesFor`):
  `commit` ("yahan" / "here"), `nudge-left`, `nudge-right`, `undo`, `round-<lo>` / `round-<hi>` ("upar" / "neeche"),
  `order-0`, `order-1`, `order-same`. A spoken act is the same press a finger makes, tagged `via: "voice"`, only at a
  turn-point (no finger down, ≥ 600 ms after release). A control marked `voiceOnly` is not drawn as a button (the spatial
  act, e.g. flying into a gate, is the primary one) but stays reachable by voice and keys. Distress words are never game
  acts (`NEVER` in the grammar).
- The teacher never speaks mid-drag (`PlayController.atTurnPoint`).

## 10. The act log and the progress store

- **Acts** go only through `deps.ctl.dispatch(act)`. The controller records `{ seq, t, via, act }`; `t` is never a grade
  input. `PlaySession` posts every act; the server replays all of them. The engine may not keep its own "score".
- **Progress** (what the child is asked next, what is cleared, which phase gates a decision) lives only in
  `core.progress`, and every write names its cause: `{ act: seq }`, `{ moment, seq }` or `{ level: "start" }`. The runtime
  economy lint replays levels and fails on a write with no such cause, or any write after the level is done.
- **Cosmetics** (camera, stars, rocks, particles, idle spin) may use `core.cosmeticRandom()` and `core.t`; progress code
  may use neither.

## 11. The economy lint (enforced in `npm test`)

`tests/r4-games-core-economy.test.mjs` runs over every file in `src/play/engines/**` and every family view:
1. **No persisted counters**: no `localStorage` / `sessionStorage` / `indexedDB` / `document.cookie` outside the G5
   whitelist (the music preference key `taxila.play.music`).
2. **No wall clock in progress**: no `Date.now`, `new Date`, `performance.now` in engine progress code (the core's frame
   clock is the only time source, and it is never a grade or progress input).
3. **No timer that ends or penalises a level** on a skill that is not secure: no `setTimeout` / `setInterval` that
   dispatches an act or writes progress; `pace: "brisk"` only through `dressFor` (secure only).
4. **No RNG after generation**: no `Math.random` in engines (cosmetics use `core.cosmeticRandom`); laws use only their
   seeded generator.
5. **Every state change traced**: the runtime half replays solved, mal-rule and junk act logs and checks the progress
   trace.
6. **Banned words in engine copy** (points, coins, streak, lives, reward, hurry, …) as in `play-style-lint`.

## 12. What an engine file looks like (G2 template)

```ts
// src/play/engines/<engine>/index.ts
import * as THREE from "three";
import type { Core3D, EngineDeps, EngineView } from "../core3d/api.ts";
export function create(core: Core3D, deps: EngineDeps): EngineView {
  const scene = core.scene as THREE.Scene;
  // build the world once; layout() solves positions for the box; react() animates moments; acts via deps.ctl.dispatch
  return { layout, update, pointer, busy, goal, readouts, controls, react, dispose };
}
```

and one entry in `src/play/engines/registry.ts`:

```ts
{ id: "khand", renders: [{ family: "nazariya", mode: "views" }], load: () => import("./khand/index.ts") }
```

(the registry is G1's file; G2's line is hand-merged by main, like `FAMILIES` / `LOGIC`).

## 13. Certification an engine must pass (BUILD-PLAN §3.1, per engine × skill)

C1 admitted by skill · C2 law / solver / shortcut-free, generator p95 ≤ 50 ms · C3 0 wrong grades over ≥ 2,000 random acts,
forged acts refused · C4 labels and controls at 360 × 800, 412 × 915, 1366 × 768 for every theme and both class bands ·
C5 ≥ 80% of graded acts are manipulations · C6 reaction bank clean · C7 signed evidence folds `via: "game"` · C8 no economy
(the lint above) · C9 reachable in a lesson both asked and at a practice beat, through the server grade into the ledger ·
C10 fps reported at 4× CPU throttle with the governor (proxy; the phone run is owner-dependent, O-R4).
