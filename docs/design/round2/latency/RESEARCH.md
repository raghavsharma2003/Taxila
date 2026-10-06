# Round 2 · stream latency · RESEARCH: the silence after the child answers

Owner complaint #1 (2026-10-05/06): about five seconds of silence after the child answers. Bar: V4.3 first sound p50
≤ 900 ms from the child's last word. This file is the study (what the best systems do, with what they measured), what
transfers to a Hindi-English voice tutor for 9-15 year olds on Azure only, the design chosen, and the arithmetic that
says what that design can and cannot reach. Measured numbers carry n, method, date and where they were taken from.
Labels: **[M]** measured here, **[V]** read in the source, **[S]** a search summary of the source (abstract-level,
not read in full).

## 0. Where the 5 s goes today (measured, this round)

`evals/latency/turn-e2e.mjs`, 2026-10-06, local in-process API on the HEAD tree (ee97e9c's server path), Neon TEST
branch, prod model routing (classify `grok-4-1-fast-non-reasoning` with the 1.5 s hedge, reply `taxila-fast`, note
`taxila-gpt6`, STT `taxila-live-transcribe` with the session the server mints: server VAD 0.6 / 900 ms), Diya
DragonHD over the production websocket client (the India Speech resource prod's eastus2 app uses), synthetic child
speech (gpt-4o-mini-tts, ×1.2 pitch), one cascade lesson on c4-maths-ch01-t01. From the US sandbox through the agent
proxy. n = 17 turns. [M]

| stage (child's speech end → …) | p50 | p90 |
|---|---|---|
| server VAD `speech_stopped` (900 ms silence + detector) | 1,099 | 1,492 |
| + "completed" transcript (the turn is sent) | +637 | +1,293 |
| last transcription delta (the words are already all there) | 863 after the end | 1,294 |
| turn request → turn response (the Brain: classify, note, plan, reply, guards, commit) | 3,060 | 4,258 |
| turn response → first audible PCM (Diya, prewarmed) | 798 | 858 |
| **speech end → first audio byte** | **5,270** | **7,935** |

Inside the Brain (debug phase marks, same run): classify ~550-950 ms (a grok call; it also carries the model's distress
read); the UNDERSTAND note wait on non-answer turns +800-1,450 ms more (gpt-6-sol p50 1.8 s from its start); the reply
0 ms on a clean speculative hit, 0.7-1.3 s on a miss, and **+1.3-3.3 s when a reply guard rewrites** (9 of 17 turns
rewrote: `ask`, `long`, `praise`, `noconfirm`, `leak`, `script`, `stage`); the commit ~60-80 ms. Speculative replies hit
9/16: every miss had a different move or verdict in the real plan (the note changed the request: "nahi pata, ek baar
aur batao" → repeat / dont_know), never a timing artefact.

The production report's shape (2.4 s end-of-turn, 1.9-4.3 s server, 0.5-1.8 s to first audio) is this table.

## 1. How the best systems get first audio under ~1 s

1. **Budgets of a fast cascade.** Voice-Light (arXiv 2609.20995, 2026; full-duplex cascaded agent, 36 turns in three
   operator sessions, an instrumented case study, not a user study) [S]: 758 ms median from the final VAD endpoint to
   first server audio, 21/36 under 800 ms; the traced turns break down as endpoint commitment 502 ms, LLM first word
   336 ms after generation start, TTS first PCM 444 ms after that word, server→browser 95 ms. Their main lever is
   **speculative generation**: turns that promoted speculative work had a median of 667 ms vs 1,513 ms without (9 of 13
   fully traced turns promoted) [S]. What transfers: the shape (start everything on the partial, promote on the final).
   What does not: a 336 ms first word assumes one LLM call; our turn has a grade (classify) and a distress read that
   must finish first, plus a guarded reply.
2. **Eager end of turn.** Deepgram Flux `EagerEndOfTurn` (developers.deepgram.com/docs/flux/voice-agent-eager-eot) [S]:
   start the LLM on a medium-confidence end of turn; the eager event comes 150-250 ms before the final one at threshold
   0.3-0.5; median response latency drops ~150 ms when it triggers (top 5 % ~350 ms); cost **50-70 % more LLM calls**; a
   `TurnResumed` cancels the speculative request. Transfers directly: our equivalent is the device's stable partial
   (§0: the joined deltas are complete ~0.8 s before the final transcript on gpt-live-transcribe). The cost line is the
   one to respect: Azure quotas are maxed.
3. **Learned end-of-turn instead of a fixed silence.** Tavus Sparrow-0/1 (tavus.io blog) [S]: an audio-native turn-taking
   transformer, ~600 ms responsiveness, Sparrow-1 55 ms median prediction latency, "zero interruptions across 28
   samples" (vendor numbers, no child speech). Pipecat Smart Turn v3.x (BSD-2, 8 MB, Hindi in its training set) [V,
   docs/research/world-best/voice-ux-smoothness.md S1]. LiveKit's turn detector (Hindi TPR 99.4 / TNR 96.3, text-only,
   LiveKit model licence) [V, same file]. **Our own measurement says silence is the wrong primary signal for children**:
   at age 9, 85 % of ≥ 250 ms silences are holds; silence-640 cut the child off on 15/25 scripted scenarios, words plus
   the lexical horizon on 0/25 (`rj-silence-gated-turn-taking`). That is the duplex engine's design (TaxilaFDB, owned
   by the duplex stream, SHADOW in prod).
4. **Stream the LLM into the TTS; speak the first clause.** Standard in every vendor stack. **Measured NOT to help us**
   (`reply-streaming-no-gain`, `tts-first-clause-no-gain`, 2026-10-02): a 30-60-token reply's first content delta lands
   37-140 ms before the call ends (Azure releases filtered text in blocks), and TTS first byte is length-independent
   (262 vs 260 ms). The guards also read the whole reply. Not repeated.
5. **Acknowledge before the answer is ready.** A behavioural filler (verbal + gesture) improved perceived response time,
   humanlikeness and naturalness and was preferred by 87.5 % (Gonzales, Kalamkar, Jörg, Grubert, arXiv 2508.11781, n=24,
   adults, VR) [V via voice-ux-smoothness.md S3]; symbolic wait indicators did not (`rj-symbolic-wait-indicator`). A fixed
   filler list heard daily becomes a tic (`rj-static-filler-list`; Voice Live's `static_interim_response` waits 2 s by
   default, which is already too late). The transferable form is the **uptake echo**: the child's own answer token said
   back, neutral for right and wrong, built in code (TEACHER-BRAIN §5.4 L3; the prelude, behind HV-16's listening check).
6. **Keep the speech socket warm and near the server.** Every vendor keeps a warm TTS connection. Measured here [M]
   (`evals/latency/tts-region.mjs`, 2026-10-06, sandbox US via the agent proxy, n=12 warm per arm, alternating, Diya with
   visemes): first byte p50/p90 **India resource 431/467 ms, eastus2 resource 230/496 ms**; cold socket 1,731 vs 891 ms;
   Diya's leading silence before the first audible sample p50 169 ms (n=26). The eastus2 AIServices account serves Diya
   with the existing key.

## 2. What transfers, and the constraints that do not move

- **The grade and the distress read finish before any committed reply that depends on them.** So the reply cannot be
  committed on a partial; it can only be *prepared* on one and *adopted* when the final words are byte-identical.
- **Quotas are maxed.** Every speculative call competes with real turns for the same TPM; a 429 on a real turn is worse
  than a slow turn. Speculation must be bounded (rate-limited per lesson, capped per item) and its waste measured.
- **Children answer slowly and pause mid-thought** (§1.3): a shorter fixed silence is not a fix; the duplex engine's
  word-aware end of turn is, and it is another stream's (SHADOW in prod).
- **Never a canned filler loop; never anything on a safety turn; never a verdict before the grade.**

## 3. Design chosen (this stream)

1. **Turn prefetch on the stable partial** (`server/latency/perceive.js`, `server/latency/routes.js`,
   `src/latency/prefetch.ts`; patches 01-03). The device sends the joined transcription deltas once the child is quiet
   (its energy VAD offset, 400 ms) and the deltas have been still for 250 ms (≤ 3 sends per item). The server runs the
   turn's own perceive stage on them — classify (grade + model distress read), the UNDERSTAND note, the speculative
   replies — with the same code (`perceive()` is what `lessonTurn` now calls) and parks it. The `/turn` that follows
   adopts it **only when the fingerprint matches**: the same lesson, the same stored state (hash of the jsonb), the same
   words byte for byte, every classify input except the ASR confidence, the same barge-in bit; and classifyFast on the
   real confidence returns the identical result. Otherwise the turn does its own work, exactly as before. Consent,
   auth, ended lesson and lane gates are the turn's own (`loadTurnContext`); a withdrawn consent sends nothing to a model.
   It also opens the Diya socket if the replica has none.
2. **Note-parallel reply** (inside `perceive()`): when classify returns a non-answer while the note is still out, the
   no-note plan's reply is written at once instead of after the note wait. Used only through the existing exact
   reply-key match; when the note changes the plan the key differs and the turn writes its reply as before.
3. **Speech region = server region** (an ops change, no code: `deploy-azure.mjs --set AZURE_SPEECH_REGION=eastus2
   --secret AZURE_SPEECH_KEY=AZURE_OPENAI_API_KEY` while the app is in eastus2; India resource when the app moves to
   India). Measured −200 ms p50 first byte (§1.6).
4. **The acknowledgement, SHADOW only** (`server/latency/ack.js`): decided after classify (so after the model distress
   read) on graded answer turns only, the child's own answer token through the prelude's closed-class screen, never
   on a safety turn / open safeguard / filter block / goodbye, never two turns running. The prefetch returns the decision
   and its time; nothing is played. Playing it needs a client change (sound a short clip before the reply; the reply's
   part 0 drops its own echo) and HV-16's listening check that the echo sounds like a teacher, not a parrot.
5. **Not done here, on purpose:** the end-of-turn decision (the duplex stream's TaxilaFDB; `turn.predictive` stays as it
   is), a faster note model (the bake-off: grok 87 % / fast 85 % policy-move accuracy vs gpt-6-sol 90 %; a quality trade
   the owner has ruled out), changing the reply guards (the rewrites are a quality gate owned by the interaction stream).

## 4. The arithmetic (why 900 ms content first sound is not reachable on this cascade, and what is)

Content reply, best case per stage, measured: end of turn on words ~0.5 s (duplex engine, simulated: cce-fast gap p50
400 ms) + STT final already in (deltas) + classify ~0.6 s (must finish) + reply ~0.7-1.0 s (spec hit ≈ 0) + guard
rewrite 0 (when clean) + commit 0.06 s + TTS first audible ~0.4 s (eastus2, warm) + network to India ~0.15 s
≈ **1.7-2.7 s**. Even a perfect prefetch (all model work done during the end-of-turn wait) leaves end-of-turn + TTS +
network ≈ 1.0-1.1 s. **900 ms is not reachable for the content reply on a cascade that must grade and read distress
first.** It is reachable only for an acknowledgement decided on the device (≈ end of turn + a cached clip), which the
safety rule forbids before the distress read; with the read, the ack's first sound is classify-bound (§5 of the
results). Reported as such, not rounded.
