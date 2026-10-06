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
2. **Note-parallel reply** (inside `perceive()`, **default OFF** after measuring it): when classify returns a non-answer
   while the note is still out, the no-note plan's reply is written at once instead of after the note wait. Used only
   through the existing exact reply-key match. Measured: 8 launches in 40 turns, 1 used (the note changed the plan in the
   other 7; 29 more were already covered by a speculative reply). Behind `TAXILA_NOTE_PARALLEL=on`.
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

## 5. Results (measured, 2026-10-06)

Harness `evals/latency/turn-e2e.mjs` (header states the method): local in-process API on a scratch copy of HEAD with
patches 01-03, Neon TEST branch, prod model routing, synthetic child speech (gpt-4o-mini-tts ×1.2 pitch, NOT children),
transcription over WebSocket from this US sandbox to eastus2, one cascade lesson on c4-maths-ch01-t01 per run, 20 turns.
"sound" = first PCM byte + 60 ms player lead + a NOMINAL 50 ms device output latency (not measured). ms, p50 / p90.

| run (file in `evals/latency/results/`) | n | turn sent after speech end | Brain (turn → JSON) | TTS first byte | **speech end → sound** |
|---|---|---|---|---|---|
| before-local (HEAD, no prefetch, Diya India resource) | 17 | 1,735 / 2,754 | 3,060 / 4,258 | 798 / 858 | **5,380 / 8,045** |
| after-local-2 (prefetch + note-parallel on, India resource) | 20 | 1,569 / 1,605 | 2,575 / 3,930 | 633 / 817 | **4,675 / 6,052** |
| base-local-3-eastus2 (same tree, no prefetch, speech eastus2) | 20 | 2,002 / 3,304 | 3,138 / 4,411 | 378 / 440 | **6,049 / 7,318** |
| after-local-3-eastus2 (prefetch, note-parallel off, speech eastus2) | 20 | 1,576 / 1,691 | 2,564 / 3,687 | 396 / 436 | **4,506 / 5,754** |
| pooled no-prefetch (before + base3) | 37 | 1,842 / 3,079 | 3,074 / 4,383 | 435 / 828 | **5,742 / 7,597** |
| pooled prefetch (after-2 + after-3) | 40 | 1,569 / 1,641 | 2,564 / 3,930 | 412 / 801 | **4,670 / 6,052** |
| prod ee97e9c, taxila.dev ACA eastus2, from the US sandbox, /turn + /tts-stream (prod-turn) | 12 | 1,625 / 1,647 | 3,366 / 4,808 | 876 / 901 | **5,999 / 7,012** |

- **What the prefetch does, mechanically:** adopted 58/60 turns over the three prefetch runs (the 2 misses: no prefetch
  had been sent). It arrives `aheadMs` ≈ 220-680 ms (p50 ~450) before the turn, so classify and the note start that
  much earlier. Deltas equalled the completed transcript 77/77. Brain p50 −485 ms (before vs after-2) and −574 ms (base3
  vs after-3), but those pairs are **confounded by guard rewrites** (16/20 turns rewrote in base3, 11/20 in after-3) and
  by STT drift between runs (base3's endpoint+STT was 400 ms slower than after-3's). The honest attributable gain is
  the head start, ≈ 0.4-0.5 s p50.
- **Speech region eastus2:** TTS first byte p50 633 → 396 ms on the same harness (after-2 vs after-3; first-byte bench
  431 → 230 ms). An ops change.
- **Cost of the prefetch:** 39-41 sends per 20 turns; every send starts classify + the note + up to 3 speculative
  replies, and about one send per turn is superseded by later deltas (the transcription emits in blocks ~450 ms apart).
  Offline replay of the 64 recorded delta timelines: debounce 250 ms → 0.98 wasted sends per turn, lead p50 512 ms;
  400 ms → 0.53, lead 362 ms; 600 ms → 0.23, lead 162 ms. Default kept at 250 ms; the cost is ~1 extra perceive per turn
  [estimate ≈ $0.004: one grok classify, one gpt-6-sol note, three taxila-fast replies]. Rate-capped at 30 per lesson
  per minute.
- **SHADOW ack:** would have fired 2/20 in after-3 (graded answers only; 14 non-answers, 3 token screen), ready
  1,501 and 1,821 ms after speech end, i.e. ~2.7-3.0 s before the reply's sound on those turns. Not played.
- **Acceptance** (`tests/prod/round2-latency.mjs`): local 12/12 (gates, adopt only identical words, a disclosure via the
  prefetch still gets the safeguard with 1098 / 14416 digit-exact, adopted 10/10, turn → first audio p50 3,098 → 2,481
  ms text-only with a fixed 600 ms lead). taxila.dev: the route 404s (not deployed): 1/3, as expected; arm A turn →
  first audio p50 2,773 / p90 3,582 ms (n=10, US sandbox → eastus2).

### What is still short of the bar, and why

V4.3 first sound p50 ≤ 900 ms: **not met. Best measured p50 4,506 ms (local, synthetic speech).** Where it goes, p50:

1. **End of turn ~1.1 s + "completed" transcript ~0.5 s** = the turn is sent ~1.57 s after the child stops. The server VAD
   waits 900 ms of silence. A word-aware end of turn is the duplex stream's TaxilaFDB (SHADOW); a fixed shorter silence
   cuts children off (`rj-silence-gated-turn-taking`). Sending the turn on the stable deltas (they equalled the final
   77/77) would save ~0.5 s but is an end-of-turn decision on a 650 ms silence: not without the word-aware engine.
2. **Guard rewrites: the single largest remaining cost.** 46 of 77 measured turns rewrote (60 %; MODEL-STACK assumed
   10 %). A rewritten turn's Brain stage is ~3.3 s vs ~1.4-1.7 s clean (reply stage 2.5 s vs 0.05-0.9 s). The guards
   behind them (counts over rewritten turns): ask 22, drift 10, noconfirm 9, long 7, praise 6, script 5, leak 4. Fixing
   the prompt so first drafts pass is a quality/prompt change owned by the interaction stream; a parallel second draft
   was already rejected (`rejected.md`: two parallel drafts). Expected gain if rewrites fell to 10 %: ≈ −1 s p50.
3. **Classify + the note** (~0.8 s and up to 2.2 s from their start) must finish before a dependent reply: the floor and
   the grade. The prefetch starts them ~0.45 s earlier; nothing else can move them without a faster model (a quality
   trade the owner ruled out: note bake-off 87-85 % vs 90 %).
4. **TTS ~0.4 s** (eastus2) + network to India ~0.15 s.

Sum of the irreducible parts with every model call hidden behind the end-of-turn wait ≈ 1.0-1.1 s; with this cascade's
real model times ≈ 1.7-2.7 s. **The 900 ms bar is not reachable for the content reply on a cascade that must grade and
read distress first;** an acknowledgement sound is the only path under ~1 s, and it may only be played after the distress
read (≈ 1.5-1.8 s after speech end measured), so it does not meet 900 ms either.
