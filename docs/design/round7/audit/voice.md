# Voice audit, 2026-11-09

Branch `claude/r7-audit-voice`, from `int/r6` at integration 21a. Scope: BRIEF.md section 6.

## What a child gets today

- **The product is one path.** The child app starts every spoken lesson as "cascade" (`src/child/lesson/useDesk.ts:637-638`): her speech goes to an Azure transcription session, the transcript goes to `POST /api/lesson/turn-audio`, the server writes the reply and streams Azure speech back on the same response. The hands-free engine (`src/duplex/**`) sits on top and is on by default (`src/duplex/flags.ts`). The ear is lane D5 (Azure Voice Live through our server) when Voice Live is configured, else lane D4 (browser to Azure, half-duplex).
- **The realtime lane is left over.** Only the dev page can start it, and production builds drop that page (`src/app/routes.tsx:27-29`). Its code still ships in the bundle (V-36).
- **No non-Azure paid call is on any shipped path.** The only non-Azure code is three hand-run AWS scripts from finished bake-offs (V-38).

Forty findings. The skeptic refuted none; it narrowed fourteen, and those are written here in their narrower form. Whether production has Voice Live configured could not be checked from here, so "D5 only" findings are conditional on that.

## Findings

Status: **fixed** = fixed on this branch with a test that fails before the fix and passes after (test files are named under "Fix status"); **open** = confirmed, mine to fix under the phase 2 rule, not fixed yet (see "Fix status"); **main** = waits for main's reply (a deletion, a redesign, a decision in project memory, or a file outside the area).

