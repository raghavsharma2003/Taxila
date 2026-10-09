# duplex (round 3) · research: the two-way teacher, and what it takes to hear a child the way a person does

Stream: duplex, round 3 (2026-10-09). Value: VALUES-100 V5.1 (hands-free duplex live on the PLAN bars, measured on real
speech). Builds on, and does not repeat: `docs/research/duplex/{ARCHITECTURE,MODELS-PAPERS,PRODUCTS,TURN-TAKING-CHILDREN,
ENGINE-MODEL}.md` (the continuous engine, the child turn-taking evidence) and `docs/design/round2/duplex-real/` (how full-duplex
systems are proven on real audio; eot-bench Hindi and AMI as the real-speech corpora; the switch criteria). Every number here
is labelled: **REAL-ADULT** (recorded adult speech through the real Azure STT lane), **SIM** (synthetic), **ESTIMATE**.
Nothing here is a child result.

## 1. The question, from the owner's directive

"Two-way teacher, voice signals, duplex type concept, natural conversation." In engineering terms, four things a person does
that the cascade does not:

1. **Knows when you have finished** without making you wait (end of turn: today the turn reaches the server ~1.57 s after
   the child stops: 900 ms server VAD + the completed transcript, `docs/design/round2/latency/RESEARCH.md` §5), and without
   cutting you off when you are only thinking.
2. **Stops when you talk over her** (barge-in: "ruko", "wait", a correction), at once.
3. **Keeps talking through "haan / achha / hmm"** (continuers), and keeps listening while she talks.
4. **Is not fooled by the room** (a TV, a sibling, her own voice coming back through the speaker).

## 2. How the best systems and papers solve exactly this (2025-2026), and what transfers

