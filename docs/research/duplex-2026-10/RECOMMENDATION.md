# Duplex recommendation, October 2026: what to commit to, and the shortest path to hands-free on a phone speaker

**Date:** 2026-10-11. **Inputs:** `LANDSCAPE.md` (what exists), `PERSONAPLEX.md` (the NVIDIA teardown), `BAKEOFF.md` (five
arms measured on the TaxilaFDB Hinglish bake-off set with a modelled phone loudspeaker). Tags as in LANDSCAPE: [V] read
from a primary source today, [U] unverified, [M] measured (here: BAKEOFF.md), [E] my arithmetic or inference.
**Validity:** every [M] number is simulated: TTS child-like voices and a modelled speaker path. Not children, not a phone.

## 1. The decision (one paragraph)

**Commit to arm (e): our cascade keeps the voice and the floor; Azure AI Voice Live becomes the acoustic front end.**
The client sends stereo audio: channel 0 is the microphone, channel 1 is what the phone *actually played* (our DragonHD
line). Voice Live does Live-Reference echo cancellation, deep noise suppression, `azure_semantic_vad_multilingual`
(hi + en) and `azure-speech` hi-IN / en-IN transcription, with `create_response: false`. It never speaks. Its
`speech_started` is the barge-in *signal* and its commit is an end-of-turn *candidate*. Our duplex engine decides the
floor: yield, duck-and-resume on a continuer, or hold through a thinking pause. Our Director writes the reply, our
safety predicate gates every word, and our TTS speaks.

The phone-speaker problem that made the owner tap is an echo problem. Voice Live's echo canceller solves it on the
bake-off set:
- false barge-in from echo: 0/66 with the canceller, 63/66 without it, on the same service and audio [M];
- true barge-in: 12/12 [M].

The one thing it must not decide is the floor. Its own decisions are:
- it stops for Hindi continuers: 23/36 in arm (e) and 17/36 in (c), with ठीक है 6/6 in both [M];
- it cuts thinking pauses 15/34 at a 500 ms silence [M].

Those are exactly the jobs our engine and Director already own.

## 2. Why not the others

| arm | verdict | the deciding numbers [M] | ownership |
|---|---|---|---|
| (a) our cascade, mic open | no | echo false barge-in 66/66 on the phone path, and also 66/66 with a −30 dB residue: the production server VAD and transcriber hear her | ours, so the predicate gates |
| (b) our duplex engine | keep as the **floor brain**, not as the ear | phone 46/66 echo false barge-in with no AEC; clean 3/66; barge-in 10/12 clean | ours, so the predicate gates |
| (c) Voice Live speech-to-speech (gpt-realtime-2.1) | no as the speaker; **yes as the ear** | echo 0/66, barge-in 12/12, Hinglish CER best of all | **the model owns the floor and speaks before our predicate can gate**; ≈ $5/child-hour [E] |
| (d) gpt-realtime alone | no | echo false barge-in 64/66 on the phone path and 66/66 even at a −30 dB AEC residue; its input transcript comes back in Urdu script, Chinese or Korean on short Hindi answers | the model owns the floor; no gate |
| (e) Voice Live front end + our cascade | **commit** | echo 0/66 and barge-in 12/12 on both variants (p50 616-658 ms), EOT p50 ≈ 945 ms, CER mean 0.32-0.37; a lone 250 ms हाँ can go unheard (§3 step 3) | ours: the predicate gates every word before it is heard |

**Why (c) is not the product even though it measured best on the ear.** In (c) and (d) the model chooses the words and
the audio leaves the service as it is generated. Our safety predicate (`server/director/safety.js`, frozen) can only
run on text *after* the fact; a realtime transcript arrives alongside the audio, not before it. That breaks the
child-safety floor: "our predicate must be able to gate what she says before it is heard". Cost is the second reason:
≈ $4.8-5.3 per child-hour [E] against ≈ $0.9-1.5 for (e) [E]. True full duplex at $3/h is cheaper than (c), but see the next point.

**Why not GPT-Live-1 (true full duplex, Direct from Azure).** Two reasons:
- The same gate problem as (c), and worse: the model talks over the child by design.
- On IndicFDB Hindi it takes the floor in about 38 % of natural pauses [V, LANDSCAPE §1 and §4.1].

Not measured here (no deployment in our subscription).

**Why not PersonaPlex or any open full-duplex model.**
- PersonaPlex is English-only [V].
- Its weights are under the NVIDIA Open Model License [V].
- It needs a GPU we have 0 quota for.
- Its reference server runs one session per process [V].

The five ideas worth stealing are in PERSONAPLEX.md §5. They are design inputs for our engine, not a model to host.

**Why not Smart Turn v3.2 as the end-of-turn model.** On the bake-off's child-like Hinglish set it is right 34/72
(47 %) [M]:
- it calls 16/38 thinking pauses "incomplete" correctly;
- it calls 18/34 true ends "complete" correctly.

That is at chance, and it repeats `rj-smart-turn-off-the-shelf-child-hinglish`. CPU cost is fine: p50 69 ms on one thread
[M]. The accuracy is the problem.

## 3. Shortest path to hands-free on a phone speaker for Hinglish children

There are six steps. Steps 1-3 are the minimum hands-free build; 4-6 make it safe to widen.

