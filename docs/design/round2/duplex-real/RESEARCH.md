# duplex-real · research: how full-duplex systems are proven on REAL audio, and what that means for Taxila

Stream: duplex-real (round 2, 2026-10-07). Value: VALUES-100 V5.1 (hands-free duplex live on the PLAN bars, "measured on
real speech, not only simulation"). Earlier work this builds on, not repeated here: `docs/research/duplex/MODELS-PAPERS.md`
(§4 benchmarks), `PRODUCTS.md`, `TAXILAFDB.md`, `ENGINE-MODEL.md`, and the p1-duplex AMI run (`m-p1dx-ami-real-adult-2026-10-06`,
real adult audio but SIMULATED STT).

## 1. What the best products and papers actually measure on real audio

| source | data (real?) | what is scored | how | headline | what transfers |
|---|---|---|---|---|---|
| **LiveKit eot-bench** (livekit.com/blog/solving-end-of-turn-detection; HF `livekit/eot-bench-data`, CC BY 4.0) | 5,000+ real user turns from human-to-agent task calls, 14 languages, **400 Hindi**; every silence >= 100 ms annotated, the last one is the turn end | every pause inside a turn is a decision point: wait through holds, answer fast at the end | a policy sweep → false-cut rate vs endpoint latency; re-rank at a fixed false-cut budget (e.g. 5 %) | LiveKit v1: 9.9 % false cuts at 300 ms, 4.5 % at 600 ms (all languages) | **the Hindi split is our E1 corpus**; the "every pause is a decision" scoring and the budget framing (report latency AT a cut-off budget, never one without the other) |
| **Deepgram Flux** (deepgram.com/learn/evaluating-end-of-turn-detection-models, 2025-10-28) | 100+ h of real conversations, ground-truth transcripts + timestamped EoT labels | EoT latency, EoT precision/recall, start-of-turn false positives | streaming in conversational context, not isolated clips; turn boundaries aligned as tokens in the transcript (sequence alignment, +3-5 pt P/R vs pure time alignment); forced alignment fixes annotators' late labels | p50 EoT < 300 ms, p95 1.5 s; SoT false positives <= 1-2 % | label offsets are a real error source: we take the end from word/silence annotations, not from a human's click |
| **Sesame TurnBench** (sesame.com/blog/turnbench; arXiv 2608.25218) | 30 h studio dialogues, 106 voice actors, 6 conversation types (incl. instructional) | end-of-turn transitions, interruptions (floor take-overs), backchannels, mid-turn pauses | window scoring −0.25 s … +3 s around each labelled event; latency p10/p50/p90 | best EoT recall 0.845; ~1 s to commit an interruption; "no system is fast, selective and high-recall at the same time"; casual talk is hardest (backchannels) | **the four events are our four bars**; p10/p50/p90 not just p50; the trade-off claim is the prior we test against |
| **Full-Duplex-Bench v1 / v1.5** (Lin et al. 2025) | v1: synthetic + **Candor** real conversations for pause handling; v1.5: 200 interruptions, 99 backchannels, 100 talking-to-others, 100 background speech | take-over rate in pauses; stop latency after interruption; resume after backchannel; response to background speech | open-loop: the user channel is played into the system, its response channel is scored | pause TOR synthetic 0.255 vs Candor 0.310 for Gemini (real is harder); GPT-4o stops in 0.23 s but answers background speech 93 % | **open loop is accepted practice** for overlap events; the four overlap categories map to barge-in / continuer / other-voices; real pauses score worse than synthetic ones |
| **IndicFDB** (NVIDIA + VoiceArena, Sept 2026) | 12,350 samples mined from ~50,000 h of channel-separated REAL conversations in 10 Indian languages | pause success, turn-taking latency, backchannel, interruption | language-independent VAD rules (an utterance < 1.2 s is a backchannel, > 2 s a take-over) | Hindi human turn gap **259 ms**; best fast system takes over in 38 % of natural Hindi pauses | the human Hindi reference gap; VAD-rule event definitions we reuse for AMI (continuer = all listening tokens, <= 1.2 s) |
| **Tavus Sparrow-1** (tavus.io/post/sparrow-1-…, 2026-01) — the Griffin line | 28 curated real audio samples "designed to expose hesitation, overlap and ambiguous endings" | floor-transfer precision/recall, interruptions, latency | identical audio to every system | P = R = 1.000, 0 interruptions, p50 55 ms (self-reported, n = 28) | a vendor number on n = 28 is a demo, not a gate; floor ownership per frame (not endpointing) is the model we already copied (ARCHITECTURE v2) |
| **Talking Turns** (ICLR 2025) | judge trained on Switchboard; live user sessions | when to speak, interrupting, backchannel, floor-keeping cues | a learned judge over real human-machine sessions | Moshi interrupts aggressively; cascades rarely backchannel | a learned judge is a second opinion only; we keep rule-scored events with CIs |

**The common method, distilled:**
1. Real recorded speech, streamed in real time through the production recogniser (Flux, eot-bench). Isolated clips and
   transcripts-as-input overstate quality: FDB's Candor arm is worse than its synthetic arm, and our own
   `rj-duplex-verbatim-stt-sim-as-gate` showed the real transcriber returned 42/90 child segments verbatim.
2. Every pause is a decision; report latency AT a false-cut rate (eot-bench), with p10/p50/p90 (TurnBench).
3. Overlap behaviour is scored open-loop on channel-separated real conversations (FDB v1.5, IndicFDB): play the user's
   real channel against the system's speech and score what it does; categories = interruption / backchannel / another
   voice / background.
4. Event definitions are rules over word or VAD timing, stated up front, so numbers compare across runs.
5. None of these is children. The only child turn-taking evidence is in `docs/research/duplex/TURN-TAKING-CHILDREN.md`
   (age 9: 85 % of >= 250 ms silences are holds). Adult numbers are a floor of difficulty, not a child result.

## 2. Real-speech data that is legally usable here (adults only)

| corpus | licence | what it is | used for |
|---|---|---|---|
| LiveKit eot-bench, Hindi config (400 turns, 69 min) | CC BY 4.0 | real human turns in Hindi with some English (task calls to an agent), 674 annotated holds (147 >= 500 ms) and 400 turn ends | **E1**: thinking-pause cut-offs and decision gap, live, on both STT lanes |
| AMI Meeting Corpus, 4 meetings (ES2004b, ES2005b, IS1004b, IS1008b), headset channels | CC BY 4.0 | real 4-party English meetings; participants include Indian-L1 adults; manual word times | **E2**: continuers, barge-ins, other voices in the room, her own bleed, turn ends, through the real STT |
| MUCS 2021 Hindi-English (downloaded in the first start, not used) | research-use terms not clearly redistributable; read speech | — | rejected: read sentences have no conversational pauses or overlaps |
| Children's speech | — | none without consent | not used (VALUES-100 honesty rule) |

Recording our own adult Hinglish actors (PLAN ET-1) is the right next corpus and is not possible from this sandbox; the
shadow telemetry (§4) is what turns every real prod lesson into data.

## 3. Taxila's case: what transfers to a Hindi-English voice tutor for 9-15 year olds on Azure only

- **The STT lane is the decision-gap floor.** The engine may not commit on words it has not seen (lexical horizon, G5),
  so on real audio its gap is bounded below by probe silence (150 ms) + the lane's commit→final time. D4
  (gpt-live-transcribe, eastus2) is 557 ms p50 from the US and 753 ms from Chennai [MODEL-STACK]; MAI-Transcribe-2-Streaming
  (South India) is 68 ms from Chennai. The 350 ms bar is only reachable on MAI, as VALUES-100 already says ("on the India lane").
- **A tutor should not chase 259 ms.** The Hindi human gap is the reference for the first sign of uptake, but thinking
  pauses are the bigger harm for children (Rowe wait time). The bars pair the gap with a cut-off rate for that reason.
- **Adult real speech is a necessary, not sufficient, gate.** It removes the TTS and simulated-STT artefacts; it cannot
  show child pause lengths, child pitch, sibling voices or Indian homes. Promotion to live therefore has two stages:
  real-adult evidence (this stream) → shadow on prod lessons (telemetry, §4) → live for an opted-in cohort.
- **Azure-only:** both STT lanes are Azure Foundry deployments already in MODEL-STACK; nothing here needs a new model.

## 4. Design chosen, and why

1. **E1: eot-bench Hindi, live, both lanes** (`evals/duplex-real/eot.mjs`). Each turn is streamed at 1x real time to the
   production transcription socket (D4 production session shape incl. the 1,500 ms backstop VAD; MAI with no server VAD
   because the deployment refuses turn detection), the live bridge `DuplexLive` runs on the real 20 ms frames beside it and
   its micro-commit probes go to the socket. Scored: cut-off in a hold >= 500 ms (the PLAN's thinking pause), every hold
   >= 100 ms, in-speech commits, decision gap after the annotated end, misses; silence-640 / -900 on the same holds.
2. **E2: AMI, real STT** (`evals/duplex-real/ami-real.mjs`). Each channel streamed live once (raw) and once with the other
   speakers masked (turns); overlap events replayed open-loop with "her" = another participant (FDB v1.5 practice). The
   same harness with SttSim isolates what real STT changes.
3. **Before / after on the same STT output**: every live run records the socket's events; engine changes are scored by
   replaying the recorded events (deterministic), then confirmed with a fresh live run.
4. **E3: shadow telemetry on prod** (`src/duplex/shadowTelemetry.ts`, `server/duplex/shadowLog.js`). Ship five's shadow
   records nothing (no `log` sink, no route, no table), so "what the engine would have done vs what happened" exists for
   zero prod lessons. One content-blind summary per lesson now goes to the access-log channel.
5. **Switch criteria** written as measurable gates with n and CIs in `CRITERIA.md`, scored by
   `evals/duplex-real/criteria.mjs` from the result files and the shadow log.

Sources: [LiveKit eot-bench](https://livekit.com/blog/solving-end-of-turn-detection) ·
[eot-bench data](https://huggingface.co/datasets/livekit/eot-bench-data) ·
[Deepgram: evaluating EoT models](https://deepgram.com/learn/evaluating-end-of-turn-detection-models) ·
[Sesame TurnBench](https://www.sesame.com/blog/turnbench) · [TurnBench paper](https://arxiv.org/pdf/2608.25218) ·
[Tavus Sparrow-1](https://tavus.io/post/sparrow-1-human-level-conversational-timing-in-real-time-voice) ·
FDB v1/v1.5, IndicFDB, Talking Turns: as cited in `docs/research/duplex/MODELS-PAPERS.md` §4.