| id | sev | kind | owner | title | where | fix | status |
|---|---|---|---|---|---|---|---|
| V-01 | P0 | broken | voice | Streamed reply never ends when speech synthesis fails with clauses queued | `server/latency/speech-stream.js:108,138-140` | abort on a thrown error so the parked producer is released | **fixed** |
| V-02 | P0 | broken | voice | Her voice stalls mid-line and the lesson stays on "speaking" for good | `src/lesson/ttsStream.ts:706-711` | a stall timer in the player: audio ran out and no bytes for a few seconds ends the line | **fixed** |
| V-04 | P0 | broken | voice | A tap that silences her (pause, hear again) is never told to the hands-free engine; on D4 the mic stays shut | `src/lesson/cascadeLink.ts:1196-1208, 611-613, 719-722` | `stopReply` tells the engine she stopped | **fixed** |
| V-05 | P0 | broken | voice | After a self-correction her reply to the corrected answer is thrown away | `src/duplex/cascadeDuplex.ts:216`, `cascadeLink.ts:566-571` | clear the drop when the merged turn is committed | **fixed** |
| V-06 | P0 | broken | voice | When her reply never sounds, the same answer is sent again about 18 s later | `src/duplex/governor.ts:576`, `live.ts:848` | start a fresh turn at the 6 s expiry | **fixed** |
| V-07 | P0 | broken | voice | Hands-free stays "live" but deaf when mic frames stop or carry no pitch; no fallback to the talk button | `src/duplex/cascadeDuplex.ts:266-269`, `audio.ts:229-233`, `governor.ts:370-372` | a running no-frames check that steps aside; a transcript with no device onset seeds the onset | **fixed** |
| V-03 | P1 | broken | voice | The transcription call can hang while it connects; the dock says "getting ready" with no talk button and no time limit | `src/lesson/cascadeLink.ts:1252,1314`, `src/lesson/handsFree.ts:39` | time-limit the token and connection requests | **fixed** |
| V-13 | P1 | broken | voice | Every teacher line in the child app loses lip-sync and board timing | `src/lesson/uiBridge.ts:322-324` | pass the third argument through | **fixed** |
| V-10 | P1 | broken | voice | An answer given 7-13 s after her question, equal to the previous answer, is silently dropped | `src/duplex/live.ts:923,960,999` | forget the last commit once its reply has played | **fixed** |
| V-12 | P1 | broken | voice | The D5 ear refuses a paired child device (403), so it falls back to D4 | `server/serve.mjs:162-166`, `server/duplex/d5route.js:81` | mark the upgrade request child-scoped in `handleD5Upgrade` | **fixed** |
| V-08 | P1 | broken | voice | "kya?" over her line stops her and nothing follows (D5 and full duplex) | `src/duplex/host.ts:616`, `audio.ts:74-76`, `governor.ts:365,511` | keep the carried onset; `sil ?? t - phaseSince` | **fixed** |
| V-09 | P1 | broken | voice | Any child sound during her reply to a number answer cuts the reply (D5 and full duplex) | `src/duplex/governor.ts:160-161,221` | send the verdict event when her reply starts | **fixed** |
| V-11 | P1 | broken | voice | Her own echo ducks her voice on D5: the "not her pitch" guard is disconnected | `src/duplex/cascadeDuplex.ts:233-236` | forward the fifth argument | **fixed** |
| V-17 | P1 | broken | voice | Maths read aloud wrong: "75000-25000" as a phone number, "by 1250" as a year, "9.30 baje" as a decimal, dates as slashes, bare `=` `+` `/` and `πr²` left as symbols | `server/voice/spoken.js:162,342,348,538,552`, `spoken-lexicon.js:208` | narrow the phone pattern and year cues; add date, dot-time, π and spaced-operator rules | **fixed** |
| V-14 | P1 | broken | voice | Typed lessons: pause does not hold her voice and resume has nothing to replay | `src/lesson/uiBridge.ts:176`, `textLink.ts:53,103` | give the TextLink the bridge's stream | **fixed** |
| V-26 | P1 | broken | voice | The DragonHD path deletes bracketed maths and starred words from her line | `server/voice/expressive/compile/dhd.js:35` | strip only letters-only brackets; unwrap stars | **fixed** |
| V-20 | P1 | not good enough | voice | Every streamed reply also synthesises itself a second time (wasted Azure speech), outside the speech rate limit | `server/routes/voice.js:414-417`, `server/voice/prewarm.js:54` | drop the prewarm when the reply was streamed; count the stream in the limiter | **fixed** |
| V-22 | P1 | inconsistent | voice | The thinking-pause cue is live in hands-free although the decision says shadow until a children's pilot | `src/duplex/liveTap.ts:50-54`; `context/decisions.md:5481`; `context/rejected.md:2348` | unsubscribe the cue from the live engine until the pilot | **fixed** |
| V-15 | P2 | broken | voice | "Fix" or "Try again" can act on an older lesson's held answer | `src/lesson/outbox.ts:342,350,363` | filter by lesson id | **fixed** |
| V-16 | P2 | broken | voice | A fix that lands just as the server answers is reported as sent, sends nothing and leaves a ghost answer | `src/lesson/outbox.ts:405-409` | remove the record from `active` as soon as the send resolves | **fixed** |
| V-19 | P2 | broken | voice | Hands-free turns post the same prefetch text more than once (duplicate classify and speculative replies) | `src/latency/prefetch.ts:89,104`, `duplexTurn.ts:51` | keep the same-text guard across item ids | open |
| V-18 | P2 | broken | voice | The device voice detector can latch "speaking" for the rest of the lesson | `src/lesson/vad.ts:50` | ignore all-zero frames in the floor; a ceiling on one "speaking" run | open |
| V-23 | P2 | broken | voice | Voice-signal numbers include up to 800 ms before the child spoke | `src/voicesig/lessonFeatures.ts:145-146` | window from the measured start | open |
| V-24 | P2 | broken | voice | A short "haan" with a steep pitch slope gets all its voice features rejected | `server/voice/features.js:31` | same range for both slopes | **fixed** |
| V-25 | P2 | inconsistent | voice | A turn that fails after her first clause reaches the client as 502, not its real status | `server/routes/voice.js:407-411`, `src/lesson/ttsStream.ts:447,461` | carry the status in the end frame and reject with it | open |
| V-21 | P2 | inconsistent | voice | Four comments say voice signals are shadow; they act by default (owner decision of 2026-10-27) on placeholder calibration | `server/voicesig/gate.js:3`, `adapter.js:1-4,41`, `server/brain/turn.js:546-547` | correct the comments in the voice files; `turn.js` comment by patch to brain | open |
| V-27 | P2 | inconsistent | main | Project memory disagrees with itself: expressive SSML is default on for DragonHD, and a rejection entry records listeners preferring plain | `server/voice/voices.js:77-82`; `context/decisions.md:3362`; `context/rejected.md:1422` | owner call: run the pending blind test or default it off | main |
| V-29 | P2 | inconsistent | voice | The voice switch and Roman-to-Devanagari step are recorded as wired; nothing calls them. "sabse bara" would become "सबसे बारह" | `server/voice/voice-switch.js:56,65`, `translit/numbers.js:27`; `context/decisions.md:5083` | wire it or correct the record; remove `bara` from twelve either way | main |
| V-33 | P2 | broken | voice | The headset check matches the phone's own earpiece and any Bluetooth speaker | `src/child/lesson/headset.ts:11` | drop `earpiece` and bare `bluetooth` | open |
| V-34 | P2 | not good enough | voice | The Opus decoder is flushed after every packet; a stale flush can fail the next decoder | `src/lesson/opus.ts:90-106` | guard the stale catch now; the flush change needs a listening check | main |
| V-40 | P2 | inconsistent | voice | The live child-text pipeline has no listener, and the emit runs before the request is authorised | `server/duplex/childText.js`, `server/routes/voice.js:398`, `server/routes/lesson.js:902` | emit after `lessonTurn` returns | main |
| V-30 | P3 | inconsistent | voice | "Hear" says the child's name differently from the streamed voice | `server/routes/tts.js:66,85` | pass `sayName` | open |
| V-28 | P3 | inconsistent | voice | The uptake prelude keeps the lowered pitch its comment says it removes (flag off) | `server/voice/expressive/render.js:94` | strip any pitch value | **fixed** |
| V-31 | P3 | broken | voice | The prelude warm reads a field the request never has (flag off) | `server/routes/voice.js:562,566` | read `childText` | open |
| V-32 | P3 | inconsistent | voice | Shadow telemetry's reason and safety counts can never match | `src/duplex/shadowTelemetry.ts:126,134` | compare the reason part of `detail` | **fixed** |
| V-35 | P3 | inconsistent | voice | A device forced to shadow runs live when the server answer is unknown; stale header | `src/duplex/flags.ts:147-148,177-182` | check the device key first; reset the partial-post flag | **fixed** |
| V-36 | P3 | no longer needed | voice | The realtime lane is dev-only but ships, and the runtime defaults to it | `src/lesson/runtime.ts:32-36,181,309` | owner decision already asked for in `gap-map.json:792`; dependency list below | main |
| V-37 | P3 | no longer needed | voice | Fourteen `server/duplex` modules have no live importer | `server/duplex/routes.js:1` and list below | delete with their five tests and three evals | main |
| V-38 | P3 | no longer needed | voice | Three hand-run AWS scripts from finished bake-offs | `scripts/voice/v3`, `scripts/voice/stt-v3`, `scripts/voicesig/aws-check.py` | delete (about 1.1 MB, mostly lockfiles) | main |
| V-39 | P3 | no longer needed | voice | Dead client and server code in the area | list below | delete | main |

