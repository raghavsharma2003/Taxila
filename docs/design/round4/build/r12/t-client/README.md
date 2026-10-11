# Release 12 · T-client · the flight recorder, client side

Brief: `docs/design/round4/build/r12/TRACKING-BRIEF.md` on base `84bc6050`. Decision: `dc-r12-flight-recorder`.
Contract: `shared/trace.ts`, T-server's file at `e376d62f`, used unchanged.

All numbers below come from adult-run harnesses on this container's dev server (Playwright Chromium, SwiftShader GL). No
child has been recorded.

## What it does

### Boot and the event bus

- **Boot.** `installTrace()` runs first in `src/main.tsx` (patch 01, `[patch-request]` commit).
- **Stamping.** Every client event is stamped `v, sid, pid, src, seq, t, mono, kind, turn?, rid?, tier`.
  - `t` carries the clock skew measured from server `Date` headers.
  - `sid` is the page-load id until a lesson starts, then the lesson id (`trace.session` marks the switch).
- **Sending.** Events are masked, capped to 8 KB of `data`, and sent every 2 s to `POST /api/trace/batch`.
  - Batches are split under 256 KB.
  - At `pagehide`, the rest goes by `sendBeacon` in pieces under 60 KB.
  - Sends use the page's original `fetch`, so the recorder never records itself.
  - A failed send is dropped and counted (`trace.dropped`).
- **Never throws.** Every entry point is wrapped, and the recorder measures its own main-thread time.

### Network

- `fetch`, `EventSource` and `WebSocket` are wrapped.
- **Every same-origin `/api` call** carries `X-Taxila-Rid` (for EventSource, the `_rid` query parameter). It is
  recorded as `net.req` / `net.res` / `net.err` with method, path, rid, status, ms, bytes and masked JSON bodies.
  - `/api/trace/*` is never recorded.
  - Audio, video and event-stream bodies are described, not read.
- **The app's own `Response` and rejection** are returned untouched.
- **Any fault** in a wrapper falls back to the original call.

### Page hooks

- **Errors:** `err.js`, `err.promise` (message, stack, top frame) and `err.resource`.
- **Performance:** `perf.lcp`, `perf.longtask` (over 200 ms) and `perf.memory`.
- **Device:** `dev.info`.
- **Route:** `ui.route` (path, scrubbed query, push/replace/pop).
- **Taps:** `ui.tap` records role, label, test id, zone and part. It never records a field's value, and a password,
  email, tel or PIN field's label and name are `[masked]`. Coordinates are kept only on the tray, a canvas or an SVG,
  never inside a text input.
- **Keys:** `ui.key` records only Enter, Escape and Space on controls.
- **Media:** `ui.image.load` / `ui.image.error` (src, ms, size, bytes); `ui.media` (a video, canvas or iframe mounted,
  played, stalled or failed).

### The lesson

The Desk's own model and the stage's own render are the source; nothing is inferred from the server.

- **From the Desk:**
  - `ui.state` (floor, phase, sheet, strip, gate, answer form, mic mode);
  - `ui.render.card` (the question on the card, its lines and source);
  - `ui.answer`;
  - `ui.chips` (shown, chosen);
  - `ui.render.tray`;
  - `ui.render.summary`.
- **`ui.render.stage` from `StudioStage`:**
  - slot, intent, mount id, epoch, state and phase;
  - artifact kind, twin, swap and box;
  - every renderer event (ready, done, error with its reason).
- **For every board page**, from `StudioWhiteboard`:
  - its page seq in the lesson, `scriptId`, `mode`, ops and prior ops;
  - **`previous: CLEARED | OVERLAID`**;
  - the texts drawn.
- **`ui.render.board` after the page has drawn:** a DOM count of op groups actually visible, how many came from earlier
  pages, and `onScreen: CLEARED | OVERLAID`. This answers "new drawings were drawn over the previous content" from what
  the screen shows, not from the script. Sample: `board-trace-events.json`.

