# Teacher visual presence: the teacher stage, the speech-synced board, the pointer, and the v2 video path

**Date:** 2026-10-02 · **Question (teacher-visual):** how the teacher shows up visually during a live lesson. That covers a 2D animated Indian teacher (a Rive state machine, lip-sync from audio amplitude or visemes, idle, listening, thinking and excited states), a board she "writes" on while she talks, kept in sync with her speech, and a pointer and highlight on modules. Also in scope: Duolingo Lily, Speak and Khan Kids as references; the teacher-stage component and its events; a performance budget on low-end Android; and a v2 video-avatar path (Simli, HeyGen or Tavus fed with our audio).

**Evidence tags:** **[V]** read at a primary source · **[S]** secondary source · **[M]** measured here (scripts and data in this folder) · **[I]** inference · **[U]** unknown, with the experiment that settles it.

**Already decided elsewhere. Read those docs; this one does not repeat them:**

- `design/PRODUCT-DESIGN.md` §3.3–3.9 covers the stage dp budgets, `StageFrame`, the gaze targets, `ReactionGate`, the chalk ledge, captions and the four-state floor.
- `design/ui-teardown.md` covers the Lily, Speak, Gemini and YoLearn teardown, pointer deixis and its tokens.
- `avatar/performance-android.md` covers tiers A–E, the WebView main-thread finding and the governor.
- `avatar/web-3d-talking-heads.md` covers the lip-sync methods and the Hindi bench.
- `avatar/behaviour-expressiveness.md` covers gaze, blinks, nods and floor programmes.
- `avatar/video-avatar-v2.md` covers vendors, the audio-clock rule, Azure TTS avatar and self-hosted MuseTalk.
- `content/sandbox-telemetry.md` covers the v2 module protocol (`highlight`, `focus`, `ghost`).
- `content/animation-video.md` covers the `draw`/`write` board verbs.

**What is new here:**

1. The first measurement of how speech timing can be estimated on our real realtime lane. This settles **E-8** and the open **R5** conflict.
2. The `TeacherStage` component, specified as code: its event bus, the cue scheduler, the board engine, the module `locate`→`rect` handshake, and the 2D face contract.
3. A whole-stage performance budget, covering every layer together.
4. The stage-side contract for v2 video.

---

## 0. TL;DR: findings that change decisions

1. **E-8 is answered, and the "lead ≥ 150 ms" gate in PRODUCT-DESIGN R5 was the wrong test [M].**
   - **Lead is plentiful.** I recorded 16 real `taxila-realtime` teacher turns (8 Hinglish, 8 English, voice `marin`). The transcript text of a word arrived **6.5 s (median), ≥ 0.94 s (p10) and ≥ 0.20 s (min)** before that word was played (n = 60 numeric anchors, WebSocket lane).
   - **The problem is placement, not lead.** Nothing tells the client *when* in the audio a word falls. Against Azure Speech word-level ground truth:
     - the best live estimator is wrong by **372 ms median and 863 ms p90**;
     - only **35% of words land within ±250 ms**;
     - a spoken word in these turns lasts about 300–450 ms.
   - **Verdict:** word-lit karaoke captions (R1 "one or two words lit") **must not ship on an estimate**. They would light the wrong word about two times in three. Phrase-level timing and clause-level board/pointer cues **can** ship (finding 3).
2. **`response.done` tells us exactly how long her audio is, seconds before it finishes playing [M].**
   - `usage.output_token_details.audio_tokens` was **exactly 20 per second of audio in 15 of 16 turns** (19.49 in the 16th).
   - Generation runs **3.2–4.2× faster than real time**: 8.8–22.4 s of audio was fully generated 2.7–6.1 s after `response.create`.
   - So from `response.done` on, the client knows the exact duration and the full text. That turns a rate guess (655 ms median error) into proportional placement (282 ms median), and it does so for **78% of anchors**. This is the core of the `CueScheduler` (§5).
3. **The cue policy that works: start the mark 400 ms early and hold it to the end of the sentence [M].**
   - With the live estimator, starting board writes and pointer marks **400 ms before the estimated word** means the mark is already visible when the word begins in **86.7%** of cases.
   - It is never more than **2.0 s** early (p90 1.37 s).
   - That stays inside the one measured harm boundary: a **−2 s** narration/animation gap hurt recall in 12-year-olds, while pictures *slightly before* sound did better than after (Porte et al. 2026, *JCAL*) **[S]**.
   - Hence §5's rule: **early is fine, late is not.**
4. **Exact word times are buildable, but they cost money and one unknown [M/U].**
   - Azure Speech fast transcription returned word offsets for a 9–22 s turn in **0.9–2.5 s** (n = 8) and costs **$0.36 per audio hour** (Retail Prices API, eastus2) **[V]**. That is ≈ **$0.15 per lesson** if all ~25 min of teacher speech is aligned, or ≈ $0.05 if only cue-bearing turns are.
   - It needs her audio *before* playback. The WebSocket lane has it. On WebRTC only the server sideband might, and whether Azure's sideband carries `response.output_audio.delta` is **[U → E-TV-2]**.
   - Ship the estimator first. Add alignment only if R1 word-lighting is shown to matter (M-TV-3).
5. **One stage, many faces.** `TeacherStage` owns the clocks, the cues, the board and the pointer. The face is a plug-in, `FaceRenderer`, with six adapters: `rive2d`, `sprite2d`, `talkinghead3d`, `portrait`, `none` and `video`. That lets the open conflict between PRODUCT-DESIGN ("2D Rive launch face") and performance-android ("Rive is only a tier-C alternative; the sprite rig is the default") be settled by measurement (E-TV-4) without touching the stage, the Director or the modules.
6. **Rive facts that bind the 2D face [V]:**
   - Use **`@rive-app/canvas-lite`: 222 KB brotli**, against canvas at 567 KB and webgl2 at 648 KB (Rive docs, January 2026). We need none of what lite drops (text, layout, audio, scripting).
   - **State-machine inputs are deprecated in favour of data binding** (view models) in the current web runtime. Specify the rig as a **view model**, not as inputs (§6).
   - Rive can run in a worker on an `OffscreenCanvas` only with workarounds: the runtime touches `document` **[S, fpapado PoC]**. In WebView, the main thread is shared with module iframes (sibling: p99 gap 76 ms). So either the worker workaround is proven, or **`sprite2d` (our own Canvas2D rig, worker-native) is the default on tiers C and D**.
7. **The pointer is drawn by the host, not by the module.**
   - Modules are opaque-origin sandboxed iframes, so the host cannot read their layout.
   - Add one round trip to the v2 protocol: `locate{targets}` → `rects{…}`. The host's single SVG `PointerOverlay` above the iframe draws every mark. Every engine, generated ones included, gets deixis for free.
   - The engine's own `highlight` stays as the persistent second cue (PRODUCT-DESIGN §3.5).
8. **The "excited" state does not exist as a free state.** Delight is a `ReactionGate`-permitted face only when the Director tags the move `affect: insight | effort`, at most once per 5 turns (PRODUCT-DESIGN §3.5). The rig exposes `affect` as an enum with **no "wrong/sad" value**, so a bug cannot show a verdict face.
9. **v2 video, briefly.** Simli, HeyGen/LiveAvatar and Tavus are excluded from builds by the Azure-only directive (2026-10-02). They serve as price and latency benchmarks only (sibling `video-avatar-v2.md`). The stage contract for any video face is fixed now (§8):
   - the renderer owns the audio clock;
   - `played_ms` comes from the renderer;
   - barge-in truncates at the renderer's position.

   The buildable first step is **pre-rendered narration video**. Self-hosted MuseTalk on Azure GPUs is live-premium only.

---

## 1. What the references teach the stage (only what is new beyond ui-teardown)

| reference | what is verified | what the stage takes |
|---|---|---|
| **Duolingo Video Call (Lily)** | A Rive file **under 1 MB**. **8 head × 8 body** animations blend into **64+ idle variations** through nested artboards. **Event-triggered expressions** are synced to AI responses. Head tilts and pondering cover processing delay. Expressions react to "speaks clearly, mumbles, or pauses" (Rive case study) **[V]**. The first question is formulated "while your Video Call is ringing" (Duolingo blog) **[V]**. "20+ mouth shapes" is reported in ui-teardown **[V there]**. A secondary claim that Lily blends TTS visemes with amplitude is **[S, unverified]** | (a) Head and body as **independent layers** (nested artboards, or separate sprite sheets) so idles combine instead of looping. (b) Expressions are **armed by events, fired on the playback clock**, never chosen from text. (c) Latency is *performed* (THINKING), never a spinner. (d) The rig budget is **≤ 1 MB**, and we target ≤ 400 KB |
| **Speak** | Live Roleplays run on the OpenAI Realtime API. Users get **goals or tasks** to complete in the roleplay. Hints arrive "when a user is stuck" with "just the right amount of help". The roleplay ends when the tasks are done **[V, Speak blog]**. Lesson cards light recognised words of *the learner's own* target sentence in blue **[V via ui-teardown]** | (a) Speak lights the learner's words as they are *recognised*, after the fact, from ASR output. It never lights the tutor's words at speaking pace, which would need the timing we lack (finding 1). Taxila's "heard" chip copies the safe half. (b) Goals live on screen as a persistent object: our ledge's goal chip |
| **Khan Academy Kids** | Five animal characters (Kodi, Reya, Peck, Sandy, Ollo). **Kodi is the main guide**, giving "instructions, helpful tips, encouragement, and reinforcement" through "intuitive gestures" **[S, Khan Kids help page via search; page 403 to fetch]** | (a) **One guide, one job.** The teacher is the only character who instructs. A protégé or other character never gives instructions (consistent with `motivation-without-rewards.md`). (b) Strong silhouettes and big readable features survive a 96 dp face on a ₹10k phone (`stage.faceMin`). (c) Gesture carries meaning for pre-readers (B1), so the pointer and her hand matter most for Young |
| **YoLearn** (sibling teardown) | Draws on a sketchpad while speaking **[V via ui-teardown]** | The board-while-talking pattern exists in the Indian market. Ours must be *timed*, not merely *concurrent* (§5) |

