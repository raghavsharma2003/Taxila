# Gap audit: human-like teacher animation (2026-10-03)

Pillar: "real human-like teacher animation" (owner intent, 2026-10-03). Audit only. No code or commits were changed.
Evidence lives in `docs/design/gap-audit/shots/teacher-anim/`. The production probe was a Playwright script in the
session scratchpad. It followed the prod-smoke pattern: signup, consent, open the hours, child, `/c/<cid>/lesson/new`,
then DELETE /api/account. All 6 accounts were deleted. Production is
`https://taxila-web.nicebay-a0d3a12f.eastus2.azurecontainerapps.io`.

Tags: [M] = measured here, [R] = read in code or docs, [U] = not verified.

## 1. What a child actually sees in a lesson today

| device | what renders | evidence |
|---|---|---|
| A phone or PC with a real GPU (static tier B or B-lite) | **The M0 procedural head** (`src/avatar/three/head.ts`). Every vertex is generated in code from `shared/tutors.js`, with Lambert shading, a solid hair shell, and 16 meshes, so 16 draws. It reads as a smooth mannequin or cartoon, not a person. | [M] `gpu-c2-window.png` (Asha), `gpu-c5-window.png` (Arjun): tier `B`, canvas present, `stage3d-*.js` loaded, **zero `.glb` / `runtime.json` requests** (`gpu-c*.json` → `net`) |
| A software rasteriser or a known-bad GPU (static tier D) | **A code-drawn SVG clip-art plate** (`src/avatar/Plate2D.tsx`). It has a 5-cell mouth path and a blink rect. | [M] `default-c2-t03.png`: tier `D`, no canvas. Same result in the earlier battery: `flows/22-lesson-c5-voice+6s-m.png` |
| The voice-only preference | an RMS ring (tier E) | [R] `TutorFace.tsx` |

**The in-house character rig is not in the product.** That rig is MPFB-based. It has 82/58 morph targets, three looks
(teal, slate, plum), three tiers (H / B+ / B-lite) and a D plate rendered from B+. It is built and deployed: prod serves
`/assets/teacher/teal/Bplus.glb` with 200 and 1,921,276 B [M, curl]. But nothing in `src/` loads it. There is no
`GLTFLoader`, `KTX2Loader` or `MeshoptDecoder` anywhere in `src/`, `server/` or `shared/` [R, grep]. The rig's
`plate/*.webp` plates are also unused. Tier D draws the SVG, not the rendered plate.

The GPU arm forced tier B on SwiftShader. It spoofed the GPU renderer string as Adreno 650 and removed
`failIfMajorPerformanceCaveat`, so the shipped static tier picked B. It shows what a child with a real GPU gets. It is
**not** a performance number.

## 2. Pillar questions

| question | answer | evidence |
|---|---|---|
| Is the lip-sync tied to the real audio? | **Yes. The mouth follows her real audio, but it only opens and closes the jaw.** `TeacherTap` adds an analysis-only `AnalyserNode` to the link's teacher `LevelMeter`. All three links attach it: `textLink.ts:59`, `cascadeLink.ts:552` (player output), `voiceLink.ts:261` (remote WebRTC source). In prod (cascade lane, gpt-4o-mini-tts audio, "Asha is talking"), 24 window frames about 100-150 ms apart all differ from the frame before. The mouth goes from closed to open with teeth showing and back. The driver is level-normalised RMS for the jaw plus a spectral-tilt hint, with **no visemes**. Bench: 23/84 Hindi bilabial closures and r 0.537, which is slightly *worse* than fixed-gain RMS at the bench level. | [M] `gpu-c2-talk00..23.png` (Asha, tier B), `gpu-c2.json`. [R] `src/avatar/lip.ts:1-11`, `context/measurements.md#avatar-m0-lip-bench-2026-10-03` |
| Are the listening, thinking, your-turn and speaking states driven by lesson events? | **Yes, as a first cut.** `faceStatusOf(floor)` (`src/ui/teacher/Teacher.tsx:31-48`) maps the lesson floor to the face. The tap's voice-activity detection (VAD) leads, and the status cross-checks it. The behaviour covers gaze aversion in thinking, a listening tilt from the child's mic level, a lean-in on your turn, accent nods and a brow flash at her onset. **Missing:** "showing" only maps to speaking, so she never looks at the board or tray. The Director's cue lists, the module gaze targets and the TurnClock "yielding" state are deferred to M2 (`behaviour.ts:6-9`). | [R] `behaviour.ts`, `Teacher.tsx` |
| Are emotions driven by lesson events? | **Hardly at all.** The client maps `ui.affect` `effort→proud` and `insight→excited` (`src/child/lesson/useDesk.ts:113-118`), and `shared/contracts.ts:91` declares the field. But **the server never sets `ui.affect`**: grep finds no write in `server/director/**` or `server/routes/lesson.js`. The only emotion that fires in a real lesson is `warm`, while a trouble strip is up (`useDesk.ts:618`). `curious`, `concerned`, `proud` and `excited` never fire. The rig's `runtime.json.emotions` has 9 presets (warm, encouraging, curious, thinking, listening, concerned, delighted, playful, surprised). `behaviour.ts:77-83` knows 5, so no mapping exists. | [R] grep |
| 2D plate or 3D? | 3D procedural on a capable GPU, the SVG plate otherwise. Neither is the in-house rig. | §1 |

