# Taxila: tech and market research

**Date:** 2026-10-02 · **Scope:** AI voice-teacher (web + Android) for Indian K-9 students · **Infra assumed:** Azure AI Foundry resource `raghavsharma1729-compan-resource` ($5k credits), Neon Postgres, Vercel.

**Evidence labels used throughout**

| tag | meaning |
|---|---|
| **[V]** | Verified today against a primary source (vendor docs, pricing page data, the PDF itself) |
| **[S]** | Secondary source (press, blog, third-party benchmark), not cross-checked |
| **[U]** | Unverified: an estimate, an inference, or a claim that Taxila must measure itself before relying on it |

Prices are USD, Azure "Global" deployment, read from the `data-amount` attributes of the Azure pricing pages on 2026-10-02 **[V]**. FX: ₹96 = $1 (USD/INR traded at about 96.5 on 2026-10-02 **[S]**).

---

## 0. TL;DR (the findings that change decisions)

1. **The voice stack exists on Azure today, and the GA endpoints are simple.** The server mints an ephemeral key with `POST https://<resource>.openai.azure.com/openai/v1/realtime/client_secrets`. The browser then posts its SDP offer to `/openai/v1/realtime/calls`, with no `api-version` query parameter **[V]**. Azure lists `gpt-realtime-2.1` and `gpt-realtime-2.1-mini` (version 2026-07-07) for global deployment in East US 2 and Sweden Central **[V]**.
2. **Cost is the hard constraint, and context re-reading drives it, not speaking.** Every response re-bills the whole conversation as input. On Azure, Microsoft said in March 2026 that **prompt caching is not supported on realtime endpoints** **[S, Microsoft Q&A moderator]**. Microsoft also said in November 2025 that **`retention_ratio` truncation is not supported** **[S]**. Our model of a 45-minute lesson (section 1.9) gives these costs:
   - gpt-realtime-2.1 with no pruning and no cache: **≈$27**.
   - 2.1-mini with aggressive pruning: **≈$1–2**.
   - GPT-Live-1: **≈$2.3**.
   - A cascaded STT→LLM→TTS pipeline: **≈$0.35**.

   PhysicsWallah says it already delivers voice-to-voice tutoring at about **$0.20/hour** **[S]**. Measuring `cached_tokens` on Azure is the first thing to do.
3. **Architecture consequence:** do not run the full 45 minutes as speech-to-speech. Generate the lesson narration once per concept as TTS, cache it, and share it across all students. Use realtime S2S only for the dialogic moments (questions, checks, "try again"). This is the main cost lever, not model choice.
4. **GPT-Live-1 is now GA on Azure, and it is in South India.** It is full-duplex with a separate reasoning backend, about $3/hour, and also runs in Sweden Central, East US 2 and other regions **[V docs, S price]**. It handles long sessions by summarising in the background and has `session.thinking.append` for silent context, which fits "teacher observes the simulation". The risk is children's pauses: the IndicFDB benchmark measured GPT Live pause-handling success at only **23.8–74.3%** across Indian languages **[S, arXiv 2609.31967]**. GPT-Live is not in the catalog list you gave; check whether it can be deployed.
5. **Hinglish quality is unproven and has a known regression.** Developers report that gpt-realtime-2.1 and 2.1-mini drift into English or an English accent in non-English languages, and say 1.5 behaved better **[S, OpenAI forum, Jul–Aug 2026]**. A/B test 1.5, 2, 2.1 and 2.1-mini with real children before choosing.
6. **Avatar v1 should be Rive (2D) driven client-side from the realtime audio stream.** This is the pattern Duolingo uses for its Video Call character, Lily **[S]**. Lip-sync can come from audio amplitude, or from the MIT-licensed HeadAudio viseme detector (part of TalkingHead), which works on any audio stream. Cost is close to zero per minute. Streaming video avatars cost $0.01 to $0.50/min **[S/V]**, so a 45-minute daily lesson rules them out except as a premium tier.
7. **Interactive modules should use parameterized engines, not live free-form code.** Google's own learning-interactives paper reports that free-form single-prompt generation passed all checks **3.5%** of the time, and **69.3%** after 10 critique/refine rounds **[S, arXiv 2609.20738]**. ChatGPT's interactive math and science visuals are a curated set of 70+ topics, not generated on the fly **[S]**. Taxila should have the LLM fill a JSON spec for a vetted engine, which takes 1–3 s. Free-form generation runs offline with a critique loop and a human review before anything joins the library.
8. **PhET relicensed new simulations to CC BY-NC on 2026-03-29.** The historical collection stays CC BY 4.0 and can be used commercially with attribution and the PhET logo kept visible **[V]**.
9. **NCERT text cannot go into a RAG store without permission.** Each book says "No part of this publication may be reproduced, **stored in a retrieval system**… without the prior permission of the publisher" **[V, Curiosity Gr 6 prelims]**. Use chapter titles, structure and NCF-SE goals as metadata, write original content, deep-link to NCERT PDFs, and ask NCERT for permission.
10. **The curriculum has just changed.** In 2026-27, Classes 1–9 all use new NCF-SE 2023 textbooks. Class 9 is new this session: *Ganita Manjari*, *Exploration*, *Kaveri*. Little teaching content is aligned to these books yet, which makes it a content gap Taxila can fill.
11. **There is a market gap.** ChatGPT and Gemini consumer apps are 13+ (ChatGPT for Teens launched for 13–17 on 2026-08-18) **[S]**. PhysicsWallah is moving away from K-12 schools toward test prep **[S]**. BYJU's is still in insolvency **[S]**. YoLearn.ai is the closest direct competitor: voice-first, sketchpad, teacher avatars, 22 languages, about 200k users **[S]**.
12. **Compliance deadline.** The DPDP Rules need verifiable parental consent for every user under 18, with full compliance by **13 May 2027** **[S]**. Design consent in from day one.

---

## 1. Realtime voice on Azure

### 1.1 What is deployable now

From Microsoft Learn's "GPT Realtime API via WebRTC" page (updated 2026-09-23) **[V]**:

| model | Azure version | notes |
|---|---|---|
| `gpt-realtime-2.1` | 2026-07-07 | flagship; configurable reasoning effort; OpenAI claims ≥25% lower p95 latency than 2 **[S]** |
| `gpt-realtime-2.1-mini` | 2026-07-07 | cheap tier; forum reports of tool calling failing on SIP **[S]** |
| `gpt-realtime-2` | 2026-05-07 | 128k context, preambles, parallel tool calls **[S]** |
| `gpt-realtime-1.5` | 2026-02-23 | reported to hold non-English languages better than 2.1 **[S]** |
| `gpt-realtime` / `-mini` | 2025-08-28 / 2025-12-15 | older |
| `gpt-realtime-whisper`, `gpt-live-transcribe` | 2026-05-06 / 2026-07-29 | streaming STT, billed per hour |
| `gpt-live-1` (separate API) | GA 2026-09-10 | full-duplex; regions include **South India** **[V catalog page]** |

- **Regions:** global deployments of the realtime models are in **East US 2** and **Sweden Central** **[V]**. Check which region `raghavsharma1729-compan-resource` is in. If it is elsewhere, create a second Foundry resource in Sweden Central, which is probably closer to India in round-trip time than East US 2 **[U, measure]**.
- **Limits stated by Azure:** the maximum session length is **60 minutes** **[V]**, so a 45-minute lesson fits, but build reconnect logic. The Azure page still says "up to 32,000 input tokens and 4,096 output tokens" **[V]**, while OpenAI quotes 128k for realtime-2 **[S]**. Treat the window as 32k on Azure until a test proves otherwise.
- **Deployment gotcha:** `client_secrets` returns `OperationNotSupported` if `session.model` names a deployment that was not created from a realtime model. `session.model` must be the **deployment name**, not the base model name **[S, MS Q&A]**.

### 1.2 Four ways to build the voice loop

| architecture | what it is | strengths | weaknesses for Taxila |
|---|---|---|---|
| **A. gpt-realtime (S2S, half-duplex)** | One model hears audio and speaks audio, with tools | lowest effort; native prosody; hears hesitation; tools mid-turn | expensive context re-reads; Azure has no caching (see 1.9); Hinglish drift |
| **B. GPT-Live-1 (full-duplex + backend)** | A live voice model talks while a backend (Responses API model or your own code) reasons | flat ≈$3/h voice; automatic long-context summarisation; `thinking`/`commentary` append; South India region | no ephemeral keys (backend relays SDP); instructions and voice fixed after start; weak pause handling for slow child speakers **[S]** |
| **C. Azure Voice Live** | Microsoft wrapper: gpt-realtime or a text LLM plus Azure STT/TTS, noise suppression, echo cancellation, semantic VAD, avatars, **viseme events** | Indian voices (`diya`, `meera` hi-IN bilingual; en-IN Aarti); `azure_semantic_vad_multilingual` includes Hindi; viseme stream for lip-sync | another API surface; WebRTC maturity unclear **[U]**; Azure TTS voices sound less natural than native S2S **[U]** |
| **D. Cascaded (STT → LLM → TTS)** | Sarvam or MAI STT, then gpt-5.6-luna/terra, then Azure or Sarvam TTS | about 10× cheaper; full control; narration audio can be cached | 1.5–3 s turn latency typical **[S]**; loses paralinguistics; more moving parts |

**Recommendation.** Build A (gpt-realtime-2.1-mini over WebRTC) as the dialog engine. Use D's TTS half for pre-rendered narration. Run B as a parallel spike in week 2. C is the fallback if native-voice Hinglish fails the A/B test, because it gives Indian-accented voices and visemes.

### 1.3 GA endpoint shapes (Azure)

