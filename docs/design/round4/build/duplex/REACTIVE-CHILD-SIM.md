# A reactive child simulator · one-page note (stream 4B, 2026-10-10; not built)

**Why.** Every overlap number we have comes from a "child" who cannot react to her.
- **AMI (§6, §16):** both sides are recorded. With her side closed (`evals/duplex-r4/ami-closed.mjs`), 2 of 3 of her
  lines are skipped and the sample starves.
- **TaxilaFDB (§8):** her side is already closed. `world.mjs` stops her when the runtime yields and plays her reply at a
  composed first-audio time. But the child is a pre-mixed stream: a cut-off never stops the child, and a continuer never
  moves when she pauses.

A child that reacts is the missing half, short of real children (owner decision) or the owner's own hands-free test.

**What it is.** The TaxilaFDB world with the child turned from a fixed stream into a **policy over pre-rendered phrase
clips**, mixed at run time.

1. **Clips, rendered once.**
   - Each scenario's child utterances are cut at their scripted pauses into phrase clips.
   - They are rendered with the existing `render.mjs` path: Azure Speech, centralindia, the same child-like hi-IN
     voices. That is Azure-only, with no new dependency.
   - Extra clips cover reactions: a repeated stop ("ruko!", "ma'am ruko"), a restart ("haan to main keh raha tha…"), a
     louder repeat, and a give-up silence.
2. **A child policy, run every 20 ms on what she is actually doing.** It sees her playback state, her word times and her
   ducked level.
   - **Barge-in.** If she stops or hushes within T, the child continues with the rest. If she keeps talking, the child
     repeats louder after R ms, or gives up after G ms. Giving up is a lost turn: a cost, scored.
   - **Continuer.** It is placed at her **actual** next clause boundary. If she has paused or hushed, it moves or is
     dropped. If she yields on it, the child stays silent (a real child says nothing more).
   - **Cut-off in a thinking pause.** The child either carries on over her reply (the engine must revoke) or stops
     (the turn is lost). Both branches run, with a set mix.
   - **Answer latency** to her question comes from a distribution, and so do sibling / TV overlays as today.
3. **Online mixer.** Mic = child clip + her echo residue from her ACTUAL output (the existing echo path) + overlays +
   noise. Per-frame RMS and YIN come from the same `src/voice/dsp.ts` that `mix.mjs` uses, computed per frame instead
   of per stream. The STT is the existing reactive `SttSim` over what is in the mic.
4. **Scoring on events as they really happened.** R3-R6 are counted over her actual sounding time, as in
   `ami-closed.mjs`. Added:
   - turns lost after a cut-off;
   - repeats a child needed before she stopped;
   - time to the child getting the floor.

**How to know it is honest.**
- **Frozen mode** (policy off, clips laid at their scripted times) must reproduce today's TaxilaFDB numbers exactly, the
  same check `ami-closed.mjs --open` passed.
- **The behaviour parameters (T, R, G, the mixes) are INVENTED.** No child data exists here. Every result is reported
  across a bracket (patient / impatient / gives-up-fast child), with the worst case quoted. It tests robustness, not
  child truth.
- Known limits:
  - TTS fillers and child-likeness are already rejected as evidence of child prosody
    (rj-sig-tts-fillers-validate-a7).
  - Adults' AMI timing does not transfer.
  - **Nothing from this simulator can claim a criterion for children.** That still needs Gate S and the owner's test.

**Ownership.** It would be built as new files under `evals/duplex-r4/reactive/`, importing the world's pieces. Any
change inside `evals/duplex/taxilafdb/` (world.mjs, mix.mjs) goes to the main session as a patch request.

**Cost (ESTIMATE; check before spending).**
- Rendering the extra reaction clips is the same order as one TaxilaFDB re-render: Azure Speech, small spend.
- Build: 4-6 days.
  - child policy: 1-2;
  - online mixer and features: 1-2;
  - event scoring: 1;
  - frozen-mode validation and the bracket report: 1.
- No child audio, no new package.

**What it would decide.** Whether the R3 / R4 gap left after the open-loop artefacts is real when the child reacts, and
what each engine change costs a child in lost turns. It is the rig for the continuer classifier's closed-loop check
(CONTINUER-CLASSIFIER.md §6).