Two things from the research literature the stage must respect, beyond ui-teardown's Pi et al. 2019 pointing result:

- **Watching a diagram being drawn beats seeing it drawn already** (Fiorella & Mayer 2016, via `animation-video.md`) **[K]**. So the board *writes*; it does not *appear*. Under reduced motion it appears, and that is the accessibility trade-off.
- **Temporal contiguity has a measured cliff.** In a VR study with 12-year-olds, delays of ±2 s and ±6 s between narrated words and the matching animation lowered recall and comprehension, and pictures-before-sound did slightly better than sound-before-pictures (Porte et al. 2026) **[S, abstract via search; full text 403]**. This is the only number we have for tolerance, so §5 targets **≤ 0.5 s late and ≤ 2 s early**.

---

## 2. The component: `TeacherStage`

### 2.1 Layers (front to back), and who owns what

```
TeacherStage (one per lesson; owns StageBus, PlaybackClock, CueScheduler)
├─ StageFrame          layout family + framing + gaze-target geometry (PRODUCT-DESIGN §3.5)
│   └─ FaceRenderer    pluggable: rive2d | sprite2d | talkinghead3d | portrait | none | video
├─ BoardView           board@1 engine: renders into ChalkLedge slots (portrait) or a board panel (split)
├─ PointerOverlay      one <svg>, pointer-events:none, above the ModuleHost iframe; chalk marks
├─ CaptionLine         phrase-level (word-lit only with exact timing, §5.6)
└─ (ModuleHost)        not owned: sibling component; the stage talks to it only via locate/rect and highlight
```

- **One clock.** Every visual effect that relates to her speech is scheduled on `PlaybackClock`, the time since *her first audio frame was played on the device*. It is never scheduled on transcript arrival or on Director response time.
  - On WebRTC, the clock starts on `output_audio_buffer.started`, refined by the level tap's first above-gate frame (`src/lesson/level.ts`).
  - On a video face, the clock is the renderer's (§8).
- **One rAF loop.** The face, the board's write animation and the pointer draw-on all tick from the existing shared loop in `level.ts`, or from the worker's loop when the face runs in a worker. There is never a second `requestAnimationFrame` chain.
- **Geometry is private.** The Director and the face programs name targets (`child`, `canvas`, `ledge`, a module target id). `StageFrame` resolves names to pixels. This rule comes from PRODUCT-DESIGN.

### 2.2 Inputs: what the stage listens to

These events are all emitted by code that already exists. `realtime.ts` and `voiceLink.ts` emit them today; the stage only adds `response.done` usage parsing.

```ts
// src/lesson/stage/bus.ts — every input the stage consumes, normalised by runtime.ts
export type StageInput =
  | { k: "floor"; state: "speaking" | "your_turn" | "listening" | "thinking"; at: number }   // four-state model
  | { k: "resp_start"; rid: string; at: number }                              // first transcript delta of a response
  | { k: "text"; rid: string; delta: string; at: number }                     // response.output_audio_transcript.delta
  | { k: "audio_start"; rid: string; at: number }                             // output_audio_buffer.started (played)
  | { k: "resp_done"; rid: string; text: string; audioMs: number | null; at: number } // audio_tokens × 50 (§0.2)
  | { k: "audio_end"; rid: string; at: number }                               // output_audio_buffer.stopped
  | { k: "interrupted"; rid: string; playedMs: number; at: number }           // barge-in; truncate position
  | { k: "level"; who: "teacher" | "child"; v: number; at: number }           // 0..1 per frame (LevelMeter)
  | { k: "viseme"; id: OculusViseme; w: number; at: number }                  // HeadAudio worklet, when present
  | { k: "ui"; rid: string | null; ui: UiDirectives }                         // Director response (TurnResponse.ui)
  | { k: "module_rects"; mid: string; rects: Record<string, Rect>; at: number }
  | { k: "module_event"; mid: string; kind: "interaction" | "answer" | "goal_met" | "stuck"; at: number }
  | { k: "layout"; family: "stacked" | "tablet" | "split" | "compact" | "micro"; at: number }
  | { k: "tier"; tier: "A" | "B" | "C" | "D" | "E"; at: number };             // governor (performance-android §6.3)
export type OculusViseme = "sil"|"PP"|"FF"|"TH"|"DD"|"kk"|"CH"|"SS"|"nn"|"RR"|"aa"|"E"|"I"|"O"|"U";
export interface Rect { x: number; y: number; w: number; h: number }          // iframe CSS px, top-left origin
```

**`rid` binding rule.** The Director's `ui` for a turn arrives *before* the response that voices it. `runtime.ts` already sends `session.update` and then `response.create`. The stage binds a `ui` to the **next** `resp_start` after it, or to the in-flight response when `speakNow: "interrupt"` is set. A `ui` that is never voiced, because the child barged in first, expires on the next `ui`.

### 2.3 Outputs: what the stage tells others

```ts
export type StageOutput =
  | { k: "cue_fired"; cueId: string; kind: "board" | "point" | "gaze"; plannedMs: number; firedMs: number; src: Est }
  | { k: "cue_skipped"; cueId: string; why: "no_match" | "interrupted" | "late" | "target_missing" | "tier" }
  | { k: "board_state"; items: { id: string; pinned: boolean }[] }           // for the Director's next call (what is on the board)
  | { k: "perf"; faceMsP95: number; droppedFrames: number; tier: string };    // into the governor
export type Est = "S_exact" | "R_rate" | "aligned" | "fallback_turn_start";
```

`cue_fired` and `cue_skipped` go to the lesson log, which already carries telemetry. They are what lets M-TV-1 and M-TV-2 be read from production without a lab.

---

## 3. Director-side contract: cues are data, never lines

Extend `UiDirectives` in `shared/contracts.ts`. The existing `whiteboard?: {kind, value}` maps onto a single `write` with `at: {k: "turn_start"}`, so v1 keeps working.

```ts
/** Where in her NEXT spoken turn a cue belongs. Never a time: the Director does not know her words or pace. */
export type CueAt =
  | { k: "say"; say: string[]; nth?: number }   // fire where she says any of these (normalised match, §5.3); nth = which occurrence (default 1)
  | { k: "turn_start" }                         // on her first played audio frame (PRODUCT-DESIGN apply: at_next_audio)
  | { k: "turn_end" }                           // when her playback stops
  | { k: "now" };                               // immediately (child acted; no speech binding)

export type BoardItem =
  | { id: string; kind: "text"; text: string; script: "latn" | "deva"; lang?: "en" | "hi" | "hi-Latn" }   // ≤ 24 chars
  | { id: string; kind: "math"; expr: string }                                // MathLite, ≤ 40 chars (§4.2)
  | { id: string; kind: "image"; assetId: string; alt: string }               // a cached asset, never generated on the turn
  | { id: string; kind: "mark"; on: string; shape: "underline" | "circle" | "arrow" | "box"; to?: string };

export interface BoardOp {
  op: "write" | "mark" | "erase" | "clear";
  item?: BoardItem; id?: string;                // write/mark carry item; erase carries id
  at: CueAt;
  essential?: boolean;                          // on barge-in, write instantly instead of dropping (§5.5)
  pin?: boolean;                                // survives eviction (prediction chip, PRODUCT-DESIGN §3.7)
}

export interface PointCue {
  id: string; mid: string; target: string;      // a target the engine declared in ready.targets (§7)
  at: CueAt;
  shape?: "circle" | "underline" | "arrow";     // default circle; arrow needs from: "teacher" (split layout only)
  gaze?: boolean;                               // default true: gaze leads the mark by 200 ms
}

export interface UiDirectives {                 // additions only
  board?: BoardOp[];                            // ≤ 3 per turn
  cues?: PointCue[];                            // ≤ 2 per turn; PRODUCT-DESIGN already names this field
  affect?: "warm" | "curious" | "insight" | "effort" | "calm";   // ReactionGate input; no negative values exist
}
```

**Rules that the server's `ui` validator enforces.** These are predicates, not instructions, per the inherited law.

1. A `say` string must be a **number, a symbol, or a term from the kit's vocabulary** for this item. It is never a sentence. Shapes not lines: a `say` like "ab dekho yahan" would be recited.
2. The teacher's compiled instructions mention the anchor terms as *shapes*. For example, the brief says "names both fractions" and never gives a sentence. The anchor block is appended **last**, because position is mechanism.
3. ≤ 3 board ops and ≤ 2 point cues per turn. Each point cue's `target` must be in the mounted engine's `targets` list, otherwise the cue is dropped server-side with a counted reason.
4. A board `text` item is in the child's school-medium script (PRODUCT-DESIGN §3.8), and a Young first-exposure item is a numeral or picture (§3.7).