Counts: P0 6, P1 12, P2 12, P3 10. Broken 25, inconsistent 9, not good enough 2, no longer needed 4.

## Fix status (2026-11-10)

Fixed, 24: V-01, V-02, V-03, V-04, V-05, V-06, V-07, V-08, V-09, V-10, V-11, V-12, V-13, V-14, V-15, V-16, V-17, V-20, V-22, V-24, V-26, V-28, V-32, V-35. Each has a test that fails before the fix and passes after.

Two sessions worked on this branch at the same time. A second session pushed `01c8e667` (V-01, V-02, V-04, V-05, V-06, V-07) and `4eb38f2b` (V-03, V-08 to V-14, V-17, V-20, V-22, V-26); its tests are in `tests/r7-audit-voice-client.test.mjs`, `r7-audit-voice-server.test.mjs`, `p1-duplex-link` and `ship5-fix-duplex-revoke`. This session fixed V-15, V-16, V-24, V-28, V-32, V-35 (`tests/audit-voice-small.test.mjs`) and had its own versions of V-01 to V-04 and V-11 to V-14; where both existed the pushed version is kept, except V-04.

- V-04: telling the engine "stopped" is not enough. The governor ignores it and keeps her turn, so the mic gate opens but the child's next answer is never committed. A stop by hand now reports her line as ended. `tests/audit-voice-small.test.mjs` runs both on the real engine under a fake clock: "ended" commits the answer, "stopped" commits nothing in 6 s. The pushed link test was changed to assert "ended".
- V-22 was listed for main's reply; the second session unsubscribed the cue, which matches the recorded decision.
- V-32 fixes the reason code only. The safety count compares against codes the engine never emits.
- New numbers: a 5 s stall limit on a reply's stream (V-02), and a 10 s limit on each of the transcription call's two requests (V-03).

