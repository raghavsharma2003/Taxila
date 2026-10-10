# An audio continuer classifier for R3 · design note (stream 4B, 2026-10-10)

**The ask (main session):** design an on-device classifier that tells a continuer ("yeah", "हम्म", "अच्छा") from an
interruption by its sound, before the words arrive. Constraints:
- open Apache / MIT / BSD weights, run with `onnxruntime-web` (already shipped, 1.30.0, `src/voicesig/ort.ts`);
- no third-party API; any training compute on Azure;
- a child's stop, repair or safeguard must never be classified away. This must hold **by construction**, not by a
  threshold.

**Status: NOT STARTED.** The owner decided (via the main session, 2026-10-10): no new features; built work ships for the
owner to test live. This note is kept for a future decision. Earlier the same day: option A was approved, to be built
after stream 4B's integration lands. It
ships behind a flag, default off, and goes on only after the owner's hands-free test.

Merge preconditions:
- the adversarial test in §3;
- the on-device latency on the reference proxy;
- R3 before and after on TRAIN and TEST.

**Recorded ceiling:** 89 % on AMI TRAIN with a perfect classifier, so R3 ≥ 90 % stays unmet even then. Nothing is
built yet, and no child audio is collected or used. Children's speech is on the owner's
list with the five-second child test.

## 1. What it would fix (and what it cannot)

The remaining R3 failures are listed in RESULTS.md §15. On AMI TRAIN (n = 103), 19 continuers still stop or pause her.
- **Not reachable by a classifier: 8.** These are revokes after a commit. She is not talking, and the closed-loop rig
  takes them out of the count.
- **Reachable: 8.**
  - 6 sustained-voice pauses at 460-990 ms;
  - 1 hushed acoustic pause;
  - 1 rising "mm-hmm" read as a repair.

  In all of them the decision was made on **acoustics alone**, under G11's 1 s.
- **Words, not sound: 3.**
  - 2 STT mishearings ("sure" → "As much");
  - 1 echo leak.

  A sound classifier does not overrule words (§3), so these stay.

**Upper bound with a perfect classifier: 84 → 92 / 103 on TRAIN (89 %).** That is a ceiling, not a prediction.
R3 ≥ 90 % also needs the closed loop or better words.

## 2. Where it plugs in: no new seam

`src/duplex/adapter.ts` already has the seam:
- a stage-B ONNX model (`models/duplex/*.onnx`, ≤ 20 MB, or an Azure Storage URL);
- loaded through the injected `onnxruntime-web` session;
- outputs `p_backchannel` and an `overlap` head [1, 6].

The classifier ships as that model's overlap head, so no cascadeLink patch is needed. One new engine-side input:
`OverlapFeatures.acousticContinuer?: Prob | null`.

## 3. The safety property, by construction

The classifier's output reaches exactly **one** branch: the acoustics-only yield in `classifyOverlap` (step 4: the
sustain, waitForSustain, the rising-burst repair read). When it reads "continuer", the only effect allowed is:

> **stay hushed and wait** (her voice already at ≈ −26 dB, i.e. inaudible under the child) instead of pausing / stopping.

It is never passed to, and so cannot change, any of the following:

| path | why the child is still served |
|---|---|
| the hush (reflex duck at onset, hush at 120 ms) | runs before and regardless of the classifier: she goes quiet for **every** child burst within ~150 ms |
| words: stop ("ruko", "wait"), repair ("kya?", a "?"), answer, turn (`overlapKind`, step 3) | step 3 runs **before** step 4 and returns; once any word exists the classifier is not read |
| the partial-safety predicate and the safeguard (G1 / G2) | reads every word whoever speaks; the governor's safety gates sit above the overlap read (frozen `safety.js`, untouched) |
| G11's forced yield at 1 s of non-echo child voice | stays in the governor, outside the overlap read |
| `endedShortWaitsForWords`: a short ended burst waits, hushed, for its words | unchanged; the classifier never un-hushes |
| her own yes/no question (`herAskedYesNo`: a "haan" there is the answer, taken at once) | the classifier is not read while her question is open |