| system / paper | what it does | what it measured | licence / availability for us | what transfers to a Hindi-English tutor for 9-15 year olds on Azure only |
|---|---|---|---|---|
| **LiveKit end-of-turn v1** (blog "solving end-of-turn detection", 2026-06-17; eot-bench) | audio-native: an audio encoder → adapter → fine-tuned LM (semantic) fused with a recurrent prosody branch; current user turn only | eot-bench, every pause a decision: **5 % false cut-offs at ~543 ms, 10 % at ~295 ms** (all 14 languages); 9.9 % at a 300 ms budget, 4.5 % at 600 ms | weights under the **LiveKit Model License: "can only use them together with the LiveKit Agents framework"**, no standalone use, outputs may not train other models (LICENSE §1, §3(b)) → **unusable** | the frontier and the honest framing: report latency AT a cut-off budget. The best audio-native model in the world sits at ~5 % / ~0.5 s on adult speech; a 3 % / 350 ms open-speech bar is beyond the state of the art |
| **LiveKit turn-detector v0.4.1-intl** (2025-12) | text-only: Qwen2.5-0.5B distilled from 7B, on the STT transcript, ~25 ms CPU | Hindi error 5.4 → 3.7 % (FPR at 99.3 % TPR, their test set) | same LiveKit Model License → unusable | text completeness carries real information, but their test set is not real pauses (see §3: on real Hindi pauses the words are ambiguous) |
| **LiveKit adaptive interruption** (2026-03-19) | audio-only CNN over the first few hundred ms of overlap: interruption vs backchannel / noise; playback resumes after a false interruption | median 216 ms of audio to trigger; 86 % precision / 100 % recall at 500 ms of overlap; rejects 51 % of VAD barge-ins | LiveKit-only | **decide overlap from acoustics fast, but make the decision reversible** (resume after a false one). Our hush + resume is this shape |
| **Deepgram Flux** (2025-10; docs "voice agent eager EoT") | ASR with an integrated end-of-turn model; events `EagerEndOfTurn` (moderately confident: start the LLM), `TurnResumed` (cancel), `EndOfTurn` (commit; same transcript) | eot-bench: 12.9 % at 300 ms, 9.9 % at 600 ms; eager costs **+50-70 % LLM calls** | third-party API → not callable (Azure-only) | **the eager pattern**: decouple the expensive work from the floor decision. Start the turn's model work on the covered words early; commit the floor later with patience; cancel if the child goes on |
| **Endpoint Anticipation** (arXiv 2606.13450) | forecasts the end of turn up to 2.56 s ahead; speculative LLM/TTS on partial context, integrated with Kyutai Unmute | **−505 ms mean latency for +28.4 % speculative compute**; beats VAP baselines | paper | same lesson as Flux: speculation is where the latency is won; the floor decision can stay patient |
| **Kyutai STT / Unmute** (2025) | the streaming STT predicts "the user is done" with the text (semantic VAD); then **flushes**: processes the buffered audio at ~4x real time so the 500 ms STT delay becomes ~125 ms | vendor | weights CC-BY (en/fr only), no Hindi, GPU | the flush is what our **micro-commit probe** already is (force the transcriber to finish the buffer now); it is the floor on our decision gap |
| **Smart Turn v3.2** (Pipecat/Daily, BSD-2) | 8 M-param Whisper-tiny audio classifier, 23 languages | Hindi train/test audio is **synthetic TTS**; on a real human Hinglish set (518 clips, smart-turn-hinglish card): balanced acc. 70 %, AUC 0.75. Ours (round 1): AUC 0.47 on child TTS, cut-offs 37-64 % | licence OK | **rejected again** (`rj-smart-turn-off-the-shelf-child-hinglish`); Hinglish fine-tunes on HF are worse than stock (Apache-2.0 card) or carry no licence (Chhotu) |
| **Moshi / PersonaPlex / Human-1** (Kyutai 2024; NVIDIA 2026; Josh Talks 2026) | native full duplex: user and agent audio as parallel token streams, 80 ms frames, 160-200 ms latency | FDB: Moshi interrupts aggressively; spurious onsets into silence 30 % (MIT 2026) | no Azure path; Human-1 (Hindi) not on Azure; persona and safety controls weak | the **model** of conversation (two streams, always listening) transfers; the model does not. Our cascade keeps the strong brain, the safety floor and Hindi quality; duplex is built as a decision engine over the streams |
| **Hertz-dev** (Standard Intelligence) | 8.5 B open full-duplex audio BASE model, 8 Hz latents, 120 ms on an RTX 4090 | latency only; no interruption benchmark | open weights, GPU, base model (no instruction following, no persona, no safety) | not a teacher. Confirms that sub-200 ms floor reactions come from acoustic streaming, not from transcripts |
| **Sesame TurnBench** (2026) | 4 events (turn end, interruption, backchannel, mid-turn pause), window scoring, p10/p50/p90 | best EoT recall 0.845; ~1 s to commit an interruption; "no system is fast, selective and high-recall at the same time" | benchmark | our four bars are its four events; the trade-off claim is confirmed below on our own data |
| **VAP / VAP-Realtime** (Ekstedt, Inoue) | continuous voice-activity projection, backchannel heads; multilingual EN/ZH/JA | child-adult VAP bAcc 94 vs silence AUC 0.62 (IWSDS 2026) | code MIT, **pretrained models academic-only** | method only; a Taxila VAP needs our own (consented) two-channel data |

**Hindi-English prosody (what the engine may use).** Delhi Hindi declaratives end in a falling contour to a low boundary
(Harnsberger; the Hindi prosody review arXiv 1705.03247); non-final phrases end high; a flat *haan* is a continuer and a
rising *haan?* a repair request (Bali 2009, via TURN-TAKING-CHILDREN.md §5.6); English fragments inside Hindi are slower and
more effortful (code-switching survey arXiv 1904.00784), so a switch at the edge is planning, not an end (P11). Gravano &
Hirschberg's seven yielding cues combine (5 % → 65 % take-over with all seven): no single cue decides. Children: at age 9,
85 % of silences >= 250 ms are holds (Study C).

## 3. What our own real-speech data says (measured this round, REAL-ADULT)

