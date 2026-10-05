# V4 face patches: apply notes

These change existing files, so they are patches rather than edits. Wave 2 was merging into the main tree while they were written. Each one was applied to a **scratch copy** of the tree taken on 2026-10-05 and verified there:

- `tsc` was clean apart from the pre-existing `studio-v2/engines/ext/kit.ts` errors, which are also in the main tree;
- `vite build` passed;
- the voice tests passed;
- the new tests passed.

Re-apply them on the merged tree with `git apply --3way`. If a hunk misses, the notes under each patch describe it well enough to place it by hand.

**Order:** 01 and 02 together (server and client of one feature), then 03 (the switch) with 06 (the picker), 04 (tests) and 05 (duplex, when the host is constructed). 03 alone already ships the puppet in the lesson tile. Without 01 and 02 she lip-syncs from the audio tap (the judged live path), and Diya's visemes are added once 01 and 02 land.

## 01 · Server: Diya's visemes, framed next to her audio
Files:
- `01-server-visemes/azureTtsWs.js` is a new file, copied as `server/voice/azureTtsWs.js`;
- `01-server-visemes/server.diff` changes `server/voice/speech.js`, `server/voice/expressive/pauses.js` and `server/routes/voice.js`.

What it does:
- **Synthesis.** DragonHD synthesis moves from REST to the Speech websocket. The websocket uses a pooled socket: at most 3 per region, idle sockets close after 45 s, and a newly opened socket is reserved straight away so two parts can never share one.
  - Part 0 of a reply asks for visemes only.
  - Later parts also ask for word boundaries.
  - The reason is measured (`evals/face-puppet/out/ttfb-warm.json`, n = 8, through the eval proxy, not the India lane). Against no metadata (median 433 ms), visemes alone cost +50 ms (483 ms) and visemes with words +378 ms (811 ms, bimodal 647-702 / 919-964 ms). These are true medians; an earlier version of this note quoted upper medians (+63, +486). Review v4.
- **Failure.** A websocket failure retries the same voice on REST before the breaker counts it, so there is no identity change. In that case the face falls back to the audio tap.
- **Cache.** The cache stores each part's marks next to its PCM (key `<key>:marks`), so a cache hit still carries visemes.
- **`edgeTrim`.** It gains `onLead(samples)`, the lead it removed. The route uses it to shift viseme offsets.
- **Route.** The route frames `{t:"visemes", part, atSample, leadMs, v:[[ms,id]], w?:[[ms,durMs,text]]}` after the part's clause frame, and again as more batches arrive. `atSample` is the clause anchor.

Flag: `TAXILA_DHD_VISEMES=0` restores today's REST path exactly.

Ops step: call `prewarmDhdWs()` from the lesson-start path, so that part 0 never pays the websocket handshake. This was not wired in the diff because `prewarm.js` is a hot file. Review v4 correction: `POST /api/lesson/start` already prewarms the teacher's opening (`server/routes/lesson.js` → `prewarm()` → `speakChunk`), and with 01 applied that synthesis goes over the websocket, so the socket opens at /start rather than on the child's first audio request. Whether that hides the 1.1-1.8 s handshake (measured through the eval proxy) depends on the gap between /start and the audio request, which is unmeasured. The pool then stays warm while the lesson runs (`KEEP_WARM_MS`, `evals/face-puppet/out/ws-warm-after.json`).

Verified:
- live end to end on the patched tree (`evals/face-puppet/server-e2e.mjs`): part 0 had 28 visemes and no words, part 1 had 43 visemes and 9 words, and the cache hit returned the same marks;
- `ws-module-test.mjs` covered pooled reuse (first audio 417-666 ms), two concurrent parts, abort, and recovery after an abort;
- `tests/voice-*.test.mjs` passed on the patched tree. One timing-sensitive barge-in case is flaky under machine load, and it is flaky on the main tree too.

## 02 · Client: the player times the visemes
File: `02-client-visemes.diff` changes `src/lesson/ttsStream.ts`. It uses `src/face-puppet/ttsBridge.ts`.

What it does:
- `ClauseSink` gains `visemes?()`.
- Viseme frames are routed on both paths:
  - tts-stream;
  - the turn-audio fold, where they are parked with the audio until a player takes it.
- The player emits each batch on its own clock. `playAt` is when the part's first synthesised sample sounds, including output latency, minus `leadMs`.
- On an underrun gap and on pause/resume, the player re-anchors: it cuts, then re-sends.
- `stop` closes the mouth.

Verified with `04-tests/face-puppet-player.test.mjs` (fake AudioContext, the same harness as `voice-player-clock.test.mjs`) and with `voice-player-clock` and `voice-expressive-client` unchanged and green.

## 03 · The puppet is the default face
File: `03-face-default.diff`.
- `src/ui/teacher/Teacher.tsx` imports `LessonFace as TutorFace`. This covers the live lesson's TeacherWindow, Summary, TroubleScreen and the namer.
- `src/ui-v3/V3Root.tsx` calls `installPuppetFace()`, which covers every v3 FaceSlot.

The flag is `face.puppet2d`, ON by default. To turn it off: `?puppet=0`, or localStorage `tx.flag.face.puppet2d=0`, or `VITE_FACE_PUPPET2D=0`.

Verified in the patched app with Playwright (`evals/face-puppet/app-check.mjs`, screenshots in `evals/face-puppet/out/app-*.png`):
- `/dev/desk?face=live&band=b2` showed the live puppet in the lesson tile, labelled "Asha, AI teacher";
- the plate form showed the poster;
- b3 (Arjun) kept TutorFace.

## 04 · Tests into `npm test`
Copy these three files from `04-tests/` into `tests/`:
- `face-puppet.test.mjs`, which needs only the new `src/face-puppet`;
- `face-puppet-player.test.mjs`, which needs 02;
- `face-puppet-server.test.mjs`, which needs 01.

On the patched tree they gave 12 pass, 0 fail. Review v4: `face-puppet.test.mjs` now has 11 tests (the fail-closed safety boot check and the word-timed retroflex gate were added); 11/11 pass on the main tree.

## 06 · The picker shows the face that teaches (Review v4)
File: `06-picker-face.diff` changes `src/avatar/picker/TutorPicker.tsx`.

Without it, a child who picks Asha picks her by a different face: the picker renders `TutorFace` (the 3D head or its 2D plate) and `Plate2D` tiles, while every surface that goes through `<Teacher>` (lesson, hello, home, namer, Meet) shows the style-C puppet after 03. With 06:
- the selected tile and the "chosen" stage use `LessonFace`, so Asha is the live puppet;
- an unselected Asha tile is the puppet's rest poster (`PuppetFace still`, no WebGL);
- every other tutor is unchanged.

Verified: `git apply --check` on the 2026-10-05 tree, and `tsc --noEmit` clean on an overlay with the patched file. Not verified in a browser.

## 05 · Duplex face cues (when the DuplexHost is constructed: V5's file)
Where the lesson builds `new DuplexHost({... emit })`, pass `emit: withPuppet(emit)` from `src/face-puppet/duplexBridge.ts`. Its effects:
- poses and content-blind nods reach the puppet;
- a voice `yield` closes her mouth.

Until then she still listens. The judged mic-level Listener nods at the child's phrase-final pauses, and the floor state drives the listening face and the thinking glance.
