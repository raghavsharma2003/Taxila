# Measurements

Every number here carries n, method and date. A number without those cannot be
compared against a future one.

## infra-smoke-2026-10-02
**Azure text deployments, first-call latency (n=1 each, 2026-10-02).**
Method: `curl` from the cloud build container (US) to `…openai.azure.com/openai/v1/chat/completions`,
prompt "In one short Hinglish sentence, explain photosynthesis to a 9 year old.", wall clock incl. TLS.

| deployment | model | wall | engine TTFT |
|---|---|---|---|
| taxila-brain | gpt-5.6-sol | 2.94 s | 523 ms |
| taxila-fast | gpt-5.6-luna | 1.88 s | 135 ms |
| gpt-5.6-terra (pre-existing) | gpt-5.6-terra | 2.15 s | 491 ms |

All three produced correct, natural Hinglish. n=1 — a smoke test, not a benchmark.

**Image generation (n=1):** `taxila-image` (gpt-image-2, quality=low, 1024²) — 23 s for a labelled
photosynthesis diagram; labels were spelled correctly. 23 s means images can never be on the
critical path of a spoken turn: they must be requested ahead and arrive while the teacher talks.

**Realtime ephemeral key (n=1):** `POST /openai/v1/realtime/client_secrets` with
`{session:{type:"realtime", model:"taxila-realtime"}}` returns `{value:"ek_…", expires_at}` — the
GA shape works on this resource.

## realtime-teacher-bakeoff-2026-10-02
**Azure realtime, TEACHER prompt, text-in → audio-out (n=6 child turns per arm per model, 2026-10-02).**
Method: `evals/realtime-bakeoff.mjs` — WebSocket `wss://…/openai/v1/realtime?model=<deployment>`, GA session
schema, voice `marin`, scripted Hinglish child turns about 3/4 vs 2/3 (incl. the "2 is smaller so 2/3 is
smaller" misconception). TTFA = `response.create` → first `response.output_audio.delta`, measured from the
US build container (add India↔eastus2 RTT for real users). Words = output audio transcript.

| arm | model | median TTFA | median words/turn | max words |
|---|---|---|---|---|
| A: brevity asked mid-prompt ("2-3 short sentences") | gpt-realtime-2.1 (`taxila-realtime`) | 1007 ms | 64 | 71 |
| A | gpt-realtime-2.1-mini | 736 ms | 64 | 71 |
| B: brevity rule appended LAST + per-`response.create` turn instruction (≤25 words, end with question) | gpt-realtime-2.1 | 980 ms | **25** | 28 |
| B | gpt-realtime-2.1-mini | 1119 ms (one 6.2 s outlier, one turn no audio) | 38 | 45 |

Quality read (owner-visible transcripts in the eval output): full 2.1 handled the misconception correctly in
both arms (common denominator 9/12 vs 8/12; "slices ka size same hona chahiye"); mini hedged ("aksar 3/4
zyada bada mana jata hai"), addressed itself as "Didi", and produced a muddled 4/8 vs 2/4 example.
Replicates Meera's `realtime-azure` finding (mini: 41-53 words, monologues) and shows it is structurally
fixable on the full model. n=6 — enough to pick a direction, not a final number.