Instrument: **the pause table** (`evals/duplex-r3/eot-table.mjs`): the 400 eot-bench Hindi turns (LiveKit, CC BY 4.0, adult
task calls; evaluation only) replayed through the live bridge with the real STT events recorded in round 2 on both lanes
(D4 = gpt-live-transcribe eastus2, production; MAI = MAI-Transcribe-2-Streaming South India), with the floor take-over
suppressed so that every pause of every turn is observed. Policies are then simulated on it (`eot-policy.mjs`); the simulator
reproduces the shipped engine exactly (MAI 19/147 cut-offs, gap p50 911 ms; D4 12/147, 926 ms) before it is trusted.

1. **The device's silence clock runs ~200 ms longer than the annotated pause** (offset ~100 ms early, onset ~100 ms late;
   p10/p50/p90 = +80 / +200 / +300 ms). "Silence-900" on the device cuts 12.9 % of >= 500 ms pauses; on the annotation it cuts
   4.8 %. The round-2 R1 baseline compared the engine to the annotation's ruler.
2. **On D4 the words cover the audio only ~800 ms into a pause** (p50; MAI ~540 ms, from the US). 101 of 147 thinking pauses
   end before D4's words arrive: the lexical horizon itself protects them, and D4's decision gap cannot go below ~700 ms
   from the US (~900 ms from India, commit→final 753 ms CHN).
3. **The transcriber's punctuation is a turn-end signal.** Both lanes punctuate 60-61 % of micro-commit finals. A comma, a
   broken word ("हर्ष वि-") or an unclosed number ended **0-4 of 400 turns against 17-33 thinking pauses**; the open-tail
   shapes (postposition, conjunction, "मेरा नंबर है") 27 ends vs 10 pauses. Unclosed plain words are NOT a hold on D4 (9 ends
   vs 3 pauses).
4. **"Complete-looking" words are genuinely ambiguous at a pause.** Words closed by "।" / "." with no hold shape and no
   question: 66 thinking pauses against 292 turn ends (MAI, n = 358 of 538 covered pauses). Inside that set:
   - prosody separates weakly: pitch position at the pause AUC 0.70, pitch slope 0.67, energy slope 0.45, final lengthening 0.50
     (all ambiguous classes);
   - **text alone, by the production fast model (grok-4-1-fast-non-reasoning, p50 563 ms), AUC 0.57** (0.70 on all pauses);
   - **text alone by a stronger model (taxila-fast, gpt-5.6-luna), AUC 0.80** (0.83 on all) — the information exists, but the
     answer takes **1,219 ms p50 / 1,494 p90** (US), i.e. it lands after the 1.1 s wait it would replace. Offline, no latency
     budget (`eot-sem-ceiling.mjs`, `results/r3-sem-ceiling.json`, n = 538 pauses, 2026-10-09).
   So no Azure model can shorten the wait on open speech in time today, and stage A's own projected pComplete is flat
   (AUC 0.49-0.50) at the moment the words cover the audio.
5. **The best class-and-wait policy on TRAIN** (even ids, both lanes, <= 3 % cut-offs) holds 1,600 ms on a hold shape,
   1,200 ms while a number is being read out, 900 ms after a complete question to her, 1,100 ms otherwise. Built into the
   engine and replayed (the simulator's prediction held to the turn on MAI, one extra cut on D4): TEST (odd ids, never used to
   choose) **4/70 = 5.7 % on both lanes** (shipped: MAI 10.0 %, D4 7.1 %); ALL MAI 19 → 6/147, D4 12 → 7/147; gap p50
   +~100 ms (910 → 1,011 / 923 → 1,019) and p90 −0.6-0.8 s (2,278 → 1,480 / 2,060 → 1,511). A fresh LIVE run on D4 (2026-10-09,
   a slower STT day): 4/147 = 2.7 % vs 6/147 for the round-2 engine on the same events. Prosody modifiers bought nothing on TRAIN.