## 3. State of the rigs (which one is "best current")

| asset set | covers looks | emotion legibility (vision judge) | ready? | evidence |
|---|---|---|---|---|
| **M0 procedural** (in lessons now) | 3, as code | not judged | live; mannequin quality; **blink artifact**: the iris rings show through the closed lids | [M] `gpu-c2-blink-artifact-crop.png` (frame `gpu-c2-talk04.png`) |
| **Main pipeline iteration 2** `public/assets/teacher/{teal,slate,plum}` | **all 3** | 43% (37% originally) | passes gates G1-G5 and G9; B+ 1.75-1.92 MB, 15.5-17k tris, 5 draws; art director: wow 1/5, "2012 game NPC" | `CHARACTER-PIPELINE.md §5-6`, `bakeoff/VERDICT.md` |
| procedural-v3 (bake-off) | teal only; slate and plum blocked (no curls, bun or pallu generators) | 85% | bake-off asset | VERDICT |
| ai-portrait-wrap (bake-off) | teal only | 57% | the only face that "looks like a person" (wow 3.5/5); teeth gate G6 failed 4→12 | VERDICT, `bakeoff/COMPARE.png` |
| **merged teal** (`public/assets/teacher-bakeoff/merged/teal`, built 19:53 today) | teal only | **not re-scored** | G1-G6 pass (G6 back to 4); garment penetration 0; parting wedge 0 texels [R, `art/character/bakeoff/merged/reports/teal.json`]. **H is 31,808 tris against the ≤16k head budget.** My B+ render shows grimacing warm and delighted smiles, a stepped hairline and a visible chin cut line. No likeness review yet. **Not shippable today.** | [M] `merged-teal-Bplus-strip.jpg` (`scripts/character/bakeoff/merged/quick.mjs --tier Bplus`) |

Conclusion: **no set is both human-like and complete for all three tutors.** The runtime work for the GLB rig is the
same for every set: the same `HeadRig` contract, morph names and `runtime.json` schema. So that work can and should
start now against the iteration-2 three-look set. The face then swaps in as an asset-only change (§5).

## 4. Gaps, ranked

