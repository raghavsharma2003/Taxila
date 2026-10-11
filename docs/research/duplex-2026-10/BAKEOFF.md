# Duplex bake-off, October 2026: five arms on Hinglish child-like turns, with a phone loudspeaker in the loop

**Date:** 2026-10-11. **Question (main, 16:36 + 17:31):** on the TaxilaFDB Hinglish set, including the phone-speaker
echo case, how do these compare?
- (a) our cascade;
- (b) our duplex engine;
- (c) Azure Voice Live;
- (d) gpt-realtime alone;
- (e) Voice Live Live-Reference AEC driven by OUR TTS.

The measures are:
- echo false barge-in;
- true barge-in;
- continuer false yield (with an explicit हम्म / अच्छा / हाँ / ठीक है probe on (c));
- end of turn;
- Hinglish transcript error;
- first audio;
- cost per child-hour;
- who owns the floor and the safety predicate.

Smart Turn v3 is reported on the same audio.

**Validity, read first.** Everything here is SIMULATED:
- The children are Azure TTS child-like voices, not children.
- The phone is a modelled speaker path, not a phone.
- The TTS voices render falling contours before pauses (`rj-sig-tts-fillers-validate-a7`), which inflates
  thinking-pause cut-offs for every arm.
- There is no realistic device AEC for arms (a) and (b). The WebRTC AEC3 Python binding did not build here, so:
  - their **phone** numbers mean "no echo canceller at all";
  - their **clean** numbers mean "a −30 dB linear residue with no non-linear suppression", which is pessimistic against
    Chrome's AEC3.

The numbers rank architectures on the one failure the owner hit: talking to her on a phone speaker. They do not predict
production rates.

Harness: `evals/duplex-2026-10/` (`assemble.mjs`, `arms-ours.mjs`, `arms-rt.mjs`, `arms-ref.mjs`, `score.mjs`,
`smartturn_eval.py`). Results: `evals/duplex-2026-10/results/`.

## 1. Method

**Set.** 66 TaxilaFDB TEST scenarios (split by template family), re-rendered today with Azure Speech (US$0.61):

| family | n | what it tests |
|---|---|---|
| F1 | 14 | closed answers |
| F2 | 12 | open explanations with thinking pauses |
| F5 | 8 | hold / word search |
| F7 | 12 | barge-in over her |
| F8 | 10 | continuers over her |
| F12 | 10 | echo only, the child silent |

Plus a **continuer probe** of all 36 F8 scenarios, six each of हम्म, अच्छा, हाँ हाँ, ओके, ठीक है and जी, at a boundary
or mid-line, TRAIN and TEST templates. No arm is trained on either split, so all 36 are fair.

**Acoustics (`assemble.mjs`).**
- The phone loudspeaker is modelled as:
  - a 300 Hz high-pass and a 5 kHz low-pass;
  - tanh soft clipping;
  - a 60 ms device delay;
  - a 120 ms room tail of 24 decaying reflections.
- That signal returns into the mic at −6 dB under the child's active-speech level. This is **phone**: her voice is
  loud in the mic.
- **clean** is TaxilaFDB's own mix: her voice as a −30 dB residue, i.e. what a device AEC leaves.

**Open loop vs closed loop.**
- **(a), (b) and (e) are open loop.** Her line is our DragonHD render. The mic stream is fixed and streamed at real
  time.
- **(c) and (d) are closed loop (`arms-rt.mjs`).**
  - The service speaks her line itself, via an out-of-band "say exactly" response.
  - Its audio plays out at real time.
  - Her played audio goes back through the speaker model (phone) or the −30 dB residue (clean).
  - The child-only track is placed against her *actual* playback.
  - Playback stops at `speech_started`, as a client would.

  So a server echo canceller sees its true reference.
- **voicelive-noaec** is (c) with echo cancellation and noise suppression off. It is the same service and audio, and
  isolates what the canceller buys.

**Arms.**