6. **The eager end of turn fires on the exact committed words at 354/399 (D4) and 336/399 (MAI) real turn ends**, 280 / 560 ms
   before the commit (p50), with 0.07 / 0.36 cancelled starts per turn (ESTIMATE of the latency it buys: about the lead, since
   the turn's model work, ~2.5 s p50 in round-2 latency, is the critical path).
7. **The AMI overlap diagnosis** (§4.3): the session-wide hush give-up and the revoke-on-any-onset were the two largest causes
   of real barge-ins not stopping and real continuers stopping her.

## 4. The design chosen, and why

**Duplex is the conversation model; the cascade is its brain.** One engine decides the floor continuously (round-1 design,
kept); this round makes the three hard decisions word-aware and measured on real speech:

1. **The word-aware end of turn (EOT3).** `engineRules.ts pauseClass()` reads the COVERED words (G5: never words that are
   older than the audio) and the transcriber's closing mark (`markers.ts endShape`, only once the session's transcriber has
   punctuated; simulated STT is unaffected) into five classes: hold (open tail, filler, projection, hold request, comma,
   broken word, unclosed number), enumerating, question, idk, complete. `config.ts PAUSE_WAIT` gives each its least silence,
   and in the free / question / chit-chat exchanges that wait IS the silence backstop (G10), so one clock decides (before: the
   1,000 ms backstop beat the 1,100 ms turn-end wait on 303/400 turns and a hold shape bought nothing). Closed answers keep the
   form grammar (a complete answer of the asked form commits as soon as its words cover the audio); open explanations keep
   wait time II. Why not a model: §3.4: the information is in the words only for a model that cannot answer within the pause.
2. **The eager end of turn** (Flux / Endpoint Anticipation / preemptive generation). When the covered words read as a finished
   turn, the engine emits `prepare.eager = start` with exactly those words, and `cancel` when the child goes on. The floor
   decision does not wait on it and never changes because of it. It is the signal the turn prefetch needs to start classify,
   the note and the speculative replies ~0.3-0.6 s before the commit (relational-human's `src/latency/duplexTurn.ts` is the
   consumer; it keys on `draft`, which fires at projected pComplete >= 0.5 on stale prefixes; `eager` is the measured one).