Open, 8, in the voice area:

- V-18 (device voice detector latch) and V-25 (real status on a failed streamed turn).
- V-23, V-30, V-31: one-line changes described in their rows; no test yet.
- V-19: under the engine the link's own prefetch calls may not run at all, so the proposed fix could stop prefetch for the rest of a lesson. It needs a trace of one hands-free turn first.
- V-33: the earpiece label was never checked on a phone; it should be before the pattern changes.
- V-21: comments only.

Waiting for main, 8: V-27, V-29, V-34, V-36, V-37, V-38, V-39, V-40.

## Evidence notes

Repro scripts were run from the repo root against the real modules with fake clocks and fake audio; none is committed. Each fix lands with a test that fails before it.

**V-01.** The producer waits at `:108` when more than `lookahead` clauses are queued. If a speech job then throws from `j.read()` (`:129`), the `finally` aborts only `if (stopped || o.signal?.aborted)` and otherwise awaits the producer, which nothing wakes. Run: 2 and 3 clauses reject with the speech error; 5 clauses never settle and `/api/lesson/turn-audio` never calls `res.end()`. It needs every speech fallback to fail, and a client disconnect releases it. On the agent path the turn frame itself is never written.

**V-02.** A stream that delivers 0.25 s of audio and then nothing (no bytes, no close, no error): six seconds later `ended` is unresolved and `player.playing` is true. `CascadeLink.current` stays `playing`, `teacher_audio_end` never fires, and the runtime's 15 s watchdog only covers "thinking". V-01 is one way to get such a stream; a stalled mobile connection is another. A tap still stops her.

**V-03.** `await this.fetchToken()` and `await fetch(…/realtime/calls)` carry no signal and `postJson` has no timeout. The 10 s timer at `:1267` only rejects `opened`, which is awaited after both. While `open()` is pending the bridge keeps `duplexExpected` true and the dock shows "starting": no talk button, mic held (decision `dc-r7-voice-first-line-held-mic`). In `lost()` the same hang leaves `reconnecting` true, so later drops do nothing.

**V-04.** `stopReply` sets `current = null`, then stops playback; the `ended` handler returns on `this.current !== cur`, so `finishReply` (the only caller of `duplex.replyStopped()`) never runs. The engine's own stop compensates by hand (`cascadeDuplex.ts:210-213`); the tap path does not. Run on half-duplex D4: phase `her_turn` for 30 s, mic gated, two answers dropped as echo, 0 commits. It heals when her next line starts, so a typed or tapped answer recovers; pause-then-continue and hear-again replay outside the link and do not.