| arm | what runs | end-of-turn decision | barge-in signal |
|---|---|---|---|
| (a) cascade | the production transcription session (server VAD 900 ms, our STT), mic open while she speaks | its commit | its `speech_started` |
| (b) duplex | our DuplexLive engine (`evals/duplex-real/lib.mjs`), D4 lane (taxila-live-transcribe, 1,500 ms backstop), her output level per frame | engine `commit` | engine `pause` / `stop` (a `duck` is not a yield) |
| (c) voicelive | Voice Live centralindia, gpt-realtime-2.1, `server_echo_cancellation`, `azure_deep_noise_suppression`, `azure_semantic_vad_multilingual` (hi, en), `azure-speech` hi-IN/en-IN, voice hi-IN Diya DragonHD Omni | `response.created` | `speech_started` |
| (d) realtime | Azure OpenAI gpt-realtime (our deployment), `semantic_vad`, its own voice | `response.created` | `speech_started` |
| (e) voicelive-ref | Voice Live api 2026-07-15, `reference_source: client`, stereo (mic + our played line), same VAD / ASR / DNS, `create_response: false` | its commit | `speech_started` |

**Scoring (`score.mjs`), one gold timeline per scenario:**
- **Echo false barge-in:** a yield while only her voice is in the mic. That is her line before the child's onset, or
  all of it for after-her and silent scenarios.
- **True barge-in (F7):** a yield in [onset − 50, onset + 1,500] ms; the latency is measured from the child's onset.
- **Continuer false yield (F8):** a yield within 1,500 ms of a continuer over her.
- **End of turn (F1/F2/F5):** the first decision ≥ true end − 200 ms, within 6 s.
  - A decision inside a gold thinking pause is a **cut-off**. The pause classes are filler, hesitation, hold_request,
    word_search, repair_open, mid_explanation and drift_pause. word_search_long and hold_long allow a listed cut-in.
  - No decision within 6 s counts as **missed**.
- **First audio:** the reply's first audio delta minus the child's true end.
- **Transcript:** skeleton CER.
  - Both sides are romanised by a Devanagari→Latin map, vowels are dropped, and similar consonants are merged, so
    "छप्पन" = "Chappan".
  - It is relative between arms only.
  - Numerals are not mapped to words, so "48" against "अड़तालीस" scores as wrong. That penalises (c), (d) and (e),
    which write numbers as digits.
- **Tokens:** the usage of each `response.done` is summed per session.

## 2. Results (66 scenarios per arm; F7 n = 12, F8 n = 10, EOT n = 34)

| arm | variant | echo false barge-in | true barge-in (F7) | barge p50 ms | continuer false yield (F8) | EOT p50 / p90 ms | missed | thinking-pause cut-offs | first audio p50 / p90 ms | CER mean / p50 |
|---|---|---|---|---|---|---|---|---|---|---|
| (a) cascade | clean | 66/66 | 0/12 | — | 0/10 | 1057 / 1179 | 1/34 | 13/34 | — | 0.407 / 0.14 |
| (a) cascade | phone | 66/66 | 0/12 | — | 0/10 | 1058 / 1150 | 0/34 | 13/34 | — | 0.624 / 1 |
| (b) duplex engine | clean | 3/66 | 10/12 | 970 | 6/10 | 2980 / 3060 | 2/34 | 5/34 | — | 0.663 / 0.87 |
| (b) duplex engine | phone | 46/66 | 4/12 | 27 | 4/10 | 2980 / 3070 | 3/34 | 7/34 | — | 0.868 / 1 |
| (c) Voice Live | clean | 0/66 | 12/12 | 638 | 7/10 | 1045 / 1180 | 2/34 | 14/34 | 1875 / 2306 | 0.281 / 0.15 |
| (c) Voice Live | phone | 0/66 | 12/12 | 675 | 6/10 | 1045 / 1199 | 1/34 | 14/34 | 1948 / 2334 | 0.293 / 0.17 |
| (c′) Voice Live, AEC+DNS off | phone | 63/66 | 7/12 | 429 | 4/10 | 1000 / 1099 | 2/34 | 13/34 | 1908 / 2212 | 0.268 / 0.17 |
| (d) gpt-realtime | clean | 66/66 | 1/12 | 413 | 1/10 | 1018 / 1170 | 1/34 | 15/34 | 1979 / 2545 | 0.375 / 0.29 |
| (d) gpt-realtime | phone | 64/66 | 1/12 | 148 | 1/10 | 1029 / 1174 | 1/34 | 15/34 | 2026 / 2668 | 0.46 / 0.38 |
| (e) Voice Live ref-AEC front end | clean | 0/66 | 12/12 | 616 | 7/10 | 945 / 1059 | 1/34 | 15/34 | — | 0.322 / 0.17 |
| (e) Voice Live ref-AEC front end | phone | 0/66 | 12/12 | 658 | 8/10 | 947 / 1063 | 1/34 | 15/34 | — | 0.367 / 0.24 |