3. **Overlap: one classifier, reversible, word-confirmed** (LiveKit adaptive interruption's shape on our stack). The AMI
   diagnosis (real meetings, real STT events) found the hush, the step that makes her inaudible within ~150 ms, switched OFF
   for the rest of the lesson after 4 wordless bursts (`hushGiveUp`, meant for her own echo): 13 of 22 real barge-ins in two
   meetings got no hush at all. And the revoke fired on ANY sound in the first 1.5 s of her reply, so a "yeah" stopped her and
   dropped the reply. Changes, each a config row:
   - the give-up counts only ECHO-LIKE wordless bursts (within 10 dB of her echo estimate) and a confirmed burst resets it;
   - while she is hushed, an acoustics-only PAUSE waits for 1,000 ms of voice or the words (the hush already met the child);
   - an ended burst <= 650 ms with no words is never an acoustic barge-in (rising contour, her yes/no question excepted);
   - the revoke is ARMED by an onset over an open reply and fired by the same classifier (words, sustain); a continuer's words
     disarm it; a pending verdict still revokes at once (round 2's `rj-dxr-armed-revoke` tried arming without the hush fix
     and without the word-only disarm: +4/195 continuers, -2/51 barge-ins);
   - when a burst over her goes quiet the engine sends the micro-commit probe, so its words (continuer, "ruko", a turn) come
     back in ~0.3-0.6 s instead of the lane's first-text delay (D4 p90 2.0 s, MAI 3.2 s): "she can hear ruko while speaking";
   - a burst too close to her own echo to be hushed (echoLikelihood >= 0.5) is never stopped for on acoustics alone; its words
     decide (added after the first AMI after-run showed 26/195 continuer failures were un-hushed sustained bursts; on all
     4 meetings it bought +8 continuers, 146 → 154/195, for −1 barge-in stopped within 200 ms, 25 → 24/51).
   Rejected on the same data: pausing at 600 ms of voice while hushed (AMI 2 meetings, against the first after-run: bleed
   self-yields 79 → 94/421, barge-ins stopped at all 18 → 16, within 200 ms 11 → 10/22); kept at 1,000 ms although the
   simulated TaxilaFDB prefers 600 for "paused within 1 s".
   Net on AMI (4 meetings, 48 pairs, real adult speech, real D4 events): continuers kept 139 → 154/195, barge-ins stopped
   within 200 ms 17 → 24/51, room false yields 37 → 32/239, bleed self-yields 116 → 101/730 (CRITERIA.md §3).
4. **The owner-test cohort.** `TAXILA_DUPLEX_LIVE_FOR` (guardian emails or their sha256) gets `on` from
   `GET /api/duplex/config` while production stays `shadow`; the kill switch wins; a slow or failing lookup answers shadow.

## 5. Rejected this round (with what broke)

- **The fast semantic estimator in the loop for open speech** (re-measured): grok-4-1-fast text-only AUC 0.58 on the
  ambiguous pauses; the strong model (AUC 0.79) answers in 1.2 s, after the wait it would replace.
- **LiveKit's end-of-turn models** (text v0.4.1 and audio v1): licence restricts them to the LiveKit Agents framework.
- **Smart Turn v3.2 and its Hinglish fine-tunes**: synthetic-only Hindi training; AUC 0.75 on real human Hinglish (card);
  0.47 on our child TTS (round 1).
- **Prosody modifiers on the complete class**: no gain on TRAIN at a 3 % budget.
- **Unclosed plain words as a hold**: on D4 they are 9 ends vs 3 pauses.
- **A complete question to her answered at 0 ms** (round 2): 6 of 20 real pauses after "…ठीक है?" / "…ना?" were cut (MAI);
  900 ms cuts 1/20.
- **The hush giving up for the whole lesson after 4 wordless bursts**: 13/22 real barge-ins (2 meetings) never hushed.
- **Revoking her reply on any sound in its first 1.5 s**: 26/195 real continuers stopped her and dropped the reply.
- **The hands-free switch failing OPEN to "on"** while production is shadow: on a loaded local production server the page's
  config read did not answer within 1.5 s and the lesson went live without the server's answer (patch 02).
- **A device-side silence ruler as the cut-off baseline**: the round-2 "silence-900 = 4.8 %" is the annotation's ruler; the
  device's own silence-900 cuts 12.9 % of the same pauses. Both are now reported.
- **Not built, named as the next step**: a target-speaker (personal VAD) model enrolled on the child's first committed turns
  for TV / sibling rejection (needs a licence-clean on-device speaker embedding; pitch / level attribution alone was rejected
  in rounds 1-2), and a better on-device VAD (the ~200 ms ruler error).

Sources: [LiveKit EoT v1 / eot-bench](https://livekit.com/blog/solving-end-of-turn-detection) ·
[LiveKit v0.4.1](https://livekit.com/blog/improved-end-of-turn-model-cuts-voice-ai-interruptions-39) ·
[LiveKit Model License](https://huggingface.co/livekit/turn-detector/blob/main/LICENSE) ·
[LiveKit adaptive interruption](https://livekit.com/blog/adaptive-interruption-handling) ·
[Deepgram Flux eager EoT](https://developers.deepgram.com/docs/flux/voice-agent-eager-eot) ·
[Endpoint Anticipation](https://arxiv.org/abs/2606.13450) · [Kyutai STT](https://kyutai.org/stt) ·
[Smart Turn](https://github.com/pipecat-ai/smart-turn) · [smart-turn-hinglish](https://huggingface.co/abhishek-040010/smart-turn-hinglish) ·
[Chhotu](https://huggingface.co/Vishwas07/chhotu-turn-detection) · [Hertz-dev](https://si.inc/posts/hertz-dev/) ·
[Multilingual VAP](https://arxiv.org/abs/2403.06487) · [Hindi prosody review](https://arxiv.org/pdf/1705.03247) ·
[code-switching survey](https://arxiv.org/pdf/1904.00784) · Moshi, TurnBench, FDB, IndicFDB, Talking Turns: as cited in
`docs/research/duplex/MODELS-PAPERS.md` §4 and `docs/design/round2/duplex-real/RESEARCH.md`.