**V-05.** A revoke arms an 8 s drop (`dropUntil`). The merged turn goes out through `outbox.edit` under the same turn number, the server supersedes the first attempt and answers once, and `promptTeacher` drops that one answer. Run: commit at 5.66 s, revoke at 6.82 s, merged commit at 8.06 s, reply at 11.7 s dropped. Applies when the edit supersedes a turn still in flight.

**V-06.** At `COMMITTED_MAX_MS` the phase returns to `child_turn` without `beginTurn`, so the committed words are still the transcript; after the 15 s in-flight guard the engine commits them again with no `revokeOf`, and the runtime posts a second turn. Run on half-duplex: "बारह" committed again 18.6 s later. Triggers: a text-only reply, speech failing before its first sample, a held post, or V-05's drop.

**V-07.** The no-frames check runs once, 3 s after start. Later, with frames stopped (context suspended, worklet dead) or an answer with no pitched frame (a whisper), `silenceRunMs()` stays null, the governor vetoes every commit, and the engine still consumes the transcripts. Run on D4 half-duplex and the D5 gate: 0 commits in 30 s, `live` true, no fallback.

**V-08.** A yield that lands after the child's short burst ended calls `audio.beginTurn`, which clears the onset; `sil` is then null and the two `sil ?? 0` sites veto the hold offer. Run: "क्या?" over an explanation stops her, then 30 s of nothing at every Voice Live delay tried. "रुको" recovers at the longer delays.

**V-09.** `verdictPlayed` is set only by a `her_verdict` event that nothing in `src/` sends (two eval simulators do). Run on full duplex: a "हाँ" four seconds into her reply to "बारह" revokes and cuts the reply 20 ms after onset.

**V-10.** The 7 s nudge moves the governor to `committed` although the bridge drops the nudge. The next onset revokes against `lastCommit`, which is never cleared. `freshWords("हाँ", "हाँ")` is empty and nothing is in flight to edit, so the turn is never posted. Run on half-duplex D4.

**V-11.** The wrapper `(t, rms, f0, herOutDb) => …` drops `herF0`, which `liveTap.ts:47` passes. Run with the echo-only frames from `tests/r5-duplex.test.mjs:138`: one pre-duck through `CascadeDuplex` (her gain at 0.05 for 900 ms), none when fed straight to `DuplexLive` as the test does.

**V-12.** The upgrade bypasses the router, which is the only place that sets the child-scope mark; `requireGuardian` then answers 403 "this device is paired to a child". Only the same-origin socket and only a device with no parent session; the relay route with a ticket is not affected.

**V-13.** `cachingStream = async (req, signal)` calls `fetchSpeechStream(req, signal)`. Without the sink, clause onsets are emitted at parse time with no `playAt` and viseme batches are dropped. Run: direct call, sink gets 1 clause and 1 viseme batch; through the bridge, 0 and 0. The dev pages build the link without the bridge, which is why it looks fine there. `context/rejected.md:1951` records the behaviour this brings back.

**V-14.** The bridge's `TextLink` gets `speech` but no `stream`, and `textLink.ts:103` prefers the default stream. `waitHold` and the replay buffer are both skipped. "Hear the question" still works through `runtime.replayReply`.

**V-15, V-16.** `kick`, `edit` and `inFlight` take the last active record whatever its lesson; `flushOthers` resends older lessons' answers in the background. Run: the fix text is written into lesson A's held answer and sent there, never to lesson B. Needs the other lesson's resend to become active after the live turn. V-16: the record stays in `active` across two awaits after the send resolves; the natural window is a few milliseconds.

**V-17.** Run, exact strings handed to speech: `"75000-25000 = 50000"` → `"seven five zero zero zero two five zero zero zero = fifty thousand"`; `"60000 40000 se bada hai"` → ten single digits; `"Divide 5000 by 1250"` → `"…by twelve fifty"`; `"9.30 baje"` → `"Nine point three zero baje"`; `"15/08/1947"` → `"Fifteen/zero eight/one thousand nine hundred forty-seven"`; `"112 pe call karo"` → `"One hundred twelve pe call karo"`; `"5 + 3 = ?"` → `"Five plus three = ?"`; `"A = πr²"` unchanged. The first six are wrong words. The last two leave symbols for the voice to read; how DragonHD says a bare `=` was not measured. The helpline list and the safety files are not touched by the fix.