| # | gap | severity | evidence | work to close | estimate |
|---|---|---|---|---|---|
| 1 | **The in-house rig is not wired into lessons.** The child sees the procedural mannequin or SVG clip art, so the owner cannot test "human-like" at all. | **blocks testing** (this pillar) | §1; `head.ts:1-11`; no loader in `src/`; prod `net` lists | The integration plan in §5, steps 1-6 | 7-9 d |
| 2 | **The best face is not ready.** The merged teal is not re-scored, H is over budget, the WIP render shows grimace smiles and a chin seam, slate and plum need hair and pallu generators, and the likeness review is owed. | **blocks testing** (the human-like bar) | §3; `merged-teal-Bplus-strip.jpg`; the VERDICT ship table | Follow the VERDICT ship table: smile and delighted fix, emotion re-score with a held-out judge (≥70%, n≥12), H subdivide or decimate to ≤16k, slate and plum generators and refs, likeness review, then the owner eye test | 8-12 d (teal ≈ 3-4 d; generators are the critical path) |
| 3 | **Emotions are not driven by lesson events.** `ui.affect` is never emitted, so only `warm` fires (in trouble). There is no 5→9 emotion map, and an affect that arrives before the lazy stage loads, or repeats, is dropped (`TutorFace.tsx:160-162`, effect on change only). | degrades the experience | §2; `useDesk.ts:113-118,618`; `contracts.ts:91` | Director: emit `affect` on **verified** outcomes only (effort after a fixed error → encouraging or proud; insight after a correct why-probe → delighted; a new topic hook → curious; strain → concerned; never a verdict preview). Keep the one-reaction-per-result rule (§4.6). Map it to the `runtime.json` presets. Queue the arm until the stage is ready, keyed by a sequence id. Test with a director-sim and a face-event assertion. | 2 d |
| 4 | **Lip-sync is jaw-only: 23/84 bilabial closures.** The rig closes 9/9 from aligned visemes, but the live driver cannot produce them. The contract makes this a precondition for H and for child panels E-T1 and E-T4 (`CHARACTER-PIPELINE §4.4.5`). | degrades the experience | measurements `avatar-m0-lip-bench`; `lip.ts` | Closure expander in `lip.ts` (below the gate, the jaw goes to 0 within one frame; power curve above it). Then the HeadAudio MFCC and classifier viseme classes (the vendored path in decision `avatar-v1-stack`) → `viseme_*` on H and `visemeFold` on B+/B-lite. Re-run `evals/avatar/lip-bench.mjs` (bar: closures ≥ 76/84 at vowel false-close ≤ 20%), then E-3 on received Opus audio. | 4-5 d |
| 5 | **No phone measurement exists for any face tier.** The only numbers are from SwiftShader. Helio G85 / Mali-G52 MC2 is not in `LITE_GPU` (only MC1), so it starts at B unmeasured. | degrades the experience (risk) | `tier.ts:35-37`; measurements `avatar-m0-fps-headless` ("M0 acceptance NOT met") | Device lab E-T2/E-T7 on 3 phones (§5.4), before the rig becomes the default | 2 d |
| 6 | **The D plate is different art from the rig.** The SVG `Plate2D` is a code-drawn cartoon, while the rig's `plate.webp` + `mouth.webp` + `blink.webp` (≈21 KB, rendered from B+) are unused. When the rig lands, B→D fallback and landing/picker portraits would show two different people. This is the `b4-rejected-rig-plates-on-landing` failure. | degrades the experience | `Plate2D.tsx`; `public/assets/teacher/*/plate/plate.json` | `PlatePerson`: the webp plate plus a 5-cell mouth strip driven by `mouthCell()` (already in `plateMouth.ts`) and the blink overlay. Switch the landing, picker, Hello, lesson and D surfaces **in one change**, with a V-FACE test that every site face is a pickable face. | 1 d |
| 7 | **Asset delivery.** GLBs are served `max-age=300, must-revalidate` from unhashed paths. The 25 MB `dist/assets/teacher*` includes all **bake-off folders, publicly reachable in prod**: generated identities before their likeness review (VERDICT licence row), and an older merged build (prod `merged/teal/Bplus.glb` 1,963,544 B vs local 1,791,180 B). | polish (the likeness exposure is a risk) | [M] curl headers and sizes | Serve `/assets/teacher/<look>/<lookRev>/…` with `immutable`. Exclude `public/assets/teacher-bakeoff/**` from the image (move it to `art/` or a dev-only path). Bundle B-lite + plates in the APK. | 0.5 d |
| 8 | **No board or tray gaze while "showing".** She looks at the camera while pointing at content. There is no Director cue list. | degrades the experience | `Teacher.tsx:33-35`; `behaviour.ts:6-9` | Gaze target from `CueScheduler` board ops (decision `teacher-stage-cue-scheduler`): eyes and head toward the tray anchor for the cue's span, then back to the child | 1.5 d |
| 9 | **Procedural head blink artifact**: the iris rings show through the closed lids, about 20 times a minute. | polish (moot once #1 lands) | [M] `gpu-c2-blink-artifact-crop.png` | Lid depth offset or render order in `head.ts`, or retire the head from lessons after #1 | 0.25 d |
| 10 | **The stage uses an alpha canvas** (`stage3d.ts:98` `alpha: true`). This breaks the rig's card hair, brows and lashes (CHARACTER-PIPELINE §4.4.1: "tan, patchy brows"). | blocks the rig's look (part of #1) | [R] | A hand-made opaque WebGL2 context passed to `WebGLRenderer({canvas, context})` | in #1 |

## 5. Integration plan: the best current rig into lessons now, the GPU face later

### 5.1 Principles (inherited, non-negotiable)
- **One person per tutor on every surface and tier.** Every fallback shows the same look: B+ → B-lite → the rig's own
  plate → voice ring. The procedural head and the SVG plate leave the lesson path the day the rig ships (they stay in
  `/dev/avatar` only). A fallback must never change the face.
- **The audio floor:** delay the face, never the audio. The tap stays analysis-only (`tap.ts` rules and tests).
- **The rig contract is the seam:** `HeadRig.apply(bs, head, gaze, lean, breath)`, ARKit-52 + viseme names, and the
  `runtime.json` schema. A new face is a new GLB plus `runtime.json` with a `lookRev` bump. It needs zero code change.

### 5.2 Which assets ship first
Ship the **iteration-2 three-look set** (`public/assets/teacher/{teal,slate,plum}`), because only it covers asha, arjun
and uma consistently. Gate it behind a remote flag (`face.rig`, default off) until the device lab (§5.4) and the
owner's eye test pass. Compare by eye in `/dev/avatar` against the procedural head. If the owner prefers the
procedural head, keep it as the default until the merged faces pass VERDICT. Either way, the runtime port is not wasted.
Then swap per look as each **merged** look passes the VERDICT ship table. teal goes first, but **only when all three
can switch**, or with an explicit owner OK to mix fidelity across tutors.

### 5.3 Steps
1. **Port the runtime.** Port `scripts/character/bakeoff/merged/viewer/{rig,shaders,presets}.js` into
   `src/avatar/three/{rig,shaders,presets}.ts` behind `HeadRig`. These are v3's runtime files, a superset of the
   iteration-2 viewer: `_strand`, optional texture slots, mouth-interior uniforms. First verify that they load the
   iteration-2 GLBs. That is [U]; the v3 slots are documented as optional. **2 d**
2. **Build the loader in the lazy `stage3d` chunk only.** Use `GLTFLoader` + `KTX2Loader` (`setWorkerLimit(1)`, the
   basis transcoder 527 KB wasm self-hosted) + `MeshoptDecoder`. Keep relative morphs (`avatar-m0-dead-ends` #1).
   Use the hand-made opaque WebGL2 context (gap 10), the `runtime.json.lighting` rig with Neutral tone mapping, and the
   `jawCeiling` clamp after the compositor. Drop three's JS morph copy after upload where possible: about 12.6 → 6.3 MB
   on B+. **1.5 d**
3. **Add the look map.** `shared/tutors.js` gets `lookId`: asha → teal, arjun → slate, uma → plum. A child-named
   teacher points at a look id, never the reverse. **0.5 d**
4. **Set the tiers** in `tier.ts` and `TutorFace`:

   | tier | asset | knobs | who |
   |---|---|---|---|
   | H (later, not in the first ship) | `H.glb` 5-6 MB, 82 keys, `viseme_*` direct | DPR ≤ 1.5, MSAA, 30 fps | GPU allow-list + RAM ≥ 6 GB + probe pass at H + Wi-Fi, large Face layout only; needs gap 4 closed |
   | B → **B+** | `Bplus.glb` ≈ 1.9 MB, 58 keys, `visemeFold` | DPR ≤ 1.25, MSAA, 30/30/20 fps | default for GPUs not on the bad or lite lists |
   | **B-lite** | `Blite.glb` ≈ 0.75 MB, `TIER_LITE` shader | DPR 1.0, no MSAA, 20/20/15 fps | `LITE_GPU`, data saver, probe demotion |
   | **D** | the rig's `plate.webp` + `mouth.webp` + `blink.webp` (≈ 21 KB) | DOM, ≤ 20 Hz | no WebGL2, known-bad GPU, probe failure, 2 context losses, GLB load failure or timeout |
   | E | voice ring | — | voice-only pref, battery < 10% |

   "On-screen size beats device class": the SpeechRow face (≤ 160 px, the work layout; prod canvas 105 px tall
   [M, `gpu-c2.json` t22]) takes B-lite or D, never H. **0.5 d**
5. **Loading and smoothness.**
   - The plate D shows at t = 0. The GLB fetches after `lesson/start` resolves, off the cold path. Prefetch it on
     the child home on Wi-Fi.
   - Cross-fade (200 ms) to 3D only in her silence ≥ 300 ms, the same rule as tier changes.
   - Time out after 8 s: stay on D for the lesson and retry next lesson.
   - Pause the rAF loop when the tab is hidden or the window is off-screen (IntersectionObserver).
   - Skip the render when no weight changed (idle between blinks).
   - Use hashed, `immutable` URLs (gap 7). The APK bundles B-lite + plates.

   **1 d**
6. **Expression and state mapping.**
   - Map `behaviour.ts` emotions to the `runtime.json.emotions` presets, scored per face (`teacher-presets-per-face`:
     presets carry no meaning across faces without a re-score): warm → warm, curious → curious,
     concerned → concerned, proud → encouraging (as a clip with the nod), excited → delighted.
   - Drive states from the `runtime.json.states` presets.
   - Add the Director affect events (gap 3), the board gaze (gap 8) and the D plate swap (gap 6).

   **4.5 d** with gaps 3, 6 and 8
7. **Lip:** gap 4. Expander first (0.5 d, ships with step 2), then the HeadAudio classes. **4-5 d**
8. **Gates.**
   - `npx tsc -b && npx vite build && npm test`.
   - Extend `tests/avatar-*.test.mjs`: loader extensions required, relative morphs, opaque context, fallback is the
     same look, audio-floor rules.
   - The bundle line: `stage3d` ≤ 230 KB br plus the transcoder wasm.
   - Playwright on prod with the GPU-spoof arm (this audit's probe) asserts `data-tier` and **`.glb` in the network
     list**.
   - The context-churn eval re-run with the GLB.

   **1 d**

**Total to "the in-house rig in every lesson, measured on phones" ≈ 15-18 engineer-days.** That breaks down as
steps 1-8 plus the device lab. The human-like face (gap 2) runs in parallel: 8-12 d.

### 5.4 Performance on low-end Android (acceptance, on device, not SwiftShader)
- **Phones:**
  - Helio G85 / Mali-G52 MC2 (Redmi 9 / Note 9 class, the declared target);
  - Helio G35 / PowerVR GE8320 (on the lite list);
  - Snapdragon 680 / Adreno 610 (lite list by regex);
  - one Snapdragon 7-series for H.
- **Measure** with the stage's own `stats` events plus Chrome tracing: the 2 s probe verdict, fps p50, frames over the
  long bar per 10 s, main-thread work p90, resident GPU memory, time to first 3D frame (cold and cached), thermal
  after 20 min, and audio glitches (the audio floor must not move).
- **Bars** (from `tier.ts` and TEACHER-VISUAL §10):
  - fps p50 ≥ 0.95 × cap;
  - ≤ 4 long frames per 10 s;
  - work p90 ≤ 8 ms (B) and ≤ 16 ms (B-lite);
  - resident ≤ 20 MB (B-lite) and ≤ 45 MB (H);
  - first 3D frame ≤ 1.5 s from cache.
- **If G85 fails B+**, add `Mali-G52 MC2` to `LITE_GPU`. Do not tune shaders blind.
- What predicts cost (SwiftShader, relative only): B-lite at 0.14 Mpx without MSAA is about 3× cheaper than B+ at
  0.22 Mpx with MSAA (`CHARACTER-PIPELINE §6`). Pixels × MSAA dominate, so DPR and MSAA are the first knobs, as the
  governor already does.

### 5.5 The GPU face later (AWS build-time only; runtime stays on Azure and on the device)
- The `face3d` job runs Hunyuan3D-2.1 (licence verified, about $0.50 per look per run). It feeds only the merged
  build's dense identity term (`TAXILA_IDENTITY_TARGET`). Its output is a new `Bplus.glb` / `Blite.glb` / `H.glb` +
  `runtime.json` + plates per look, under the same contract. So it ships by **bumping `lookRev`** with zero runtime
  change, behind the same gates:
  - VERDICT's front NME ≤ 1.2% and yaw-24 NME ≤ 1.5× front;
  - G1-G6 and G9;
  - emotions ≥ 70% at n ≥ 12 under a held-out judge;
  - a likeness review;
  - the device-lab bars re-run, because the triangle and texture budgets may move.
- First test owed (`GPU-JOBS §6`): the merged teal with the GPU dense term, measuring front and yaw-24 NME against the
  current merged teal. Reversal: if it fails yaw-24 or costs front likeness, the flag stays off.

## 6. Not verified from this sandbox
- **The WebRTC voice lane** (`VoiceLink` → `remoteSource` tap). Lip motion was verified only on the cascade TTS lane.
  The face-to-audio lag on received Opus audio and Bluetooth output (E-3), and whether `faceDelayMs` should be
  non-zero, are unmeasured.
- **Any real GPU or phone.** All 3D frames here are SwiftShader with a spoofed renderer string. The procedural head on
  a real Mali, and every tier's fps and memory, are unmeasured.
- **The rig GLBs inside the app.** Not loadable today (gap 1). The merged viewer loading the iteration-2 GLBs is
  untested.
- **Merged teal emotion legibility and likeness.** Not scored. My strip is an iteration shot, not evidence-grade.
- **Sandbox noise:** 3 of 7 lesson loads hit `net::ERR_TOO_MANY_RETRIES` on lazy chunks through the agent proxy. A
  retrying route handler fixed it, and curl from the same host got 200 every time, so I do not count it as a product
  defect. One default-arm run showed "We couldn't start the lesson" (`default-c2-t08.png`, n = 1). Re-check it outside
  the sandbox.