**Readings.**

1. **The phone-speaker echo case is solved by a server echo canceller with a reference, and by nothing else here.**
   - Voice Live yields to her own echo 0/66, with the canceller on, whether it speaks itself (c) or our TTS is the
     reference (e).
   - The same service with the canceller off yields 63/66.
   - gpt-realtime alone yields 64/66 on the phone path and **66/66 even at a −30 dB device-AEC residue**: its VAD hears
     what a browser canceller leaves.
   - Our cascade with the mic open yields 66/66 even at a −30 dB residue: the production server VAD hears her. So the
     cascade can only be half-duplex (tap or mic-gated) on a speaker. The owner's tap itself had a different cause: the
     cohort, WHY-TAP.
   - Our duplex engine yields 3/66 at −30 dB but 46/66 on the raw phone path, because its her-PCM gate was built for
     an AEC residue, not a loud echo.
2. **True barge-in works where the echo is cancelled.**
   - (c) and (e): 12/12 on both variants, with a p50 of 616-675 ms from the child's onset to `speech_started`. A client stops
     playback on that event, or ducks earlier on raw energy.
   - (b): 10/12 clean, at p50 970 ms.
   - (a) and (d) cannot be scored: echo already held the floor. The same holds for (b) phone, whose 27 ms p50 is an
     echo yield that was already running.
3. **Continuers: every arm stops for Hindi continuers far too often.** See §3. Voice Live's filler filter is
   English-only and does not help.
4. **End of turn.**
   - Voice Live's semantic VAD commits at about 0.95-1.05 s p50, the same as gpt-realtime (1.02-1.03 s) and our
     900 ms server VAD (1.06 s).
   - All of them cut 13-15 of 34 thinking pauses. With a 500 ms silence that is expected; the Director's merge is what
     must absorb it.
   - The duplex engine cut 5/34 clean and 7/34 phone, the fewest, but waited about 3.0 s p50 here, far slower than in its
     own TaxilaFDB runs. That is a harness gap: partial UI context, and her residue words in the real STT.
5. **Hinglish transcripts.**
   - Voice Live's `azure-speech` hi-IN/en-IN front end is the best ear: CER mean 0.27-0.37, even with numerals scored
     as errors. The canceller costs it little: 0.293 on, 0.268 off.
   - gpt-realtime's own input transcript (0.38 clean, 0.46 phone) comes back in **Urdu script, Chinese, Korean or Japanese** on short
     Hindi turns: हम्म → "媽媽" / "엄마."; छप्पन → "シャッペン".
   - Our cascade's transcript on the phone path is mostly her own line (0.62).
   - The duplex committed text is often empty (0.66 clean).
6. **The short-answer hole (the top open risk of (e) and (c)).**
   - A lone 250 ms "हाँ" as a closed answer raised **no `speech_started` at all** in 1/2 (e) and 2/2 (c).
   - Lone "रुको" over her raised `speech_started` (so barge-in fired) but an **empty transcript** in 1-2 of 5.
   - Both `remove_filler_words: false` and VAD `threshold` 0.3 or 0.2 with `speech_duration_ms` 80 leave this
     unchanged (5-scenario A/B, `voicelive-ref-kf`, `-vlref-t03`, `-vlref-t0280`).
   - The engine must treat "speech_started, then an empty transcript" as a short answer or stop word, not as nothing.
     Real children say "haan" louder and longer than a 250 ms TTS token, so this needs a real-audio check before it is
     believed or dismissed.