```
# 1) Mint ephemeral key (server only; api-key or Entra bearer)
POST https://raghavsharma1729-compan-resource.openai.azure.com/openai/v1/realtime/client_secrets
     Content-Type: application/json
     api-key: <AZURE_OPENAI_API_KEY>        # or Authorization: Bearer <Entra token, scope https://ai.azure.com/.default>
  -> 200 { "value": "ek_...", "expires_at": ..., "session": {...} }

# 2) Browser SDP exchange with the ephemeral key
POST https://raghavsharma1729-compan-resource.openai.azure.com/openai/v1/realtime/calls[?webrtcfilter=on]
     Authorization: Bearer ek_...
     Content-Type: application/sdp
     body: <offer.sdp>
  -> 201  body: <answer sdp>   header Location: /v1/realtime/calls/rtc_xxx

# 3) Optional server observer/controller on the same call
wss://raghavsharma1729-compan-resource.openai.azure.com/openai/v1/realtime?call_id=rtc_xxx

# Deprecated preview endpoints: do NOT use
/openai/realtimeapi/sessions?api-version=2025-04-01-preview
https://<region>.realtimeapi-preview.ai.azure.com/v1/realtimertc
```
All of the above is **[V]** from the Azure WebRTC page. Getting the observer socket needs the `Location` header, so the server must proxy the SDP exchange (Azure's "/connect" sample). The `openai.azure.com` host should resolve for a Foundry resource, but some resources only expose `*.services.ai.azure.com` or `*.cognitiveservices.azure.com` **[U]**. Use the endpoint shown in the Foundry portal.

**`webrtcfilter=on` drops tool events.** With the filter on, the browser receives only speech_started/stopped, output_audio_buffer started/stopped, input transcription completed, item added/created, and text and transcript deltas **[V]**. `response.function_call_arguments.done` and `response.done` are **not** delivered. If the tools run in the browser (simplest for v1), leave the filter off and keep nothing secret in `instructions`. To hide the prompt and run tools on the server, you need the observer WebSocket on an always-on worker. A Vercel function is not suitable for a 45-minute socket.

### 1.4 Server: mint the key (Vercel function, Node)

```ts
// api/realtime/token.ts  (Vercel Node runtime)
import { SESSION } from "./session-config";   // shared config, see 1.6

export default async function handler(req: Request): Promise<Response> {
  const user = await requireStudentSession(req);         // your auth; parent-consented account only
  await enforceDailyMinuteQuota(user.id);                // a leaked ek_ can run a 60-min session, so gate minting
  const r = await fetch(
    `https://${process.env.AZURE_RESOURCE}.openai.azure.com/openai/v1/realtime/client_secrets`,
    {
      method: "POST",
      headers: { "api-key": process.env.AZURE_OPENAI_API_KEY!, "Content-Type": "application/json" },
      body: JSON.stringify({
        // OpenAI GA param (10–7200 s, default 600) [V on OpenAI]; confirm Azure honours it [U]
        expires_after: { anchor: "created_at", seconds: 120 },
        session: { ...SESSION, instructions: await buildInstructions(user) },
      }),
    },
  );
  if (!r.ok) return new Response(await r.text(), { status: 502 });
  const { value, expires_at } = await r.json();
  return Response.json({ token: value, expires_at });
}
```
The key only has to live until the SDP exchange. Once a session starts it keeps running after the key expires **[V, OpenAI ref]**.

### 1.5 Browser: WebRTC connect (also works inside Capacitor's Android WebView)

```ts
export async function connectTeacher(onEvent: (e: any) => void) {
  const { token } = await fetch("/api/realtime/token", { method: "POST" }).then(r => r.json());
  const pc = new RTCPeerConnection();

  const audioEl = Object.assign(document.createElement("audio"), { autoplay: true });
  pc.ontrack = (e) => { audioEl.srcObject = e.streams[0]; avatar.attachStream(e.streams[0]); };

  const mic = await navigator.mediaDevices.getUserMedia({
    audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true, channelCount: 1 },
  });
  pc.addTrack(mic.getAudioTracks()[0], mic);

  const dc = pc.createDataChannel("oai-events");
  dc.onmessage = (m) => onEvent(JSON.parse(m.data));

  await pc.setLocalDescription(await pc.createOffer());
  const ans = await fetch(
    `https://${RESOURCE}.openai.azure.com/openai/v1/realtime/calls`,
    { method: "POST", body: pc.localDescription!.sdp,
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/sdp" } });
  if (!ans.ok) throw new Error(`SDP ${ans.status}`);
  await pc.setRemoteDescription({ type: "answer", sdp: await ans.text() });
  return { pc, dc, send: (ev: object) => dc.send(JSON.stringify(ev)) };
}
```
On WebRTC the server truncates its own audio when the user barges in. Over WebSocket you must send `conversation.item.truncate` with `audio_end_ms` yourself **[V]**.

Android (Capacitor):
- Declare `RECORD_AUDIO` and `MODIFY_AUDIO_SETTINGS`.
- The WebView must grant `onPermissionRequest`. Capacitor's bridge client handles this, but test it on Android 12–15.
- Use a single foreground audio route.
- Low-end ₹8–12k phones are the target hardware; test echo cancellation on loudspeaker **[U]**.

### 1.6 `session` fields (GA schema) and a starting config for children

The GA field reference comes from OpenAI's client-events reference **[V]**. Azure's own how-to page still shows older flat fields (`input_audio_transcription`, `turn_detection`). Use the nested GA shape below on `/openai/v1`, then read the `session.updated` echo to confirm what Azure accepted **[U]**.

| field | values | Taxila setting |
|---|---|---|
| `type` | `realtime` \| `transcription` | `realtime` |
| `model` | the **Azure deployment name** | e.g. `rt21mini` |
| `instructions` | string | structured sections (role, tone, language, pronunciations, tools, safety), with safety last (see 1.8) |
| `output_modalities` | `["audio"]` or `["text"]` | `["audio"]` (the transcript still arrives as `response.output_audio_transcript.delta`) |
| `audio.input.noise_reduction.type` | `near_field` \| `far_field` \| null | `near_field` for phones and headsets; `far_field` for tablets and laptops |
| `audio.input.transcription` | `{model, language, prompt}`; models: `gpt-4o-mini-transcribe`, `gpt-4o-transcribe`, `gpt-live-transcribe`, `gpt-realtime-whisper`, … | on Azure, `model` = your transcription deployment name **[V Azure note]**; leave `language` unset and A/B test `hi` against none for Hinglish **[U]** |
| `audio.input.turn_detection` | `server_vad{threshold, prefix_padding_ms, silence_duration_ms, idle_timeout_ms, create_response, interrupt_response}` \| `semantic_vad{eagerness: low/medium/high/auto, …}` \| null | see the VAD note below |
| `audio.output.voice` | alloy, ash, ballad, coral, **cedar**, echo, **marin**, sage, shimmer, verse | A/B test marin, cedar, coral and shimmer with children; it cannot be changed mid-session **[V]** |
| `audio.output.speed` | 0.25–1.5 | 0.9–0.95 for Classes 1–4 **[U]** |
| `tools`, `tool_choice` | function or MCP tools; `auto`/`none`/`required` | 6–8 small tools (1.7) |
| `max_output_tokens` | 1–4096 \| `inf` | 1500 as a runaway guard only (about 75 s of speech at 20 tok/s) **[U]** |
| `truncation` | `auto` \| `disabled` \| `{type:"retention_ratio", retention_ratio, token_limits:{post_instructions}}` | Azure did not support `retention_ratio` as of 2025-11 **[S]**; prune manually instead (1.9) |
| `reasoning.effort` | minimal, low, medium, high, xhigh (2.x models) | `low` for dialog; `minimal` if latency is too high **[U]** |

**VAD for children.** Children pause in the middle of a thought, and the defaults (threshold 0.5, silence 500 ms) will interrupt them.
- Start with `server_vad`, threshold 0.55–0.65 (noisy Indian homes), `silence_duration_ms` 800–1000, `prefix_padding_ms` 300, and `idle_timeout_ms` 8000. Let the teacher prompt the child gently when the timeout fires.
- In August 2025 a user reported that **Azure ignored `semantic_vad`** and silently fell back to server_vad **[S, MS Q&A]**. Test `semantic_vad{eagerness:"low"}` again on 2.1 before relying on it.
- Ship a **push-to-talk fallback** (`turn_detection: null`, then `input_audio_buffer.commit` and `response.create`) for noisy rooms and very young children.

```jsonc
// session-config.json: starting point; every number here is a hypothesis to tune
{
  "type": "realtime",
  "model": "rt21mini",
  "output_modalities": ["audio"],
  "reasoning": { "effort": "low" },
  "audio": {
    "input": {
      "noise_reduction": { "type": "near_field" },
      "transcription": { "model": "gpt-4o-mini-transcribe", "prompt": "Hinglish classroom talk; NCERT terms: photosynthesis, denominator, magnet" },
      "turn_detection": { "type": "server_vad", "threshold": 0.6, "prefix_padding_ms": 300,
                          "silence_duration_ms": 900, "idle_timeout_ms": 8000,
                          "create_response": true, "interrupt_response": true }
    },
    "output": { "voice": "marin", "speed": 0.95 }
  },
  "tool_choice": "auto",
  "tools": [ /* see 1.7 */ ],
  "max_output_tokens": 1500
}
```

### 1.7 Function calling during the call, and letting the teacher see the module

The event flow is OpenAI GA **[V]**:
```jsonc
// server -> client (data channel)
{ "type": "response.function_call_arguments.done", "call_id": "call_123", "name": "show_module",
  "arguments": "{\"engine\":\"ray-optics@1\",\"params\":{\"mirror\":\"concave\",\"object_cm\":25}}" }
// client -> server: return the result, then ask the model to continue speaking
{ "type": "conversation.item.create",
  "item": { "type": "function_call_output", "call_id": "call_123", "output": "{\"ok\":true,\"module_id\":\"m_9\"}" } }
{ "type": "response.create" }
```
Recommended tool set (keep it small; every tool description costs tokens on every turn):
- `show_module(engine, params, goal_id)`
- `set_module_param(module_id, name, value)` lets the teacher move the slider herself
- `show_diagram(kind: svg|mermaid|image_ref, spec)`
- `check_answer(objective_id, student_answer)`, which routes to a cheap text model
- `mark_objective(objective_id, evidence)`
- `emote(expression)` drives the avatar
- `next_segment()` plays the next pre-rendered narration chunk
- `end_lesson(summary)`

**Module observations without making the teacher talk.** Inject module events as conversation items **without** `response.create`:
- Debounce raw events into summaries every 1.5–3 s, for example `[module m_9] student moved object distance 25→8 cm; image became virtual; goal g2 not met`.
- Request a response only on milestones: goal met, the same mistake three times, or 20 s of idling.
- Prefer `role: "user"` with a bracketed `[observation]` prefix, or `role: "system"` if Azure accepts it **[U]**.

GPT-Live offers this natively: `session.thinking.append` is quiet context, and `session.commentary.append` is content the model should say aloud. Both take up to 500 tokens each **[V]**.

### 1.8 Hindi and Hinglish quality: what is known

- **Language coverage.** Microsoft lists Hindi, Marathi, Tamil, Kannada and Urdu among the languages gpt-realtime handles under 50% WER **[V, Voice Live language page]**. That bar is very loose.
- **Accent.** One secondary source says the realtime voices are "single global multilingual models" with a "neutral/US-leaning" accent and no en-IN locale control **[S, low confidence]**.
- **Regression in 2.1.** Production users report that 2.1 and 2.1-mini drift into English or an English accent for several turns, and some recommend reverting to 1.5 **[S, forum Jul 15–Aug 8 2026]**. The thread covers European languages, not Hindi. Assume Hindi is affected until tested.
- **Transcription.** OpenAI's 2025-12-15 transcription snapshot is "particularly strong in … Hindi, Bengali" **[S, OpenAI dev blog]**.
- **Indian-accented voices.** Azure Voice Live has native realtime voices **`diya`** ("crisp, clear bilingual Hindi and Indian-accented English") and **`meera`** (calm, warm, bilingual), plus en-IN `aarti` **[V]**. These belong to the `azure-realtime` model and Azure TTS, not to gpt-realtime's native voices.
- **Prompting levers** (OpenAI Realtime Prompting Guide **[V]**):
  - Pin the output language explicitly.
  - Add a "Reference Pronunciations" section (Hindi words, Indian names, NCERT terms).
  - Add a "Variety" rule.
  - Use labelled sections.
  - Inject context in the target language, which helped drift a little **[S]**.
- **Lessons carried over from the sibling Meera project** (its `CLAUDE.md` notes; measured there, not here):
  1. Example sentences in a prompt get recited. Describe the register ("Hindi sentence frame, English technical nouns, warm elder-sibling tone"), not lines she could say.
  2. Rules placed **last** in the prompt fire reliably; rules buried mid-prompt were followed 0 times in 8.
  3. Silent truncation eats the **end** of the prompt, where safety text sits. Add a prompt-budget check to CI.

**Evaluation to run before choosing a model (week 1):**
- Arms: 1.5, 2, 2.1, 2.1-mini and gpt-live-1. Voices: marin, cedar, coral, shimmer.
- 20 children aged 6–14, 5 scripted lesson snippets each, plus free talk.
- Score on a 1–5 rubric: Hinglish naturalness, drift events per 10 turns, wrongly interrupted child turns, comprehension, and "sounds like a teacher".
- Pick the cheapest arm within 0.3 rubric points of the best.

### 1.9 Pricing and the 45-minute session

**Azure Global token prices, $ per 1M tokens [V]:**

| model | text in / cached / out | audio in / cached / out | image in |
|---|---|---|---|
| gpt-realtime-2.1 | 4.00 / 0.40 / 24.00 | 32.00 / 0.40 / 64.00 | 5.00 |
| gpt-realtime-2.1-mini | 0.60 / 0.06 / 2.40 | 10.00 / 0.30 / 20.00 | 0.80 |
| gpt-realtime-2 | 4.00 / 0.40 / 24.00 | 32.00 / 0.40 / 64.00 | 5.00 |
| gpt-realtime-1.5 | 4.00 / 0.40 / 16.00 | 32.00 / 0.40 / 64.00 | 5.00 |
| Data Zone (2.1) | +10% | 35.20 / 0.44 / 70.40 | |

Other voice-related prices **[V]** (*[S] = not on the Azure pricing page*):

| service | price |
|---|---|
| gpt-realtime-whisper | $1.02/h |
| gpt-live-transcribe | $1.02/h |
| gpt-transcribe | $0.27/h |
| gpt-4o-transcribe (audio input) | $6/M tokens |
| gpt-4o-mini-transcribe (audio input) | $3/M tokens |
| gpt-4o-mini-tts | $0.60/M text in, $12/M audio out |
| Azure Neural TTS | $15/M chars |
| Azure Neural HD TTS | $22/M chars |
| Azure STT real-time | $1/h |
| MAI-Transcribe-2 | **$0.10/h** |
| Azure Pronunciation Assessment | $0.30/h add-on |
| GPT-Live-1 | **$3/h** for voice (Azure catalog search snippet) **[S]**; OpenAI direct is $0.05/min **[S]**; backend LLM billed separately |

**Token rates.** User audio is 1 token per 100 ms (600 tokens/min). Assistant audio is 1 token per 50 ms (1,200 tokens/min) **[V, OpenAI cost guide]**.

**Why long sessions blow up.** Each response re-processes the whole conversation as input. One measured 14-minute unpruned mini session used 480k tokens and cost $2.05 ($0.146/min). Across 4,000 measured production sessions, mini cost **$0.015–0.08/min**, on OpenAI direct with caching **[S, Hackernoon]**.

**Model assumptions** (reproducible with `python3 docs/research/realtime-cost-model.py`):
- 45 minutes, 60 exchanges.
- The teacher speaks 40% of the time (18 min) and the student 15% (6.75 min).
- 2,500-token system prompt, plus 80 tokens of text per turn for tool results and observations.
- Text output = 25% of audio output tokens.

| scenario (45 min) | 2.1 | 2.1-mini |
|---|---|---|
| No pruning, **no cache (Azure today, per MS)** | **$27.0** ($0.60/min) | **$8.2** ($0.18/min) |
| No pruning, 97% cache hit (OpenAI-direct-like) | $3.5 | $1.2 |
| Keep last 6 turns as audio, older turns as text summary, no cache | $7.7 | $2.2 |
| Keep last 1 turn as audio, rest as text, no cache | $3.9 | **$0.96** |
| Text-in (external STT) / audio-out | $3.4 | $0.72 |
| **GPT-Live-1** voice + gpt-5.6-luna backend | ≈$2.3 | n/a |
| **Cascaded:** STT (MAI-2 $0.08, or Sarvam $0.23) + gpt-5.6-luna ($0.02) + Azure Neural TTS ($0.23) | ≈$0.35 | n/a |

The floor for 2.1 is its audio output alone: about $1.38 for 18 minutes of teacher speech. You cannot prune your way below it.

**Keeping 45 minutes affordable, in order of impact:**
1. **Pre-render and cache narration across students.** The "how a concave mirror forms an image" segment is identical for every Class 7 student. Generate it once with TTS (about $0.25 per 18 minutes, then near $0 marginal) and play it from object storage. The realtime model is idle during playback, and nothing is billed while it is not generating a response **[U, verify that VAD-committed silence does not bill]**. Realtime then handles only Q&A: about 10–15 dialog minutes per lesson instead of 45.
2. **Measure Azure caching on day 1.** Read `usage.input_token_details.cached_tokens` from every `response.done`. Microsoft said in March 2026 that realtime endpoints do not cache **[S]**, yet the pricing page lists cached-audio prices **[V]**. If caching works, costs drop 5–8×.
3. **Prune manually.** Keep at most the last 1–2 turns as audio. Replace older items with text (`conversation.item.delete`, then `conversation.item.create` with a summary). Do this in batches every N turns rather than every turn, so the cache (if any) breaks rarely. This is what `retention_ratio` would do, but Azure lacks it **[S]**.
4. **Keep instructions static and short.** Changing instructions mid-session breaks the cache **[V, OpenAI]**. Put lesson-specific context into conversation items, not into `instructions`.
5. **Use mini by default and 2.1 by exception.** Route hard reasoning, such as diagnosing a misconception, to an out-of-band text call (gpt-5.6-terra) rather than raising realtime reasoning effort.
6. **Make teacher turns short.** OpenAI's measured data shows audio output dominates cost **[S]**. A 20–40% saving comes from shorter answers alone **[S]**.
7. **Auto-pause** after 60 s of no speech and no module activity, and close the session. Reconnect costs only a new system-prompt read.

**Unit economics check.** Consumer price points in India: SpeakX ₹300/mo, Khanmigo $4/mo, PW's average collection ₹4,104 per year **[S]**. At 20 lessons a month:

| approach | monthly cost per student |
|---|---|
| Full-S2S mini, no cache | $43 |
| Hybrid (narration cached, mini dialog about 12 min, pruned) | ≈$5–8 **[U]** |
| Cascaded | ≈$7 |

Only the hybrid or cascaded designs can fit a ₹499–999/month plan. The $5k credit buys roughly 2,000–4,000 hybrid lessons, or about 100 beta students for one to two months.

### 1.10 GPT-Live-1 details (spike candidate)

- **Endpoints [V]:**
  - WebSocket: `wss://<resource>.openai.azure.com/openai/v1/live/sessions`, then the client sends `session.start {model, instructions, audio.output.voice, delegation}`.
  - WebRTC: the backend POSTs `{session:{…}, transport:{type:"webrtc", sdp}}` to `https://<resource>.openai.azure.com/openai/v1/live/sessions`. Data channel `oai-events`. **No ephemeral keys**, so the backend always relays the SDP.
  - Sideband: `wss://…/openai/v1/live/sessions/{session_id}/attach`.
- **Delegation:** `{type:"client"}` sends tool and reasoning hand-offs to your app. `{type:"responses", …}` sends them to a configured Responses-API backend.
- **Context:** older history is summarised automatically. Keep authoritative lesson state in your app.
- **Billing:** a 15-second minimum per WebRTC session. Usage is cumulative; read it from `session.closed`.
- **Language and voice:** the catalog lists "multilingual + accents across 10 languages", and a secondary source says Hindi is one of them, at a lower tier than English **[S]**. Instructions and voice are immutable after start. Use `session.instructions.append` to add to them.
- **Fit:** strongest on naturalness and cost (flat hourly rate). Weakest on children who pause **[S, IndicFDB]**. Test it with the same rubric as 1.8.

---

## 2. Teacher avatar

### 2.1 Options

| option | how lip-sync works with realtime audio | cost / min | look | fit |
|---|---|---|---|---|
| **Rive** state machine (2D vector) | number input `mouthOpen` from audio RMS, or a `viseme` index from HeadAudio | ≈$0 (runtime is open source; editor $9–32 per seat per month to export `.riv`) **[S]** | stylised, warm, Duolingo-like | **v1 pick**. Duolingo's Lily runs on a Rive state machine with 20+ mouth shapes **[S]** |
| **Lottie / dotLottie** | swap pre-baked mouth loops by amplitude | ≈$0 | flat | rewards, confetti, transitions; weak for faces |
| **Live2D Cubism (Web)** | `ParamMouthOpenY` from RMS (standard VTuber setup) | ≈$0; free publication license under ¥10M annual revenue **[S]** | anime-leaning 2.5D, very lively | v1 alternative if the art direction wants 2.5D |
| **three.js + TalkingHead (MIT)** | **HeadAudio** AudioWorklet detects visemes from raw audio in-browser; GLB with ARKit + Oculus viseme blendshapes **[S]** | ≈$0 | 3D; uncanny-valley risk | v1.5. Ready Player Me closed on **2026-01-31** after the Netflix acquisition; use MPFB (CC0), VRoid or Avatar SDK instead **[S]** |
| **Azure TTS avatar** (Voice Live) | server renders lip-synced H.264 over WebRTC; needs an **Azure TTS voice**, not native gpt-realtime audio | **$0.50** standard interactive; $0.60 photo avatar (VASA-1); 4K $0.80 **[V]** | photoreal | v2 premium only; $22.50 per 45-min lesson |
| **HeyGen LiveAvatar (LITE)** | bring your own audio; returns video | ≈$0.08–0.10 (1 credit/min) **[S]** | photoreal | v2 candidate |
| **Simli (Trinity-1)** | bring your own audio, WebRTC, <300 ms | "<$0.01" marketed; plans $0–249/mo; 50 free min/mo **[S]** | photoreal (Gaussian) | **v2 pick** to trial |
| **Anam** | managed stack (does not accept your audio) | $0.11–0.16 **[S]** | photoreal | no: replaces our voice stack |
| **Tavus CVI** | managed stack | $0.32–0.37 **[S]** | photoreal | no |
| **Beyond Presence** | bring-your-own speech-to-video | €0.03–0.175 **[S]** | photoreal | v2 alternative |
| **D-ID** | hybrid | pricing not public **[S]** | photoreal | skip |
| Soul Machines | in receivership since Feb 2026 **[S]** | n/a | n/a | avoid |

Prices for HeyGen, Simli, Anam, Tavus and Beyond Presence come from the Akapulu index (sourced 2026-09-14).

### 2.2 Lip-sync from the realtime audio stream (no visemes from gpt-realtime)

gpt-realtime sends audio only, with no visemes. You have three ways to animate the mouth:

1. **Amplitude (simplest, works everywhere).** Feed `MediaStream → AnalyserNode` into an RMS value, smooth it, and drive `mouthOpen`. Add a crude vowel cue: the high/low band energy ratio picks wide versus round mouth shapes.
2. **Audio-driven visemes.** HeadAudio (MIT AudioWorklet from TalkingHead) classifies visemes from raw audio with no text **[S]**. Map its viseme output onto a Rive `viseme` number input. This works for Hindi too, because it is acoustic rather than text-based **[U, test]**.
3. **Voice Live visemes.** Set `animation.outputs: ["viseme_id"]` to receive `response.animation_viseme.delta {audio_offset_ms, viseme_id}` **[V]**. This works only with Azure TTS voices.

```ts
// amplitude -> Rive (v1). Chrome quirk: attach the remote stream to a playing <audio> too,
// or WebAudio may receive silence from a WebRTC track [U, known Chromium behaviour].
const ctx = new AudioContext();
const an = ctx.createAnalyser(); an.fftSize = 512; an.smoothingTimeConstant = 0.6;
ctx.createMediaStreamSource(remoteStream).connect(an);
const buf = new Float32Array(an.fftSize);
const mouth = rive.stateMachineInputs("Teacher").find(i => i.name === "mouthOpen")!;
(function tick() {
  an.getFloatTimeDomainData(buf);
  const rms = Math.sqrt(buf.reduce((s, x) => s + x * x, 0) / buf.length);
  mouth.value = Math.min(100, Math.max(0, (rms - 0.01) * 600));   // gate + gain; tune per voice
  requestAnimationFrame(tick);
})();
```

Drive more than the mouth:
- `output_audio_buffer.started/stopped` switch between talking and listening poses.
- `input_audio_buffer.speech_started` triggers a listening nod or a "hmm" pose.
- `emote()` tool calls set the expression: smile, thinking, surprised, proud.
- Idle blinks and breathing loop in the state machine.

Rive's newer data-binding API may replace state-machine inputs; check current Rive docs **[U]**.

### 2.3 Recommendation

- **v1:** one Rive teacher character, about 15 visemes plus 6 expressions, in Indian school-teacher styling ("Didi/Ma'am"). Drive it by amplitude on day 1 and by HeadAudio visemes by week 3.
  - Commission the art: it is a one-off cost, and Rive animators charge for their work.
  - It runs fully client-side, adds nothing per minute, and works offline for narration.
  - Lottie handles reward animations.
- **v2:** an optional "video teacher" tier using Simli or LiveAvatar LITE (bring your own audio, so the voice stack stays the same). Use it for short segments (greetings, celebrations), or for a premium plan where about $0.01–0.10/min is acceptable.
- **v3:** a custom photo avatar (Azure, $0.60/min), or a self-hosted audio-to-face model if volume justifies the GPU cost **[U]**.

---

## 3. Generative interactive learning modules

### 3.1 State of the art (2025–2026)

| system | approach | evidence |
|---|---|---|
| **Google Generative UI** (Gemini 3 Pro; "dynamic view" in the Gemini app; AI Mode in Search; 2025-11-18) | the model writes complete HTML/JS from detailed system instructions, with tools (image generation, search) and post-processors for common errors | raters strongly preferred it to markdown when speed was ignored; "**can sometimes take a minute or more**"; occasional inaccuracies **[S, Google Research]** |
| **Google, "Harnessing Generative UI for Education"** (arXiv 2609.20738, 2026-09-18) | plan, then leveled goals, then generate UI, then guidance (tours, hints, feedback); critique-and-refine loop that renders in Chrome and checks visual, solution, telemetry and mechanics | single prompt passed all critiques **3.5%** of the time; after 10 rounds **69.3%**; experts accepted **86%**; physics and chemistry best, biology weakest; teacher usability 8.1/10 (n=12) **[S]** |
| **Google Learn Your Way** (Labs, 2025) | turns textbook content into personalised representations: immersive text, quizzes, narrated slides, audio, mind maps | randomised trial, n=60, ages 15–18: **+11 pp retention** after 3–5 days (78% vs 67%) **[S]** |
| **ChatGPT interactive math and science** (2026-03-10) | **70+ curated topics** (Ohm's law, compound interest, Hooke's law…) with live sliders | curated modules, not live free-form code **[S]** |
| **Claude artifacts / Gemini Canvas** | free-form HTML/React rendered in a sandboxed iframe on a separate origin, with a fixed set of preloaded libraries | general-purpose; quality varies; no telemetry contract **[U, from general knowledge]** |
| **PhET** | about 160 hand-built HTML5 simulations; PhET-iO gives event APIs (licensed) | historical simulations CC BY 4.0 (keep the logo and attribution); **new simulations CC BY-NC since 2026-03-29** **[V]** |
| **Synthesis Tutor** | hand-built manipulatives, with an AI tutor driving them | the quality bar for "interactive"; $300/yr **[S]** |

**Conclusion.** The production systems with the highest quality bar (ChatGPT, Synthesis, PhET) all ship **curated or parameterized** interactives. Free-form generation is real but slow (a minute or more) and unreliable without a long critique loop. Do not put it in the live path for children.

### 3.2 The module spectrum for Taxila

| tier | what generates it | latency | reliability | when |
|---|---|---|---|---|
| **T0 Engine library** | hand-built TypeScript engines (about 25–40 for K-9) | 0 (bundled) | about 100% | always available |
| **T1 Spec-filled** | LLM (gpt-5.6-terra or luna, structured output) fills an engine's JSON spec | **1–3 s** **[U]** | near 100% valid, because a schema validator rejects bad specs **[U]** | **live in lesson, the main path** |
| **T2 Offline free-form** | gpt-5.6-sol writes p5.js/canvas/SVG, then static checks, headless render, vision critique and a fix loop (at most 10 rounds), then human review | minutes to hours | about 70% pass after the loop (Google's figure) | builds the library ahead of lessons; promoted into T0 or T1 |
| **T3 Live free-form** | same generator, live | 30–120 s+ | low | never by default; only for "teacher sketch" toys marked as draft |

**Starter engine list (K-9, NCF-SE new books):**
- **Mathematics (Ganita Prakash / Ganita Manjari):**
  - number line, fraction bars and circles, place-value blocks, area and perimeter grid
  - protractor and angles, symmetry mirror, coordinate plane, function grapher
  - algebra tiles, probability spinner and dice, data-handling charts (bar, pictograph), 3D nets
- **Science (Curiosity / Exploration):**
  - states of water particle box, magnet and field lines, simple circuit builder
  - ray optics (mirrors and lenses), length-and-motion measurement, thermometer
  - separation methods (drag and drop), food chain builder, labelled cell diagram (SVG hotspots)
  - moon phases and solar system, sink or float (density)
- **Social science:** India map hotspot quiz, timeline builder, sort and match.
  - Maps must show India's official boundaries (Survey of India). Do not use generic world GeoJSON **[U, legal check]**.
- **Languages:** word builder, sentence ordering, read-along with highlighting, pronunciation practice (Azure Pronunciation Assessment, $0.30/h **[V]**).
- **Generic:** MCQ, drag-to-match, fill-in, flashcards, sorter, "explore with sliders".

**T1 spec example** (the LLM output is validated with zod/ajv against the engine's schema):
```jsonc
{
  "engine": "ray-optics@1",
  "module_id": "m_9",
  "lang": "hi-Latn+en",
  "title": { "en": "Concave mirror images", "hi": "अवतल दर्पण से प्रतिबिंब" },
  "params": {
    "mirror": "concave",
    "focal_cm": 10,
    "object_cm": { "min": 3, "max": 40, "step": 1, "value": 25, "student_editable": true }
  },
  "goals": [
    { "id": "g1", "say": "Make the image real and inverted", "check": { "param": "object_cm", "op": ">", "value": 10 } },
    { "id": "g2", "say": "Now make it virtual and enlarged", "check": { "param": "object_cm", "op": "<", "value": 10 } }
  ],
  "telemetry": ["param_change", "goal_met", "idle_20s", "reset"],
  "objective_ids": ["SCI7.LIGHT.LO3"]
}
```

### 3.3 Making it reliable

1. **Schema-first.** Each engine exports `specSchema` (zod) plus a `describe()` string that becomes the tool description. LLM output → `safeParse` → on failure, re-ask once with the error. Ranges are clamped by the engine, not trusted from the LLM.
2. **Golden tests per engine.** Snapshot-render about 20 representative specs in CI with Playwright (canvas not blank, no console errors, all goals reachable).
3. **T2 pipeline** for free-form work:
   - Static AST checks (acorn): ban `fetch`, `XMLHttpRequest`, `WebSocket`, `import()`, `eval`, `Function`, `localStorage`, `document.cookie`, `window.open`, `navigator.*`, `top`/`parent` access except through the bridge.
   - Render in headless Chromium with simulated input. Assert that telemetry events fire.
   - Screenshot and run a vision critique (gpt-5.6-terra), then repair.
   - Human review, then publish to the library with a version number.

   This needs an always-on worker (Azure Container Apps) or Vercel Sandbox, not a request handler **[U]**.
4. **Pedagogy checks.** The LLM grades a rubric (goal clarity, scaffold, feedback, age-appropriate language). A teacher reviewer signs off on T2. The Google paper's acceptance results came from expert teachers.
5. **Cache by concept, personalise by parameters.** Modules are per learning objective, not per student. Store them in Postgres keyed by `(engine, objective_id, spec_hash)` so they are reused across students.

### 3.4 Sandbox and the postMessage bridge

```html
<!-- host page (app origin). Modules served from a SEPARATE origin, e.g. https://sandbox.taxila.app (own Vercel project) -->
<iframe id="mod"
  src="https://sandbox.taxila.app/engine/ray-optics@1.html"
  sandbox="allow-scripts"            
  allow=""                            
  referrerpolicy="no-referrer"
  loading="eager"></iframe>
<!-- never add allow-same-origin together with allow-scripts: the frame could remove its own sandbox -->
```
- Leave out `allow-same-origin`, `allow-forms`, `allow-popups`, `allow-top-navigation`, `allow-modals` and `allow-downloads`. The frame then gets an **opaque origin**, and its messages arrive with `origin === "null"` **[S]**.
- Set the CSP header on the sandbox origin:
  `default-src 'none'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; connect-src 'none'; frame-ancestors https://app.taxila.app`.
  - `connect-src 'none'` means a module cannot send data anywhere.
  - Bundle p5, three, JSXGraph and KaTeX locally rather than loading them from CDNs.
- `srcdoc` works for T2 previews, but it inherits the parent's CSP. A separate origin is cleaner **[S]**.

Bridge protocol (both directions validated with zod):
```ts
// iframe -> host
type ModuleEvent = { v: 1; kind: "taxila:event"; module_id: string; nonce: string;
  event: "ready"|"param_change"|"goal_met"|"answer"|"idle"|"error";
  payload: Record<string, string|number|boolean>; t_ms: number };
// host -> iframe
type HostCmd = { v: 1; kind: "taxila:cmd"; nonce: string;
  cmd: "init"|"set_param"|"highlight"|"reset"|"reveal_hint"; args: Record<string, unknown> };

window.addEventListener("message", (e) => {
  if (e.source !== modFrame.contentWindow) return;   // origin is "null", so check the source window
  const ev = ModuleEventSchema.safeParse(e.data);
  if (!ev.success || ev.data.nonce !== currentNonce) return;
  rateLimit(ev.data) && observer.push(ev.data);       // debounced -> conversation item (1.7)
});
```
The host sends `init` with a per-mount `nonce`. Events without the nonce are dropped.

### 3.5 Latency budgets (generate while the teacher talks)

| step | budget | how |
|---|---|---|
| teacher first audio after the student stops | ≤ 800 ms target | realtime over WebRTC; GPT-Live measured 0.069–0.28 s turn-taking in IndicFDB **[S]** |
| tool call to visible module (T0/T1) | ≤ 3 s | the teacher's spoken preamble ("chalo, ek mirror lete hain…") covers it; realtime-2.x supports preambles **[S]** |
| T1 spec generation | 1–3 s | about 300–600 output tokens on luna or terra with structured output **[U]** |
| LLM SVG diagram | 2–8 s | 1–3k tokens **[U]** |
| Mermaid diagram | 1–3 s | short spec; validated with `mermaid.parse()` |
| gpt-image-2 illustration | low quality ≈17–20 s; high ≈2 min (1024²) **[S]** | **pre-generate during lesson planning**, never in the live path |
| T2 free-form simulation | minutes (with critique loop) | offline, ahead of the syllabus calendar |

**Lesson-plan prefetch.** When a lesson starts, the planner already knows the next 3–5 objectives. Prefetch or generate their T1 specs, SVGs and narration audio in the background, so live tool calls mostly hit the cache.

### 3.6 Safety for children

- No network access from modules (CSP), no outbound links, no free text input that goes to other users, no personal data inside the frame.
- Every generated string (labels, hints, image prompts, narration) passes **Azure AI Content Safety**. Image prompts are filtered before generation.
- Nothing is generated unseen in the live path: T0 and T1 are templates with LLM-filled parameters only. T2 requires human review.
- Age gate and verifiable parental consent before any audio or data is collected (DPDP, section 7.4). Do not use behavioural advertising or profiling on anyone under 18 **[S]**.
- Do not retain raw child audio by default. Keep transcripts for learning analytics only with consent, and set a retention limit.
- The crisis-helpline and never-deny-being-an-AI rules from the Meera project are directly reusable as prompt invariants with CI tests.

---

## 4. Image and diagram generation

| need | best tool | why | caveats |
|---|---|---|---|
| precise labelled science or maths diagrams (ray diagram, circuit, triangle, number line, bar chart) | **LLM-written SVG** (or a T0 engine) | exact geometry, crisp text in Hindi or English, animatable, accessible, about 0.1¢, seconds | quality drops with complexity; the best model scores only about 64% on SVG-Bench (Sep 2026) **[S]**; sanitise with DOMPurify; render check plus vision critique for library assets |
| process flows, concept maps, timelines, mind maps | **Mermaid** | deterministic layout, cheap, parse-validated | limited styling; Devanagari font fallback must be tested **[U]** |
| equations | **KaTeX** | exact, fast | none |
| function graphs and geometry constructions | **function-plot / JSXGraph** engines | interactive and exact | JSXGraph is LGPL/MIT dual-licensed **[U]**; Desmos and GeoGebra need commercial licences **[U]** |
| illustrations, scenes, story images, "real-world" context (a village well, a magnet factory) | **gpt-image-2** on Azure | strong text rendering, editing, multilingual prompts, 4K **[S]** | slow (see 3.5); labels can be wrong; never use it for content that must be scientifically exact |
| photographs of real things (organisms, monuments) | Wikimedia Commons (licence per file) | authentic | CC BY-SA attribution; cache the licence metadata |

**gpt-image-2 on Azure [V price]:**
- Token prices: text input $5/M, image input $8/M, image output **$30/M**.
- Approximate cost per image at 1024² **[S]**: low $0.006, medium $0.053, high $0.211.
- Regions: eastus2, polandcentral, swedencentral, uaenorth, westus3 **[S]**.
- Newer gpt-image-2.5 (sunburst/flare) costs the same **[V]**.
- Use: generate illustrations offline per objective at medium quality, store them, and serve them from cache. Add text labels as SVG overlays rather than baking them into the image, so language switching and correctness checks stay possible.

**Rule:** if correctness matters, it must be code (SVG, Mermaid, engine). If mood matters, use an image.

---

## 5. Competitors and market (India and global, 2025–2026)

| player | what it does | voice / avatar / interactive | price | status and notes |
|---|---|---|---|---|
| **Khanmigo** (Khan Academy) | Socratic tutor plus teacher tools | TTS/STT voice; no avatar; KA exercises | **$4/mo or $44/yr**; free for Indian teachers since Nov 2024, in English and Hindi **[S]** | KA content is NCERT/CBSE-aligned **[S]**; tutor is text-first |
| **PhysicsWallah** (Alakh AI, AI Guru) | doubt solving, AI grader, AI mentor; **1:1 AI tutor launching by Q2 FY27** | 3M+ voice queries a month; tutor beta: 95% lesson-level accuracy, <1% hallucination, 1.8–2.2 s latency, **~$0.20/h voice-to-voice** **[S]** | average ₹4,104 per paid user per year; 5.34M paid users **[S]** | dropped K-12 school acquisitions to stay asset-light; State Boards online revenue up 9× **[S]**; building its own small models; strongest in test prep |
| **BYJU'S** | n/a | n/a | n/a | insolvency continuing; NCLT paused the search for a buyer for Think & Learn **[S]**. Parents remember the hard selling and EMI contracts, so trust is an opening for a transparent, low-pressure brand |
| **Vedantu** | live human tutoring | none | n/a | layoffs and cash crunch **[S]**; no AI tutor news found |
| **Doubtnut** (owned by Allen since Dec 2023, about ₹83 cr) | photo-to-video doubt solutions in Hindi | no | freemium | monthly reach of about 32M at acquisition **[S]** |
| **SpeakX** | spoken-English AI coach | voice-first | **₹300/mo** | 1M monthly learners, 200k paid, $7.5M ARR, 70% Hindi-speaking; EBITDA-positive **[S]**. Shows Hindi-belt families pay for voice AI |
| **Duolingo Max** | language learning; **Video Call with Lily** (Rive-animated) | voice plus 2D avatar | global $168/yr; India price reported as ₹99/mo at launch or about $70/yr **[S, conflicting]** | the reference for the Taxila avatar experience |
| **Synthesis Tutor** | math for ages 5–11 with interactive manipulatives | voice; rich interactives | $45/mo or $300/yr; family plan $119/yr **[S]** | the reference for interactive quality |
| **Alpha School / Timeback** | "2 hours a day" AI-driven school | software plus human guides | $10k–75k/yr | expanding to about 50 campuses for 2026; claims not independently verified **[S]** |
| **Google** (Gemini, LearnLM, Learn Your Way) | Guided Learning, Study Notebooks, free JEE/NEET mocks; Gemini in Classroom for all ages (Aug 2026); Learn Your Way research | Gemini Live voice | **free AI Plus for Indian college students** until 2026-12-31 **[S]** | does not cite NCERT pages; weaker on formal academic Hindi **[S, low confidence]** |
| **OpenAI** (ChatGPT) | Study Mode; interactive visuals (70+ topics); **ChatGPT for Teens** (13–17, launched 2026-08-18) | Advanced Voice | ChatGPT Go free for a year in India (from Nov 2025); 5 lakh free licences via the Learning Accelerator **[S]** | **not for under-13s** **[S]** |
| **Anthropic** (Claude) | Learning mode; Claude for Education (universities); Claude for Teachers (US K-12, Jul 2026) | n/a | institutional | not aimed at Indian school students |
| **YoLearn.ai** (Noida) | **voice-first AI tutor with live sketchpad, "teacher avatars", 22 Indian languages**; CBSE/JEE/NEET | yes / yes / sketchpad | token packs; plans Free, Starter (500), Pro (1,000+200), Elite (2,000+500); about $5–100/mo usage **[S]** | 200k users; pre-seed $500k at $5M valuation; seed from ABP Education (Sep 2026) **[S]**. **Closest direct competitor** |
| **ProLearn** | AI learning companion for K-12 and exams | n/a | n/a | $4.07M pre-seed (Jun 2026), founded by an ex-Vedantu executive **[S]** |
| **Sarvam AI** | Indic STT/TTS/LLM platform | n/a | Saaras ₹30/h, Bulbul ₹3 per 1k chars **[V]** | a vendor and possible partner, not a direct competitor |

### 5.1 Gaps Taxila can exploit

1. **Under-13s and teacher-led.** General assistants are 13+, and test-prep incumbents target Classes 9–12. Classes 1–8 are underserved, especially Hindi-medium and Hinglish learners and state boards (RBSE).
2. **The new NCF-SE books (2024–26).** *Ganita Prakash*, *Curiosity*, *Exploration*, *Malhar* and the rest are new and full of activities. Little aligned interactive content exists yet. Being "the companion for your actual textbook chapter" is a sharp position.
3. **An actual teacher presence.** A named, animated "Taxila Ma'am/Didi" who talks, draws and runs experiments. Most Indian AI tutors are chat or doubt-solving tools. YoLearn is the exception and is the one to beat on warmth and on interactive quality.
4. **Experiential learning on demand.** ChatGPT covers 70 generic topics, PhET's new simulations are non-commercial, and NCERT activities assume a lab. Engine-backed modules mapped to every chapter activity fill this.
5. **Price and trust.** ₹299–699/mo, no sales calls, no EMI, weekly parent reports in Hindi. This needs the hybrid cost design from 1.9, because PW's ~$0.20/h is the benchmark the market will set.
6. **Parent co-presence.** Short WhatsApp voice-note summaries for parents ("aaj Riya ne magnets seekhe…"). Treat this as a market hypothesis to test **[U]**.

---

## 6. Indic speech (children, Hinglish)

### 6.1 Why this is hard

- **Children's ASR.** On OGI and MyST child corpora, Whisper-large reached 55.8% WER on child speech versus 26.0% on adult speech (the 2024 benchmark paper); Canary and Parakeet did better zero-shot **[S]**.
- **Children code-switch more.** HiACC (Hinglish code-switched speech; 20 children aged 10–14 and 24 adults; 5.24 h) found intra-sentential switching in **60.7%** of children's utterances versus 36.7% of adults'. WER for Whisper Medium was 18% for children and 16% for adults; MMS-1B was 36% and 31% **[S]**. The licence is **CC BY-NC 4.0**, so it is usable for research and evaluation only, not for commercial training.
- **Code-switching penalty.** Code-switched speech raises WER by 30–50% relative to monolingual speech **[S]**.
- **Hindi turn latency.** Hindi cascades often take 2.5–4 s per turn against about 0.8 s for English **[S]**. This is why S2S, or a fast STT, matters.

### 6.2 Options

| option | type | Hindi / Hinglish evidence | children | price | latency | notes |
|---|---|---|---|---|---|---|
| **gpt-realtime native hearing** | S2S (no ASR on the understanding path) | Hindi supported **[V]**; drift reports on 2.1 **[S]** | unknown **[U]** | in the token cost | lowest | also hears hesitation and tone |
| **gpt-4o-mini-transcribe / gpt-4o-transcribe** | realtime input transcription or batch | 2025-12 snapshot "particularly strong in Hindi" **[S]**; prompt and language hints | unknown | $3 / $6 per M audio tokens, roughly $0.11 / $0.22 per hour at 10 tok/s **[U, derived]** | streaming in session | use for logs and analytics |
| **gpt-live-transcribe** | streaming STT | language and keyword hints; reports detected languages **[S]** | unknown | **$1.02/h** **[V]** | low | replaces whisper-1, which shuts down 2027-02-26 **[S]** |
| **MAI-Transcribe-2** (preview, Voice Live / Speech) | STT | `hi` supported; `phrase_list` biasing **[V]** | unknown | **$0.10/h** **[V]** | low | cheapest; preview status |
| **Azure Speech** (real-time, multilingual) | STT | multilingual model includes **hi-IN and en-IN** with automatic detection **[V]** | unknown | $1/h; custom $1.2/h plus $10 per compute-hour training **[V]** | low | **fine-tunable on our own consented child data**; Pronunciation Assessment |
| **Sarvam Saaras v3** | STT (streaming, codemix and translit modes) | **~19.3% WER on IndicVoices**, claimed to beat GPT-4o-transcribe and Gemini 3 Pro; leads Svarah (Indian English) **[S, vendor]** | unknown | **₹30/h (~$0.31)** **[V]** | "fast" mode <150 ms to first token **[S]** | India-hosted; strongest Indic claim; vendor-run benchmark |
| **AI4Bharat IndicConformer-600M** | open model (MIT), CTC/RNNT, 22 languages | Vaani Hindi results posted on HF **[S]** | unknown | GPU self-host | depends | not code-mix-specialised **[U]**; needs a GPU |
| Whisper (open) fine-tune | open model | HiACC baseline 18% child Hinglish WER **[S]** | improvable with data | GPU | depends | v3 path |

TTS for narration (Hinglish):
- **Azure Neural/HD** ($15/$22 per M chars **[V]**): hi-IN and en-IN voices (e.g. Swara, Madhur, Aarti **[S]**).
- **gpt-4o-mini-tts** ($12/M audio tokens **[V]**): use the same voice family as the realtime teacher (marin/cedar), so narration and dialog sound like one person. Check that gpt-4o-mini-tts offers those voices on Azure **[U]**.
- **Sarvam Bulbul v3** (₹3 per 1k chars, about $31/M chars **[V]**): widely called the best for Hinglish transitions **[S]**.
- **Voice consistency between narration and live dialog is a product requirement.** If the realtime voice is `marin`, narration must also be `marin`.

### 6.3 Recommendation

1. **v1:** keep ASR off the understanding path. The realtime model hears the child directly. Enable in-session transcription (gpt-4o-mini-transcribe deployment) only for transcripts, parent reports and mastery evidence.
2. **Build `taxila-kids-hinglish-eval` in month 1.**
   - At least 300 utterances from 30+ consented children aged 6–15, across North and West Indian accents, phones and tablets, and quiet and noisy rooms.
   - Include read and spontaneous speech, NCERT terms and numbers.
   - Measure WER/CER, numeric accuracy and **intent accuracy** (did the tutor understand the answer?). Intent accuracy matters more than WER for tutoring.
3. Run Sarvam Saaras v3 (codemix), MAI-Transcribe-2, gpt-live-transcribe and Azure multilingual on that set. Pick the cascaded-mode STT by intent accuracy at cost.
4. **v2:** Azure Custom Speech fine-tuned on consented Taxila data. This is the only option with a supported path to commercial child-speech adaptation. Keep HiACC for evaluation only, because of its non-commercial licence.

---

## 7. Curriculum data

### 7.1 Sources

| source | what | access | licence and notes |
|---|---|---|---|
| **NCERT textbooks** (ncert.nic.in/textbook.php) | all books for Classes 1–12, in Hindi, English, Urdu and translations | chapter PDFs at `https://ncert.nic.in/textbook/pdf/{code}{NN}.pdf`; prelims and contents at `{code}ps.pdf`; full book at `{code}dd.zip`. Codes: `fecu1` = Class 6 *Curiosity*, `gecu1` = Class 7 *Curiosity*, `iesc1` = Class 9 *Exploration* **[V]** | **ALL RIGHTS RESERVED. "No part… may be reproduced, stored in a retrieval system…"** **[V]**; NCERT warns it will act against commercial infringement **[S]**. Free to *read*; commercial reuse needs permission (Publication Division: secy.ncert@nic.in / pd.ncert@nic.in) **[S]** |
| **NCF-SE 2023** | curricular goals and competencies by stage | `https://ncert.nic.in/pdf/NCFSE-2023-August_2023.pdf` **[V reachable]** | government document; paraphrase and cite |
| **NCERT Learning Outcomes at the Elementary Stage** (2017) | class-wise learning outcomes for Classes 1–8 | `https://ncert.nic.in/pdf/publication/otherpublications/tilops101.pdf` **[V]** | predates the new books; useful for outcome phrasing |
| **CBSE curriculum 2026-27** | Secondary curriculum, released 2026-04-02, in force to 2031 **[S]** | cbseacademic.nic.in, then Curriculum 2026-27 | official PDFs; facts and structure are usable |
| **RBSE (Rajasthan)** | Classes 9–12 board syllabus; Classes 1–8 set by SIERT Udaipur and published by the Rajasthan State Textbook Board; many classes use NCERT books **[S]** | rajeduboard.rajasthan.gov.in | check which subjects use state books versus NCERT **[U]** |
| **DIKSHA** | energised-textbook QR to resource mapping | Sunbird (MIT code) | content reported as **CC BY-NC-ND (textbooks) / CC BY-NC-SA (resources)** **[S, Wikipedia]**, so not for commercial reuse |
| **PhET** | simulations | phet.colorado.edu | historical collection CC BY 4.0; new simulations CC BY-NC (section 3.1) **[V]** |

**The 2026-27 book set (all new NCF-SE books for Classes 1–9) [S, cross-checked with ncert.nic.in for Classes 6 and 9 V]:**

| classes | books |
|---|---|
| 1–2 | Mridang (Eng), Sarangi (Hin), Joyful Mathematics |
| 3–5 | Santoor (Eng), Veena (Hin), Maths Mela, Our Wondrous World (EVS) |
| 6–8 | Poorvi (Eng), Malhar (Hin), Ganita Prakash, Curiosity (Sci), Exploring Society: India and Beyond, Deepakam (Skt) |
| 9 (new in 2026-27) | Kaveri (Eng), Ganga (Hin), Ganita Manjari I and II, Exploration (Sci), Understanding Society: India and Beyond, Sharada (Skt) |

Example taxonomy seed, verified from the book: **Curiosity, Grade 6** (2026-27 reprint) has 12 chapters:
1. The Wonderful World of Science
2. Diversity in the Living World
3. Mindful Eating: A Path to a Healthy Body
4. Exploring Magnets
5. Measurement of Length and Motion
6. Materials Around Us
7. Temperature and its Measurement
8. A Journey through States of Water
9. Methods of Separation in Everyday Life
10. Living Creatures: Exploring their Characteristics
11. Nature's Treasures
12. Beyond Earth

### 7.2 Copyright position (not legal advice; get counsel)

- **Safe:** book and chapter **titles**, sequence, page ranges, and links to NCERT's own PDFs. These are facts and short identifiers. Original explanations, questions and modules written by Taxila or generated by an LLM are also safe, as long as they do not reproduce NCERT text **[U]**.
- **Not safe without permission:**
  - copying textbook passages, exercises or figures into the app;
  - **embedding NCERT text in a vector store for RAG**, which the notice names explicitly ("stored in a retrieval system");
  - redistributing PDFs.
- **Grey:** an LLM reading a chapter transiently to align generated objectives, with nothing stored. Ask NCERT for permission early. A written licence also becomes a marketing asset ("NCERT-aligned, with permission").
- India's educational exception (section 52(1)(i), Copyright Act) covers teachers and pupils in the course of instruction. It probably does not cover a commercial platform **[U]**.

### 7.3 Seed taxonomy approach

**Hierarchy:** Board → Class → Subject → Book (edition year) → Chapter → Topic → **Learning Objective (LO)** → Misconceptions / Skills → Assets (narration, T1 specs, SVGs, quizzes)

1. **Skeleton (1–2 days, scripted).** For each class and subject, fetch `{code}ps.pdf`, read the Contents page with `pdftotext -layout`, and store the book code, chapter number, title, page range and PDF URL. Expect about 9 classes × 5–7 subjects × 8–15 chapters, or roughly 600–800 chapters. Store no body text.
2. **Objectives (LLM, offline).** For each chapter, gpt-5.6-sol drafts 4–10 LOs in original wording, tagged to NCF-SE stage competencies. Inputs: chapter title, neighbouring chapters, NCF-SE goals, and the 2017 Learning Outcomes. Output is structured JSON with Bloom level, prerequisite LO ids, a 2–5 item misconception list, and suggested engines.
3. **Human review.** Contract teachers review Classes 6–8 Science and Maths first (the launch scope), then expand.
4. **Prerequisite DAG.** Link LOs across classes (fractions in Classes 3–5 → Class 6 → Class 7 ratio). Use the DAG for diagnostics and spaced review.
5. **State-board crosswalk.** Map RBSE or other state chapters onto NCERT LOs (`crosswalk(board_chapter_id, lo_id, strength)`). Most state boards reuse NCERT books, so this table stays small.
6. **Versioning.** Books are re-issued and "rationalised" every year. Key on `edition_year` and keep old mappings (supersede them rather than deleting).

```sql
-- Neon Postgres (Drizzle) - minimal
create table board      (id text primary key, name text);                       -- 'CBSE','RBSE'
create table book       (id text primary key, board_id text, class int, subject text,
                         title text, lang text, ncert_code text, edition_year int, pdf_base_url text);
create table chapter    (id text primary key, book_id text references book, num int, title text,
                         page_from int, page_to int, pdf_url text);
create table objective  (id text primary key, chapter_id text references chapter, code text,   -- 'SCI6.MAG.LO2'
                         text_en text, text_hi text, bloom text, ncf_competency text,
                         status text default 'draft', reviewed_by text, version int default 1);
create table objective_prereq (lo_id text references objective, prereq_id text references objective,
                         primary key (lo_id, prereq_id));
create table misconception (id text primary key, lo_id text references objective, text_en text, text_hi text);
create table asset      (id text primary key, lo_id text references objective,
                         kind text,          -- narration_audio | t1_spec | svg | mermaid | image | quiz
                         engine text, spec jsonb, storage_url text, lang text, voice text,
                         content_hash text unique, created_by_model text, reviewed bool default false);
create table mastery    (student_id uuid, lo_id text references objective, p_mastery real,
                         evidence jsonb, updated_at timestamptz, primary key (student_id, lo_id));
create table module_event (id bigserial primary key, session_id uuid, module_id text,
                         event text, payload jsonb, t timestamptz default now());
```

### 7.4 DPDP (children's data)

- The DPDP Rules 2025 define a child as anyone **under 18** and require **verifiable parental consent**: proof that the consenter is an adult and the parent or guardian. Acceptable routes include verified data already on file or a DigiLocker-style digital identity token **[S]**.
- Tracking, behavioural monitoring and targeted ads aimed at children are not allowed.
- Full compliance is required by **13 May 2027**, with penalties up to ₹250 crore **[S]**.
- Design for v1: the parent creates the account and consents through a DigiLocker or verified-token flow; the child profile hangs off that account.
- Audio is not retained by default, there is a data-deletion path, and a consent log is kept.

---

## 8. Recommended v1 stack (concrete)

| layer | choice | notes |
|---|---|---|
| Client | React + Vite PWA; **Capacitor** for Android | one codebase; test on ₹8–12k Android phones |
| Hosting | **Vercel** (app + API functions) and a **separate Vercel project for `sandbox.` origin** | strict CSP on the sandbox project |
| Voice (dialog) | **Azure OpenAI `gpt-realtime-2.1-mini`** over GA WebRTC; ephemeral key from `/api/realtime/token`; Sweden Central or East US 2 deployment | A/B against 1.5 and 2.1 in week 1 (1.8); upgrade to 2.1 for the "premium" tier only |
| Voice (spike) | **GPT-Live-1** (South India) with client delegation | decide in week 2–3 on the child-pause and Hinglish rubric |
| Turn handling | `server_vad` tuned for children (threshold 0.6, silence 900 ms, idle 8 s) plus push-to-talk fallback | test `semantic_vad` again; Azure ignored it in 2025 **[S]** |
| Narration | **pre-rendered TTS** per objective (gpt-4o-mini-tts in the *same* voice as realtime, or Azure HD if voices match), cached in object storage, shared across students | biggest cost lever |
| Context control | manual pruning: last 1–2 turns as audio, older turns as text summary, in batches; static `instructions` | log `cached_tokens` and costs from every `response.done` |
| Planner / brains | **gpt-5.6-terra** (lesson plan, T1 specs, answer checking); **gpt-5.6-luna** (observation summaries, classification); **gpt-5.6-sol** offline (taxonomy, T2 modules) | Azure prices **[V]**: luna $0.20/$1.20, terra $2/$12, sol $4/$20 per M (short context) |
| Avatar | **Rive** teacher; amplitude lip-sync first, then **HeadAudio** visemes; `emote()` tool; Lottie for rewards | about $0 per minute |
| Modules | **T0 engine library** (TypeScript, about 25 engines for Classes 6–8 Maths and Science at launch) plus **T1 LLM spec filling** with zod validation; postMessage bridge; observations go into the realtime context | T2 pipeline runs later on an always-on worker |
| Diagrams | LLM SVG (DOMPurify), Mermaid, KaTeX, function-plot; **gpt-image-2 medium**, offline only | labels as SVG overlay |
| Transcripts / STT | in-session `gpt-4o-mini-transcribe`; eval Sarvam Saaras v3 / MAI-Transcribe-2 / gpt-live-transcribe on the kids set | |
| Data | **Neon Postgres** (schema in 7.3) + Drizzle; object storage for audio and images | |
| Safety | Azure AI Content Safety on all generated text and image prompts; prompt invariants tested in CI; DigiLocker-style parental consent; no raw-audio retention | |
| Scope at launch | **Classes 6–8, Maths and Science**, CBSE/NCERT new books, Hinglish | fastest path to the gap in 5.1 |

**Session shape (target 30–45 min):**
1. Greeting (realtime).
2. Recall check (realtime, 2 questions).
3. Narrated explanation chunks (cached TTS, with the avatar talking).
4. "Try it" module (T1 engine; the teacher watches through observations and nudges in realtime).
5. Practice: three questions, voice or tap.
6. Recap, a star award, and a parent summary.

Realtime minutes: about 10–15 per lesson.

---

## 9. v2 and v3 roadmap

**v2 (months 3–6)**
- T2 offline free-form module pipeline (headless render, vision critique, teacher review), growing the library toward every NCF-SE chapter activity for Classes 3–9.
- Optional video-teacher tier with Simli or HeyGen LiveAvatar LITE (bring your own audio). Measure retention lift against cost.
- Azure Custom Speech fine-tuned on consented Taxila child audio. Cascaded "lite mode" (Sarvam or MAI STT → luna → cached or streamed TTS) for low-bandwidth and low-price plans.
- Sideband server (Azure Container Apps) for server-side tools, prompt privacy (`webrtcfilter=on`) and authoritative session state.
- Mastery model (BKT or Elo per objective) with spaced review; a weekly parent report in Hindi or English, plus a WhatsApp summary.
- RBSE crosswalk and Hindi-medium book set (e.g. *Jigyasa*, the Hindi edition of *Curiosity*), plus a second state board.
- Pronunciation and reading-fluency coach using Azure Pronunciation Assessment.

**v3 (months 6–12+)**
- Full-duplex GPT-Live or its successor as the default, if the pause-handling problem is solved for children.
- Teacher (school) dashboard and classroom mode: one device per class, projector, group Q&A.
- More languages (Marathi, Bengali, Tamil, Telugu) with region-specific voices.
- Distil the high-volume paths (observation summaries, answer checks) into small models on cheaper endpoints; consider self-hosted IndicConformer or Whisper.
- A licensed NCERT content partnership, if granted, to enable chapter-grounded RAG.
- Offline-first Android (cached lessons and narration, sync later) for Tier-3 connectivity.

---

## 10. Measurements to run first (in priority order)

| # | question | method | decides |
|---|---|---|---|
| M1 | Does Azure realtime return `cached_tokens > 0` on 2.1 / 2.1-mini? | 20-turn scripted session; read `response.done.usage` | whether pruning is mandatory; cost tier |
| M2 | Which model and voice gives the best Hinglish with children? | rubric from 1.8; 20 children; 1.5, 2, 2.1, 2.1-mini and gpt-live-1 × 4 voices | default model and voice |
| M3 | Child turn-taking: false barge-ins and cut-offs per 10 turns | same sessions; tag manually | VAD parameters; push-to-talk default for Classes 1–3 |
| M4 | Is `semantic_vad` honoured on Azure now? Is `retention_ratio` accepted? | echo in `session.updated` plus behaviour test | config |
| M5 | Latency from Indian cities to Sweden Central, East US 2 and South India | WebRTC stats `currentRoundTripTime`, first-audio delay, 5 cities × 3 ISPs | deployment region |
| M6 | Kid-Hinglish STT ranking (Sarvam, MAI-2, gpt-live-transcribe, Azure) | eval set from 6.3 | cascaded-mode STT |
| M7 | T1 spec validity rate | 500 generated specs across engines | prompt and schema design |
| M8 | Rive + HeadAudio on low-end Android | fps, CPU, battery over 30 minutes | avatar fidelity level |
| M9 | Cost per lesson in production | per-session cost log | pricing |

Each result goes into the project's context files with n, method and date, following the Meera convention.

---

## Sources

**Azure / OpenAI realtime and pricing**
- Azure WebRTC GA guide (updated 2026-09-23): https://learn.microsoft.com/en-us/azure/foundry/openai/how-to/realtime-audio-webrtc
- Azure Realtime overview (models, 32k note, 60-min sessions): https://learn.microsoft.com/en-us/azure/foundry/openai/how-to/realtime-audio
- client_secrets OperationNotSupported Q&A: https://learn.microsoft.com/en-us/answers/questions/5828199/azure-openai-realtime-client-secrets-api-returns-o
- Azure realtime has no prompt caching (Q&A, 2026-03-31): https://learn.microsoft.com/en-us/answers/questions/5845663/realtime-api-caching-behavior-available-through-op
- Azure does not support retention_ratio (Q&A, 2025-11): https://learn.microsoft.com/en-us/answers/questions/5605994/does-the-session-of-azure-openai-realtime-support
- Azure ignores semantic_vad (Q&A, 2025-08): https://learn.microsoft.com/en-us/answers/questions/5521485/azure-openai-realtime-api-ignores-semantic-vad-tur
- Azure OpenAI pricing (realtime, image, GPT-5.x, transcribe, TTS): https://azure.microsoft.com/en-us/pricing/details/azure-openai/
- Azure Speech pricing (avatar, Voice Live, STT, TTS, MAI-Transcribe): https://azure.microsoft.com/en-us/pricing/details/speech/
- Azure prompt caching doc: https://learn.microsoft.com/en-us/azure/foundry/openai/how-to/prompt-caching
- OpenAI client events reference (session fields): https://developers.openai.com/api/reference/resources/realtime/client-events
- OpenAI client secret create: https://developers.openai.com/api/reference/resources/realtime/subresources/client_secrets/methods/create
- OpenAI realtime cost guide (token rates, truncation JSON): https://developers.openai.com/api/docs/guides/voice-latency-cost?api=live
- OpenAI changelog (realtime-2 May 7, 2.1 Jul 6, GPT-Live Sep 10, etc.): https://developers.openai.com/api/docs/changelog
- OpenAI audio model updates (Hindi strength): https://developers.openai.com/blog/updates-audio-models
- Realtime prompting guide: https://developers.openai.com/cookbook/examples/realtime_prompting_guide
- 2.1 announcement thread: https://community.openai.com/t/new-realtime-models-on-the-api-gpt-realtime-2-1-and-gpt-realtime-2-1-mini/1385896
- 2.1 language drift thread: https://community.openai.com/t/gpt-realtime-2-1-exhibits-language-drift/1386953
- 2.1 pricing summary: https://datanorth.ai/news/openai-releases-gpt-realtime-2-1-voice-models
- 4,000-session cost study: https://hackernoon.com/openai-realtime-api-pricing-in-2026-real-world-data-from-4000-measured-sessions
- GPT-Live concept (Azure): https://learn.microsoft.com/en-us/azure/foundry/openai/concepts/gpt-live
- GPT-Live WebSocket how-to: https://learn.microsoft.com/en-us/azure/foundry/openai/how-to/gpt-live
- GPT-Live WebRTC how-to: https://learn.microsoft.com/en-us/azure/foundry/openai/how-to/gpt-live-webrtc
- GPT-Live catalog: https://ai.azure.com/catalog/models/gpt-live-1
- GPT-Live summaries: https://ibl.ai/blog/gpt-live-1-full-duplex-voice-api-enterprise and https://techjacksolutions.com/ai-brief/openai-gpt-live-1-api-full-duplex-voice/
- Voice Live how-to (VAD types, noise and echo, visemes, avatar, azure-realtime voices diya/meera): https://learn.microsoft.com/en-us/azure/ai-services/speech-service/voice-live-how-to
- Voice Live language support: https://learn.microsoft.com/en-us/azure/ai-services/speech-service/voice-live-language-support
- IndicFDB full-duplex benchmark (2026-09-25): https://arxiv.org/html/2609.31967
- Indian-accent claim for realtime voices (low confidence): https://learn.microsoft.com/en-us/answers/questions/5698273/gpt-realtime-api-how-to-specify-the-voice

**Avatar**
- Real-time avatar price index (2026-09-14): https://blog.akapulu.com/p/real-time-avatar-api-pricing-index/
- Rive lip-sync patterns: https://dev.to/uianimation/how-to-build-real-time-ai-lip-sync-using-rive-state-machine-viseme-data-26o7
- Duolingo Lily on Rive: https://x.com/guidorosso/status/1904374664388018403
- Rive pricing: https://www.spotsaas.com/product/rive/pricing
- TalkingHead / HeadAudio (MIT): https://github.com/met4citizen/TalkingHead
- Ready Player Me shutdown: https://avatarsdk.com/blog/2026/01/15/switch-from-ready-player-me-to-avatar-sdk-fast-familiar-production-ready/
- Live2D SDK licence: https://www.live2d.com/en/sdk/license/
- HeyGen LiveAvatar LITE: https://docs.liveavatar.com/docs/lite-mode/overview
- Simli WebRTC: https://docs.simli.com/api-reference/simli-webrtc

**Generative modules**
- Google Generative UI: https://research.google/blog/generative-ui-a-rich-custom-visual-interactive-user-experience-for-any-prompt/
- Generative UI for Education (arXiv 2609.20738): https://arxiv.org/html/2609.20738
- Teachers creating interactives with GenUI: https://research.google/blog/the-future-of-practice-enabling-teachers-to-create-learning-interactives-with-generative-ui/
- Learn Your Way RCT: https://www.etavrian.com/news/google-ai-textbook-retention-lift
- ChatGPT interactive math and science: https://openai.com/index/new-ways-to-learn-math-and-science-in-chatgpt/ and https://techbriefly.com/2026/03/11/chatgpt-can-now-generate-interactive-visuals-for-math-and-science/
- PhET licensing (historical CC BY 4.0): https://phet.colorado.edu/en/licensing/html
- PhET move to CC BY-NC: https://phetsims.substack.com/p/a-small-change-to-support-a-big-mission
- iframe sandbox pitfalls: https://danieldusek.com/escaping-improperly-sandboxed-iframes.html and https://joshua.hu/rendering-sandboxing-arbitrary-html-content-iframe-interacting

**Images and diagrams**
- gpt-image-2 on Foundry: https://techcommunity.microsoft.com/blog/azure-ai-foundry-blog/introducing-openais-gpt-image-2-in-microsoft-foundry/4500571
- gpt-image-2 latency and quality tiers: https://help.apiyi.com/en/gpt-image-2-api-performance-tuning-quality-size-guide-en.html and https://vibedex.ai/blog/gpt-image-2-quality-tier-comparison-2026
- gpt-image-2 cost per image: https://www.aifreeapi.com/en/posts/openai-image-generation-api-pricing
- SVG-Bench leaderboard: https://benchlm.ai/benchmarks/svgbench

**Market**
- Khanmigo pricing: https://www.khanmigo.ai/pricing
- Khanmigo free for Indian teachers: https://scoonews.com/news/khan-academy-launches-khanmigo-ai-tool-for-teachers-in-india/
- PW K-12 change and AI metrics: https://www.medianama.com/2026/05/223-physicswallah-u-turn-school-ai-for-growth-q4-fy26/
- PW AI tutor (~$0.20/h): https://www.medianama.com/2026/08/223-physicswallah-personal-ai-tutoring-services/
- PW versus OpenAI and Google: https://www.businesstoday.in/technology/story/why-physicswallah-believes-it-can-beat-openai-google-in-indias-ai-tutor-race-534212-2026-06-01
- BYJU'S NCLT: https://www.business-standard.com/companies/news/nclt-pauses-byju-s-insolvency-bidding-till-aug-31-giving-founders-relief-126072301153_1.html
- Vedantu: https://openthemagazine.com/business/untold-vamsi-krishna-vedantu-and-the-night-it-nearly-fell-apart
- Doubtnut / Allen: https://inc42.com/buzz/allen-acquires-peak-xv-backed-doubt-solving-edtech-platform-doubtnut/
- SpeakX: https://analyticsindiamag.com/ai-news-updates/speakx-raises-16m-pre-series-b-to-scale-ai-powered-spoken-english-learning/
- Duolingo India: https://www.entrepreneur.com/en-in/news-and-trends/duolingo-to-launch-generative-ai-video-calling-feature-in/483016
- Synthesis Tutor: https://www.aitoolsforkids.com/blog/synthesis-tutor-vs-khanmigo-ai-math-tutor-comparison
- Alpha School: https://www.axios.com/2026/08/02/alpha-schools-ai-expansion-50-campuses
- Google free plan for Indian students: https://blog.google/intl/en-in/products/start-the-academic-year-with-one-year-of-gemini-on-us/
- Gemini in Classroom for all ages: https://workspaceupdates.googleblog.com/2026/08/gemini-in-google-classroom-is-expanding-to-users-of-all-ages-with-contextualized-Gemini-starter-prompts-for-students.html
- Gemini Guided Learning: https://techcrunch.com/2025/08/06/google-takes-on-chatgpts-study-mode-with-new-guided-learning-tool-in-gemini/
- ChatGPT for Teens: https://explainx.ai/blog/chatgpt-for-teens-safety-study-mode-august-2026
- OpenAI Learning Accelerator India: https://www.business-standard.com/technology/tech-news/openai-to-provide-5-lakh-free-chatgpt-licences-to-teachers-students-125082501056_1.html
- ChatGPT Go free in India: https://techcrunch.com/2025/10/27/openai-offers-free-chatgpt-go-for-one-year-to-all-users-in-india
- Claude for Education and Teachers: https://www.educatorstechnology.com/2026/02/claude-for-education.html and https://www.explainx.ai/blog/claude-for-teachers-free-k12-educators-july-2026
- YoLearn.ai: https://www.indianstartuptimes.com/investment/yolearn-ai-raises-500k-pre-seed-funding-to-expand-voice-first-ai-tutoring-platform/ , https://www.finsmes.com/2026/09/yolearn-ai-raises-seed-funding.html and https://www.yolearn.ai/students/pricing
- ProLearn: https://dealroom.co/news/130878-prolearn-raises-30-crore-pre-seed-to-build-an-ai-tutor-for-indias-k-12-a/

**Indic speech**
- HiACC corpus: https://pmc.ncbi.nlm.nih.gov/articles/PMC12329218/
- Children's ASR benchmark: https://arxiv.org/pdf/2406.10507
- Saaras v3: https://www.sarvam.ai/blogs/asr and https://www.business-standard.com/technology/tech-news/saaras-v3-beats-gemini-gpt-4o-on-indian-speech-benchmarks-says-sarvam-ai-126021200384_1.html
- Sarvam pricing: https://www.sarvam.ai/api-pricing
- IndicConformer: https://huggingface.co/ai4bharat/indic-conformer-600m-multilingual
- GPT-Transcribe and Live-Transcribe: https://www.buildfastwithai.com/blogs/gpt-transcribe-review
- Svarah: https://arxiv.org/pdf/2305.15760

**Curriculum and policy**
- NCERT textbooks: https://ncert.nic.in/textbook.php (e.g. https://ncert.nic.in/textbook/pdf/fecu1ps.pdf)
- NCERT copyright press release: https://ncert.nic.in/pdf/announcement/notices/Press_Release_Copyright_Infringement-NCERT.pdf
- NCF-SE 2023: https://ncert.nic.in/pdf/NCFSE-2023-August_2023.pdf
- Learning Outcomes (2017): https://ncert.nic.in/pdf/publication/otherpublications/tilops101.pdf
- 2026-27 book list: https://www.learnify.bh/blog/new-ncert-textbooks-class-1-to-12 and https://www.bweducation.com/article/ncert-rolls-out-new-class-9-textbooks-for-mathematics-and-social-science-624891
- CBSE curriculum 2026-27: https://collegedunia.com/news/cbse-new-curriculum-2026-27-released-alertid-150070
- RBSE: https://rajeduboard.rajasthan.gov.in/
- DIKSHA: https://en.wikipedia.org/wiki/Digital_Infrastructure_for_Knowledge_Sharing
- DPDP children and verifiable parental consent: https://www.consently.in/blog/verifiable-parental-consent-dpdp-rules-2025-edtech-gaming and https://xident.io/blog/india-dpdp-age-verification-verifiable-parental-consent-childrens-data-2026/
- FX (USD/INR 2026-10-02): https://tradingeconomics.com/india/currency
