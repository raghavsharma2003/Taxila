# X3: a target-speaker gate for duplex · decision note for the owner (stream 4B, 2026-10-10)

**The ask:** fund X3, the only path found to duplex criteria R5 (false yields to other voices) and R6 (self-yields on
her own bleed). **It needs one owner decision first.** Decision `voice-features-longitudinal` (2026-10-02) says
"Never: … voiceprints / speaker ID". X3 is speaker ID in its lightest form. Without reversing or narrowing that line,
X3 cannot be built, and this note recommends no spend.

## What X3 is

A small model tells whether the voice at the microphone is the child, in the first ~150 ms of a sound over her. Its
score feeds `OverlapFeatures.targetSpeaker`, which the engine already reads: the hush, the pause and G11 skip a voice
that is not the child.

Two ways to get the child's "voice reference":
1. **Ephemeral, per session (recommended if X3 is built).** The reference is taken from the child's first utterance
   of the lesson and kept only in device memory. It is never stored or uploaded, and is gone when the lesson closes.
   FireRedChat's open pVAD works this way: it updates the speaker after the first user utterance.
2. **Enrolled.** A short sample at onboarding, stored as a template. Stronger, but it is a stored biometric of a
   child. **Not recommended.**

Model: SpeechBrain ECAPA-TDNN speaker embedding (Apache-2.0, ~17 MB checkpoint, VoxCeleb EER ~0.8 %), plus
FireRedChat's pVAD (Apache-2.0). Both run on the device with `onnxruntime-web`, which ships already (voicesig).

## Azure-only compliance

- **No third-party API is called.** Open weights run on the child's device. The weights are hosted on our Azure
  Storage.
- **Azure has no managed alternative.** Azure AI Speech speaker recognition was retired on 2025-09-30.
- **Evaluation compute** runs on Azure (a Container Apps job, or a GPU VM if we fine-tune).
- **No new package**, so no `package.json` patch. Converting the model to ONNX is a build step.

## Cost

| item | money (ESTIMATE; check the Azure pricing calculator before buying) | build days (ESTIMATE) |
|---|---|---|
| on-device inference | ~0 Azure spend: runs on the child's phone | – |
| weight download (~17 MB + pVAD, once per device) | Azure Storage egress, a few US$ per 1,000 devices | – |
| port ECAPA + pVAD to ONNX for web, wire `targetSpeaker` | 0 | 3-4 |
| measure R5 / R6 on AMI (public adult speech, no child data) with ephemeral first-utterance references | 0 (runs in the dev sandbox) | 2 |
| fine-tune for children (only if the pilot shows false rejections) | a few GPU-hours on an Azure GPU VM; tens of US$ | 3-5 |
| consent copy, parent setting, privacy text (stream 5 / main) | 0 | 1-2 |
| low-end Android CPU / latency check (needs the reference phone, O-R4) | 0 | 1-2 |

**Recurring Azure spend: ~0. One-time: tens of US$ at most. People time: ~8-15 build days.**

## What it would fix, and the evidence

- **Published:** FireRedChat's pVAD cut false barge-in to 10.2 %, against 33.4 % for LiveKit and 78.1 % for TEN, at +30 ms
  (their benchmark, adults; `docs/research/duplex/MODELS-PAPERS.md`).
- **Ours:**
  - R5: 13.8 % (bar ≤ 10 %), real adult AMI speech.
  - R6: 13.2 % (bar ≤ 2 %), AMI headset bleed, which is harsher than a phone.
  - **No measurement yet says X3 meets either bar.** The 2-day AMI measurement above is the first evidence step and
    costs no money.
- **R6 is mostly an echo problem, not a speaker problem.** The AEC reference (below) is likely the better fix for it.
  X3 helps R6 only when her bleed sounds unlike the child.

## Risks

1. **It is biometric data of a child.** It conflicts with an existing owner decision, and DPDP treats a child's data with
   the highest care (compliance is deferred, not waived). Mitigations if built:
   - ephemeral only: never stored, never uploaded, never in telemetry or research extracts;
   - a parent setting, default per the owner, and an explanation in the parent corner;
   - an automated test that no embedding leaves the device.
2. **Children are harder.** Adult-trained embeddings lose 40-45 % relative EER on children's speech, and much more for
   the youngest (one study: 30.7 % EER at kindergarten against 6.2 % at grade 10).
   - Our classes 1-3 are exactly where it is weakest.
   - A false rejection means she keeps talking over the actual child.
3. **Safety rule (non-negotiable).** The score may only make her ignore a voice that is not the child. It must never
   block:
   - a stop / repeat request;
   - a safeguard;
   - the partial-safety predicate, which reads every word whoever speaks.

   A sibling saying "ruko" still stops her.
4. **Siblings sound alike.** A brother of 8 and a sister of 10 may not be told apart. That part of R5 may stay unmet.

## The alternative if we do not fund it

- **R6:** the AEC reference. Measure her echo from her own PCM (reference correlation) instead of today's level estimate (her output
  level plus a learned coupling). No biometrics. A seam patch in `src/lesson/cascadeLink.ts` (stream 3), ~3-5 build days. It also unblocks the
  lexical echo gate rejected this round (bleed 77 → 56/421 on AMI TRAIN, but it read the mic frame at the words' arrival;
  a burst-level version is being tried in RESULTS.md).
- **R5:** a text "not addressed to the teacher" class ("mummy, paani do", the TV) on the words, plus today's pitch
  rule. No biometrics, but slow: words arrive 0.3-2 s after the sound.
- **Or accept** R5 / R6 as unmet for "on" and let shadow telemetry from real lessons decide whether a phone even
  shows them. AMI headsets over-state both.

## Recommendation

1. Fund the AEC reference for R6 now: no biometrics, no spend.
2. For X3, let the owner decide first whether ephemeral, on-device, never-stored speaker matching is allowed under
   `voice-features-longitudinal`.
3. If yes, start with the 2-day AMI measurement (no spend), then build only if it shows R5 ≤ 10 % with no barge-in lost.

**Sources:**
- [Azure AI Speech speaker recognition retirement](https://learn.microsoft.com/en-us/azure/cognitive-services/speaker-recognition/home)
- [FireRedChat-pvad (Apache-2.0)](https://huggingface.co/FireRedTeam/FireRedChat-pvad)
- [speechbrain/spkrec-ecapa-voxceleb (Apache-2.0)](https://huggingface.co/speechbrain/spkrec-ecapa-voxceleb)
- [Personal VAD, Ding et al. 2020 (~130K parameters)](https://arxiv.org/pdf/1908.04284)
- Children's speaker verification: [ChildAugment](https://arxiv.org/abs/2402.15214), [age-agnostic SV](https://arxiv.org/pdf/2508.01637)