7. **First audio** (speaking arms only): (c) 1,875-1,948 ms p50 and (d) 1,979-2,026 ms p50 from the child's true end. Our
   cascade's own end-to-end figure is 3.1-3.2 s (`cascade-latency`, 2026-10-03 [M]). Not comparable to the realtime
   arms without the Director in the loop.

## 3. The continuer probe (36 scenarios; main asked for this explicitly on (c))

Each cell is false yields out of scenarios. A false yield is a `speech_started` (for (b), a `pause` or `stop`) within
1.5 s of the continuer, while she is talking.

| arm | हम्म | अच्छा | हाँ हाँ | ओके | ठीक है | जी | total | echo false barge-in |
|---|---|---|---|---|---|---|---|---|
| (b) duplex engine clean | 3/6 | 5/6 | 3/6 | 6/6 | 3/6 | 5/6 | 25/36 | 0/36 |
| (b) duplex engine phone | 2/6 | 4/6 | 3/6 | 4/6 | 2/6 | 0/6 | 15/36 | 21/36 |
| (c) Voice Live phone | 6/6 | 2/6 | 0/6 | 3/6 | 6/6 | 0/6 | 17/36 | 0/36 |
| (e) Voice Live ref-AEC front end phone | 4/6 | 3/6 | 5/6 | 4/6 | 6/6 | 1/6 | 23/36 | 0/36 |

- **(c) Voice Live's `remove_filler_words` is English-only, and it shows: 17/36 false yields.**
  - It yields to हम्म 6/6 and to ठीक है 6/6.
  - It yields to ओके 3/6 and अच्छा 2/6.
  - It holds through हाँ हाँ and जी (0/6 each).
- **(e) is worse: 23/36**, and it yields to हाँ हाँ 5/6. It runs the same VAD; the difference is the open-loop timing
  against our DragonHD line, and n = 6 per word.
- **Gpt-realtime and our cascade are not in this table:** echo had already taken the floor in nearly every run.
- **Our duplex engine on the real D4 STT also stops for most continuers.** Its ≥ 90 % continuer result (task R3/R4)
  was on TaxilaFDB timing with oracle-style text. Here the live transcriber turns अच्छा into "हर रिश्ता", so the text
  rule never sees a continuer.
- **The fix is ours to own, and it is cheap.**
  - Duck at once on `speech_started` (her volume to 5 %).
  - Resume if the transcript, which arrives ~0.9 s after `speech_started` in (e) (p50 916 ms, p90 974 ms, n = 36), is
    one of our Hindi/English continuers.
  - Also resume if it is empty and the speech lasted < 500 ms.
  - Stop otherwise.
  - The cost is a ~1 s duck on a continuer instead of a stop.

## 4. Who owns the floor, and can our safety predicate gate her words before they are heard?

| arm | floor (who decides to speak, yield, hold) | words (who writes them) | safety predicate before audio? |
|---|---|---|---|
| (a) cascade | our server (VAD commit) + Director | our Director | **yes**: `server/director/safety.js` runs on the text before TTS |
| (b) duplex engine | our engine + Director | our Director | **yes**, same gate |
| (c) Voice Live S2S | **the service** (its VAD, `create_response`, `interrupt_response`) | **the model** | **no**: audio streams as it is generated; the text transcript arrives alongside, too late to gate. Instructions are not a predicate |
| (d) gpt-realtime | **the model** | **the model** | **no**, same |
| (e) Voice Live front end + our cascade | **our engine + Director** (Voice Live supplies signals only; `create_response: false`) | our Director | **yes**: nothing is spoken that did not pass our predicate |

(c) and (d) could be wrapped in text-only mode with our TTS. That is (e) with an extra model call, so it is not a
separate arm.

## 5. Cost per child-hour (estimates [E]; the inputs are below so they can be redone)

**Lesson-hour assumptions:**
- she speaks 30 min;
- the child speaks 12 min;
- the mic is open 60 min;
- 120 exchanges;
- 1.5k text tokens of instructions and context per exchange;
- audio tokens at 10/s in and 20/s out. The input rate is measured here: 9 audio tokens for 0.97 s of speech. The
  output rate is the documented one.