---

## 4. The board engine (`board@1`)

### 4.1 Behaviour

- **Capacity.** It renders into the ChalkLedge, which holds 1–3 idea chips in portrait (PRODUCT-DESIGN §3.7), or into a board panel in split layout that holds up to 5 lines. When full, the oldest unpinned item is evicted with a 200 ms fade.
- **Write animation.** Text and maths reveal left to right with a **clip-path wipe**, which is compositor-friendly. Mark items draw with `stroke-dashoffset`. Duration is `clamp(300, 55 × glyphs, 900)` ms.
  - Stroke-order tracing per glyph is **not** attempted. There is no stroke data for Devanagari, and a wipe reads as writing at 96 dp.
  - Reduced motion: the item appears at full opacity on the fire time.
- **Chalk feel without filters.** Fonts are Baloo 2 (Young) and Mukta 600 (Older) from `visual-identity.md`. One pre-rendered 128² chalk-grain PNG is used as a `mask-image` on the board surface; it is never drawn per item. No `filter: blur()`, SVG turbulence or shadows: each forces a non-composited repaint on Mali-class GPUs **[I]**.
- **Newest item:** a white hand-drawn underline (PRODUCT-DESIGN §3.7). It is never marigold, which is reserved for the turn.
- **Tap an item:** replays her line about it from the teacher-audio buffer (§3.7 there). The board records `{itemId → rid, startMs, endMs}` from the scheduler so the replay is clipped to the right clause.
- **`board_state`** goes back to the Director on the next call, so she can refer to what is visible ("jo board pe likha hai" as a shape).

### 4.2 MathLite (the only maths grammar the board renders)

There is no KaTeX: it is ~270 KB, and our expressions are tiny **[I]**.

```
expr    := term (op term)*            op := + | − | - | × | x | ÷ | / (inline) | = | < | > | ≤ | ≥ | ≈
term    := frac | num unit? | "(" expr ")" | "□" | var
frac    := num "/" num                # rendered stacked when standalone or beside =,<,>; inline inside words
num     := digit+ ("." digit+)?       # numerals per InitCtx.numerals (latn | deva)
unit    := cm | m | km | g | kg | ml | l | °C | ° | ₹ | %
var     := single letter a–z
```

Grammar checks: at most 40 characters and 3 fractions. Anything else is rejected server-side and replaced by a `text` item, with the reason counted. Fractions use CSS grid (numerator / bar / denominator). `□` is a blank for prediction items.

### 4.3 Params (`EngineDef`-style, so the Director's validator can share code)

| param | type | default | range | doc |
|---|---|---|---|---|
| `slots` | number | 3 (portrait) / 5 (split) | 1–5 | visible items before eviction |
| `writeMsPerGlyph` | number | 55 | 30–90 | write speed; Young 65 |
| `writeMinMs` / `writeMaxMs` | number | 300 / 900 | | clamp |
| `preRollMs` | number | 400 | 0–800 | start before the estimated word (§5.4) |
| `skin` | enum | `chalk` | `chalk`, `flat` | B4 default `flat` (PRODUCT-DESIGN §3.7) |
| `numerals` | enum | from `InitCtx` | `latn`, `deva` | |
| `reducedMotion` | boolean | system | | no wipe |

Events: `board.write{id, firedMs, est}`, `board.evict{id}`, `board.tap{id}`, `board.replay{id, rid}`.

---

## 5. Speech-synced board and pointer: the measurement and the scheduler

### 5.1 Method [M]

- **Probe.** `teacher-visual-sync-probe.mjs` drove **16 real teacher turns** (8 Hinglish, 8 English; Class 4–6 maths and science prompts; voice `marin`) on `taxila-realtime` over WebSocket. It recorded the arrival time of every transcript delta and audio delta, plus the PCM.
- **Ground truth.** `teacher-visual-sync-align.mjs` sent each turn's PCM to **Azure Speech fast transcription** (word offsets; en-IN + hi-IN; same Foundry resource).
  - Anchors are **digit runs** ("3", "4", "180"), matched in order. Digits are script-neutral, so they line up between the Roman realtime transcript and the Devanagari STT output.
  - That gave **60 matched anchors in 10 turns**. Six turns contained no digits.
- **Estimators scored:**

| id | how | live? |
|---|---|---|
| P | char position / length × known duration | after `resp_done` |
| S | spoken-unit position / total × known duration (units: Roman vowel groups; numbers by digit count; pauses 2.2 at `.?!`, 1.2 at `,;:`; `/ = + ×` count as words) | after `resp_done` |
| R | units ÷ rate (rate fitted leave-one-turn-out) | from the first delta |
| Q | R re-anchored at audio-envelope pauses | causal |
| Y | syllable-nucleus counting on the played audio (de Jong & Wempe-style) | causal |
| **L** | **R until `resp_done` arrives ≥ 300 ms before the word, then S with D = audio_tokens × 50 ms** | **yes: this is the shipped one** |

- **Output:** `teacher-visual-sync-2026-10-02.json`.

### 5.2 Results [M] (n = 60 anchors, 16 turns, 1 voice, 2026-10-02)

| estimator | median abs err | p90 | max | within ±250 ms | within ±500 ms |
|---|---|---|---|---|---|
| P chars, known D | 475 ms | 1,570 | 2,421 | 30% | 55% |
| **S units, known D** | **282 ms** | **971** | 1,600 | **48%** | **73%** |
| R units ÷ rate | 655 ms | 1,976 | 2,317 | 20% | 40% |
| Q pause re-anchor | 885 ms | 2,525 | 2,749 | 30% | 42% |
| Y nuclei (params tuned on this data: optimistic) | 340 ms | 1,520 | 2,150 | 37% | 62% |
| **L live hybrid** | **372 ms** | **863** | 1,600 | 35% | 67% |

| other measured facts | value |
|---|---|
| transcript lead over playback (text arrival → word played) | median **6.46 s**, p10 **0.94 s**, min **0.20 s** |
| first transcript delta / first audio after `response.create` | 472–1,138 ms / 671–1,360 ms |
| generation speed (audio length ÷ time to last audio delta) | **3.2–4.2× real time** |
| `audio_tokens` per second of audio | **20.00** in 15/16 turns (19.49 in 1) |
| share of anchors placed by S (after `resp_done`) under L | **78.3%** |
| speaking rate (S units/s) | 4.1–5.6 per turn |
| signed L error (estimate − truth) | median −80 ms; 60% early |
| fast-transcription latency for a 9–22 s turn | 0.88–2.46 s (n = 8) |

**What the numbers mean:**

- **Q and Y lose.** Envelope pauses do not map one-to-one onto punctuation: she pauses mid-clause and runs through commas. Text-only S, given the exact duration, beats both acoustic trackers.
- **Caveats:** one voice; WebSocket rather than WebRTC (WebRTC paces audio at real time, so lead should be similar, but **[U → E-TV-1]**); STT word offsets have ~80 ms granularity; digits only (keyword anchors are untested); 60 anchors is small.
- **Reproduce:** `node teacher-visual-sync-probe.mjs <dir>` then `node teacher-visual-sync-align.mjs <dir> out.json`.

### 5.3 The `say` matcher

- The transcript text is normalised before matching: lower-case; Unicode NFKC; `×`/`x`/"times"/"into"/"guna" → `×`; `/` / "by" / "upon" / "over" → `/` when it sits between numbers; "equals"/"barabar" → `=`.
- **Number words → digits**, in English (zero–thousand) and Hindi-Roman (ek…sau, aadha → 1/2, paav → 1/4, dedh → 1½, dhai → 2½; "teen chauthai" → 3/4). The probe saw a "five tenths" turn (r14) where 9 of 11 STT digits had no digit in the transcript.
- Each `say` alternative matches on a token boundary. The match records `charPos` = the index of the first character.
- **No match by `resp_done`:** a board `write` falls back to `turn_start`, because the anchor is still worth having; a `PointCue` is **skipped** (`no_match`), because pointing at the wrong moment is worse than the persistent `highlight` alone. Both are logged.

### 5.4 `CueScheduler` (implementable)

```ts
// src/lesson/stage/cues.ts
interface PendingCue { id: string; kind: "board" | "point"; at: CueAt; op?: BoardOp; point?: PointCue; charPos?: number; fireAt?: number; est?: Est }
interface TurnClock { rid: string; text: string; t0?: number /* audio_start, perf.now */; audioMs?: number; done: boolean; cues: PendingCue[] }

const PRE_MS = 400, GAZE_LEAD_MS = 200, LATE_MS = 600;
let rate = 4.8 / 1000;            // units per ms; EWMA per voice over finished turns: rate ← 0.8·rate + 0.2·(U/D)

function plan(c: PendingCue, t: TurnClock): void {
  if (c.at.k === "turn_start") { c.fireAt = 0; c.est = "fallback_turn_start"; return; }
  if (c.at.k === "turn_end" || c.charPos == null) return;
  const u = units(t.text.slice(0, c.charPos));
  if (t.done && t.audioMs) { c.fireAt = (u / units(t.text)) * t.audioMs - PRE_MS; c.est = "S_exact"; }
  else { c.fireAt = u / rate - PRE_MS; c.est = "R_rate"; }
}
// on text delta: append, run matcher for unmatched say-cues, plan(); on resp_done: set audioMs, done=true, re-plan
// every unfired cue (R → S upgrade), apply §5.3 fallbacks, update rate; every frame (shared rAF): now = perf.now() - t0;
//   point cue: if (now >= fireAt - GAZE_LEAD_MS) gaze(target); if (now >= fireAt) draw(target)
//   if (now > fireAt + PRE_MS + LATE_MS) → board: write now (est stays); point: skip("late")
// on interrupted(playedMs): cues with fireAt > playedMs → essential board ops write instantly (no wipe), others skip("interrupted")
```

