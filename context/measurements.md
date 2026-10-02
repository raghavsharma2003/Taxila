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

## realtime-audio-in-2026-10-02
**Audio-in realtime (gpt-realtime-2.1 `taxila-realtime`), synthetic child, 2026-10-02.** n = 1 session per arm
(2 child turns each, 8 arms). Method: `evals/realtime-audio-in.mjs` streams a 51 s 24 kHz PCM16 file over the
WebSocket in real time (40 ms chunks). The "child" is gpt-4o-mini-tts voice `coral` instructed to sound like a
shy 9-year-old Indian child (SYNTHETIC — real children will be harder). Clip 1 (10.25 s, ends at audio 12.25 s)
contains a hesitation pause after "Didi…" (~7.6 s); clip 2 starts 3.2 s after clip 1 ends, i.e. while the teacher
is still speaking (barge-in probe). Measured from the US build container.

| arm | endpoint (speech_stopped − true end) | commit → first audio | split mid-thought pause? |
|---|---|---|---|
| server_vad 0.6 / 900 ms, client response.create | +870 ms | 1653–1740 ms | no |
| server_vad 900, server auto-response | +870 ms | 1310–1472 ms | no |
| server_vad 900, auto, effort minimal | +870 ms | 1376–1600 ms | no |
| server_vad 600, auto, minimal | +550 ms | 1766–2232 ms | **yes** (pause at 7.6 s) |
| semantic_vad low, client response.create | +360 ms | 2303–2373 ms | no (run 1) |
| semantic_vad low, auto | +630 ms | 1184–1395 ms | **yes** |
| semantic_vad low, auto, minimal | +710 ms | 893–1710 ms | **yes** |

- **Barge-in:** every arm cancelled the teacher's response 7–260 ms after the child's speech_started
  (`status=cancelled, reason=turn_detected`). n=8.
- **Child transcription (`taxila-transcribe` = gpt-4o-transcribe):** both synthetic Hinglish clips transcribed
  verbatim (Devanagari) in every arm. Synthetic speech — says nothing yet about real children's ASR (research
  E1 is still the first real measurement to make).
- **Language drift:** without a mirror rule the teacher answered a Hindi-speaking child mostly in English
  ("Sweetie…", "Imagine 12 equal parts…"); with "Language: mirror the child …" placed just before the final
  rule, all subsequent turns were Hinglish (one turn mixed Devanagari into the transcript).
- **Turn length with session-level last-line brevity only (auto mode):** ~20–28 words — the per-response
  instruction is not needed for brevity once the rule is last.
- **Caching:** second response reported `cached_tokens=128` of ~350 input — Azure realtime does cache at least
  part of the prefix, contradicting the "no caching" note in tech-and-market.md §1.9. n=1; re-measure on a long
  session before trusting the cost model either way.
- **Browser WebRTC (`evals/webrtc/`)**: from headless Chromium the ephemeral-key SDP POST to
  `/openai/v1/realtime/calls` returned **201** and a remote track — the browser signalling path is proven. ICE
  then failed because this sandbox cannot carry UDP/TURN (3478) — media must be verified on a real device.

## db-driver-latency-2026-10-02
**DB round-trip from the Azure Container App (eastus2) to Neon `taxila-us` (aws-us-east-1), 2026-10-02.**
Method: `/api/health?db=1` runs 5 sequential `select 1` inside the container (n=3 calls × 5).
- Neon HTTP driver (one HTTPS request per query): ~230 ms/query (inferred: `/api/me` = 3 queries took 0.9 s vs
  0.2 s for `/api/health`, n=5).
- Persistent `pg` Pool (`DB_DRIVER=pg`): **9-12 ms/query** (15 samples). `/api/me` end-to-end from the US build
  sandbox 0.26-0.58 s, now dominated by client↔Azure network/TLS.
- Neon moved from Singapore (`billowing-glitter-91836156`, test data only, left in place) to US East
  (`royal-fire-14595065`) to sit beside eastus2; migrations re-applied.


<!-- merged from inbox/design.json -->
## design-token-contrast-2026-10-02
**Design-token contrast and colour-vision checks for PRODUCT-DESIGN.md (deterministic computation, 2026-10-02).**
Method: `python3 docs/research/design/product-design-contrast.py`, reusing the WCAG 2 relative-luminance and Machado-2009 (severity 1.0, [M] matrix digits) + CIEDE2000 helpers in `visual-identity-contrast.py`. n = 37 colour pairs (one deterministic computation each; no human or device measurement). Result: 0 failures against the stated floors.
- Turn ring vs its own marigold fill `#FFB21E`: kids-ux `#9A5B00` 3.01:1 (no margin); `#8A4F00` 3.64; **`#7A4800` 4.23** (7.23 on cream, 7.62 on white). Adopted `#7A4800`.
- Two-tone focus ring (2 px `#1F1A14` + 2 px white): best tone >= 9.36 on cream, white, board, jamun, marigold, dusk, dark bg, sky panel; 4.48 on a worst-case mid grey.
- Caption lit-word bar: jamun on cream 8.87, dark jamun on dark bg 8.85. White chalk underline on board 10.86 (dark board 9.82). ink-2 on new light surface-2 `#F1E8D9` 6.39. Status glyphs on cream 5.04-6.20.
- Status pairs, CIEDE2000 normal/protan/deutan/tritan: done vs stop 59.7/14.1/13.0/58.6; listen vs think 15.9/19.7/19.2/14.4; listen vs jamun 21.5/14.8/10.4/34.8; turn vs parent your-turn fill 10.5/9.9/8.4/9.7; turn vs the removed chalk-mark `#F2CF6B` 11.6/7.9/6.7/9.0. Pairs below 15 under any simulation must carry a glyph.
- Limits: pixel arithmetic, not legibility for children; no sunlight or cheap-LCD measurement; Machado digits unverified.