### Tier 2 (`/api/me` `trace.tier === 2`, also learned from a batch response)

- **The rrweb recording:**
  - rrweb (MIT) is lazy-loaded as its own 178 KB chunk, so tier 1 never downloads it.
  - Canvases are sampled at 4 fps as webp.
  - All inputs are masked by rrweb, and password, email and tel fields never record.
  - Chunks go to `POST /api/trace/blob` every 10 s or 400 KB, pointed at by `rrweb.chunk`.
  - App-driven focus is recorded as an rrweb custom event, so the replay shows the same focus ring.
- **The REC chip** appears in the lesson header whenever tier 2 is on.
- **"Flag this moment"** sits in the lesson's ⋯ menu, which is shown for tier 2 even after the "Not me" window. One tap
  stamps `flag.owner` (time, path, the Desk's floor, ask and tray); an optional note follows as `flag.note`.
- **`traceBlob(kind, bytes, {ext})`** is T-voice's door for `audio.mic.chunk` and `audio.tts.clip`. It does nothing at
  tier 1.

### `scripts/trace-replay.mjs`

- `--events <file|dir> --at hh:mm:ss[,…] [--tz +05:30] [--base origin] [--out dir]`. Also exported as
  `renderReplay()` / `loadEvents()` / `resolveAt()` for T-server's `scripts/trace.mjs --replay`.
- It renders with rrweb's own Replayer (the engine inside rrweb-player), locally, in headless Chromium, and writes a
  PNG per moment.
- **From the store** (what `scripts/trace.mjs --replay <session> --at hh:mm:ss` runs; the session is the first bare
  word, resolved as `trace.mjs` resolves it: lesson id with its page loads, child id prefix, or pid). The agreed events
  input: the session's `rrweb.chunk` rows in `trace_event`, each chunk read from the private `trace` container at
  `data.blob.ref`; a chunk sent by beacon at pagehide has no ref, so its path is rebuilt as the server writes it
  (`{day}/{sid}/client-{seq}.json`, that day or the next); a chunk with `failed` is skipped and counted. Blob reads are a
  SharedKey GET with the PUT's own signer, or `TAXILA_TRACE_BLOB_DIR=<dir>` for a local copy with the same layout.
  `--base` defaults to the recording's own origin (its Meta event).
- At each moment it jumps CSS animations to their end, so a just-inserted word is not frozen at frame 0 of its fade-in.
  It also applies the recorded focus.

## Evidence

| what | result |
|---|---|
| **Replay = what the screen showed** (`replay-proof.json`): 5 moments; 4 from a scripted lesson (real LessonRuntime, scripted Director, recorder tier 2, 412x915) plus a board page drawing. Pairs: `pair-*.png` (screenshot left, replay right) | differing pixels 0 / 0.054 / 0 / 0.123 / 0.02 %; differing 32 px tiles 0 / 0 / 0 / 2 / 0 (gate ≤ 4) |
| **Tier 1 main thread**, scripted lesson, 3 turns, CPU ×4, n = 3 (`budget.json`) | recorder's own time **0.33 % median, 0.41 % max** (budget 2 %); page TaskDuration with vs without recorder +0.12 % median |
| **Tier 2 frame rate**, rAF over 4 s, n = 3 | board 60.0-60.2 fps (60.4 without the recorder); Antariksh 3D **56.6-58.4 fps** (58.4-60.1 without); rrweb ran in every window, about 16 canvas frames per window on Antariksh |
| **A broken recorder never changes a lesson**: the scripted lesson with no recorder vs a sabotaged tier-2 recorder (its sink, sends and chunks all throw) | floor sequence, turn requests and visible text after every turn **identical** (the REC chip, tier 2's sanctioned addition, excluded), no page error |
| **Masking** in a real page (`masking.json`): password, email, phone, PIN and plain fields typed and tapped, plus a `/api` call carrying the same secrets in body and headers | **0 leaks** in tier-1 events and the rrweb stream; tap labels `[masked]`; body `{email, password, pin, phone: [masked], note: "call me on [masked]"}` |
| **Replay end to end on TEST** (`replay-e2e.json`, `pair-e2e.png`): the scripted lesson against the REAL API in-process on the Neon TEST branch, tier 2 by `TAXILA_TRACE_FULL_FOR` (the harness does not force it: `&real=1`), then `TAXILA_DB=test node scripts/trace.mjs --replay <pid> --at <hh:mm:ss.mmm>` | 2 `rrweb.chunk` rows stored at tier 2, both with a ref; 66 events read back; PNG vs screenshot **0 differing pixels, 0 tiles**. The blob transport is the one stub (no storage credentials in this container: PUT to a temp dir, read with `TAXILA_TRACE_BLOB_DIR`); **the Azure GET is not exercised** |
| **Flag this moment keeps its note open** (same run) | note field shown at once, focused, still open 800 ms later, closes on save; `flag.owner` and `flag.note` stored on TEST. Against the pre-fix Desk the same check fails (note never shown, the menu closed: the tapped item was detached before the outside-tap handler ran) |
| Masking, button keypad (`masking.json`, `keypad`) | a keypad in a `data-trace-mask` region, 4 digits tapped: every tap label `[masked]`, 0 digit labels, the region absent from the rrweb stream |
| Unit tests `tests/r12-t-client-trace.test.mjs` | 15/15 (adds: session resolution, chunks by ref / rebuilt beacon path / missing, time order) |
| Unit tests, release 12 as shipped | 12/12: masking by key and shape, batches under 256 KB, tier-2 refused at tier 1, rid only on `/api`, the app's own Response and rejection, faults fall back, tier from `/api/me` |

Harnesses:

- `tests/prod/r12-t-client-replay.mjs`
- `tests/prod/r12-t-client-budget.mjs`
- `tests/prod/r12-t-client-masking.mjs`
- `tests/prod/r12-t-client-smoke.mjs`
- `tests/prod/r12-t-client-replay-e2e.mjs` (TEST branch; `NODE_USE_ENV_PROXY=1`)

The dev harness is `src/trace/dev/lesson.html` (`?trace=off`, `&tier=2`, `&sabotage=1`, `&page=play`, `&real=1` for the
real trace endpoints behind the vite proxy). It is never a
build input.

## Not done / for the other streams

- **For T-server:** the `trace_flag` view reads `data->>'note'` from `flag.owner` rows, but the note is a separate
  `flag.note` event (same `pid` and `n`), so `--flags` prints an empty note. Join on `(pid, data->>'n')`, or say if the
  client should resend the note on the owner row instead.
- **Superseded (see the TEST row above):** the full end-to-end proof (brief rule 4: a scripted lesson on TEST against a packaged build, `scripts/trace.mjs
  --session` printing the merged timeline, `--replay` from stored blobs) needs T-server's `/api/trace/batch`,
  `/api/trace/blob`, the migration and `scripts/trace.mjs`. None of those are on this branch.
  - The proof here uses the dev server, with the trace endpoints answered by the harness.
  - `renderReplay()` is the piece `--replay` calls once the blobs are readable.
- **T-voice (4B)** wires its mic and TTS clips through `traceBlob()`, and its `mic.*`, `asr.*`, `tts.*` events through
  `emit()` from `src/trace/index.ts`.
- **T-server:**
  - `/api/me` should carry `trace: { tier }` (the client also accepts it on `/api/child/boot` and on every batch
    response);
  - the server should accept the `_rid` query parameter on EventSource requests (`/api/studio/stream`);
  - `/api/trace/blob` takes `seq` as `b<n>` for audio blobs (rrweb chunks use plain numbers).
- **rrweb** (2.1.7, MIT) and **rrweb-player** (2.1.7, dev, used only by tooling) are new dependencies. `package.json`
  sits in a `[patch-request]` commit, because the brief allows rrweb.