- **Hold rule (pointer):** the mark holds until her sentence ends or the child acts, then fades over 300 ms (PRODUCT-DESIGN §3.5). The sentence end is estimated the same way: the next `.?!` charPos run through `plan()`, plus 300 ms.
- **Why 400 ms of pre-roll:** see the policy curve [M]. With pre-roll of 0, 200, 400 and 600 ms, the mark is visible at word onset in 61.7%, 78.3%, **86.7%** and 95.0% of cases, with maximum early times of 1.6, 1.8, **2.0** and 2.2 s. At 400 ms the early tail stays inside the Porte −2 s boundary; at 600 ms it crosses it.
- **Gaze** turns 200 ms before the mark (ui-teardown token), so it effectively leads the word by ~600 ms. Teachers do look before they point **[I]**.

### 5.5 Interruption, failure and offline

| case | behaviour |
|---|---|
| barge-in mid-turn | cues past `playedMs` are dropped; `essential` board items appear instantly; the pointer fades at once (PRODUCT-DESIGN: "stop on the frame") |
| `resp_done` never arrives (socket drop) | R-rate placement continues; on `audio_end` every unfired essential item is written |
| target rect missing (module re-laid out, unmounted) | `locate` is re-asked once (≤ 150 ms); else `cue_skipped{target_missing}` |
| tier E (voice only) or `none` face | board and captions still run; pointer runs only if a module is mounted |
| recorded or cached narration (exact audio known offline) | alignment is precomputed when the asset is made (fast transcription, once): `est = "aligned"`, exact |

### 5.6 Captions and R5, resolved

- **Phrase-level captions** use clause boundaries from transcript punctuation, placed with L. A clause is 1.5–4 s long, so a ±0.4 s error is a small fraction of the clause. They ship.
- **R1 word-lit captions:** these **do not ship on an estimate** (finding 1). They ship only when `est === "aligned"`: cached narration, and live turns when E-TV-2 proves the sideband audio path and M-TV-3 shows word-lighting helps R1 readers. That replaces R5's "lead ≥ 150 ms" criterion with an accuracy criterion: **≥ 90% of lit words within ±150 ms of word onset** on a 50-turn validation set.

---

## 6. The 2D face: the `rive2d` and `sprite2d` contracts

### 6.1 One rig contract for both 2D adapters

The face is specified as a **view model**, matching Rive data binding, because state-machine inputs are deprecated **[V]**. `sprite2d` implements the same properties in code, so the Director, the stage and the tests cannot tell them apart.

```ts
export interface TeacherFaceVM {                 // Rive ViewModel "Teacher" / sprite2d state
  floor: "speaking" | "your_turn" | "listening" | "thinking";   // enum; from StageInput floor
  affect: "warm" | "curious" | "insight" | "effort" | "calm";    // enum; ReactionGate-filtered; NO negative values
  mouthOpen: number;             // 0..1 jaw from LevelMeter (attack 0.55 / release 0.18 already in level.ts)
  mouthShape: MouthShape;        // enum from viseme map (§6.2); "rest" when no viseme source
  gaze: "child" | "canvas" | "ledge" | "protege" | "down_think";  // resolved by StageFrame to an angle
  gazeX: number; gazeY: number;  // −1..1, eased by the rig (180 ms saccade, overshoot 5%)
  point: boolean;                // pointing arm/hand toward canvas (split layout: arm; portrait: hand at frame edge)
  nod: Trigger; blinkNow: Trigger; browFlash: Trigger;            // fired by behaviour controller (sibling)
  idleSeed: number;              // reseed head × body idle blending every 6–12 s (Lily's 8 × 8 pattern)
  register: "young" | "older";   // drawing register (PRODUCT-DESIGN cast: warm sibling / respected cousin)
  reducedMotion: boolean;        // idles −80%, no sway, mouth still moves (it carries speech timing)
}
type Trigger = number;           // increment to fire (data-binding trigger semantics)
```

**Rig deliverables per character** (the artist brief, extending `character-creation.md` §3.3):

