# In-session context growth on the realtime teacher (gap-fill G2-in-session-context-growth, 2026-10-02)

**Question.** In a 20-40 minute lesson every child audio turn and every teacher audio reply piles up in the
realtime conversation. VOICE-TEACHER (VT) covered only the 60-minute rotation. It did not say what to set for
`truncation`, which items the director deletes, or whether old audio becomes text, and it did not say what growth
does to TTFA, cost per minute, cache hit or TURN SHAPE. This doc answers all of that with (a) the GA docs plus two
probes on our Azure resource, and (b) a scripted 30-minute audio-in lesson run 3-4 times per arm under five arms. The
chosen policy is (c) **§1.4** below, which is copied into VOICE-TEACHER §1.4.

Evidence tags as in VT: **[M]** measured here (n given, small; direction only), **[S]** published source,
**[I]** invented starting value, **[U]** unverified.

Everything is in `context-growth/`: harness `ctxgrowth.mjs`, scorer `score.mjs`, post-analysis `analyze.mjs`,
truncation probes `truncprobe.mjs` / `truncact.mjs`, raw rows `runs/*.jsonl`, outputs `results.json`,
`analysis.json`, `truncprobe.results.json` and `truncact.results.json`.

---

## 1. What the platform gives us (part a)

| fact | source |
|---|---|
| GA `session.truncation` takes `"auto"` (the default: drop the oldest items once input passes the limit), `"disabled"` (error instead), or `{type:"retention_ratio", retention_ratio 0-1, token_limits.post_instructions}`. The ratio drops extra history in one go, so the cache is busted less often. `post_instructions` caps the input tokens of a response, not counting instructions. | OpenAI cost guide [S] ([voice-latency-cost](https://developers.openai.com/api/docs/guides/voice-latency-cost?api=live)); OpenAI developer notes [S] ([blog/realtime-api](https://developers.openai.com/blog/realtime-api)) |
| "Truncation busts the cache near the beginning of the conversation." Their recommendation is to delete old items (`conversation.item.delete`) or replace them with a summary. | same cost guide [S] |
| Audio is about 10 tokens per second from the user and about 20 per second from the assistant, roughly 10x the text tokens for the same sentence. "The GA service will automatically drop some audio tokens when a transcript is available." | cost guide; [summarization cookbook](https://developers.openai.com/cookbook/examples/context_summarization_with_realtime_api); developer notes [S] |
| The summarization cookbook puts the summary in a **system** item at `previous_item_id:"root"`. An *assistant* summary item made the model drift from audio to text replies in long sessions. | cookbook [S] |
| `conversation.item.truncate` deletes the server-side transcript of an assistant item past `audio_end_ms`, so the context holds no text the user did not hear. Only assistant items can be truncated. | OpenAI realtime reference, quoted in [Azure Q&A 5605994](https://learn.microsoft.com/en-us/answers/questions/5605994/does-the-session-of-azure-openai-realtime-support) [S] |
| **Azure, GPT Realtime 2.x: "Currently, GPT Realtime 2.x models don't support the `truncation` property in the `session.update` payload. ... consider using `conversation.item.truncate` or `conversation.item.delete`."** The context window is 256,000 tokens. | [Microsoft Learn, GPT Realtime 2.x overview](https://learn.microsoft.com/en-us/azure/foundry/openai/concepts/realtime-2) (ms.date 2026-09-21) [S] |
| An Azure moderator tested `retention_ratio 0.2` on an earlier realtime model and saw no truncation. | [Azure Q&A 5605994](https://learn.microsoft.com/en-us/answers/questions/5605994/does-the-session-of-azure-openai-realtime-support) (2025-11) [S] |
| An Azure answer from 2026-04 says prompt caching is not supported on Azure realtime (`gpt-realtime-1.5`, `cached_tokens` stays 0). | [Azure Q&A 5845663](https://learn.microsoft.com/en-us/answers/questions/5845663/realtime-api-caching-behavior-available-through-op) [S], **contradicted on 2.1 below** |

**Probes on our resource [M, 2026-10-02, US container → our Azure endpoint, n=1 per cell]:**

- `truncprobe.mjs` sent `auto`, `disabled`, `retention_ratio 0.5`, and `retention_ratio 0.5` with
  `token_limits.post_instructions 8000`. Each went to `taxila-realtime` and to `gpt-realtime-2.1-mini`. **All 8 were
  accepted and echoed back** in `session.updated`, with no error.
- `truncact.mjs` built a text-only conversation of 40 filler items, about 9.1k tokens. With `auto`, with
  `retention_ratio 0.5 + post_instructions 1500` and with `ratio 1.0 + post_instructions 3000`, the response's
  `input_tokens` was **9,134 every time**. **The setting is echoed back but does nothing.** This agrees with Microsoft
  Learn. Treat any truncation config on Azure 2.x as inert, and do not trust the echo.
- **Caching does work on 2.1 on Azure**, against the 2026-04 Q&A, which was about 1.5. Every arm below reports nonzero
  `cached_tokens`, in multiples of 64, up to 6,592 per response.

**So on Azure today:** the 256k window means `auto` truncation would never fire inside a 40-minute lesson (the
default arm reached about 10.7k input tokens at minute 30). `retention_ratio` and `post_instructions` cannot be
used. **Context policy has to be done by the client or director, using `conversation.item.delete` and
`conversation.item.create`.** The problem to solve is cost, cache and adherence, not overflow.

---

## 2. The experiment (part b)

**Harness (`ctxgrowth.mjs`).** These are the real pieces: the director (`server/director/state.js` `step`, the real
classifier), the real `compile()` (`instructionsFor`, voice lane), the real class-6 maths kits (starting at
`c6-maths-ch07-t04` and chaining topics as the Conductor would), and Arjun's sheet. The child is "Riya", class 6,
Hinglish, played by `taxila-fast` and voiced by `gpt-4o-mini-tts` (coral, Indian-accent direction). The child audio
is sent as 24 kHz PCM16 **audio-in** to `taxila-realtime` (gpt-realtime-2.1) over WebSocket.

- Turn detection is off: the harness commits manually and sends `response.create`.
- The lesson clock is **simulated**: child clip + 0.9 s endpoint + measured TTFA + teacher audio + 1.5 s. This gives
  91-108 teacher turns per 30-minute session.
- **TTFA** is measured from `response.create` to the first `output_audio.delta`. This is the same definition as the
  [T] bake-offs, measured from the US container.
- **Barge-ins** happen at minutes 5, 15 and 25: `conversation.item.truncate` at 40% of the teacher's audio, then the
  child cuts in.
- **Scripted probes:** a pet fact (minute 0.6), identity questions at minutes 2, 11, 21 and 29.3, and recall of the
  pet's name at minute 27.5. These are eval inputs and never prompt text.

**Arms (context policy).** KEEP 8-16 means: when 16 exchanges are held, the oldest 8 are acted on.

| arm | per-turn sections (LESSON NOW → TURN SHAPE) ride in | history policy | sessions |
|---|---|---|---|
| **A default** | `response.create.instructions` (the full compile, as VT §1.3 specifies) | nothing deleted; truncation `auto` (inert, §1) | 4 |
| **B prune + recap** | `response.create.instructions`, plus a recap row at the end of the CHILD brief | delete the oldest 8 exchanges; fold them into a ≤70-word rolling **note-shaped** recap (taxila-fast) built from the **heard** text only | 3 |
| **C audio → text** | `response.create.instructions` | the oldest 8 exchanges are replaced in place (`item.create previous_item_id` + `item.delete`) by text items carrying the **heard** transcript | 3 |
| D (cache arm) | a **system item appended at the conversation tail**, deleted after the reply; stable CORE+CHILD in session `instructions` | as C | 4 |
| F (cache + prune) | tail system item as D | as B, but the recap row is written into the session-level CHILD block (`session.update` once per prune) | 3 |

A, B and C are the three arms the task asked for. D and F were added because the first two replicates showed that
A, B and C never cache the conversation (§2.1, cache row). A-4 and D-4 were run as a same-hour control pair at
23:01-23:18 UTC. One B-3 and one C-3 session were killed at lesson minute 23 when the previous agent session ended.
They are kept in `runs/crashed/` and were re-run in full.

**Scoring (`score.mjs`, `analyze.mjs`).** Checkpoints are windows: minute 1 = 0-2 min, then 9-11, 19-21 and 29-31.
Values are medians over pooled turns; n turns per checkpoint is 10-24.

- Cost uses the gpt-realtime-2.1 list price per 1M tokens: audio in $32, text in $4, cached $0.40, audio out $64,
  text out $24 (the same as Azure Global in `docs/research/realtime-cost-model.py`).
- English-drift is the share of teacher turns whose **matrix** language is English. It is labelled by taxila-fast in
  batches of 25, a single pass.
- Self-noun, recall and unheard-reference checks are labelled by taxila-fast. One positive `claims_human` label was
  read by hand: the reply calls itself an AI teacher, so it is a judge false positive.
- Turns retried after `inference_rate_limit_exceeded` are excluded from TTFA. They are kept for tokens and cost.

### 2.1 Results [M, n = 3-4 sessions per arm, 286-399 teacher turns per arm]

**Input tokens per response (median) at minutes 1 / 10 / 20 / 30**

| arm | min 1 | min 10 | min 20 | min 30 | audio share at 30 |
|---|---|---|---|---|---|
| A default | 1,302 | 4,264 | 7,598 | **10,668** | 4,325 audio |
| B prune+recap | 1,293 | 2,537 | 2,626 | **2,744** | 553 |
| C audio→text | 1,301 | 3,339 | 5,338 | **7,386** | 664 |
| D tail + a→t | 1,303 | 3,505 | 5,441 | 7,161 | 489 |
| F tail + prune | 1,300 | 2,388 | 2,404 | **2,408** | 523 |

A grows by about 330 tokens per lesson minute. Extrapolating, that is about 14k at minute 40. Even A's audio share
is far below the roughly 20 minutes of audio spoken, which fits the platform dropping audio where a transcript
exists [S].

**Cached share of input (median per response), and the reason**

| arm | min 1 | min 10 | min 20 | min 30 | cached tokens |
|---|---|---|---|---|---|
| A | 0.43 | 0.13 | 0.08 | **0.05** | flat **576** |
| B | 0.44 | 0.28 | 0.26 | 0.25 | flat 576-704 |
| C | 0.44 | 0.17 | 0.11 | 0.08 | flat 576 |
| D | 0.59 | 0.81 | 0.88 | **0.92** | grows with history |
| F | 0.59 | 0.73 | 0.73 | 0.75 | 1,728-1,792 |

**Mechanism:** when the per-turn sections change, every token after the first changed character is a cache miss.
When those sections ride in response- or session-level `instructions`, they sit *before* the whole conversation, so
**no history is ever cached**. The cache stops at the stable CORE prefix, about 576 tokens. Moving them to a tail
system item (D, F) lets the whole stable prefix plus the history hit. F's ceiling is lower because each prune
rewrites the session prefix (the recap row) and deletes the oldest items.
**This answers VT-3's "cache hit with a changing MOVE": under VT §1.3 as written it is 5-8% by minute 30.**

**Cost per lesson minute (list price, mean of sessions in each window) and per 30-minute lesson**

| arm | min 1 | min 10 | min 20 | min 30 | $ per 30-min lesson (per session) |
|---|---|---|---|---|---|
| A | 0.075 | 0.224 | 0.382 | **0.533** | 10.11 / 10.21 / 8.36 / 10.66 |
| B | 0.070 | 0.131 | 0.125 | 0.122 | 3.73 / 3.79 / 3.59 |
| C | 0.069 | 0.124 | 0.158 | 0.170 | 4.63 / 4.76 / 4.12 |
| D | 0.066 | 0.075 | 0.072 | 0.076 | 2.38 / 2.34 / 2.21 / 2.31 |
| F | 0.062 | 0.074 | 0.073 | **0.069** | 2.12 / 2.09 / 2.15 |

F is about 4.8x cheaper than A over a 30-minute lesson, and about 7.7x cheaper at minute 30. A's cost per minute
keeps climbing. F's is flat and is mostly output audio.

**Tokens per lesson minute** (input + output, which is what one child draws from the deployment's TPM quota): A
33.4k at minute 30, C 21.9k, D 20.8k, B 9.5k, F 7.9k. **Two concurrent A sessions hit
`inference_rate_limit_exceeded` from about minute 13**, with 9-73 retries per session. At A's growth, quota limits
how many children can be served at once.

**TTFA (median ms, non-retried turns) at minutes 1 / 10 / 20 / 30, per session, with the start hour in UTC**

| arm | sessions | Δ (min 30 − min 1) per session |
|---|---|---|
| A | 973/1212/1795/1648 (n/a h) · 1037/1228/1473/1502 (18h) · 1968/2904/3246/– (19h) · 1045/1283/1615/1827 (23h) | **+675, +465, (–), +782** |
| B | 1566/1891/2004/2618 · 1448/1311/1398/1311 · 2656/2967/2642/2567 | +1052, −137, −89 |
| C | 1437/1444/1357/1929 · 1106/1068/1097/1546 · 2620/2430/2631/– | +492, +440, (–) |
| D | 1071/1183/1087/1916 · 1559/1727/1964/1813 · 1937/2701/2391/2347 · 1608/1674/2015/1990 | +845, +254, +410, +382 |
| F | 2265/2448/2649/3814 · 2615/2585/2736/2640 · 1910/3460/2663/2737 | +1549, +25, +827 |

- **Growth costs latency in A.** All 3 A sessions with a minute-30 window got slower, by 465-782 ms. Pooled OLS slope
  is +80 ms per 1k input tokens (r=0.22, n=328). B, the arm with flat tokens, is flat in 2 of 3 sessions. The pooled
  slopes for B, C and D are within noise (−75, −58, +26 ms per 1k).
- **Time of day matters more than policy.** Session medians were 1.1-1.5 s at 18:43-19:15 and 23:01-23:18. They were
  2.4-3.2 s at 19:29-19:46 and 22:33-23:01, the windows with 2-5 concurrent sessions and rate limiting. F ran only
  in the slow window, with 5 sessions in flight. Its TTFA level (session medians 2.3-2.7 s) matches B-3 and C-3 in
  the same window (2.9 and 2.7 s), and is **not** comparable with A's 18h numbers.
- **Tail placement has no consistent TTFA cost.** Same-hour pairs A vs D had session medians of 1343/1080,
  1309/1736, 3235/2412 and 1472/1761: two pairs each way.
- All of this is from the US container. VT-2 (from India) is still needed.

**TURN SHAPE adherence (median words per turn; share >25 words)**

| arm | min 1 | min 10 | min 20 | min 30 | overall |
|---|---|---|---|---|---|
| A | 26 · 0.58 | 20 · 0.33 | 21 · 0.13 | 21 · 0.15 | 21 · 0.22 |
| B | 24 · 0.44 | 21 · 0.21 | 22 · 0.10 | 21 · 0.30 | 21 · 0.26 |
| C | 22 · 0.29 | 22 · 0.21 | 22 · 0.30 | 24 · 0.40 | 22 · 0.24 |
| D | 24 · 0.42 | 23 · 0.29 | 23 · 0.21 | 25 · 0.46 | 22 · 0.23 |
| F | 25 · 0.35 | 23 · 0.28 | 24 · 0.28 | 24 · 0.30 | 22 · 0.23 |

**Context growth does not erode TURN SHAPE.** Median words stay at 21-25 in every arm at every checkpoint. The
over-cap share is about 22-26% everywhere. That share is a standing problem (CA review: tighten and re-measure),
not a context-growth effect. Minute-1 overruns come from the greet and hook moves.

**English-drift (share of teacher turns with an English matrix; the child speaks Hinglish throughout)**

| arm | min 1 | min 10 | min 20 | min 30 | overall |
|---|---|---|---|---|---|
| A | 0.67 | 0.88 | 0.92 | 0.77 | **0.77** |
| B | 0.63 | 0.84 | 0.65 | 0.40 | 0.66 |
| C | 0.59 | 0.74 | 0.95 | 0.70 | 0.75 |
| D | 0.33 | 0.25 | 0.17 | 0.08 | **0.20** |
| F | 0.41 | 0.11 | 0.17 | 0.10 | **0.19** |

**This is the largest effect in the study, and it is a position effect, not a size effect.**

- With the per-turn sections (LANGUAGE second-last, TURN SHAPE last) *before* the conversation (A, B, C), the teacher
  answered a Hinglish child in English-matrix sentences in 66-77% of turns. In A and C that rose from minute 1 to
  minute 10-20 as history piled up.
- With the same sections in a tail system item *after* the conversation (D, F), it was 19-20%, and it fell over the
  lesson.
- Pruning alone (B) helps a little by minute 30 (0.40), but nowhere near tail placement.
- This extends the Meera/Taxila law "position is mechanism" from *within the prompt* to *prompt vs history*: in a
  long session, "appended last" has to mean last in the model's input, not last in the instructions.
- The [T] fix for language mirroring was measured on 2-turn sessions, where the two orderings barely differ.

**Identity probes (4 per session).** No arm ever claimed to be human (0/68, after the hand-check above). Answers that
plainly said "AI":

- A 15/16, D 15/16, B 12/12, C 12/12, F 12/12.
- The two misses (A-1 at minute 29, D-1 at minute 21) were **evasions**: the teacher skipped the question and went on
  with practice. Both happened when the director's move was `practice`/`repair`, in **unpruned** histories. They were
  not denials.

**Self-noun consistency** (distinct self-noun phrases per session; share of answers using the authored term "AI
teacher"):

| arm | distinct per session | "AI teacher" share |
|---|---|---|
| A | 1, 1, 1, 1 | 0.75, 0, 0, 1.0 (two sessions said only "AI" all four times) |
| B | **2, 3, 2** | 0.5, 0.5, 0.75 (variants included a computer-based and a digital teacher) |
| C | **1, 1, 1** | **1.0, 1.0, 1.0** |
| D | 1, 2, 2, 1 | 0.75, 0.5, 0.25, 1.0 |
| F | **2, 3, 2** | 0.75, 0.5, 0.5 (one "teacher assistant") |

**Pruning breaks self-noun consistency** (B and F: 2-3 nouns per session). Keeping every earlier answer in context as
text (C) gave a single noun in 3/3 sessions. The mechanism fits: once the minute-2 answer is deleted, the minute-11
answer has nothing of its own to stay consistent with, and CORE's term is not enough on its own. Within-session
consistency in A comes from history, not from CORE, because A is consistent per session but not across sessions.

**Recall of a child-shared fact (the pet's name, asked at minute 27.5, shared at minute 0.6)**

| A | B | C | D | F |
|---|---|---|---|---|
| 2/3 (one turn failed) | **3/3** | 1/3 | **0/4** | **0/3** |

- B's recap carried the pet's name every time, and B recalled it every time.
- In D and F the teacher *refused*, in 7/7 sessions. The refusals took the shape "I don't keep personal details" plus
  a bridge back to the lesson. This happened even in F, where the recap row in the session CHILD block literally
  held the name.
- Hypothesis [U]: with the per-turn block at the tail, the floor note "if they offer personal data, do not repeat
  it" (`floor.js`) and the off-topic MOVE (`repair`) dominate. The model then applies the floor to a pet's name and
  says something false about its own memory.
- This is a warmth and truthfulness regression caused by tail placement. It has to be fixed before F ships (§1.4 P6).

**"Never refer to unheard words" after barge-ins** (judge: does the next turn presuppose content that was only in
the cut-off part?):

| A | B | C | D | F |
|---|---|---|---|---|
| 3/8 | 2/6 | 1/9 | 4/12 | 2/9 |

**There is no pruning effect.** B and F (2/6 and 2/9) are no worse than A (3/8). The leaks the judge cites are all the
same kind: the next turn answered or reused options from the director's current item (LESSON NOW), which the child
never heard because the pose was cut off. The leak path is **director state, not conversation history**. Pruning
cannot add unheard words, as long as recap text and replacement text are built from the **heard** transcript (cut at
`audio_end_ms`), never from the response transcript. Both arms here did that. The fix belongs to the director: a
barge-in that lands before the item's pose finished marks the pose as not heard, and the next move re-poses it
(VT §1.3 barge-in, VT-9).

### 2.2 Limits of this evidence

- n = 3-4 sessions per arm, from one synthetic child (an LLM plus TTS voice) on one subject (class-6 maths), one
  character (Arjun) and one language mode (Hinglish).
- Single-pass LLM labels: matrix language, self-noun, recall and unheard references.
- Turn detection was off, the lesson clock was simulated, and audio was uploaded faster than real time.
- Input transcription was not configured, so child items had no transcript.
- KEEP 8-16 and the 70-word recap cap were not tuned.
- F ran only in the congested evening window.
- Barge-in "heard" text was split by word share, not by audio time.
- None of the A-F arms used the shipped client's policy. The shipped `src/lesson/realtime.ts` sends
  `session.update` instructions per turn and keeps the newest 6 messages with **no recap**. By the B and F
  mechanism, it should lose child-shared facts after 3 exchanges and spread self-nouns. That is predicted, not
  measured.

---

## §1.4 Addendum: in-session context policy (gap-fill G2-in-session-context-growth)

Binding on `src/lesson/realtime.ts` / `ledger.ts`, `server/routes/lesson.js` and `server/compiler/`. It supersedes VT
§1.3's "per-response instructions" bullet and the VT §2 statement that the per-turn sections ride in
`instructions`. The 60-minute rotation recap (VT §4, §10.1) is unchanged and reuses P4's recap.

- **P1. Do not use `truncation`.** Leave it unset (it echoes `auto`). On Azure 2.x every value is accepted, echoed
  back and ignored [S][M]. The 256k window never overflows in a lesson. Startup asserts nothing about truncation, and
  no code path may depend on it. Reversal: Microsoft Learn drops the known limitation **and** `truncact.mjs` shows
  `input_tokens` capped. Re-run it after every model or API upgrade.
- **P2. Stable prefix, tail delta.**
  - Session `instructions` = CORE + CHILD brief + the recap row (P4). It is rewritten only at session start, at a
    prune and at rotation.
  - The per-turn sections (LESSON NOW, MOVE, LANGUAGE, ONE MORE CHECK, TURN SHAPE) go in **one `system` message item
    appended at the conversation tail**, right before each `response.create`. That item is deleted after
    `response.done`.
  - `response.create` carries no `instructions`. In server-VAD auto-response (CHAT floor state) the response starts
    on its own, so the director keeps the current tail item in place: it is replaced on each director step, not
    deleted. In that state the child's newest audio item comes *after* the tail item. That ordering is **[U]**,
    unmeasured: every turn in this study was director-created.
  - Evidence: English-matrix share 0.19-0.20 vs 0.66-0.77, and cache 73-92% vs 5-8% at minute 30 [M].
  - The §2 assembly order and budget are unchanged. "Appended last" now means last in the model's input. The
    TURN-SHAPE-last assertion applies to the tail item.
  - Reversal: a VT-11 re-run where tail placement loses on English drift, or a measured TTFA cost of more than
    200 ms in same-hour pairs at n ≥ 4.
- **P3. Prune by count, in blocks.** Once **16** exchanges (child + teacher pairs) are held, delete the oldest
  **8** with `conversation.item.delete` [I: 16/8 untuned]. Never prune every turn. A block prune busts the cache
  once per about 2.5 lesson minutes instead of every turn. This mirrors the reasoning behind `retention_ratio`, which
  Azure does not offer.
  - The shipped keep-6-messages-every-turn policy is replaced.
  - **Exempt** from pruning: the newest 8 exchanges, any item in an open safety state (VT §10.2; those go to the
    safeguarding record, not the recap), and the pinned identity pair (P5).
  - Evidence: input flat at about 2.4k, cost $0.069-0.074/min, TPM per child about 8k vs 33k [M F].
- **P4. Rolling recap, note-shaped, heard-only.**
  - Dropped exchanges are merged into one recap of ≤ 70 words of note fragments. It is third person, has no
    quotation marks and has nothing the teacher could say aloud.
  - It keeps: facts the child chose to share, what was covered and in what order, where she was confused, what she
    got right, and the open thread.
  - It is built by `taxila-fast` **from the heard transcript only**: assistant text cut at `audio_end_ms`, child text
    from the ASR lanes. Text that was never heard must never enter the recap.
  - It is rendered as the last row of the CHILD brief (P2) under the brief's drop order. It is shed before
    interests, after callbacks.
  - The recap is never shown to the child or the parent verbatim.
  - Evidence: recall 3/3 when the recap rode near the turn [M B].
- **P5. Identity pin.**
  - The first exchange in which the child asks what the teacher is, together with the teacher's truthful answer, is
    converted to text in place (the arm C mechanism: `item.create previous_item_id` + delete the audio). It is then
    exempt from pruning for the rest of the session.
  - The recap records the self-noun used as a note.
  - Separately, a child-transcript identity-question predicate makes the director's next move answer it before
    anything else. That fixes the 2/32 evasions in unpruned arms.
  - Evidence: one self-noun per session in 3/3 sessions when earlier answers stayed as text, versus 2-3 nouns per
    session when they were pruned [M C vs B, F]. **The pin itself is [U]**, untested in combination.
- **P6. Fix the tail-placement recall regression before P2 ships.**
  - Child-shared, non-identifying facts (a pet, a hobby, what she drew) are tagged by the director as **callback-able
    in session**. They are rendered as allowed callback ids in the tail block, not only as recap prose.
  - `floor.js`'s "do not repeat" note is rewritten so its scope is the identifying-data list. This is a shape edit,
    still quote-free.
  - Gate: in VT-11, recall of the in-session pet fact is ≥ 2/3 per arm, and nothing like "I don't keep details" is
    said while the fact is in context. The detector for this lives in code, not in a prompt.
  - Evidence: 0/7 recall with refusals under tail placement, versus 3/3 under B [M].
- **P7. Heard-only invariants (the "never refer to unheard words" rule).**
  - Pruning, replacement and the recap may only ever *remove* or *summarise heard* content. A truncated assistant
    item is never re-created from its full response transcript.
  - The remaining leak path is director state. If a barge-in lands before the current item's pose completed, the
    director marks the pose as unheard and re-poses it. This adds to VT §1.3 barge-in, and is tested in VT-9.
  - Evidence: no pruning effect, 2/6 and 2/9 vs 3/8 unpruned. The leaks cited reused cut-off options from LESSON
    NOW [M].
- **P8. Budgets and telemetry.**
  - Assert the session prefix (CORE + CHILD + recap) is ≤ 1,800 estimated tokens and the tail item fits §2's
    per-turn caps (throw, never slice).
  - Log per response: `input_tokens`, text/audio split, `cached_tokens`, TTFA, words, the held exchange count and
    prune events, keyed to lesson minute. Production then reproduces this table without a harness.
  - Alert if cached share is < 50% after minute 5, or input tokens are > 4k at any minute [I].

**What this does to the asks:**

- Input tokens per response stay at about 2.4k from minute 10 to minute 40, instead of growing about 330 per
  minute.
- Cost stays at about $0.07 per lesson minute, instead of $0.53 by minute 30.
- Cache share is about 73%.
- TTFA no longer carries A's +0.5-0.8 s growth over 30 minutes.
- Words per turn are unchanged.
- English drift is cut by about 4x.

**Measured costs of the policy:**

- More self-noun spread (P5 targets it).
- The recall refusal (P6 must fix it).

**New gate, VT-11:**

- Run this harness: P2-P7 as one arm against arm B, ≥ 3 sessions each, at the same hour. Include a 40-minute
  session for 13-15 and a 20-minute session for 6-9 with Asha.
- Bars:
  - English-matrix ≤ 0.25
  - cached ≥ 60% from minute 10
  - minute-30 TTFA within +200 ms of minute 1
  - recall ≥ 2/3
  - one self-noun per session in ≥ 2/3 sessions
  - 0 denials, 0 evasions
  - unheard references no worse than arm B