**V-18.** The floor updates only while not speaking. Run: mic held (zeros) 3 s then a room at −48 dBFS gives an onset and never an offset. With the engine deciding, the link's own duck and pause are bypassed anyway; what is lost is the prefetch's "quiet" edge.

**V-19.** The engine passes item id `"duplex"`, the link passes the transcription item id; each change resets the same-text guard. Six identical posts is the ceiling; one duplicate per turn is the likely case. Each runs classify and speculative replies on the server.

**V-20.** `brain/turn.js:1312` prewarms every cascade reply (two speech jobs start at once). When the reply was streamed, `voice.js:414` returns before the only `prewarmTake`. Run: the entry is still held after the response ended, 2 jobs started, not aborted. Clause streaming and the fold are both defaults, so this is the normal turn. The streamed path never calls `allowSpeech`.

**V-21.** `server/voicesig/lesson.js:44-53` records the owner's decision that the default is "internal" (acts). The comments elsewhere still say shadow. The knowledge prior is a placeholder (`rules.js:16-19`) and every evidence row is "simulated". Run: a first spoken turn "umm shayad paanch", graded correct, returns `followUpProbe`.

**V-22.** `lessonFeatures.ts:109,122` → `holdBus` → `liveTap.ts:52-53` → `live.ts:653-656` → the governor's silence backstop. It went live when hands-free became every child's default. The recorded trial prevented 0 of 12 cut-offs and delayed one turn by 2.0 s.

**V-23, V-24.** `u.at` is already the measured start; subtracting the pre-roll again reaches past the tracker's own bounds. Run: tracker 600 ms, voice-signal numbers 1,400 ms for the same turn, when flagged frames sit in the 800 ms before it. V-24: slope 122.4 on a 120 ms "haan" throws `feature out of range: f0SlopeStPerS`; the turn itself is unaffected.

**V-25.** The examples that matter are commit failures after the first clause; 401 and "lesson ended" are thrown before any clause.

**V-26.** Run: `"Set [1, 2, 3] dekho"` → `"Set dekho"`; `"Yeh *zaroori* hai"` → `"Yeh hai"`. Live replies are bracket-guarded upstream; openings and kit narration are not. The fallback voice does not strip, so the two engines say different words.

**V-33.** Run: `"Headset earpiece"` and `"JBL Flip 5 (Bluetooth)"` both read as a headset. It only decides the dock for an older child who chose open mic, while the engine is not live. The earpiece label is from knowledge of Chrome on Android, not checked on a device.

**V-34.** Read only (needs WebCodecs). Decoded quality was never measured; `tests/r7-voice-opus.test.mjs` uses an identity codec.

## Dependency lists for the deletions

**V-36, realtime lane.** Would go: `src/lesson/voiceLink.ts`, `realtime.ts`, `ledger.ts`, `voiceFlags.ts`; in `runtime.ts` the lane switch, rate-limit and reply-filter code; `POST /api/realtime/token` and `POST /api/lesson/lane`; `server/voice/realtimeSession.js`; `server/voice/expressive/compile/realtime.js`; the realtime panel in `LessonDev.tsx`. Still depends on it: `tests/client-runtime.test.mjs`, `w2d-voice-lanes.test.mjs`, `safety-r4-realtime-filter.test.mjs`, `pair-scope.test.mjs`, `round3-integration.test.mjs`, `w2-seams.test.mjs`, two files in `tests/prod/`, `tests/client-e2e.mjs`; about 29 tests that start a lesson as "voice" through fake links; `scripts/live-probes.mjs`, `scripts/check-prompt-budget.mjs`; five realtime evals; `server/pair/scope.js`, `server/brain/turn.js`; and `context/` entries (lane switch, `gpt-realtime` measurements, `meera-realtime-azure`, `rj-realtime-default-at-current-quota`).