1. **Client: send what was actually played.**
   - Tap the lesson's output: the AudioContext node that feeds the speaker, after the DragonHD decode and any ducking.
   - Interleave it with the mic as stereo PCM16 at 16 kHz, 20 ms frames.
   - Keep `getUserMedia({echoCancellation: true})` as the default. Measure on real phones whether browser AEC3 *plus*
     server reference AEC is better or worse than reference AEC alone; a double canceller can smear.
   - Owner: src/duplex (client stream).
2. **Server relay to Voice Live.**
   - The lesson socket already terminates on our server (the D4 live lane). Open one Voice Live session per lesson from
     the server: centralindia, api-version `2026-07-15`, a front-end model with `create_response: false`, and the
     session settings in `evals/duplex-2026-10/arms-ref.mjs`.
   - Forward the stereo frames to it.
   - Keys stay server-side. Nothing new is stored: audio is still never stored (`T-voice` Tier 1 rule).
3. **Feed the engine from Voice Live events instead of gpt-live-transcribe.**
   - `speech_started` while she speaks becomes the engine's barge-in *candidate*.
   - Final transcripts become the engine's text stream.
   - A commit becomes an end-of-turn *candidate*.
   - Then the engine's existing rules decide:
     - **Continuers:** duck her at once on `speech_started`. If the transcript within ~600 ms is a continuer
       (हम्म / हाँ / अच्छा / ठीक है / जी / ओके / okay / hmm), resume; otherwise stop and yield. Voice Live's filler
       filter is English-only and yields to these [M], so this list must be ours.
     - **Short answers:** a lone 250 ms "हाँ" raised no `speech_started` in 1/2 (e) and 2/2 (c) runs. Lone "रुको"
       raised `speech_started` with an empty transcript in 1-2 of 5 [M]. Neither `remove_filler_words: false` nor a
       lower VAD threshold changed it [M]. So the rule is: `speech_started` plus an empty transcript while a closed
       question is open means "the child said something short". The Director re-asks lightly ("haan? phir se bolo"),
       never treats it as silence. Gate it on real children (step 5).
     - **Thinking pauses:** a 500 ms Voice Live commit is commit-early. The Director's decide-late merge (decision
       `voice-turn-config`, commit-early/decide-late) holds the turn when the text is incomplete. The bake-off's
       15/34 raw cut-offs are what that merge must absorb.
4. **Flag and cohort.** Ship behind the existing `TAXILA_DUPLEX` cohort flag as a new lane, D5 = Voice Live front end.
   The owner's cohort tries it first.
5. **Measure on real phones with the flight recorder** (release 12 voice events already carry the reasons). These
   gates decide widening:
   - echo false barge-in ≤ 2 % of her lines;
   - true barge-in ≥ 95 %, with her audio stopped ≤ 300 ms after the child's onset (client duck is immediate);
   - continuer false stop ≤ 10 %;
   - lone-word recall (हाँ / नहीं / रुको heard and transcribed) ≥ 95 %;
   - thinking-pause cut-off ≤ 3 % (the R1 bar);
   - no regression in EOT p50.
6. **Read the real bill.** Run one hour of a Voice Live front-end session and read Azure Cost Management. This settles
   how a session that never responds is billed (stereo? silence?) [U].

## 4. Reversal conditions

Reverse (e) and reopen the choice if any of these holds:

1. **On real phones with real children:** echo false barge-in stays > 5 % of her lines, or true barge-in < 90 %, after
   the reference channel is aligned. Then try browser AEC3 plus our own her-PCM correlation gate (R6), or move to (c)
   under a text-first mode.
2. **The bill:** a front-end-only session costs > $1.5 per child-hour (step 6).
3. **ASR quality:** Voice Live hi-IN/en-IN transcription is worse on real child audio than the gpt-live-transcribe lane
   by > 5 points of CER on the same sessions.
4. **Short words:** lone-word recall on real children stays < 90 % with the re-ask rule in place. Then the ear needs a
   second listener for short words, e.g. our own STT on the canceller's output if Voice Live exposes it, before (e) widens.
5. **Latency:** Voice Live adds > 300 ms to end-of-turn p50 against the D4 lane on the same sessions.
6. **The gate becomes possible (reopens c):** a Direct-from-Azure speech-to-speech model offers a text-first mode in
   which the full text of each sentence is available before its audio is released, at ≤ 300 ms extra. Then our
   predicate could gate it. Reopen the GPT-Live-1 / gpt-realtime question with cost and IndicFDB floor-taking
   (≤ 10 % in natural pauses) as the bars.
7. **The product goes away:** Live-Reference AEC leaves preview without a GA equivalent, or `azure_semantic_vad_multilingual`
   drops Hindi.

## 5. What this does not settle

- **Real devices and real children.** No AEC3 binding built here, so arms (a) and (b) had no realistic device echo
  canceller. Their phone numbers are "no AEC at all" and their clean numbers use a pessimistic −30 dB residue.
- **TTS prosody.** The child-like voices render falling contours before pauses (`rj-sig-tts-fillers-validate-a7`). That
  inflates thinking-pause cut-offs for every arm and makes Smart Turn look worse or better than it is on children.
- **The duplex engine's slow EOT here.** About 3.0 s p50, against its own TaxilaFDB runs. Likely causes: residual
  her-words in the real STT, and partial UI context in the harness. This is a harness gap to close, not a verdict on
  the engine.
