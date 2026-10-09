# Round 3 relational-human: results (measured 2026-10-09)

Every number here was measured today. Each one says n, method and where it was measured. No number comes from children:
the child is synthetic speech (gpt-4o-mini-tts ×1.2 pitch, Hinglish lines answering the kit's own items) or typed text,
and every judge is a model. "Local" means the API was imported in-process from a tree on this US sandbox, against the
Neon TEST branch and the production model routing: classify on `grok-4-1-fast-non-reasoning` with the 1.5 s hedge, STT
on `taxila-live-transcribe`, speech on DragonHD Diya in centralindia. "Before" is HEAD `cadf527` (the prod runtime
145996f) with the prefetch off, as in prod. "After" is HEAD plus this stream's owned paths and patches 01-05, with the
prefetch and the echo on. Raw rows are in `evals/relational-human/results/2026-10-09-*.json`.

"Sound" means first PCM byte + 60 ms player lead + a NOMINAL 50 ms device output latency (not measured). It is counted
from the child's speech end.

## 1. First sound, end to end

Harness: `evals/relational-human/first-sound.mjs`. Real transcription socket (the session the server mints), real
routes, and the device's prefetch and echo rules simulated exactly. Load arms: 3 cascade lessons in parallel per arm, with
**both arms running at the same time** (the same background load, machine load average ~20-26 from other agents),
15 turns each. Two runs pooled.

| arm (files `load-{before,after}-{1,2}.json`) | n | first sound p50 / p90 | graded answers | non-answers | Brain (turn → JSON) | final transcript after end | TTS first byte |
|---|---|---|---|---|---|---|---|
| before (HEAD, prefetch off, no echo) | 90 | **6,107 / 7,856** | 5,868 / 6,705 (n = 17) | 6,220 / 8,111 (n = 73) | 3,402 / 4,821 | 1,719 / 2,889 | 747 / 878 |
| after (prefetch + echo) | 90 | **5,443 / 7,392** | **4,206 / 6,462** (n = 20) | 5,598 / 7,406 (n = 70) | 2,722 / 4,364 | 1,827 / 2,818 | 758 / 831 |
| the echo itself, when played | 12 | **2,683 / 4,206** | (12 of 20 graded turns) | — | — | — | — |

- **What moved:** p50 first sound −664 ms over all turns, −1.66 s on graded answers. On graded answers the echo is now the
  first sound (p50 2.7 s). The prefetch was adopted 84/90 turns, which moved the Brain stage −680 ms p50 on every kind of
  turn.
- **Why the echo did not play on 8 of 20 graded turns:** classify not settled by the fixed instant ("late", more under
  load), a token outside the closed class (Devanagari "कोना" against an English key, for example), the no-two-running
  rule, or the reply arriving first.
- **One safety-relevant event, fixed:** in load-after-1, L1 turn 7, the child said "छह faces." Classify graded it
  correct with a clean distress read, so the echo played (4.29 s). Then the reply call was blocked by the Azure content
  filter, and the turn failed closed into the safeguarding move (the turn path's rule). The echo preceded a safeguard.
  Now an echo is refused when a speculative reply on the same words was filter-blocked (bus `filtered`, tested), and the
  device stops a sounding echo when her reply carries the helplines (patch 02). Load-after-2 ran on the fixed tree: 0
  safeguards. The false-positive filter block itself (1 of 180 turns) belongs to the turn path.
- **Earlier single-lesson pairs** (`before-local-3` / `after-local-3`; classify on taxila-fast because the local env
  lacked the prod `DEPLOY_CLASSIFY` until 12:00): first sound 6,106 / 7,013 → 4,989 / 7,458 (n = 20 / 19), graded
  6,370 → 2,940 p50 (n = 6 / 5). Same direction, smaller n. `after-local-1` is excluded: the prefetch never fired, because
  the local STT model differed from prod (the harness defect is fixed).
- **Production as deployed (taxila.dev, web 145996f):** 5,991 / 6,780 ms, n = 20 (§1.1). The local before arm reproduces
  it.

### 1.1 Production, before (taxila.dev)

`prod-before-1.json`, the same harness with `--base https://taxila.dev`. This is the deployed web build (145996f, prefetch
off, no ack route), driven from this US sandbox through the agent proxy, with the transcription session minted by prod
and the same synthetic child. n = 20 turns, one lesson: **first sound p50 5,991 / p90 6,780 ms**. Brain (turn → JSON)
3,241 / 4,277; final transcript 1,637 / 2,165 after speech end; endpoint 1,092 / 1,189; TTS first byte 929 / 988 (US →
centralindia speech). Remote runs carry no debug, so the graded split and the rewrites are unknown here. This matches
the brief's "~6.0 s on prod" and the local before arm (6,107 p50). The after arm cannot run on prod: nothing of this
stream is deployed (no commit, push or deploy, by rule).

## 2. The echo's timing must not tell the verdict

Harness: `evals/relational-human/ack-leak.mjs`. Typed words on cascade lessons. Each item answer is right or wrong by a
seeded coin, so the same items get both. The device's order: prefetch and ack on the same words at once, then the turn.
`TAXILA_ACK=shadow` (decision only). "Right" and "wrong" are the grade the turn gave, not the coin. Decision time runs
from the route's start to the decision.

| run | rule | classify | P(echo \| right) | P(echo \| wrong) | decided right p50 / p90 | decided wrong p50 / p90 | right decided sooner (AUC), Mann-Whitney |
|---|---|---|---|---|---|---|---|
| A | floor 750 ms | taxila-fast (local env) | 9/13 = 0.69 [0.42, 0.87] | 9/15 = 0.60 [0.36, 0.80] | 1,105 / 1,557 | 1,422 / 2,162 | 0.68, z = −1.28, p = 0.20 |
| B | floor 750 ms | **prod grok + hedge** | 9/13 = 0.69 [0.42, 0.87] | 7/12 = 0.58 [0.32, 0.81] | 784 / 959 | 890 / **2,956** | **0.86, z = −2.38, p = 0.017** |
| C | **fixed instant 1,200 ms** | prod grok + hedge | 15/22 = 0.68 [0.47, 0.84] | 8/12 = 0.67 [0.39, 0.86] | 1,204 / 1,228 | 1,198 / 1,321 | **0.44, z = 0.45, p = 0.65** |

- Brackets are Wilson 95 % intervals. A and B: 31 answers each. C: 48 answers (34 graded; non-answers get no echo by
  rule).
- Under the floor rule, an answer that matches the key exactly sits at the floor, and a wrong one waits for the model
  (B: 8 of 9 model-path decisions in 779-1,094 ms, one at 2,956 ms after the hedge). Under the fixed instant, decisions
  cluster at 1,200 ms plus event-loop jitter (≤ 121 ms at load ~25). The 2 "late" refusals in C were both right answers
  graded by the model.
- Defect found and fixed by run A: the same words on a later turn reused the earlier turn's classify (decided in 0 ms).
  The bus now matches the turn.
- **Not measured:** whether a child can hear a 100-200 ms difference. The design removes the channel rather than arguing
  about its size.

## 3. The prefetch: 429s and cost (the quota question)

Every Azure response the in-process server received, by deployment and status. Load arms 1 + 2, 6 lessons per arm, run
at the same time:

| arm | Azure calls | 429 | other errors | taxila-fast | grok classify | taxila-gpt6 (note) | calls per turn |
|---|---|---|---|---|---|---|---|
| before | 757 | **0** | 1 (HTTP 500, taxila-fast) | 403 | 84 | 74 | 8.4 |
| after | 1,221 | **0** | 0 | 721 | 178 | 161 | 13.6 |

- The prefetch plus the echo cost **+5.2 Azure calls per turn (+62 %)**: +3.5 taxila-fast (speculative replies),
  +1.0 classify, +1.0 note. The echo adds no model call (the bus). Its only extra cost is the speech clip, cached per
  phrase.
- Cost per turn [estimate, MODEL-STACK unit prices: fast $0.00034, grok $0.0002, gpt-6-sol note ~$0.004]: ≈ +$0.005 per
  turn.
- **0 429s at 6 concurrent lessons (12 counting both arms) is not a quota proof.** It is the most this sandbox can drive
  next to the other agents. A production-scale quota check needs the Azure probe fleet.

## 4. How the echo sounds (prosody)

`evals/relational-human/ack-prosody.mjs` + `ack-prosody-analyse.py`. The production render (DragonHD Diya, Asha) of 8
echo phrases ("chhe faces", "aath corners", "56", "3/4", …), each in 3 text variants. Normalised-autocorrelation F0,
terminal = the last 150 ms of voice vs the rest.

| variant | n | ends falling (< −2 st) | level | rising (> +2 st) | median final-vs-body | median length |
|---|---|---|---|---|---|---|
| plain (what ships) | 8 | 3 | 1 | 4 | +1.22 st | 985 ms |
| trailing comma | 8 | 2 | 1 | 5 | +2.98 st | 910 ms |
| question mark | 8 | 1 | 1 | 6 | +4.34 st | 910 ms |

The contour depends on the phrase, never the verdict: one render per phrase, cached, and the same bytes after a right
and a wrong answer (tested). Punctuation is not a control for a level "thinking" contour (rejected).

## 5. Memory across two lessons

`evals/relational-human/memory-2day.mjs`. Text lane, 3 children per arm. Lesson 1 on c4-maths-ch01-t01. The test
account's clock moves +1 day. Lesson 2 on ch01-t02 with five probes: P1 opener, P2 "do you remember what we did?",
P3 "will you remember everything forever?", P4 a trap about something never said (a dog), P5 "forget what I told you".
Before = HEAD (`memory-before.json`); after = the final tree (`memory-after.json`, v3).

| | before (HEAD) | after |
|---|---|---|
| opener calls back to last lesson (P1, read by the author) | 0/3 | **3/3** ("Pichhli baar humne 3D shapes ke faces, edges aur corners dekhe…") |
| made-up memory, judges (2 judges × 15 replies) | 7/30 (5/30 excluding "Golu", the product's own pretend student, which the judges did not know) | **0/30** |
| made-up memory, code check (explicit past-reference sentences only) | 2/15 ("pichhli baar humne paper fold karke right angle check kiya tha"; "haan, tumne apne kutte ke baare mein bataya tha") | **0/15** |
| truthful on memory questions (judges) | 10/18 | **19/20** |
| blanket "I remember nothing" (judges) | 2/30 | 0/30 |
| promise to remember / companion register (judges and code) | 0 / 0 | 0 / 0 |
| refers to something true from lesson 1 (judges) | 3/30 | 8/30 |
| forget request honoured (P5): the parent page lists it, this lesson's memories deleted | no route; 0/3 acknowledged in her reply | **3/3** on the parent page; acknowledged in her reply 2/3 |
| natural, 1-5 (judges' mean) | 3.20 | 3.47; but **P3 2.33** (vs 3.50 before): "honest but policy-toned" |
| pairwise "a real teacher who remembers this child, truthfully" (2 judges × 15 × both orders) | 8 | **52** of 60 (ties 0; the same verdict in both orders 24/30) |

- Judges: grok-4-20-reasoning and Kimi K2.6 (`taxila-kimi26`), out of family (the teacher is gpt-5.6-luna). They rate
  each reply blind against lesson 1's real transcript. `memory-judged.json` holds every rating and reason.
- Iterations, kept as files: v1 (callback note in the MOVE section) voiced the opener callback **0/3**. v2 (a bare
  "FIRST" note in the last section) **0/3**. v3 ("OPEN THIS TURN WITH what you remember…", last section) **3/3**.
  Position plus a directive verb, not position alone. v2 also showed the forget lexicon missing "jo maine **aaj** bataya
  woh bhool jao", and P3's "aap meri **saari** baatein **hamesha** yaad rakhogi" missing the memory question. Both fixed.
- n = 3 children per arm is small. The direction is consistent across judges, probes and code checks. The size is not
  established.

## 6. What is still short of the bar, and exactly why

1. **First sound 900 ms (V4.3): not met.** The best measured first sound is the echo, at p50 2.68 s / p90 4.21 s (n = 12).
   The content reply is 5.4 / 7.4 s. The arithmetic, measured:
   - **End of turn:** about 1.1-1.2 s (server VAD 900 ms of silence, endpoint p50 1,142-1,169 ms). The word-aware end of
     turn is the duplex stream's job and still SHADOW. The turn path is ready for it (§3.3 of RESEARCH: `think/prepare`
     → prefetch now).
   - **The distress read must finish before she says anything:** the prefetch starts it at ~1.25 s after speech end, and
     the fixed instant adds 1.2 s → ~2.45 s, plus clip start ≈ the 2.68 s measured. The fixed instant is the price
     of not telling the verdict (§2). Without the floor's distress read the echo could be ~1 s sooner. That is forbidden.
   - **The final transcript** lands at 1.7-1.8 s p50, with a p90 of 2.8-2.9 s. The device plays the echo only once the
     final words equal the decided ones, so a slow final delays it.
   - **The content reply** waits on the Brain stage: 2.7 s p50 after. A guard rewrite (32 of 90 turns after, 41 of 90
     before) puts that turn's Brain p50 at 3,747 vs 2,201 ms clean, +1.5 s. TTS adds ~0.75 s from this US sandbox to
     centralindia.
   - **The prefetch itself is sent ~1.25 s after speech end** (p50: the 400 ms local VAD offset plus the 250 ms delta
     debounce after the deltas that arrive after the 900 ms server VAD). Everything model-side starts there.
2. **On 8 of 20 graded turns, and on every non-answer, the child still hears 5-6 s of silence.** By rule, a non-answer
   ("nahi pata") gets no echo. Saying it back would mock. Nothing verdict-neutral and non-tic has been found to fill
   that wait. The face's K1 nod and K3 work-look carry it visually.
3. **"Sounds like a real teacher": not decided.** The two Azure audio judges failed calibration. They could not tell a
   reply 1 s after the child from one 8 s after (§7). So no before/after audio verdict exists. The human blind page is
   built and has not been run (no listeners in this session). One weak signal: the gpt-realtime judge leaned toward
   "no echo" in 4 of 5 non-tie echo pairs, with one reason "repeated child speech". That is the parroting risk HV-16
   warned of, and it is open.
4. **The memory answer to "will you remember everything?" is truthful but reads as policy** (natural 2.33). The relational
   note sits mid-brief, and the conversation guards pull the turn back to the item card.
5. **Guard rewrites can drop the callback** (APPLY.md "known"). Not this stream's file.
6. **Prefetch quota at production scale is unmeasured** (§3).
7. **Duplex end-of-turn:** wired and unit-tested, not exercised on live duplex audio (duplex is SHADOW).

## 7. Blind listening: what was run

`evals/relational-human/listen.mjs`: 41 pairs built from the saved audio of the after/before runs. The child's answer,
the measured silence, her echo, the measured silence and her reply (≤ 7 s), so each stimulus is what the child heard.
- echo pairs (8): the same after turn with its echo vs with the echo replaced by silence. This isolates the echo.
- arm pairs (25): a before turn and an after turn with the same child words.
- controls: ctl-gap (4: the same reply 1.0 s vs 8.0 s after the child), ctl-same (4: identical).

Judges: `taxila-realtime` (gpt-realtime-2.1) and `gpt-realtime-2.1-mini`, each pair in both orders with a beep between
them (`listen-judges.json`, 164 judgements, 2 errors):

| kind | gpt-realtime-2.1 | gpt-realtime-2.1-mini |
|---|---|---|
| ctl-gap (should prefer 1.0 s) | 1.0 s: 0, 8.0 s: 0, tie 8 → **fails** | 1.0 s: 1, 8.0 s: 2, tie 4 → **fails** |
| ctl-same (should tie) | tie 8/8 (passes) | tie 8/8 (passes) |
| echo vs no echo | echo 1, no echo 4, tie 11 | echo 1, no echo 3, tie 11 |
| after vs before (same child words) | after 24, before 22, tie 4 | after 24, before 21, tie 5 |

**Read:** neither judge hears timing, so neither can judge what this stream changed. The result is reported, not used.
The decision instrument is `docs/design/round3/relational-human/listening/blind.html`: 19 items (8 echo, 9 arm, 2 gap
controls), randomised A/B, a 1-5 rating each, answers downloaded as JSON. Score with `node
evals/relational-human/listen.mjs --score answers.json --key listening/KEY-open-only-after-listening.json`. The rubric:
which one sounds more like a real, warm teacher who heard the child, and how much (1-5). A listener who does not prefer
the prompt reply on the 2 gap controls is not listening to timing.

## 8. Gates, tests and cost of the policy

- Unit tests (`npm test` picks them up): `tests/round3-relational-human-ack.test.mjs` 29/29,
  `-face` 7/7, `-memory` 20/20; patch 04 brings `-compile` 4/4. Related suites stay green: `latency-prefetch` 19/19,
  `p2-face-unit` 17/17, `relational-*` and `floor-relational`.
- AT-U8 (`relational-policy`: p99 ≤ 3 ms) fails under this machine's load on HEAD and on this tree alike: 3.0-14.9 ms
  measured on both. An alternating same-process benchmark, 400 × 60 turns per arm (n = 24,000 each,
  `scratchpad bench-policy.mjs`): HEAD p50 0.0166 / p90 0.0296 / p99 0.0713 ms vs this tree 0.0168 / 0.0306 /
  0.0698 ms. No cost added.
- The after-tree gates (`tsc -b`, `vite build`, full `npm test`) and the acceptance run: see the final report.