**V-37, server duplex.** No live importer: `index.js`, `routes.js`, `slice.js`, `registry.js`, `floorManager.js`, `eot.js`, `backchannel.js`, `ear.js`, `bargein.js`, `speculator.js`, `drafts.js`, `buildIntent.js`, `triage.js`, `launch.js`, `semantic.js`. `registry.sliceFor` is always null, so `server/brain/turn.js:541` does nothing. Importers to remove with them: `tests/duplex-runtime.test.mjs`, `duplex-engine-model.test.mjs`, `r5-overflow.test.mjs`, the stagecraft tests that import `buildIntent`/`triage`, and `evals/duplex/{harness,live-validate,live-analyze,tick-sim}.mjs`, `evals/duplex/taxilafdb/*`, `evals/duplex-real/eot-sem.mjs`. Live and staying: `voicelive.js`, `d5route.js`, `config.js`, `fanin.js`, `echo.js`, `partialSafety.js`, `understand.js`, `phrases.js`, `childText.js`, `shadowLog.js`.

**V-38, AWS scripts.** Nothing in `package.json`, `infra/`, `.github/`, `tests/` or `server/` runs them. `aws-check.py` reads `AWS_*` keys from `.env.local` and calls STS, EC2, Pricing, Budgets and Cost Explorer (billed per request). The bake-off results are already stored under `evals/stt-v3/results/` and `docs/research/voice/v3/renders/`, whose manifests name the scripts as provenance text only.

**V-39, dead code.** `src/duplex`: `TrainedEngine`, `loadOnnxFloorModel` (`live.ts:475` hard-codes `trained: false, cutIn: false`), unused exports in `config.ts`, `governor.ts`, `host.ts`. `src/voicesig/frontend/encoder.ts` (never constructed). `src/lesson/latency.ts` `AckRationer`, `ackBank` (one test). `turnModel.ts` `loadSmartTurn`. The floor's `yielding` state (only a test feeds it). `server/voice/expressive/compile/mai.js`, `omni.js` (one test). `scripts/duplex/*` (train a model nothing loads). `GET /api/voice/trends` and `GET /api/voicesig/status` have no client. Not dead, corrected by the skeptic: `heuristicScorer`, the `uma` voice row (a parked tutor), `POST /api/voice/features` (client code exists, nothing enables it).

## Proposed `context/` entries

In `context/inbox/r7-audit-voice.json` with the fixes: the V-04 mechanism (an engine told "she started" must be told "she stopped" on every path), the V-13 regression of `w2gfix-clause-events-on-player-clock`, and the V-22 and V-27 conflicts for main to settle.

## Coverage

- **Read fully:** `src/lesson/**` except `safetyStrings.ts` (frozen); `src/duplex/**` except `turnPolicy.ts`, `form.ts`, `numerals.ts`; `src/voicesig/**`; `src/latency/**`; `src/voice/**` except most of `trace.ts`; `src/child/lesson/headset.ts`; `src/pages/LessonDev.tsx`; `server/routes/voice.js`, `tts.js`; `server/latency/**` except the last 50 lines of `ack.js`; `server/voicesig/**`; `server/voice/**` except the files below; in `server/duplex`, the live modules.
- **Sampled:** `server/voice/features.js` (first 121 lines), `translit/lexicon*.js` and `rules.js` (exercised through `toDevanagari`), `spoken.js` by about 330 inputs across five language cells.
- **Imports and timers only:** the fourteen non-live `server/duplex` modules (V-37).
- **Headers only:** `scripts/duplex/*`, `scripts/voice/**`; lockfiles identified, not read.
- **Not checked:** the deployed app's environment (whether Voice Live, `TAXILA_VOICESIG` or any voice flag is set in production); anything on a real phone; how the Azure voices read a bare `=` or `/`.