- **Artboards:** `Head`, `Body` and `Hand` nested, so they move independently, as in Lily.
- **Idles:** ≥ 6 head idles and ≥ 6 body idles (PRODUCT-DESIGN asks ≥ 6 × 6; Lily ships 8 × 8).
- **Mouths:** 9 shapes (§6.2).
- **Eyes:** 3 states (open, half, closed), plus pupils on a 2-axis blend.
- **Brows:** 4 (neutral, raised, soft-concern, focused). There is no frown, which would read as a verdict.
- **Affect poses:** 5, one per `affect` value.
- **Thinking:** eyes up and chalk to chin, plus a "one moment" hand past 4 s.
- **Disclosure badge:** the "computer teacher" badge (Young) lives **outside** the rig, in StageFrame, so no rig edit can drop it.
- **Budget:** ≤ 400 KB `.riv` (Lily's is < 1 MB). Vector only; at most one embedded raster, the scarf print at ≤ 256² WebP.

### 6.2 Mouth shapes: Oculus-15 visemes → 9 2D shapes

Nine shapes cover what is readable at 96 dp. The extended Preston-Blair set adds TH and CH distinctions that are invisible at that size **[I]**.

| 2D shape | Oculus visemes | note |
|---|---|---|
| `rest` | sil | lips together, relaxed |
| `MBP` | PP | **closed**: the most visible error if missed; HeadAudio's closure detection is its best feature (sibling bench) |
| `FV` | FF | lower lip to teeth |
| `TDN` | DD, nn, TH | slightly open, tongue hidden |
| `KG` | kk | open, back |
| `SCH` | SS, CH | teeth together, lips wide |
| `R` | RR | rounded small |
| `A` | aa | widest open: Hindi "aa" and "a" |
| `E_I` | E, I | wide, medium open |
| `O_U` | O, U | rounded: Hindi "o", "u", "au" |

- **Sources, best first:**
  1. HeadAudio visemes (`viseme` events; sibling-patched; Hindi retrain pending).
  2. Amplitude only: `mouthOpen` from the level tap, `mouthShape` alternating `A`/`E_I`/`O_U` by spectral tilt.
  3. The stage-1 fallback: **jaw only**. The sibling bench found RMS the best jaw signal **[M there]**.
- **Interruption** freezes `mouthShape = rest` on the frame of the cancel.

### 6.3 Behaviour, by floor state (the stage side of `ReactionGate`)

| floor | rig programme (the stage sets VM props; the behaviour controller in `behaviour-proto/controller.mjs` sets triggers) |
|---|---|
| speaking | `mouth*` live; `gaze=child`, switching to `canvas` and `point=true` around point cues (§5.4); brow flashes on prosodic peaks (level-derived); `affect` from the Director only at turn start |
| your_turn | lean-in pose; gaze at the ringed element; idle sway −50%; stillness |
| listening | nods timed to the child's pauses and level (never to content); `affect` locked to `warm` |
| thinking | `thinking` pose; past 4 s, the "one moment" hand; `gaze=down_think` |

**"Excited" as asked in the question** is `affect ∈ {insight, effort}` within the gate. Correct answers do not trigger it; insight and effort do (PRODUCT-DESIGN §3.5). This is enforced by the VM enum and by the gate test PD-G7.

### 6.4 `rive2d` vs `sprite2d`: what decides the default

| | `rive2d` | `sprite2d` |
|---|---|---|
| runtime | canvas-lite **222 KB br [V]** (sibling measured 368 KB gz **[M there]**) | ≤ 15 KB br own code **[I]** |
| rig asset | ≤ 400 KB `.riv` | atlas: 2 × 1024² KTX2/WebP sheets ≈ 200–350 KB, pre-rendered from the same character (sibling tier C) |
| thread | main (worker only with the `document` workaround **[S]**) | **worker on OffscreenCanvas 2D** (WebView supports it **[V, MDN compat]**) |
| expressiveness | true blending: bones, meshes, nested artboards | cross-faded frames; head × body layering possible; no continuous blend |
| identity across tiers | a separate art path from the 3D tutor | same renders as the 3D tutor (sibling's argument) |

**Decision rule (E-TV-4):** on a Helio G35 and a G85, with a busy module iframe, `rive2d` stays the launch face (PRODUCT-DESIGN) only if its p95 frame cost is ≤ 4 ms and its mouth p99 gap is ≤ 70 ms. Otherwise `sprite2d` in a worker is the tier C/D default and Rive is kept for tier B+ only.

---

## 7. Pointer on modules: the `locate` → `rects` handshake

The host cannot read a sandboxed module's DOM. Additions to the v2 protocol (`sandbox-telemetry.md` §4):

```ts
// module → host: ready gains a target vocabulary (engines declare it in EngineDef too)
| (MBase & { k: "ready"; caps: Cap[]; emits: string[]; state: StateSnap; targets: TargetDecl[] })
interface TargetDecl { id: string; label: string /* accessible name */; kind: "part" | "region" | "control" }
// host → module
| (HBase & { k: "locate"; targets: string[] })                      // ≤ 4 ids
// module → host
| (MBase & { k: "rects"; reply_to: number; rects: Record<string, Rect | null>; vw: number; vh: number })
| (MBase & { k: "layout_changed" })                                 // throttled ≥ 250 ms; host re-locates armed cues
```

- **When:** the host sends `locate` when a cue is **armed** (its `charPos` matched), well before it fires. The lead is ≥ 0.94 s at p10 [M], so the rects arrive in time. Rects are in iframe CSS px; `PointerOverlay` maps them through the iframe's `getBoundingClientRect()`.
- **Drawing:** one `<svg>` above the iframe, `pointer-events: none`. Strokes are chalk paths (`stroke-dasharray` draw-on, 240 ms), 4–6 px with a 2 px halo, ≥ 3:1 on every surface, never marigold (PRODUCT-DESIGN §3.5).
  - Shapes: `circle` is a hand-drawn ellipse with 8% overshoot, inflated by 10 px; `underline` sits under the rect; `arrow` runs from the stage-facing edge in split layout.
  - The path jitter is seeded per cue, so two marks never look stamped **[I]**.
- **Second cue:** the host also sends `highlight{target, ms}` to engines whose caps include it. The engine's persistent highlight remains when the chalk mark fades.
- **Accessibility:** on fire, the target's `label` goes to the polite live region once ("look at: the denominator"), only when a screen reader is active.
- **Generated modules (Forge T2/T3):** the scene DSL nodes already have ids, so `targets` = node ids with labels, emitted by the runtime shell rather than by generated code. A T3 game that declares no targets gets no pointer cues; the server validator drops them.

**Why not draw inside the iframe** (ui-teardown critique C-layer count)? It would need every engine, including generated ones, to implement chalk drawing identically. One overlay layer costs one composited layer that is idle except for about 1.5 s per cue. If E-TV-4 shows the overlay layer itself costs > 1 ms per frame, T1 engines may implement `focus{target, style:"chalk"}` natively, with the overlay as the fallback.

---

## 8. v2: video face on the same stage

**Directive first.** Every paid AI service must be Azure first-party. Simli, HeyGen/LiveAvatar, Tavus, D-ID and every other vendor are **benchmarks only**, not build options. Sibling `video-avatar-v2.md` has the full analysis. What the stage must guarantee, so a video face drops in without redesign:

```ts
export interface FaceRenderer {
  kind: "rive2d" | "sprite2d" | "talkinghead3d" | "portrait" | "none" | "video";
  mount(el: HTMLElement, opts: { tier: string; register: "young" | "older"; reducedMotion: boolean }): Promise<void>;
  set(vm: Partial<TeacherFaceVM>): void;         // video ignores mouth*; honours floor/affect/gaze where it can
  /** Who owns the audio clock. Non-video: "webrtc" (PlaybackClock = played audio). Video: "renderer". */
  clock: "webrtc" | "renderer";
  /** Renderer-owned clock only: ms of HER audio actually played to the child, for cues and for barge-in truncation. */
  playedMs?(): number;
  stop(): void;                                  // freeze on the frame (barge-in)
  perf(): { msP95: number; dropped: number };
  unmount(): void;
}
```

- **The audio clock moves with the renderer.** A bring-your-own-audio video renderer returns audio and video together, 300–400 ms after we hand it our audio (sibling: Ditto 385 ms FFD, Simli "<300 ms" **[S]**). The child must hear the *renderer's* audio, not the direct track, or the lips trail the voice.
  - `PlaybackClock` then reads `face.playedMs()`.
  - The cue scheduler's `t0` becomes the renderer's first played frame.
  - The `truncate` on barge-in uses the renderer's position. Nothing else in §5 changes.
- **Echo.** The playback path changes, so the echo/AEC check (`EchoProbe`, open mic gating) must re-run on video lessons.
- **Order of build (from the sibling's decision rule, unchanged):**
  1. **Pre-rendered narration video** for cached, identical-for-everyone narration: MuseTalk on Spot A100, ≈ $200 per character library, ≈ $0.12 per student-month to stream **[M there]**. Exact alignment is free, because the audio is known offline.
  2. Live self-hosted video (MuseTalk/Ditto on Azure GPU VMs plus a self-hosted SFU) as a premium tier only, gated on price, scale, an A/B lift over the illustrated face, and the latency and Hindi lip bars.
  3. Azure TTS avatar is out unless it accepts our audio (**[U]**, sibling E-1). Otherwise it forces an Azure TTS voice, the axis the portfolio already lost on.
- **Vendor benchmark row, kept for "reverse if" only:**
  - Simli and HeyGen LiveAvatar LITE: ≈ $0.01–0.10/min, BYO audio **[S, sibling]**.
  - Tavus Echo mode accepts our audio **[V, sibling]**; it was previously listed as managed-only.
  - These rows matter only if the Azure-only directive is lifted.

---

## 9. Performance budget on low-end Android (whole stage)

Reference devices are from `performance-android.md`: **Helio G35** (PowerVR GE8320, A53 only, 3 GB; tier C) and **Helio G85** (Mali-G52 MC2, 4 GB; tier B, the design target). The frame is 30 fps = 33.3 ms. The module and the stage share the WebView main thread (no site isolation **[V there]**).

### 9.1 Bytes and memory

| item | budget | basis |
|---|---|---|
| stage code (bus, scheduler, board, overlay, captions) | **≤ 20 KB br** | [I]; enforced by a size gate |
| `rive2d` runtime + rig | 222 KB br + ≤ 400 KB | **[V]** Rive docs; Lily < 1 MB **[V]** |
| `sprite2d` code + atlas | ≤ 15 KB + ≤ 350 KB | [I]; atlas from sibling tier C |
| board fonts | 0 extra: reuses the app's Baloo 2 / Mukta subsets | visual-identity |
| chalk grain mask | ≤ 6 KB (128² PNG) | [I] |
| stage resident memory (JS + decoded images + canvas backing) | **≤ 24 MB** tier C, ≤ 40 MB tier B | [I]; face canvas ≤ 360 css px × DPR cap (C: 1.5, B: 2) ≈ 1.2–2 MB per backing buffer |

All of it ships in the APK and precaches on the PWA. Nothing on the stage is ever on the cold network path of a lesson start.

### 9.2 Frame time (main thread unless noted), p95 targets

| layer | idle | during cue | rule |
|---|---|---|---|
| face `rive2d` (main) | ≤ 4 ms | ≤ 4 ms | 30 fps cap; skip draw when VM unchanged and no idle tween is active; pause on `visibilitychange` |
| face `sprite2d` (worker) | ≤ 0.3 ms main (postMessage of the VM diff) | same | worker draws on OffscreenCanvas 2D; lips fed from the level/viseme port (sibling: worklet → worker cut p99 gap from 76 to 35–40 ms **[M there]**) |
| board write | 0 | ≤ 1 ms | clip-path/transform/opacity only; no layout per frame (fixed boxes) |
| pointer draw-on | 0 | ≤ 0.5 ms | one SVG path per mark; `stroke-dashoffset`; removed from DOM after fade |
| captions | 0 | ≤ 0.5 ms per phrase change | fixed box, no reflow (PRODUCT-DESIGN §3.8) |
| scheduler | ≤ 0.2 ms per transcript delta | ≤ 0.1 ms per frame | `units()` is linear in text; memoise per response |
| **stage total** | **≤ 4.5 ms** | **≤ 6 ms** | leaves ≥ 25 ms for the module, React and GC; gate G-UT-8 (≤ 33 ms p95 all layers on a 2–3 GB device) |

### 9.3 Governor hooks (into performance-android §6.3)

- **Inputs:** the stage reports `perf{faceMsP95, droppedFrames}` every second. The module reports `perf{long_tasks, max_task_ms}` every 10 s (sandbox-telemetry).
- **Step-down order, cheapest loss first:**
  1. Idle tweens halve.
  2. Face to 20 fps when not speaking.
  3. DPR to 1.
  4. `rive2d` → `sprite2d`.
  5. `portrait`, a static image with a jaw-only mouth.
  6. `none`.

  Board, captions and pointer are **never** degraded: they carry teaching content. The face is decoration in information terms, though not in relational terms.
- **When:** switch faces only in silence (between turns), with a 200 ms crossfade (sibling rule).
- **Thermal and battery saver:** start one step down.

---

## 10. Engines and components specified here

| id | what | key params | events |
|---|---|---|---|
| `teacher-stage@1` | the container: StageBus, PlaybackClock, layer composition, governor reporting | `face`, `tier`, `family`, `reducedMotion` | `cue_fired`, `cue_skipped`, `board_state`, `perf` |
| `cue-scheduler@1` | places `say`/`turn_*` cues on the playback clock (estimator L, §5.4) | `preRollMs` 400, `gazeLeadMs` 200, `lateMs` 600, rate EWMA 0.2 | `cue_fired{est}`, `cue_skipped{why}` |
| `say-matcher@1` | normalises the transcript and finds `say` anchors (number words en/hi-Latn, operators) | `alternatives[]`, `nth` | `match{cueId, charPos}` |
| `board@1` | chalk board / ledge renderer with MathLite | §4.3 table | `board.write`, `board.evict`, `board.tap`, `board.replay` |
| `pointer-overlay@1` | host-drawn chalk marks over module iframes via `locate`/`rects` | `stroke` 5 px, `halo` 2, `draw` 240, `fade` 300, `shape` | `point.draw{target}`, `point.fade` |
| `face-rive2d@1` | Rive canvas-lite adapter over `TeacherFaceVM` | `.riv` url, `fpsCap` 30, `dprCap` | `perf` |
| `face-sprite2d@1` | worker-side Canvas2D sprite rig over the same VM | atlas url, `fpsCap`, `dprCap` | `perf` |
| `viseme-map@1` | Oculus-15 → 9 2D mouths; amplitude fallback | table §6.2 | — |
| `face-video@1` (v2) | renderer-clocked video face (pre-rendered first) | `clock: "renderer"`, `playedMs()` | `perf`, `played` |

---

## 11. Experiments (pass bars set before running)

| id | question | method | pass bar | decides |
|---|---|---|---|---|
| **E-TV-1** | Does WebRTC keep the transcript lead, and does `resp_done` usage arrive ≥ 2 s before playback ends? | Re-run the probe through the real `voiceLink.ts` path (data channel), 3 voices × 16 prompts, logging `output_audio_buffer.started` | lead p10 ≥ 500 ms; `resp_done` before the median anchor in ≥ 70% of turns | the scheduler as specified |
| **E-TV-2** | Does the Azure sideband WebSocket on a WebRTC call receive `response.output_audio.delta`? | 1-hour spike on `taxila-realtime` | audio deltas arrive and the PCM matches what was played | server-side alignment (`est: "aligned"`) for live R1 captions |
| **E-TV-3** | Keyword (non-digit) anchors | Extend the align script to kit vocabulary terms with STT word matching (Devanagari↔Roman transliteration table) | L median ≤ 400 ms on terms, like digits | whether `say` may use terms or only numbers and symbols |
| **E-TV-4** | `rive2d` vs `sprite2d` on G35/G85 with a busy iframe | Sibling harness (`avatar/bench/perf`), real rig vs sprite atlas, 4 × 10 s runs | §6.4 rule: Rive p95 ≤ 4 ms and mouth p99 gap ≤ 70 ms | the launch 2D face per tier |
| **E-TV-5** | Pre-roll sweep in children | Within-child A/B: 200 / 400 / 600 ms pre-roll on pointer cues; first touch on the referent after the cue word | pick the shortest pre-roll within 5% of the best time-to-referent | `preRollMs` |
| **M-TV-1** | Does the timed board help? | A/B: timed `say` writes vs everything written at `turn_start` (same items) | delayed-recall gain ≥ 0.1 SD, or drop timing | the scheduler's value |
| **M-TV-2** | Pointer fires and misses in the field | `cue_fired`/`cue_skipped` rates per band | skipped ≤ 15%; late ≤ 5% | matcher and validator tuning |
| **M-TV-3** | Do R1 readers benefit from lit words? | Cached-narration-only pilot (exact alignment), R1 children, word-lit vs phrase line | decoding gain on taught words ≥ 0.1 SD | whether to pay for live alignment (≈ $0.05–0.15 per lesson) |

---

## 12. Proposed `context/` entries (for the main loop's inbox merge; not written there by this workflow)

- **measurement `teacher-speech-timing-2026-10-02`:** the figures in §5.2. n = 60 anchors, 16 turns, `taxila-realtime` (gpt-realtime-2.1), voice marin, WebSocket lane. Method: Azure Speech fast-transcription word offsets as ground truth. Files: `content/teacher-visual-sync-*.{mjs,json}`.
- **measurement `realtime-audio-tokens-20ps`:** output `audio_tokens` = 20 per second of audio (15/16 turns exact); generation runs 3.2–4.2× real time.
- **decision `cue-placement-L-preroll-400`:** board and pointer cues are placed by estimator L with 400 ms pre-roll and held to sentence end. *Reverse if* E-TV-5 or M-TV-1 shows another pre-roll or untimed writes do as well, or E-TV-2 makes exact alignment cheap and live.
- **decision `r1-wordlit-needs-alignment`** (supersedes PRODUCT-DESIGN R5's "lead ≥ 150 ms" gate): word-lit captions only with `est = aligned`, at ≥ 90% within ±150 ms. *Reverse if* a cheaper estimator meets that bar on 50 turns.
- **decision `stage-face-pluggable`:** `FaceRenderer` with six adapters; the 2D default per tier is decided by E-TV-4. *Reverse if* one renderer wins on every tier.
- **rejection `envelope-pause-reanchoring` (Q) and `syllable-nucleus-tracking` (Y):** both were tried as live word-time estimators. Q was worse than the plain rate (885 vs 655 ms median), because her pauses do not map one-to-one onto punctuation. Y did not beat text-proportional S, even tuned in-sample.
- **rejection `karaoke-from-transcript-estimate`:** 35% of words within ±250 ms. It would light the wrong word about two times in three.

---

## Sources

- Rive, "Duolingo's AI-powered Video Call brings Lily to life with Rive": https://rive.app/blog/duolingo-s-ai-powered-video-call-brings-lily-to-life
- Duolingo blog, "Get to know the AI behind every Video Call with Lily": https://blog.duolingo.com/ai-and-video-call/
- 60fps.design, Lily video call interaction: https://60fps.design/shots/duolingo-lily-video-call-interaction
- Secondary claims on Lily lip-sync (TTS visemes + amplitude), unverified: https://dev.to/uianimation/building-duolingo-style-ai-video-call-characters-using-rive-10o9
- Speak, "Live Roleplays powered by OpenAI Realtime API": https://www.speak.com/blog/live-roleplays · "Building Speak's Voice Agent Platform": https://www.speak.com/blog/building-speaks-voice-agent-platform
- Khan Academy Kids characters: https://khankids.zendesk.com/hc/en-us/articles/360049358751-Learn-more-about-the-characters-inside-Khan-Academy-Kids · https://svgapp.ai/app-mascots/khan-academy-kids/
- Rive runtime sizes (January 2026): https://rive.app/docs/runtimes/runtime-sizes · Canvas vs WebGL: https://rive.mintlify.dev/docs/runtimes/web/canvas-vs-webgl · Web parameters (data binding, deprecations): https://rive.app/docs/runtimes/web/rive-parameters · rive-flutter changelog: https://github.com/rive-app/rive-flutter/blob/master/CHANGELOG.md
- Rive on OffscreenCanvas in a worker (PoC and caveats): https://github.com/fpapado/rive-offscreen-canvas
- Porte et al. 2026, "Continuous Temporal Contiguity Narration-Animation for Learning in Virtual Reality", *JCAL*: https://onlinelibrary.wiley.com/doi/10.1002/jcal.70218
- Mayer, Temporal Contiguity Principle: https://www.cambridge.org/core/books/abs/multimedia-learning/temporal-contiguity-principle/2B975B185589B381663F342F0363515F
- Azure Voice Live API reference (viseme and blendshape events): https://learn.microsoft.com/en-us/azure/ai-services/speech-service/voice-live-api-reference-2026-06-01-preview · Speech visemes: https://learn.microsoft.com/en-us/azure/ai-services/speech-service/how-to-speech-synthesis-viseme
- Azure Retail Prices API (Fast Transcription $0.36/h, eastus2): https://prices.azure.com/api/retail/prices
- OpenAI server-side controls (sideband WebSocket on a WebRTC call): https://developers.openai.com/api/docs/guides/voice-server-controls · Azure Q&A on server-side controls: https://learn.microsoft.com/en-us/answers/questions/5586849/does-azure-openai-realtime-support-server-side-con
- Sibling Taxila docs cited by section: `design/PRODUCT-DESIGN.md`, `design/ui-teardown.md`, `avatar/performance-android.md`, `avatar/web-3d-talking-heads.md`, `avatar/behaviour-expressiveness.md`, `avatar/character-creation.md`, `avatar/video-avatar-v2.md`, `content/sandbox-telemetry.md`, `content/animation-video.md`, `content/genui-reliability.md`.

---

## Engineering review

**Reviewer stance:** senior frontend/game engineer. Scope is feasibility in React/TS + canvas/SVG, cost per component, 60 fps on a ₹10k Android, parameter and event sufficiency, and safety. Evidence tags as above; everything about device frame time below is **[I]** because nothing in this doc was run on a Helio G35 or G85. I did not re-run the §5 probe. The numbers in §5 are taken as stated (n = 60 anchors, one voice, WebSocket).

**Cost key:** S = ≤ 1 engineer-day, M = 2–3 days, L = 4–8 days. Costs are for one engineer who already knows the repo, and include unit tests and a replay harness but exclude art and device-lab time. The brief's "≤ 2 days" bar is met only by S and the low end of M. The lens is the stage, which is not a set of engines in the manipulative sense (see C-1).

### Verdict

The plan is buildable, and §5's measurement-first approach is the strongest part of the doc. But it is not a "two-day engines" list. The whole stage is about **25–32 engineer-days** (§E.2), not 9 small components. Four items are **wrong or unsafe as written** (C-3, C-7, C-10, C-13). "60 fps" is not a target the doc meets and should not be implied: the face is capped at 30 fps and the budget is a 33 ms frame. The bar is reachable for compositor-only effects (board, pointer), and **unproven** for the face on tier C.

### E.1 Corrections (numbered; the first item of each group is the most severe)

**Timing and scheduler (§5)**

- **C-1. Scope mismatch.** The brief asks about engines (manipulatives, simulations). This doc specifies the *teacher stage*, so the review is of those nine components. Parameter sufficiency for learner-facing engines belongs to the sibling engine docs.
- **C-2. `plan()` has gaps.** `turn_end` returns without a `fireAt`, so nothing fires it unless an `audio_end` handler exists (not specified). Add one.
  - **Idempotence:** the R→S re-plan on `resp_done` can move `fireAt` earlier or later. A cue already drawn from the R estimate must never re-fire or be re-judged "late". Give `PendingCue` a `state: "armed" | "fired" | "skipped"`, and make re-planning touch only `armed` cues.
  - **Re-plan can make a cue instantly late.** Under L the signed error is median −80 ms, so S often lands earlier than R. A cue that is armed and not yet fired can be pushed into the `now > fireAt + 1000` skip rule at the moment of the upgrade. Skip only if `now > newFireAt + PRE_MS + LATE_MS` **and** the cue has not fired. Better: fire at once with `est: "S_exact"` if the delta is within `LATE_MS`.
- **C-3. The pointer pre-roll can mark the wrong referent.** The 400 ms pre-roll (and the up-to-2 s early tail) was validated for "mark visible at word onset", not for "mark visible on the *right* thing". Two pointer cues in one sentence ("numerator ... denominator") that sit < 2 s apart will have the second mark appear while she still talks about the first. Rules to add:
  1. A pointer cue never fires earlier than the *previous* pointer cue's word plus 300 ms.
  2. Cues inside one sentence supersede: the second replaces the first at fire time; the "hold to sentence end" rule applies only to the last cue of the sentence.
  3. For pointer cues, cap pre-roll at 400 ms *and* never earlier than the previous clause boundary. Boards may keep the 2 s tail; pointers may not.
- **C-4. Playback clock drift (WebRTC).** `t0` = `output_audio_buffer.started` assumes constant-rate playback. The jitter buffer, Bluetooth output (150–300 ms extra) and OS audio latency all move the true heard time. The doc already says the level tap refines the first frame, but there is no continuous re-sync. Cheap fix: re-anchor the clock on every above-gate level onset after a ≥ 400 ms silence (a free resync at each pause). That is S and attacks the 372 ms median, but needs a measurement before it is trusted.
- **C-5. Backgrounding and the rAF stall.** On `visibilitychange` or an Android app switch, rAF stops while `performance.now()` keeps running. On return, every cue is "late" and gets skipped or written at once. Specify: when `document.hidden` mid-turn, freeze the clock (or mark all unfired pointer cues `interrupted`), and treat the return as a barge-in.
- **C-6. `rid` binding for `speakNow: "interrupt"`.** The text of the in-flight response has already streamed partly. The matcher must run over the whole text so far, and any anchor whose `charPos` is behind the played position gets `late` rather than waiting. State this.
- **C-7. `board.replay` clip bounds come from an estimate with p90 error 971 ms (S).** A clause replayed from `[startMs, endMs]` will cut words in half in roughly one case in five. Fix: **snap both bounds to the nearest audio-envelope silence within ±600 ms** (the Q/Y acoustic tracker loses as a word estimator but is fine as a boundary snapper, because pauses are real even when the mapping to punctuation is loose). Also specify the audio store: tapping the remote WebRTC track into an `AudioWorklet` ring buffer. 25 min of 24 kHz mono 16-bit is about 72 MB, so keep only the last ~3 min (≈ 8.6 MB) and drop the tap on tier C if memory pressure triggers. This adds ~2 days to `board@1` (E.2).
- **C-8. Matcher cost is understated.** Digits are the easy case, and the measurement used digits only (E-TV-3 is not done). The Hindi-Roman number table is 1–100 and irregular (ikkis, baaees, untalis ...), and the realtime transcript's spellings vary (pachees, pacchis, pachis). It needs fuzzy matching and a spelling corpus, so it is not a lookup. Ship **digits + operators only** (S) first. Terms and Hindi number words follow E-TV-3, as M.
- **C-9. The 86.7% figure is not a per-pointer guarantee.** It is n = 60 anchors from digit runs, one voice. Treat all §5 thresholds as defaults behind remote config, not constants. Per-voice `rate` EWMA is right, but the S estimator's `units()` is tuned on this data and will need re-fitting for each new voice.

**Board and MathLite (§4)**

- **C-10. `clip-path` is not guaranteed compositor-only on Mali/PowerVR WebViews.** The doc claims "compositor-friendly" for the clip-path wipe. In Chrome, clip-path animation has historically run on the main thread with a repaint per frame, and I have no proof it is composited on older Android System WebView builds, which are common on ₹10k devices **[U]**. Safer implementation, in order of preference:
  1. Rasterise the item once to an `OffscreenCanvas`/`ImageBitmap`, then reveal with a `drawImage` clipped rect on one small board canvas (16 ms per frame is not at risk for a ≤ 360 × 120 px item).
  2. A sliding "eraser" `div` using `transform: translateX`, only where the board background is flat (`skin: flat`).
  The chalk-grain `mask-image` has the same trap: a mask on an element whose children animate forces re-masking each frame. Use the grain as a static background-image overlay (no blend mode, no mask).
- **C-11. MathLite gaps for Classes 1–9.**
  - **Ambiguity:** `x` is both multiplication and a variable, and `l` (litre) is both a unit and a variable. Define precedence: `x` between two terms with no preceding `=` context is `×`, else variable. Reject `l` as a variable.
  - **Missing:** mixed numbers (the matcher produces "1½", "2½" but the grammar cannot render them), exponents (`cm²`, `x²`, Class 7–9), `√`, and vertical column arithmetic with carries (the core of Class 1–4 addition/subtraction). Without these the board cannot do what the matcher already says it hears.
  - **Glyph count:** "55 ms × glyphs" is ill-defined for Devanagari (matras, conjuncts). Count grapheme clusters via `Intl.Segmenter`, which the WebView supports (Chrome 87+), and fall back to code points.
  - Needs a parser + render test corpus of ≥ 60 NCERT-derived expressions. The estimate is M for the grammar with those gaps closed, not S.
- **C-12. Stage bundle budget.** "≤ 20 KB br" for bus + scheduler + matcher + board + MathLite + overlay is optimistic once the Hindi number table, fuzzy matching and MathLite layout are in. Plan **25–35 KB br** and make the size gate a ratchet instead of a hard 20.

**Pointer and protocol (§7)**

- **C-13. Safety: the `rects`/`label` reply comes from an untrusted opaque-origin module and is trusted as written.**
  1. Check `event.source === iframe.contentWindow` and a per-mount nonce, not `origin` (it is `"null"` for sandboxed iframes).
  2. Validate every rect: finite numbers, clamp to `[0, vw] × [0, vh]`, reject area > 60% of the viewport, and clip the overlay to the iframe's box (`overflow: hidden` on the overlay container). Otherwise a bad module can draw a chalk ring over the "computer teacher" badge or the safeguarding / help control.
  3. **`label` is module-supplied but goes to a live region.** Take `label` only from the host-side kit/engine registry (verified), never from the `ready`/`rects` message of generated modules. Render as `textContent`, ≤ 40 chars.
  4. Rate-limit `rects` and `layout_changed` (≤ 4/s each).
  5. Keep the overlay z-index below the badge and the safeguarding control, and test that with a PD gate.
- **C-14. Rects go stale for moving targets.** A one-shot `locate` is wrong for a ball in a physics sim, a draggable on a number line or any animated target. `layout_changed` is throttled to 250 ms and says nothing about motion. Add `TargetDecl.moving: boolean`; for moving targets the host re-asks `locate` every 100 ms while a mark is held, and the engine may push `rects` itself while `moving`. Without it, pointing at a moving object looks like an error and breaks pointer-before-answer deixis.
- **C-15. `Rect` units across scaled iframes.** The doc gives `vw`/`vh` but not the transform. If ModuleHost scales the iframe (the usual way to fit a fixed-size engine), the host maps by `getBoundingClientRect().width / vw`, not 1:1. State the formula and add the test.
- **C-16. Generated T3 targets.** "Scene DSL nodes already have ids, so targets are emitted by the runtime shell" works only for modules built through our scene runtime. Free-form generated HTML cannot expose rects honestly. The validator already drops cues there; also surface this to the Director (`ready.targets: []`), so it stops planning pointer cues for those modules.

**Face (§6)**

- **C-17. `Trigger = number` ("increment to fire") is not how Rive triggers work.** A data-binding trigger property is fired by calling `.trigger()`. Keep the increment convention in the *host-side VM interface* (so `sprite2d` and tests can diff it) and have the `rive2d` adapter translate to `.trigger()` calls. Also confirm in the first hour of the spike that **data binding and nested artboards are present in `canvas-lite`**; the doc cites lite's size (222 KB) but only lists text/layout/audio/scripting as dropped **[U]**. If binding is missing, the size figure is for a runtime that cannot run the specified VM.
- **C-18. "Rive in a worker" is a proof of concept, not a plan** **[S]**. It needs the `document` workaround. The doc's own default fallback (`sprite2d` in a worker on tiers C/D) is correct. I would go further and **make `sprite2d` the launch face on tiers C and D from day one**, running E-TV-4 only to find out whether `rive2d` earns tier B. The stage-total budget of 4 ms for a vector Rive rig on a Cortex-A53 at DPR 1.5 is **not credible without measurement**; Canvas2D vector rasterisation of a meshed rig is CPU-bound on those devices.
- **C-19. `KTX2` atlas is wrong for a Canvas2D renderer.** KTX2/Basis is a GPU texture format; `drawImage` cannot consume it. A Canvas2D sprite atlas must be WebP/PNG, decoded to RGBA: 2 × 1024² ≈ **8 MB** decoded, not "1.2–2 MB". Budget stage memory accordingly (tier C ≤ 24 MB is then tight with a wasm heap on the Rive path), and consider 2 × 768² sheets.
- **C-20. `sprite2d` in a worker needs a main-thread fallback.** Old Android System WebViews on budget devices may not update (Android Go). If `OffscreenCanvas` 2D is absent, fall back to a main-thread `<canvas>`, and treat that as a governor step. Also feed lips by **transferring a `MessagePort` from the `AudioWorklet` directly to the worker**, so main-thread jank does not delay the mouth; do not push `mouthOpen` through main `postMessage` per frame. Coalesce to ≤ 30 Hz.
- **C-21. Brow state vs the "no negative affect" promise.** The rig has a `soft-concern` brow and `affect: "effort"`. If effort maps to soft-concern, the face reads as worry exactly when a child is struggling, which the enum was designed to prevent. Test that `effort` renders as *focused*, never concern, and add a snapshot test per `affect` value in both registers. Also cap flashing (`browFlash`, highlight pulses) at < 3 Hz.
- **C-22. `gaze` enum plus `gazeX/gazeY` is redundant.** Pick one source of truth: the enum is resolved to X/Y by `StageFrame`; the rig takes only X/Y. Two sources will fight under easing.

**Performance (§9)**

- **C-23. "60 fps" is not met, and the doc should say so.** Face capped at 30 fps; total budget 33 ms; the only 60 fps items are compositor-driven (pointer `stroke-dashoffset`, `transform`/`opacity`). Note `stroke-dashoffset` is a paint-triggering property in Chrome, not a compositor property. The 240 ms draw-on of one SVG path is cheap, but call it "main-thread paint, ≤ 0.5 ms", not compositor. All frame-time and memory numbers in §9 are **[I]**: gate G-UT-8 must be run on real G35/G85 hardware before anything ships.
- **C-24. React cost.** Board/pointer/caption updates must go through imperative refs, not React state per frame. Stage props that change at ≤ 1 Hz may use state. Add that rule so a `StageInput` stream (`level` at 60 Hz) does not re-render the tree.

### E.2 Build-cost estimate per component (S/M/L)

| component | cost | days | notes and risk |
|---|---|---|---|
| `teacher-stage@1` (bus, clock, layers, governor reporting) | **M** | 3–4 | Normalising `realtime.ts`/`voiceLink.ts` events, `rid` binding (C-6), background handling (C-5). Not ≤ 2 days |
| `cue-scheduler@1` | **M** | 2–3 | Core placement is ≈ 0.5 day. The rest is C-2/C-3/C-4 and a **replay harness over the 16 recorded turns** (the JSON already exists), which is what makes it safe |
| `say-matcher@1`, digits + operators | **S** | 1 | Number words and terms are separate: **M, 3–4** (C-8), gated on E-TV-3 |
| `board@1` (text, mark, evict, tap, canvas wipe) | **M** | 2–3 | C-10 rasterise-and-reveal design |
| `board@1` MathLite parser + layout + corpus | **M** | 2–3 | C-11; vertical arithmetic would add **M** more |
| `board@1` replay (audio ring buffer + silence snapping) | **M** | 2–3 | C-7; tier C memory risk |
| `pointer-overlay@1` + `locate`/`rects` host side | **M** | 2–3 | C-13 validation and C-14/C-15 |
| per-engine target declaration (each existing engine) | **S** each | 0.5–1 | Shared helper makes it a manifest entry |
| `face-rive2d@1` adapter | **M** | 2–3 | **Gated on the C-17 spike** (is binding in lite). Rig art is a separate multi-week workstream, not counted |
| `face-sprite2d@1` worker rig | **M-L** | 4–5 | Atlas packer, cross-fade, head × body idle blend, port feed, main-thread fallback (C-20). The atlas render pipeline from the 3D character is a further **L** |
| `viseme-map@1` | **S** | 0.5 | Depends on HeadAudio availability; amplitude fallback is simple |
| governor hooks / face switching in silence | **S-M** | 1–2 | Switching faces mid-lesson needs crossfade and state transfer |
| `face-video@1`, v2 pre-rendered narration player | **M** | 2–3 | The offline alignment pipeline is separate; live video face is **L+** and out of scope |

**Total for the v1 stage (everything but `face-video@1` and art): about 25–32 engineer-days.** Unblocked critical path: `teacher-stage` → `cue-scheduler` → `board` → `pointer-overlay`; the two faces run in parallel.

### E.3 Are params sufficient for LLM control?

- **`board@1`:** sufficient and *deliberately narrow*. The Director never sets speed or fonts; it sets items, `at`, `essential` and `pin`. This is right. Add `BoardItem.kind: "colmath"` (column arithmetic) for Class 1–4, which the grammar cannot express, and `exp` support (C-11).
- **`CueAt.say`:** sufficient for numbers and symbols, and the server validator rule "never a sentence" is correct. But it gives the Director **no way to express "the second occurrence of a fraction she says"** other than `nth`; confirm `nth` counts matches of *any* alternative, not per alternative.
- **`PointCue`:** missing `holdUntil: "sentence_end" | "child_acts" | "ms"` (the hold rule is fixed in code; the Director may need "until the child taps"), and a `moving` hint from the engine (C-14).
- **`TeacherFaceVM`:** more than the LLM should control. Only `affect` is Director-reachable, which is correct. Keep `mouth*`, `gaze*` and triggers off the Director's schema, and validate that on the server.

### E.4 Are the events enough for the teacher to observe learning?

Not yet. The stage logs *what the stage did* (`cue_fired`, `cue_skipped`, `board_state`) but not *what the child did in response*, which is what the teacher needs.

1. **No cue outcome.** E-TV-5 measures "first touch on the referent after the cue word", but no event produces it. Add `cue_outcome { cueId, target, touchedAtMs: number | null, windowMs }`, timestamped on the `PlaybackClock`, produced by the host by joining `module_event` (with a `target` field) against `cue_fired`. This is the single most useful event for the learner model: did the child follow the teacher's pointer, how fast, or ignore it.
2. **`module_event.kind` is coarse** (`interaction | answer | goal_met | stuck`). Add `target: string | null` and `t_play: number` (ms on PlaybackClock) to every `interaction`, and define who detects `stuck` (the engine, with a documented threshold), or it will be inconsistent per engine.
3. **Board interaction is tap-only** (`board.tap`, `board.replay`). Replay is a legitimate confusion signal ("child replayed the same clause twice"); emit `board.replay{id, count}` aggregated per item.
4. **No caption/face events needed for learning.** Do not add them; they would only be noise.
5. All `StageOutput` events should carry the lesson `turnId` so the Director can join them to its own moves, and every timestamp must say which clock it is on (`PlaybackClock` vs `performance.now()`).

### E.5 Safety review summary

| risk | where | status |
|---|---|---|
| Untrusted module rects/labels draw over safety UI or inject text into a live region | §7 | **Fixed by C-13**; needs a PD gate (overlay never above the disclosure badge/help control) |
| LLM-authored `text` board items reaching the child | §3/§4 | Server validator exists; also render with `textContent`, apply the same content filter as captions, ≤ 24 chars enforced client-side too |
| Wrong-referent pointing teaches a wrong association | §5 | **C-3**; the `no_match` skip is the right default |
| Face reading as a verdict (concern on "effort") | §6 | **C-21**; snapshot-test every `affect` value |
| Flashing/pulsing for photosensitive children | §6/§7 | Cap < 3 Hz, honour `reducedMotion` (already in the VM) |
| Replayed audio cut mid-word | §4 | **C-7** (accuracy, not safety, but visible to the child as a defect) |
| Retained audio buffer of the teacher's voice | C-7 | Memory only, ring buffer, never persisted or uploaded; confirm with the privacy review |
| Video face (v2) echo/AEC | §8 | Already flagged; keep it as a launch gate |

### E.6 Recommended first week (what to build and what to prove)

1. **Day 1:** the Rive `canvas-lite` spike: data binding, nested artboards and `.trigger()` present or not (C-17); measure the idle frame cost of a stand-in rig on a G35. In parallel start `sprite2d`, since it is the likely tier C/D default (C-18).
2. **Days 1–3:** `cue-scheduler` + digits-only `say-matcher` + the replay harness on the 16 recorded turns. Success: reproduce the §5.2 L figures (372 ms median, 86.7% at 400 ms pre-roll) in CI, so later changes cannot silently regress them.
3. **Days 3–6:** `board@1` with the canvas reveal; `pointer-overlay@1` with C-13 validation first, because it is the only item in the doc that crosses a trust boundary.
4. **Then** MathLite and replay (C-7), `face-rive2d` only if the spike passes.
5. Run G-UT-8 on real devices before any of it is called shipped.