**Prices** (Azure retail, read 2026-10-11, Global):

| item | price |
|---|---|
| gpt-realtime-2.1 audio in / out | $32 / $64 per 1M |
| gpt-realtime-2.1 cached audio in | $0.4 per 1M |
| gpt-realtime-2.1 text in / out | $4 / $24 per 1M |
| Voice Live Pro, LLM audio | the same rates |
| Voice Live Pro, standard speech audio in | $0.017 per 1K |
| gpt-live-transcribe | $1.02/h |

| arm | estimate | how |
|---|---|---|
| (a) cascade | **≈ $0.59-1.84** | re-priced 2026-10-11 with the §5b meters. **High end:** S1 STT streamed for the hour $1.00, 5.6 terra for 120 turns $0.24, and her 30 min as Neural HD TTS (≈ 27k characters) $0.59. **Low end:** gpt-transcribe $0.27, 5.6 luna $0.02, and half the narration pre-rendered $0.30. The earlier **$0.29 (Rs28, `mk-azure-voice-cost-per-hour`) is too low**: TTS alone costs more than that once she speaks 30 min of the hour |
| (b) duplex engine | **≈ $1.6-2.9** | (a) + continuous gpt-live-transcribe for the open-mic hour ($1.02) |
| (c) Voice Live S2S, gpt-realtime-2.1 | **≈ $4.8-5.3** | audio out 36k tok $2.30 + child audio 7k $0.23 + her prior turn re-read ~43k $1.38 + text 180k in / 7k out $0.89; the existing model's windowed gpt-realtime figure is Rs512 ≈ $5.3 |
| (d) gpt-realtime alone | **≈ $4.8-5.3** | same tokens |
| (e) Voice Live front end + our cascade | **≈ $0.86-1.38** | (a) with STT replaced by the open-mic hour as Voice Live Std speech audio in (36k tok × $0.015/1K = $0.54). Add up to $0.54 if the stereo reference is billed as audio [U] |

Per minute, these are $0.010-0.031 for (a) and $0.014-0.023 for (e). §5b's enterprise call is $0.035 and $0.027 for the
same arms, because a call has no pre-rendered narration and assumes 30 s of agent speech every minute.

The front-end-only billing unit is the open question: a session that never responds, with a stereo reference. It must
be read off Azure Cost Management after a 1-hour test before (e) is widened.

## 5b. Cost per conversation-minute for an enterprise voice-calling SaaS (owner's question, 2026-10-11)

**Sources.** All AI prices come from the **Azure Retail Prices API** (`prices.azure.com/api/retail/prices`), read
2026-10-11 from this sandbox. It returned items here. The filters that work are:
- `serviceName eq 'Foundry Tools'` for Speech and Voice Live (centralindia);
- `serviceName eq 'Foundry Models'` for Azure OpenAI Media, GPT5 and Azure OpenAI;
- `serviceName eq 'Voice'` for Azure Communication Services.

**PSTN per-minute rates are NOT in the API.** The ACS "Local/Toll Free Calls" meters are $1 "Consumption Unit"
placeholders. The rates below come from the ACS PSTN pricing page (`learn.microsoft.com/.../pstn-pricing`, updated
2026-09-23) and its destination CSV (`github.com/Azure/Communication/.../communication-services-pstn-rates.csv`).
Script: `evals/duplex-2026-10/cost-per-minute.mjs`.

**Meters used [V]:**