So the worst case of a wrong "continuer" on a real "ruko" is this:
1. She is hushed within ~150 ms, as today.
2. She is not paused until the word "ruko" arrives (0.3-2 s, or ~0.3-0.6 s with the overlap probe), or until 1 s of
   voice (G11).
3. Then she stops for the stop request.

Her voice is inaudible the whole time. A wrong "continuer" can only **delay a pause that has no words behind it yet**; it
can never cancel a stop, a repair or a safeguard.

**The test that proves it, not a threshold:** an adversarial run with the classifier forced to `p_continuer = 1.0` on
every frame, against every stop / repair / safeguard fixture:
- `tests/round3-duplex-*`, ship5 B3/B4, the TaxilaFDB stop and safety lanes, the P1_SAFETY seam;
- the time to the hush, the time to the stop on the words, and the safeguard timing must be **identical** to the
  classifier-off run.

It ships as a unit test next to the classifier wiring, and the wiring cannot merge without it.

## 4. The model

| option | weights | size | notes |
|---|---|---|---|
| **A. a small CRNN from scratch (recommended first)** | ours | ~0.2-0.5 M params, < 1 MB int8 | 64 log-mel at 10 ms + the f0 / level features `ChildAudioTracker` already computes; a 400 ms window (100 ms before the onset) |
| B. a head on the Smart Turn v3 encoder | BSD-2 (Pipecat; Whisper-Tiny base, MIT) | ~8 MB | an audio-native turn model with Hindi in its training data [V in `docs/research/world-best/voice-ux-smoothness.md`]; heavier, but a strong start if A plateaus |
| ~~VAP backchannel head~~ | pretrained VAP weights are **academic-only** [V, same file] | – | excluded; retraining VAP from scratch would be option A with more steps |

- **Output:** 3 classes per window:
  - continuer;
  - speech that is not a continuer;
  - not the child's speech (noise / echo).

  Only "continuer" is ever read, and only as above.
- **Latency budget:**
  - the read is needed between `decideMs` 150 ms and the 450-600 ms sustain;
  - inference every 40 ms, only while a burst overlaps her;
  - ≤ 10 ms per inference on the low-end reference phone (wasm, single thread). This is a budget to verify on that
    phone (O-R4), not a measurement.
  - It runs off the hot path, as the adapter already does: a stale read (> `FALLBACK.staleMs`) is ignored, so stage A
    decides alone.
- **Added decision latency: 0.** The hush covers the wait.

## 5. Data

| set | licence | use |
|---|---|---|
| AMI meetings **other than** the 4 evaluation meetings (ES2004b, ES2005b, IS1004b, IS1008b stay held out) | CC BY 4.0 | train. Continuers labelled by the same listening-token rule the scorer uses (`LISTEN`); negatives are every other overlapping spurt |
| Smart Turn data v3.2 | CC BY 4.0 [V, same file] | extra non-continuer speech, including Hindi |
| Hindi / Hinglish continuers ("हम्म", "हाँ जी", "अच्छा") | no open, labelled, commercially usable set found [U] | the gap: adult Hindi continuers are needed before any Hindi claim |
| TaxilaFDB (our TTS lanes) | ours | smoke tests only, never training (it would learn our TTS) |
| **children's speech** | **owner decision pending; none collected or used** | the only data that can show R3 for children |

**Compute:**
- training option A is CPU-sized: an Azure Container Apps job;
- option B fine-tuning needs a few GPU-hours on an Azure GPU VM (an ESTIMATE; check the pricing calculator);
- export to ONNX is a build step;
- no new `package.json` dependency.

## 6. How it would be judged

1. **AMI open-loop and the closed-loop rig, TRAIN then TEST:**
   - R3 must rise;
   - R4, R5, R6 and the pause cut-offs must not get worse;
   - per-barge-in check: no real barge-in loses its hush or its stop (`evals/duplex-r4/ami-artefact.mjs`).
2. **The adversarial safety test above:** identical stop / repair / safeguard timing.
3. **Only then, and only if the owner allows children's speech:** a children's continuer / stop set, consented and
   stored under the owner's rules.

**Cost (ESTIMATE):**
- option A: 3-5 build days, about zero Azure spend;
- option B: +2-3 days and tens of US$ of GPU.

It cannot claim R3 for children until §5's last row exists.