| meter | price |
|---|---|
| `Azure Speech / S1 Speech To Text` | $1 / hour |
| `Azure Speech / Neural HD Text to Speech Characters` | $22 / 1M |
| `Azure Speech / S1 Neural Text To Speech Characters` | $15 / 1M |
| `Azure OpenAI GPT5 / 5.6 terra ShortCo Inp, Cd Inp, Opt Std Gl` | $2 / $0.2 / $12 per 1M |
| `5.6 luna … Std Gl` | $0.2 / $0.02 / $1.2 per 1M |
| `Azure OpenAI Media / gpt-realtime-2.1 Audio inp, Audio cd inp, Audio opt Gl` | $32 / $0.4 / $64 per 1M |
| `gpt-realtime-2.1 Text inp, Text cd inp, Text opt Gl` | $4 / $0.4 / $24 per 1M |
| `gpt-realtime-2.1-mini Audio inp, Audio opt Gl` | $10 / $20 per 1M |
| `gpt-realtime-2.1-mini Text inp, Text opt Gl` | $0.6 / $2.4 per 1M |
| `gpt-live-transcribe Gl Unit` | $1.02 / hour |
| `Live 1 Gl Unit` (GPT-Live-1) | $3 / hour |
| `Voice Live API Pro - LLM Audio Input Tokens` | $0.032 / 1K |
| `Voice Live API Pro - LLM Text Output Tokens` | $0.016 / 1K |
| `Voice Live API Pro - Standard Speech Audio Output Tokens` | $0.031 / 1K |
| `Voice Live API Std - Standard Speech Audio Input Tokens` | $0.015 / 1K |
| `Voice Live API Std - Standard Speech Audio Outpt Tokens` | $0.026 / 1K |
| `Voice Live API Std - LLM Text Input Tokens` | $0.00066 / 1K |
| `Voice Live API Std - LLM Text Output Tokens` | $0.00264 / 1K |
| `Voice / Audio Streaming / Unmixed Audio Streaming` (ACS media to the AI) | $0.004 / min |
| `Voice / Direct Routing / Standard Inbound, Standard Outbound` | $0.004 / min |

**PSTN [V]:**
- **US numbers (ACS pricing page):** inbound geographic $0.0085/min, inbound toll-free $0.022/min, outbound from
  $0.013/min. The number itself is $1/mo geographic or $2/mo toll-free.
- **India:** ACS sells **no Indian numbers**. Indian calling means ACS Direct Routing at $0.004/min plus an Indian SIP
  trunk from a licensed carrier. That carrier rate is not on Azure [U]. Calls placed from a US ACS number to India cost
  $0.035/min to mobiles and $0.045/min to landlines (CSV).

**Assumptions per conversation-minute [E]:**
- **Talk split:** 50/50, so the caller speaks 30 s and the agent 30 s.
- **Turns:** 4 per minute.
- **Audio tokens:** 10 per second in and 20 per second out. The input rate is [M]: 9 tokens for 0.97 s of speech in
  the bake-off.
- **Agent speech:** 450 TTS characters per minute.
- **LLM context:** 2,000 tokens per turn, 75 % cached, and 60 output tokens per turn.
- **Realtime arms:**
  - The prior agent turn is re-read as uncached audio input.
  - 8,000 cached history audio tokens per minute.
  - 280 text-out tokens per minute, from the bake-off's measured text-out / audio-out ratio of 0.47 [M].
- **STT:** billed on the streamed minute, not VAD-gated.
- **Voice Live input:** billed on the streamed minute. A stereo reference may double it [U].

**Per conversation-minute (USD):**

| arm | STT | LLM | TTS | realtime model | AI total | + US inbound (geo) + streaming | + India Direct Routing + streaming (carrier extra) | SaaS price at 3× (US) |
|---|---|---|---|---|---|---|---|---|
| (a) cascade: S1 STT + 5.6 terra + Neural HD TTS | 0.0167 [V] | 0.0081 [E] | 0.0099 [E] | — | **0.035** | 0.047 | 0.043 | 0.141 |
| (a′) cascade, budget: S1 STT + 5.6 luna + Neural TTS | 0.0167 | 0.0008 | 0.0067 | — | **0.024** | 0.037 | 0.032 | 0.110 |
| (b) duplex engine on (a): + gpt-live-transcribe stream | 0.0337 | 0.0081 | 0.0099 | — | **0.052** | 0.064 | 0.060 | 0.192 |
| (c1) Voice Live Pro, gpt-realtime-2.1, native voice | — | — | — | 0.0875 | **0.088** | 0.100 | 0.096 | 0.300 |
| (c2) Voice Live Pro, gpt-realtime-2.1 + Azure HD voice | — | — | — | 0.0402 | **0.040** | 0.053 | 0.048 | 0.158 |
| (c3) Voice Live Std, cascade-class LLM (4.1-mini tier) + Azure voice | 0.0090 | 0.0039 | 0.0156 | — | **0.029** | 0.041 | 0.037 | 0.123 |
| (d) gpt-realtime-2.1 alone | — | — | — | 0.0875 | **0.088** | 0.100 | 0.096 | 0.300 |
| (d′) gpt-realtime-2.1-mini alone | — | — | — | 0.0256 | **0.026** | 0.038 | 0.034 | 0.114 |
| GPT-Live-1 (full duplex; $3/h unit [V]) | — | — | — | 0.0500 | **0.050** | 0.063 | 0.058 | 0.188 |
| (e) Voice Live front end + cascade (a) | 0.0090 | 0.0081 | 0.0099 | — | **0.027** | 0.040 | 0.035 | 0.118 |

Everything except the meter prices is [E].

**Margin.** A 3× list price is a 67 % gross margin before hosting, support and payment costs. At 2.5×-4× the band is:
- **(e) or (a):** $0.10-0.19/min (US inbound);
- **(c1) or (d):** $0.25-0.40/min.

**Readings.**
- **Telephony is a third to a quarter of the cost on the cheap arms** (US inbound geographic plus streaming is
  $0.0125/min). It is noise on gpt-realtime.
- **Audio tokens dominate the realtime arms.** In (c1)/(d), native audio out at $64/M is 44 % of the cost, and audio in
  (the caller plus the re-read agent turn) is 33 %. An Azure HD voice instead (c2) halves the cost.
- **(e), the architecture recommended for Taxila, is also the cheapest serious option for enterprise calling.** It
  costs about $0.027/min of AI plus telephony. It also keeps a text gate before every word, which an enterprise
  compliance buyer will want for the same reason Taxila does.

**Not included:**
- container hosting (Azure Container Apps), storage, and call recording (`Call Recording / Dual Channel Stereo Audio`
  $0.0025/min [V]);
- number rental;
- the Indian carrier's SIP rate;
- taxes. "Pricing may include requisite taxes and fees" (ACS page).

## 6. Smart Turn v3.2 on the same audio (main asked)

Setup: Pipecat Smart Turn v3.2 (BSD-2; Whisper-Tiny encoder, ONNX, CPU), with the reference preprocessing (last 8 s,
front zero-pad, Whisper log-mel, threshold 0.5).
- Samples are cut from the child-only track (`<id>.child.s16`) of the after-her scenarios.
- **Complete** = true end + 200 ms; **incomplete** = a gold thinking pause's start + 200 ms.
- `results/smartturn-v3.2.json`.

| | result |
|---|---|
| accuracy | **34/72 (47 %)** |
| true ends called complete | 18/34 |
| thinking pauses called incomplete (the cut-off guard) | 16/38 |
| CPU, 1 thread | p50 69 ms, p90 79 ms |
| CPU, default threads | p50 102 ms, p90 135 ms |

At chance on child-like Hinglish TTS, which repeats `rj-smart-turn-off-the-shelf-child-hinglish`. The vendor's
93.4 % on Hindi is adult speech on its own test set. The cost is fine for on-device use; the accuracy is not. TTS
prosody (falling contour before pauses) is a known confound here, so this is not a verdict on real children.

## 7. What was not done, and why

- **No AEC3 for (a) and (b).** The Python binding did not build. The real-phone comparison of "browser AEC3 + our engine"
  against "Voice Live reference AEC" is the first real-device test (RECOMMENDATION.md §3 step 5).
- **No GPT-Live-1 arm.** It is not deployed in our subscription, and it would also be a no-gate arm (§4).
- **No PersonaPlex arm.** It is English-only, and we have 0 GPU quota (PERSONAPLEX.md).
- **The cascade arm is raw VAD commits.** Production adds the predictive merger and Director hold, so its cut-offs here
  overstate production. Production also does not keep the mic open while she speaks today (it taps).
- **The duplex arm's EOT of about 3 s is a harness gap** (partial `ui` context), not a re-measurement of the engine.
