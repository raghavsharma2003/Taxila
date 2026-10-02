# Video / photoreal tutor avatar for v2: options that accept Taxila's own audio

Date: 2026-10-02. Question (`video-avatar-v2`): which photoreal or "video" avatar options can be driven by **our**
`gpt-realtime-2.1` audio stream? Candidates are Simli, HeyGen LiveAvatar, Tavus CVI, D-ID, Hedra, Azure TTS avatar,
Synthesia, the Pipecat/LiveKit integrations, and open-source models self-hosted on Azure GPUs (MuseTalk, LatentSync,
Hallo3, EchoMimic, LivePortrait, Ditto and others). For each: latency, cost per minute, quality, availability in
India, and fitness for children. And when does v2 make economic sense?

Evidence tags (same scheme as `../tech-and-market.md` and the sibling avatar docs):
- **[V]**: verified this session from a primary source. That means vendor docs fetched raw, Azure Retail Prices API
  rows, repository source or README read via `git clone`, or the paper's HTML.
- **[S]**: secondary source or vendor marketing claim, not reproduced.
- **[U]**: unverified. Covers my estimates, arithmetic and extrapolations, plus anything that needs a measurement before a decision rests on it.
- **[M]**: computed by `video-avatar-v2-cost.py` in this folder (deterministic, rerunnable).

Builds on:
- `../tech-and-market.md` §2: Rive v1, video avatars at $0.01–0.50/min, Simli/LiveAvatar as v2 picks.
- `../../harvest/companion-tech.md` §13: lip-sync slaved to the playback clock, nothing on the audio thread, echosim for any audio-path change.
- `audio-to-face-ml.md` §5.1 (`FaceFrame`), §8 (server relay) and §9 (video-real path).
- `web-3d-talking-heads.md` §1 (the constraint table, including the Azure-only directive).

Session note: the web-search quota was already spent when this question started, so every source below was fetched
directly (docs `llms.txt` indexes, raw `.md` doc pages, the Azure Retail Prices API, `git clone` of each OSS repo).
Simli's per-minute price, D-ID's price, and Hedra's realtime status could not be fetched from a primary page. They are tagged.

---

## 0. TL;DR: the findings that change decisions

1. **The Azure-only directive (`context/decisions.md#azure-only-compute`) decides most of this question.** Simli,
   HeyGen/LiveAvatar, Tavus and D-ID are named exclusions. Beyond Presence, Synthesia, Anam and Hedra fall under "no
   third-party AI APIs". Two routes stay buildable:
   - (a) **Azure TTS avatar** through Voice Live;
   - (b) **open-source models on Azure GPUs** (the decision names MuseTalk explicitly).

   Vendors are covered below as price and quality benchmarks, and as the "reverse if" evidence the decision asks for. They are not build options.
2. **Azure's avatar does not take our audio.** It renders from Voice Live's *own* synthesised output. Every
   documented configuration and the official sample pair it with an Azure TTS voice (`azure-standard`, `azure-custom`,
   `avatar-voice-sync`) **[V]**.
   - Whether native `gpt-realtime` audio can drive it is undocumented **[U → 1-hour spike, E-1]**.
   - If it cannot, the avatar forces the tutor onto an Azure TTS voice. That is the axis the portfolio already lost on by ear ("not human and not Indian", harvest rejected #7).
   - It costs **$0.50/min standard, $0.70 HD, $0.60 custom, $0.80 HD custom** real-time, plus **$0.60/h hosting per custom avatar endpoint** (Retail Prices API, centralindia) **[V]**. That is **$450 per student-month** for full 45-minute lessons **[M]**.
3. **Several earlier "managed stack, no" verdicts are now wrong.** Tavus has an **Echo mode** (base64 audio or mic
   echo, bypassing its STT/LLM/TTS) **[V]**. D-ID has **Echo Sessions** (PCM16 ≥8 kHz over a LiveKit byte stream, with
   an interrupt attribute) **[V]**. Anam and Synthesia now ship LiveKit avatar plugins that consume the agent's audio
   **[V, LiveKit lists 16 providers]**. Hedra has **no realtime product** in its docs index today, and LiveKit does not list it **[V]**.
   Correct `tech-and-market` §2.1 accordingly.
4. **Every "bring your own audio" video avatar makes the renderer the audio clock.** The child must hear the audio
   that comes back *with* the video, not the direct Azure track. Otherwise lips trail the voice by the renderer's
   first-frame delay, which is 300–400 ms and fails the BT.1359 window. Three consequences:
   - The **added mouth-to-ear latency** is inherent: Ditto FFD **385 ms** on an A100 **[V, paper]**; Simli "<300 ms" **[S]**; LiveTalking/MuseTalk 200 ms lookahead plus batch **[V, config]**.
   - **Barge-in truncation** must use the renderer's played position.
   - **echosim must be re-run**, because the playback path changes (companion-tech §13).
5. **Self-hosted live video is cheap per GPU-hour but not cheap per student.**
   - MuseTalk on an A100 VM in Central India costs ≈ **$0.026 per session-minute**. Wav2Lip-256 on an ACA T4 costs ≈ $0.003. Ditto costs ≈ $0.045 **[M; stream counts U]**.
   - Full live lessons with MuseTalk come to **$23 per student-month**, against **$0.69–2.30** of avatar budget at ₹299–999 (20% of revenue) **[M]**.
   - Only *moments* (2 min/lesson ≈ $1/month) or *hybrid* (12 min live ≈ $6/month, which needs a ₹2,999 tier) fit.
6. **Azure has no serverless A100 in India.** ACA serverless GPUs in Central India and South India are **T4 only**.
   A100 is available in Sweden Central, East US and others **[V]**. ACA ingress is **HTTP/TCP only (no UDP)**, and **no
   fractional GPUs** are offered **[V]**. Live MuseTalk or Ditto in India therefore means GPU **VMs** (NC24ads A100 v4 at $5.142/h,
   NV36ads A10 v5 at $4.48/h, centralindia **[V]**), plus a self-hosted WebRTC SFU (for example LiveKit server, Apache-2.0) or a WebSocket media path.
7. **The cheap, allowed, high-impact v2 is pre-rendered video for cached narration.** Narration that is identical for every
   student (tech-and-market §1.9 lever 1) can be rendered once offline on **Spot** A100s.
   - MuseTalk: ≈ **$200 per character** for a 30,000-minute library. Diffusion-class models (LatentSync): ≈ $4,750 **[M, throughput U]**.
   - Streaming it costs ≈ $0.12 per student-month **[M]**.
   - This puts "video-real" where the tutor talks longest, at near-zero marginal cost and with no live-latency risk.
8. **Licences hide in the face detectors.** LivePortrait's README states InsightFace's models are non-commercial, and
   commercial users must swap them **[V]**. Ditto's registrar loads `insightface_det_cfg` too **[V, source]**. MuseTalk's code and
   weights are MIT and commercial-OK, but its test data is not **[V]**. Hallo3 inherits the CogVideoX-5B licence **[V]**.
9. **Decision rule (§9).** Ship **pre-rendered narration video** once v1 narration caching exists. Ship **live**
   self-hosted video only as a premium "Studio" tier, gated on all four of:
   - (i) a tier of ≥ ₹2,999/mo, or moments-only use in ≥ ₹499–999 plans;
   - (ii) ≥ ~600 premium subscribers, so the warm GPU floor (~$3,750/mo per A100) amortises;
   - (iii) an A/B retention or learning lift over the 3D tutor;
   - (iv) passing the latency and Hindi lip-sync bars in §10.

---

## 1. Constraints every option is judged against

| constraint | source | consequence for a video avatar |
|---|---|---|
| Azure-only compute and AI; no third-party AI APIs; OSS on Azure compute is fine | `CLAUDE.md`, `decisions.md#azure-only-compute` | only Azure TTS avatar or self-hosted OSS can be built. Vendors need owner escalation ("reverse if: a required capability has no Azure-native option") |
| The voice is native `gpt-realtime-2.1` audio over WebRTC, chosen by ear, with no visemes or timestamps | tech-and-market §1.5, §2.2 | the avatar must be **audio-driven** from that exact audio. Swapping the voice to suit the avatar reverses the voice decision |
| Speed and quality are never traded away | owner directive (portfolio) | added mouth-to-ear latency is a cost, not a detail. Budget it (§2.3) |
| Barge-in floor; AEC must keep working; echosim gates audio-path changes | companion-tech §13; `rejected.md` | a renderer that re-emits audio changes the playback path. Re-run echosim (E-4) |
| ₹10k Android: Chromium WebView, 3–4 GB RAM, 4G | brief | H.264 hardware decode of 512²–720p is cheap. **Bandwidth and data cost** are the constraint (§6.4) |
| Children aged 6–15; never deny being an AI; no romance or companion register | `CLAUDE.md` safety floor | photoreal raises the "is this a real person?" risk, which needs disclosure by design (§6) |
| Several selectable Indian tutors | brief | per-character assets: an actor video, a portrait, or a custom avatar. Some options charge per character (§4.3) |

---

## 2. The architectural core: whoever renders the video owns the audio clock

### 2.1 Why

A server video avatar returns **audio and video together**, synchronised on its side:
- Simli re-emits audio through `getAudioStreamIterator()` **[V, Pipecat source]**.
- LiveAvatar publishes A+V to a LiveKit room **[V]**.
- Azure's avatar arrives as one WebRTC peer with both tracks **[V]**.

If the client also plays the direct Azure audio, the lips trail the voice by the renderer's first-frame delay.
BT.1359 puts the acceptability limit for video lagging audio at roughly −125 ms **[S]**. A 300–400 ms lag fails it.
So the child must hear the **renderer's** audio, and three things follow:

1. **Latency.** The renderer's first-frame delay is added to every reply's first audible sound.
2. **Barge-in.** On `input_audio_buffer.speech_started`, interrupt the renderer and then send
   `conversation.item.truncate` with `audio_end_ms` = the renderer's played position, not the model's generated
   position. Otherwise the model believes the child heard words that were never played. This is companion-tech §13's
   "slave to the playback clock" rule, with the clock moved to the renderer.
3. **AEC.** The far-end reference becomes the renderer's remote track. Chromium cancels echo from remote WebRTC tracks
   played through media elements, but this must be measured with echosim, not assumed **[U]** (§10 E-4).

### 2.2 Three ways to wire it

| | A. client relay | B. server relay (recommended if live video ships) | C. Azure Voice Live + avatar |
|---|---|---|---|
| path | Azure → phone (WebRTC) → phone sends PCM to renderer → renderer → phone (A+V) | phone ↔ our SFU (WebRTC); our server ↔ Azure realtime (WebSocket); server → renderer (same region) → SFU → phone | phone ↔ Voice Live (WebSocket or WebRTC) + avatar WebRTC peer; Azure renders server-side |
| extra hops | 2 last-mile trips plus phone uplink of the tutor audio (raw PCM16 16 kHz is 256 kbps) | 1 intra-region hop (≈ ms) **[U]** | none |
| what changes | client only | the voice transport moves server-side. This is the same move as the v2 "sideband server" roadmap item | the whole voice endpoint (Realtime → Voice Live), and probably the voice |
| who uses it | Simli JS SDK demos (browser sends audio) **[V]** | Pipecat and LiveKit Agents (the avatar worker publishes A+V) **[V]** | the Azure sample `voice-live-avatar` **[V]** |
| verdict | no: worst latency and bandwidth on 4G | yes, for self-hosted OSS | only if E-1 shows native voice works |

Architecture B, concretely:

```
child mic ──WebRTC──▶ LiveKit SFU (Azure VM, Central India, public UDP) ──▶ session worker (Node/Python)
                                                                             │  WebSocket (pcm16 24 kHz)
                                                                             ▼
                                                    Azure OpenAI realtime gpt-realtime-2.1 (centralindia)
                                                                             │ response.output_audio.delta (faster than real time)
                                                                             ▼
                                         renderer pod (GPU VM): audio → mouth frames → H.264 + Opus
                                                                             │ publishes tracks
child ◀──WebRTC (A+V, one peer)── LiveKit SFU ◀──────────────────────────────┘
```

- ACA ingress is HTTP/TCP only **[V]**. The SFU and renderer therefore need a VM, or AKS with UDP, or TURN-over-TCP/TLS.
- WebRTC-over-TCP on Indian 4G adds head-of-line jitter **[U]**.
- The session worker is where `FaceFrame.state` and the Director's emotion are turned into renderer controls (§5.4).

### 2.3 Latency budget (added to the current audio-only path)

| contribution | Ditto (A100) | MuseTalk via LiveTalking | Simli Trinity | Azure avatar |
|---|---|---|---|---|
| renderer first-frame | **385 ms FFD** (RTF 0.895, 0.4 s segments) **[V, paper]** | lookahead `r=10` × 20 ms = 200 ms, plus filling `batch_size=16` frames at 40 ms each (≤ 640 ms; cut to 4 → 160 ms) **[V, config.yaml/config.py]** | "<300 ms" speech-to-video **[S]** | not published **[U]** |
| encode + jitter buffer | 30–80 ms **[U]** | 30–80 ms **[U]** | included **[S]** | included |
| hop | ≈ 1–5 ms intra-region **[U]** | same | India → vendor region RTT (US ≈ 200+ ms, EU ≈ 120–150 ms) **[U]** | 0 (centralindia) |
| **total added** | **≈ 420–470 ms** **[U]** | **≈ 400–900 ms** as shipped; **≈ 250–350 ms** tuned **[U]** | **≈ 300–550 ms** from India **[U]** | measure (E-1) |

`gpt-realtime` emits audio faster than real time **[U, sibling §5.4]**, so after the first frame the renderer runs
ahead. The cost is paid once per reply, which is the moment the child notices most. The pass bar is in §10 (E-3).

---

## 3. Vendor landscape (benchmarks; excluded from builds by the directive)

### 3.1 Summary

| vendor / product | takes our audio? how | audio format | interrupt | price (2026-10-02) | concurrency | India / regions | notes |
|---|---|---|---|---|---|---|---|
| **Simli** (Trinity = Gaussian; Legacy) | yes: WebRTC or WebSocket, `send()`/`sendImmediate()` **[V]** | **PCM16 16 kHz mono**, 6,000-byte chunks advised, max 65,536 **[V]** | `clearBuffer()` **[V]** | "$10 on signup", 50 free min/mo **[V]**; "<$0.01/min" **[S]**; plans $0–249/mo **[S, Akapulu via tech-and-market]** | not published | not published **[U]** | Pipecat holds **128,000 bytes (4 s)** after an interruption for Trinity before `sendImmediate` **[V, source]**, a latency trap to check |
| **HeyGen LiveAvatar LITE** | yes: WebSocket `agent.speak` base64; media via LiveKit **[V]** | **PCM16 24 kHz mono** (matches gpt-realtime), ~1 s chunks advised **[V]** | `agent.interrupt` clears audio and pending video **[V]** | LITE 1 credit/min. Essential $99 = 1,110 cr; Business $475 = 6,010 cr; overage $0.095/$0.09 **[V]** → **$0.079–0.095/min** | not stated | not stated **[U]** | 5-min idle timeout, `session.keep_alive`, `video_starvation` warning **[V]**; ships an "OpenAI Realtime connector" **[V]** |
| **Tavus CVI** (Phoenix-4/4.5) | yes: **Echo mode**, base64 audio echo or mic echo via Daily **[V]** | base64 audio over Daily app messages **[V]** | interrupt message (Pipecat `send_interrupt_message`) **[V]**; with mic echo "all interrupt logic must be embedded in your audio stream" **[V]** | Starter $59/100 min, Growth $397/1,250 min; overage **$0.37 / $0.32** **[V]** | 1 / 3 / 10 streams **[V]** | not stated | echo is "incompatible with perception" **[V]**; replica training $65/$40 overage **[V]**; Phoenix-4 emotion control **[V]** |
| **D-ID** (V4 Expressive agents) | yes: **Echo Sessions**, LiveKit byte stream on topic `did.audio-stream` **[V]** | wav, mp3, or pcm16 (sample rate ≥ 8,000, 1–2 ch) **[V]** | `interrupt: "true"` stream attribute, or a `did.interrupt` message **[V]** | not in docs **[U]** | not in docs | not stated | the user's mic never feeds the agent in echo mode **[V]** |
| **Beyond Presence** | yes: Speech-to-Video API via the LiveKit plugin **[V]** | via LiveKit agent audio | via LiveKit | Starter 280 min, €0.175 overage; Growth 1,490 min, €0.10; Scale 4,000 min, **€0.0875** **[V]** | 10 / 25 / 50 **[V]** | runners in **EU, US, Middle East**; data stored in EU **[V]** | **on-prem / air-gapped enterprise deployment** **[V]**. This is the only vendor that could run on *our* Azure GPUs (see §3.3) |
| **Anam** | yes: LiveKit avatar plugin **[V]** | via LiveKit | via LiveKit | $0.11–0.16 **[S, tech-and-market]** | | | corrects tech-and-market's "does not accept your audio" |
| **Synthesia** interactive avatars | yes: LiveKit plugin (Python), up to 5 preloaded avatars swappable mid-session **[V]** | via LiveKit | via LiveKit | interactive pricing not public; Studio $29/$89/mo **[V]** | | | the plan must include interactive avatars **[V]** |
| **Hedra** | **no realtime product found**: the docs index lists only offline avatar videos; LiveKit's 16-provider list omits it **[V]** | | | credits (offline) | | | offline Character-3 only. Treat it as a pre-render tool, not a live option |
| others on LiveKit/Pipecat | Avatario, AvatarTalk, bitHuman (local `.imx` models, CPU-heavy, API secret required **[V]**), Keyframe, LemonSlice, Protoface, Runway, Spatius, TruGen **[V]** | | | | | | not evaluated in depth |
| Soul Machines | in receivership since Feb 2026 **[S, tech-and-market]** | | | | | | avoid |

### 3.2 What the vendor numbers tell us even though we cannot buy

- **The market price of "BYO-audio photoreal" is $0.08–0.37 per session-minute** (LiveAvatar, Bey, Tavus) **[V]**. Simli's
  "<$0.01" would be an outlier. Azure's $0.50 is the most expensive of all.
- **24 kHz PCM16 input is converging** (LiveAvatar, D-ID) **[V]**. It equals gpt-realtime's output, so a renderer adapter needs no resample.
- **The interrupt primitive is universal**: clear the buffered audio and pending video, seal the utterance, and emit an
  event naming the cut utterance (`agent.speak_interrupted` with `source_event_id`) **[V]**. Copy that contract (§5.4).
- **No vendor publishes an India region** in what was fetched. Bey's nearest is the Middle East **[V]**.

### 3.3 The one grey zone worth escalating

The directive allows "open-source code run on Azure compute". It forbids "third-party AI APIs". **Beyond Presence on-prem**
on Azure GPUs would be neither: it is licensed third-party software, and no audio or video leaves our network **[V, deployment page]**.
Per the decision's reversal clause, **escalate it to the owner rather than deciding**. It becomes interesting only if
self-hosted OSS fails the quality bar in §10 E-5.

---

## 4. Azure TTS avatar (the only first-party managed option)

### 4.1 What it is and what it accepts

- Voice Live's `session.avatar` gives "standard or custom avatar ... synchronized with the audio output" **[V]**.
  - WebRTC is negotiated via `session.avatar.connect {client_sdp}` → `session.avatar.connecting {server_sdp}`, with server ICE servers returned in `session.updated` **[V]**.
  - A WebSocket video output mode also exists **[V, sample README]**.
- **Photo avatar**: `type: "photo-avatar"`, `model: "vasa-1"`, made from one ~512×512 image.
  - A custom photo avatar needs the subject's photo plus about **one minute of consent audio** **[V]**.
  - `scene` controls zoom, position, rotation and movement `amplitude` **[V]**.
- **Custom video avatar**: trained from actor video. **Limited access**: an intake form, eligibility and usage criteria **[V]**.
- **Models.** `gpt-realtime-2.1` (Pro tier) is offered "+ option to use Azure text to speech voices" **[V]**. It is
  available in centralindia as Global Standard **[V]**. The new `azure-realtime` model has native voices,
  including **`diya` and `meera` (hi-IN, bilingual Hindi/Indian English)** **[V]**.
- **Voice.** Every documented avatar example, and the official sample's default (`gpt-realtime` + `en-US-AvaMultilingualNeural` +
  avatar on), uses an **Azure TTS voice** **[V]**. Pricing Scenario 3 pairs the avatar with "standard Azure Speech output" **[V]**.
  - The sample also offers OpenAI voices (`type: "openai"`) and an `avatar-voice-sync` voice type, but never shows them with an avatar **[V, source]**.
  - **Whether native gpt-realtime audio drives the avatar is undocumented** **[U → E-1]**.
- **There is no "send your own PCM" input.** The avatar is driven by Voice Live's synthesis path, not by an arbitrary audio stream **[V, by absence in the reference]**.

### 4.2 Prices (Azure Retail Prices API, centralindia, 2026-10-02) **[V]**

| meter | price |
|---|---|
| TTS Standard Avatar, real-time | **$0.50 / min** |
| TTS HD Standard Avatar, real-time | $0.70 / min |
| TTS Custom Avatar, real-time | $0.60 / min |
| TTS HD Custom Avatar, real-time | $0.80 / min |
| Standard / HD / Custom / HD Custom avatar, batch | $1.00 / $1.35 / $2.00 / $2.70 per min |
| **Custom Avatar hosting** | **$0.60 / hour per endpoint** (≈ $438/month, so 5 selectable tutors ≈ $2,190/month idle) **[M-style arithmetic]** |
| Photo avatar creation | $2,000 per 1K images ($2 per avatar) |
| Photo avatar (VASA-1) real-time | no meter returned; $0.60 **[S, tech-and-market]** |

On top of these sit the Voice Live Pro token charges for gpt-realtime-2.1, which are unchanged. The avatar is billed separately ("charged through Text to Speech Avatar 'interactive avatar (real-time)'") **[V]**.
Billing is probably per minute of avatar connection, not per minute of speech **[U]**. On that basis:
- a full 45-minute lesson costs **$22.50**;
- a student-month costs **$450** (full), **$120** (12-minute hybrid) or **$20** (2-minute moments) **[M]**;
- **$10k of grant buys 22 student-months** at full use **[M]**.

### 4.3 Regions **[V]**

Real-time avatar runs in westus2, eastus, eastus2, southcentralus, **southeastasia, centralindia**, westeurope,
swedencentral, northeurope, italynorth and francecentral (limited).
- Custom video avatar *training* is only in westus2, southeastasia and westeurope.
- "Voice sync for avatar" is **not** in centralindia.
- Azure Speech processes data only in the resource's region **[V]**, so a centralindia resource keeps the tutor's audio and video in India.

### 4.4 Verdict

- **Cost** rules it out for any lesson-length use at Indian price points (§8).
- **Voice** probably rules it out entirely unless E-1 passes. If E-1 fails, the only Azure-native photoreal path is
  "Azure TTS voice + avatar". That reopens the voice decision, and needs a blind re-test of the newer voices (`diya`/`meera`
  `azure-realtime`, MAI-Voice-2-Flash, Dragon HD) against gpt-realtime with Hindi-belt parents.
- **Where it could fit:** a short, scripted, cached clip, such as a 20-second celebration, rendered in **batch** ($1.00/min,
  one-time) rather than real-time, if a batch avatar's look matches a live character. MuseTalk-offline does this for about 1/150th of the price (§5.5).

---

## 5. Open-source, self-hosted on Azure GPUs (the buildable route)

### 5.1 Models, read at source (repos cloned 2026-10-02)

| model (last commit) | what it does | real-time? measured speed | resolution / input | licence (code / weights) | role for Taxila |
|---|---|---|---|---|---|
| **MuseTalk 1.5** (TMElyralab, 2025-09-26) | inpaints the mouth region of a **base video** from Whisper-tiny audio features, single-step latent UNet | **30 fps+ on V100** **[V, README + paper]**; via LiveTalking: 42 fps (3080 Ti), 45 (3090), **72 (4090)** **[V, LiveTalking README]** | 256×256 face crop; 25 fps; `bbox_shift` per avatar **[V]** | **MIT / "any purpose, even commercially"**; test data non-commercial **[V]** | **live renderer candidate #1** and the cheapest offline renderer. Its stock `realtime_inference.py` takes a **whole audio file** (`get_audio_feature(audio_path)`), not a stream **[V, source]**, so live use needs LiveTalking's streaming wrapper or our own |
| **LiveTalking** (lipku, 2026-09-13) | streaming harness: WebRTC/RTMP out, interruption, idle "action" clips, multi-session; plugs MuseTalk, Wav2Lip, Ultralight **[V]** | wav2lip256 60 fps (3060), 120 (3080 Ti) **[V]** | 16 kHz 20 ms audio chunks; `l=10, m=8, r=10`; `batch_size=16`; fps "must be 25" **[V]** | Apache-2.0 **[V]**. The README *asks* published videos on Chinese platforms to carry a LiveTalking watermark **[V]**; check whether it binds us **[U]** | **reference harness** (fork or reimplement its `BaseASR` queue design) |
| **Ditto** (Ant Group, ACM MM 2025; 2025-11-12) | audio → **LivePortrait-style motion space** via DiT, then warp/render a **single portrait** | **online RTF 0.895, FFD 385 ms; per frame: audio 23 ms, DiT 62 ms, render 15 ms, on 1 A100** **[V, paper]**; online chunk (3, 5, 2) frames = 5 new frames with 2 lookahead per step **[V, source]** | one image; TensorRT 8.6 (Ampere+) or PyTorch **[V]** | Apache-2.0 **[V]**, **but** the registrar loads `insightface_det_cfg` **[V, source]**. Swap the detector (InsightFace models are non-commercial) **[V via LivePortrait LICENSE]** | **live renderer candidate #2**: it takes **emotion, gaze, head pose, blink and regional motion** as controls **[V, paper]**, so it maps onto `FaceFrame` and the Director. About one stream per A100, so roughly 2× MuseTalk's cost |
| **LivePortrait** (Kuaishou, 2026-06-02) | portrait animation from driving keypoints (video, or retargeted controls) | **≈ 14.8 ms per frame on a 4090** (0.82 + 0.84 + 7.59 + 5.21 + 0.31 ms) **[V, speed.md]** | one image | MIT code; **InsightFace detection models non-commercial; replace them** **[V, LICENSE]** | the renderer under Ditto. It could also be driven **directly from our `FaceFrame`** if a blendshape → implicit-keypoint retarget is trained **[U, research]** |
| **Wav2Lip-256** (via LiveTalking) | GAN mouth inpainting | 60 fps on an RTX 3060 **[V]** | 256 face crop | original Wav2Lip weights were research-only **[U, recheck]**; LiveTalking's 256 weights come via a Quark or Google Drive link with no stated licence **[V]** | cheapest (T4-class), but the lowest quality and an unclear licence. A fallback only |
| **LatentSync 1.6** (ByteDance, 2025-06-20) | latent-diffusion lip-sync dubbing of an existing video | offline; 8 GB (1.5) / **18 GB (1.6)** VRAM inference **[V]** | 512×512 (1.6) **[V]** | Apache-2.0 **[V]** | **offline premium renderer** for cached narration, where sync quality matters more than speed (the MuseTalk paper reports slightly better sync for LatentSync **[V]**) |
| **EchoMimic v2 / v3** (Ant Group, 2026-02/03) | audio-driven half-body (v2) or unified multi-modal 1.3B (v3) video generation | offline. v2 accelerated: ~50 s per 120 frames on an A100 **[V]**; v3: **12 GB VRAM**, up to 768×768 **[V]** | image + audio | Apache-2.0 (v3) **[V]** | offline, for expressive "explainer" shots and gestures; too slow for live. The README cites **EchoTorrent** (streaming) **[V]**; watch it |
| **InfiniteTalk** (MeiGen, 2026-05-22) | long-form audio-driven video dubbing, 480p/720p, `--mode streaming` (chunked long video, not live) **[V]** | offline | image or video + audio | Apache-2.0 **[V]** | offline long narration; heavy (Wan-based) |
| **Hallo3** (Fudan, 2025-03-13) | CogVideoX-5B I2V fine-tune | offline; tested on **H100** **[V]** | | **CogVideoX-5B licence** applies to the weights **[V]**; read it before any commercial use **[U]** | no: slow, and the licence is unclear |
| **Live Avatar** (Alibaba Quark, ECCV'26, 2026-08-24) | 14B streaming diffusion avatar, "infinite length" | **45 fps on multi-H800** (5 GPUs); a single 80 GB GPU runs, FP8 runs on 48 GB **[V]** | | Apache-2.0 (majority) **[V]** | no for live economics: ≈ 5 H100s per stream ≈ $49/h ≈ **$0.8/min** **[U]**. Watch it as the quality frontier |

### 5.2 Azure GPU options in India (Retail Prices API, 2026-10-02) **[V]**

| SKU (Linux, centralindia) | GPU | on-demand $/h | Spot $/h | use |
|---|---|---|---|---|
| ACA serverless **T4** | T4 16 GB, per-second billing, scale to zero | **$0.367** ($0.000102/s) | n/a | Wav2Lip-class live, or batch jobs. **The only serverless GPU in Central/South India** |
| ACA serverless A100 | A100 | not offered in Central India (offered in Sweden Central, East US, West US 3, ...) **[V, region table]** | | offline batch in another region is fine; live from Europe adds ≈ 120+ ms RTT **[U]** |
| NC4as T4 v3 | 1× T4 | $0.579 | $0.164 | dev/test |
| NV36ads A10 v5 (full GPU) / NV18ads (½) | A10 24 GB | $4.48 / $2.24 | $0.83 / $0.41 | MuseTalk live **[U: A10 throughput unmeasured]** |
| **NC24ads A100 v4** | 1× A100 80 GB | **$5.142** | **$0.950** | MuseTalk or Ditto live (on-demand); all offline rendering (Spot) |
| NC40ads H100 v5 | 1× H100 | $9.772 | $4.964 | not needed |
| NC24lds xl RTX PRO 6000 BSE v6 | RTX PRO 6000 (share not stated) | $1.582 | $0.316 | **[U]** worth a benchmark: Blackwell at a quarter of the A100 price, if it is one GPU |

ACA constraints **[V]**: GPU only on Consumption workload profiles; **one GPU-using container per app**; **no
multi- or fractional-GPU replicas**; ingress **HTTP and TCP only**; external TCP needs a VNet. Startup and sponsorship
subscriptions may not have GPU quota by default (the doc says EA and PAYG have it) **[U, check E-0]**.

### 5.3 Capacity arithmetic (what one GPU serves)

Only **talking** streams need inference. Idle, listening and thinking states play pre-rendered loops, which need only CPU encode.
The tutor talks about 40% of a lesson, so a GPU serving *k* concurrent talking streams carries ≈ *k*/0.4 sessions,
derated to 70% for overlapping bursts:

| renderer | talking streams per GPU at 25 fps | sessions per GPU | $/session-min (GPU + encode + egress) **[M]** |
|---|---|---|---|
| Wav2Lip-256 on an ACA T4 | 1.5 **[U]** | 2.6 | **$0.0034** |
| MuseTalk 1.5 on an A100 VM | 2.0 **[U, from 72 fps on a 4090]** | 3.5 | **$0.0256** |
| Ditto on an A100 VM | 1.12 (1/RTF 0.895) **[V]** | 2.0 | **$0.0449** |

Fleet at evening peak, with lessons concentrated in 4 h/day and a 1.5× peak factor **[U]**:
- 1,000 students on full live lessons need **54 A100s at peak**.
- With hybrid (12 min live) they need **15**. The cost is $5.9k/month, or **$5.88 per student** **[M]**.
- A warm floor of one always-on A100 VM costs **$3,754/month** **[M]**.

GPU quota is a real gating item at these numbers.

### 5.4 Design: the Taxila video renderer (if v2 live is approved)

**Contract.** Vendor-shaped, so that an OSS renderer, Azure, or a future escalated vendor are swappable:

```ts
// shared/contracts.ts (proposed): one interface, whatever renders the face
export interface VideoTutorRenderer {
  open(o: { sessionId: string; characterId: string; region: "centralindia" }): Promise<{ joinUrl: string; token: string }>;
  pushAudio(u: { utteranceId: string; pcm16_24k: Int16Array }): void;   // may run faster than real time
  endUtterance(utteranceId: string): void;
  interrupt(): Promise<{ utteranceId: string | null; playedMs: number }>; // playedMs → conversation.item.truncate
  setState(s: { state: "idle" | "listening" | "thinking" | "speaking"; emotion?: Emotion; gazeTarget?: "child" | "module" }): void;
  on(ev: "speak_started" | "speak_ended" | "speak_interrupted" | "starved", cb: (e: { utteranceId: string; t: number }) => void): void;
}
```

`setState` takes the same `state` field as `FaceFrame` (audio-to-face-ml §5.1). The Director's expression program
(sibling §6.1) maps onto it:
- **MuseTalk** keeps **a clip bank per character**: idle, listening-nod, thinking-look-away, explaining-warm, explaining-excited,
  proud and concerned, each 10–30 s, seamlessly looped. `setState` picks the base clip, and MuseTalk inpaints only the mouth.
  Expression changes therefore land at clip-transition points (≈ 0.3–1 s crossfade) **[D]**.
- **Ditto** takes `emotion`, gaze and pose per segment directly **[V, paper]**, so expression follows the Director within
  one 0.4 s segment. That is better, at about 2× the GPU.

**Session worker** (Node, beside `server/`):

```js
// pseudo: Azure realtime → renderer, with barge-in that respects the renderer's clock
rt.on("response.output_audio.delta", ({ delta, item_id }) => renderer.pushAudio({ utteranceId: item_id, pcm16_24k: b64ToI16(delta) }));
rt.on("response.output_audio.done", ({ item_id }) => renderer.endUtterance(item_id));
rt.on("input_audio_buffer.speech_started", async () => {
  const { utteranceId, playedMs } = await renderer.interrupt();      // clears audio + pending video
  if (utteranceId) rt.send({ type: "conversation.item.truncate", item_id: utteranceId, content_index: 0, audio_end_ms: playedMs });
  renderer.setState({ state: "listening" });
});
director.on("face", (m) => renderer.setState(m));                     // emotion and gaze from intent, never from audio-emotion recognition
```

**Renderer pod** (Python, GPU VM):
- A per-session `asyncio` queue of 20 ms frames (LiveTalking's `BaseASR` pattern **[V]**).
- MuseTalk with `batch_size` 4 (latency over throughput).
- Precomputed VAE latents for every clip-bank frame (MuseTalk's `prepare_material` **[V]**).
- NVENC H.264 at 512×512 or 540p, 25 fps, ~400–600 kbps.
- Opus audio on the same RTP clock.
- Published to the SFU.
- One process per GPU serving N sessions, with admission control: refuse a new session rather than starve existing ones; fall back to the 3D tutor.

**Client.** Joins the SFU and renders `<video playsinline>` with its audio. The 3D tutor stays loaded underneath, as an
**instant fallback**: on `starved` or a disconnect it swaps back to 3D driven by the same audio. Keep both looks of
the same character close enough that the swap reads as "camera off", not as a different person (§6.2).

### 5.5 Pre-rendered narration video (recommended v2 first step)

The cheapest "video-real" is **offline**:

1. **Character assets.** Generate the portrait with `gpt-image-2` (Azure, allowed) so no real person's likeness is used. Generate the base clips either
   (a) with `sora-2` image-to-video, **[U: Azure Sora's policy on photoreal humans; test E-6]**, or
   (b) by filming a consenting actor once.
2. **Narration audio** is rendered once per lesson segment in **the same voice** as live. Use gpt-realtime output captured offline, so the voice matches the live tutor.
3. **Render** with MuseTalk (cheap) or LatentSync 1.6 (higher sync quality) on **Spot A100s**.
   - MuseTalk: ≈ $0.0066/video-min → **≈ $198 per character** for a 30,000-minute library.
   - Diffusion-class: ≈ $0.158/video-min → ≈ $4,750 per character **[M; throughput factors U, measure E-7]**.
   - Spot eviction only delays a batch job; it never kills a lesson.
4. **Store** as fragmented MP4 or HLS in Blob Storage, keyed by `(segmentId, characterId, voiceId, renderVersion)`. Identity goes in the cache
   key, because harvest rejected #13 is "the cache outlived the voice".
5. **Play** with the realtime session idle (tech-and-market §1.9 lever 1). Barge-in pauses the video and hands over to the live tutor.
   - **Frame it diegetically**, as "Didi's recorded explanation" in a video panel, with the live tutor (3D) present for questions. A photoreal recorded clip and a stylised live tutor then do not pretend to be the same continuous body **[D]**.
   - Egress is ≈ $0.12 per student-month **[M]**.

---

## 6. Quality and child-appropriateness

### 6.1 Quality expectations by option **[U unless tagged]**

| option | mouth / teeth | head and expression life | Hindi-specific risk | identity across a 45-min lesson |
|---|---|---|---|---|
| MuseTalk 1.5 | good at 256² face crop; "occasional jitter", lip shape and colour "not always preserved" **[V, paper limits]** | comes only from the base clips. Expression changes need clip switches | trained on HDTF (English) plus some Chinese **[S]**; bilabial closures (p/b/m/bh) and retroflexes untested → **E-5** | stable: the base video carries identity |
| Ditto | good; full face is re-rendered | **controllable** emotion, gaze, pose, blink **[V]** | same, untested | one portrait. Long-session drift unmeasured |
| Azure photo avatar (VASA-1) / custom | high (custom video avatar is trained on the actor) | VASA-style natural head motion, with `amplitude` control **[V]** | Azure-voice-driven, so Hindi lip-sync follows its TTS phonemes | stable |
| Vendors (Phoenix-4, Trinity, LiveAvatar) | high **[S]** | Phoenix-4 has emotion control **[V]** | unknown | stable |
| Diffusion offline (LatentSync, EchoMimic v3, InfiniteTalk) | best sync and texture **[S]** | EchoMimic: gestures | unknown | per clip |

### 6.2 Children

- **"Never deny being an AI" gets harder with photoreal.** A 6-year-old seeing a lifelike *Didi* is more likely to
  believe a real person is present **[D]**. Required design:
  - a persistent "AI teacher" badge on the video tile;
  - an introduction in which the tutor says she is an AI;
  - no human backstory ("I studied in Jaipur");
  - a parent-visible setting to choose stylised 3D instead.

  Treat this as product, under the safety floor.
- **Uncanny valley and trust.** A near-miss photoreal face (jitter, mouth smear, dead eyes in a loop) is worse than a good stylised one **[D]**.
  Gate photoreal on a blind preference test with children and parents (E-8), and keep 3D as the default.
- **Likeness and consent.**
  - Use **generated** faces checked against resemblance to real public figures, or a **contracted, consenting actor** whose contract covers synthetic use, minors as audience, and character retirement.
  - Azure's custom avatar requires consent statements and limited-access approval **[V]**.
  - Never let a parent or teacher upload a real person's photo as a tutor face.
- **Synthetic-media labelling in India.** MeitY's 2025–26 IT Rules amendments on "synthetically generated information" are reported to require visible labelling **[U, could not fetch this session; legal check before launch]**. The AI badge above should be designed to satisfy that requirement.
- **The child's data never goes to the renderer.** Only the **tutor's** audio flows in. Keep the child's camera and mic away from
  any video-avatar process (the opposite of Tavus "perception"). This also keeps DPDP exposure in our own Azure region.
- **Emotion comes from the Director's intent, never from recognising the child's emotion** (harvest rejected #8).

### 6.3 India availability **[V unless tagged]**

| option | runs in India? |
|---|---|
| Azure TTS avatar | **yes**, real-time avatar in centralindia; custom training outside India |
| Self-hosted on Azure | **yes**: T4 serverless in Central/South India; A100/A10/H100 VMs in centralindia |
| Beyond Presence | no: EU / US / Middle East runners |
| Simli, LiveAvatar, Tavus, D-ID, Synthesia | no India region stated in what was fetched **[U]** |

### 6.4 Device and bandwidth

- **Decode is easy.** H.264 hardware decode at 540p is lighter on a ₹10k phone's GPU than the WebGL 3D tutor **[U, measure on reference devices]**.
  On low-end devices, video is *kinder* to the battery than 3D **[U]**.
- **Data is the cost the parent pays.** At 500 kbps, a 45-minute lesson is ≈ 170 MB, which is a large slice of a 1.5 GB/day plan **[U, plan sizes typical]**.
  Offer a 300 kbps 360p mode, and default to video only on Wi-Fi or with parent opt-in.
- The 3D tutor's assets are about 2 MB once (web-3d-talking-heads TL;DR). **Video is a recurring bandwidth tax; 3D is not.**

---

## 7. Pipecat and LiveKit integrations (what they teach)

- **Pipecat** video services: **HeyGen, LemonSlice, Tavus, Simli** **[V, `src/pipecat/services/` and README]**. The integrations show:
  - Simli resamples to 16 kHz, re-emits audio as `TTSAudioRawFrame`s, and calls `clearBuffer()` on `InterruptionFrame`/`UserStartedSpeakingFrame` **[V]**;
  - HeyGen uses a WebSocket for control and audio (`agent.speak`, `agent.speak_end`, `agent.interrupt`, `agent.start_listening`) and LiveKit for media, at 24 kHz **[V]**;
  - Tavus uses persona `pipecat0` in echo mode, takes audio via `conversation.echo`, and sends an interrupt message **[V]**.
- **LiveKit Agents** lists **16 avatar providers**: "the agent session sends its audio output to the avatar worker instead of to
  the room, which the avatar worker uses to publish synchronized audio + video tracks" **[V]**. That sentence is
  architecture B (§2.2).
- **Lesson for Taxila.** If live video ships, a **self-hosted LiveKit SFU on an Azure VM**, plus a LiveKit-compatible avatar worker
  running our OSS renderer, reuses a proven pattern. It needs no third-party API. It also lets an escalated vendor (Bey on-prem) slot in later.
  It does mean adopting a server-side voice transport, which belongs to the voice-stack owner.

---

## 8. Economics (all from `video-avatar-v2-cost.py`) **[M]**

Assumptions **[U]**:
- 20 lessons/month of 45 min; the tutor speaks 40%;
- "hybrid" = cached narration plus 12 min of live dialog per lesson; "moments" = 2 min live per lesson;
- ₹87 = $1; the avatar budget is **20% of revenue**;
- vendors are billed per session-minute.

| option | $/min | full (45 min) $/student-mo | hybrid (12 min) | moments (2 min) |
|---|---|---|---|---|
| Azure standard avatar RT | 0.500 | **450.00** | 120.00 | 20.00 |
| Azure HD standard / custom RT | 0.70 / 0.60 | 630 / 540 | 168 / 144 | 28 / 24 |
| Tavus CVI (overage midpoint) | 0.345 | 310.50 | 82.80 | 13.80 |
| Beyond Presence Scale overage | 0.102 | 92.14 | 24.57 | 4.09 |
| LiveAvatar LITE (Business / Essential) | 0.079 / 0.089 | 71 / 80 | 19.0 / 21.4 | 3.2 / 3.6 |
| Simli (marketing "<$0.01") | 0.010 | 9.00 | 2.40 | 0.40 |
| **Self-host Wav2Lip-256, ACA T4** | **0.0034** | 3.10 | 0.83 | 0.14 |
| **Self-host MuseTalk 1.5, A100 VM** | **0.0256** | 23.04 | **6.14** | **1.02** |
| **Self-host Ditto, A100 VM** | **0.0449** | 40.45 | 10.79 | 1.80 |

What each tier can afford for the avatar (20% of revenue):

| price | avatar $/mo | max $/min, full | hybrid | moments |
|---|---|---|---|---|
| ₹299 | 0.69 | 0.0008 | 0.0029 | 0.0172 |
| ₹499 | 1.15 | 0.0013 | 0.0048 | 0.0287 |
| ₹999 | 2.30 | 0.0026 | 0.0096 | 0.0574 |
| ₹1,499 | 3.45 | 0.0038 | 0.0144 | 0.0861 |
| ₹2,999 | 6.89 | 0.0077 | 0.0287 | 0.1724 |

Reading the two tables together:
- **No option, including self-hosted MuseTalk, affords full live-video lessons at any tier below ₹2,999.** Even there it misses by 3×.
  Only Wav2Lip-on-T4 fits full lessons at ₹1,499+, and it is the lowest quality with an unclear weights licence.
- **Hybrid live video with MuseTalk ($6.14) fits only ₹2,999.** Moments with MuseTalk ($1.02) fit ₹499+, and moments with Ditto ($1.80) fit ₹999+ (marginal cost only; the warm floor still applies).
- **Azure avatar fits nothing**: even moments cost $20 per student-month.
- **Pre-rendered narration** costs $198 per character one-time (MuseTalk), or $990 for 5 tutors, plus $0.12 per student-month egress.
  It fits **every** tier once there are more than a few hundred students.
- **The self-hosting fixed floor dominates below ~600 premium students.** One always-warm A100 VM costs $3,754/mo. At 100 students
  that is $37.5 per student whatever the mode. ACA T4 serverless has no floor, but cold start means a slow first lesson [U].
- **Grant burn:** $10k = 22 student-months of full Azure avatar, 83 of hybrid, or about 1,600 of self-hosted MuseTalk hybrid (marginal cost only).

Upside not modelled: 1- or 3-year reserved pricing or a savings plan on the A100 VMs (the API was not queried for
reservations) **[U, typically 30–60% off]**, and a cheaper Blackwell SKU if the RTX PRO 6000 v6 benchmarks well.

---

## 9. When does v2 make sense?

**Now (v1 → v1.5):** keep the 3D tutor. Do not build live video.

**v2a: pre-rendered narration video.** Trigger: narration caching exists in v1, and E-5, E-7 and E-8 pass. Cost: ≈ $200
per character plus a CDN-less $0.12 per student-month. Allowed under the directive (OSS on Azure Spot GPUs). Risk: low, with no live-path change.

**v2b: live "Studio" video tier.** Ship only when **all** hold:

| gate | threshold | why |
|---|---|---|
| price | a tier at **≥ ₹2,999/mo** (hybrid), or moments-only in **≥ ₹499** (MuseTalk) / **≥ ₹999** (Ditto) plans | §8: below this, avatar cost exceeds 20% of revenue |
| volume | **≥ ~600 subscribers** on that tier, or a scale-to-zero T4 design that meets the latency bar | the warm-GPU floor ($3,754/mo per A100) must amortise to below the per-student marginal cost |
| evidence | an A/B vs the 3D tutor shows a retention lift (for example +10% relative D30) or a learning lift, at n large enough to detect it | otherwise it is cost without benefit |
| latency | added first-audio delay **≤ 250 ms p50 / ≤ 400 ms p95**; barge-in to silence **≤ 150 ms** (E-3) | owner directive: speed is never traded away |
| quality | passes the Hindi lip-sync bar (E-5) and children's blind preference (E-8) | uncanny photoreal is worse than good 3D |
| audio floor | echosim tables unchanged (E-4) | `rejected.md` failure class |
| ops | GPU quota for peak (≈ 15 A100s per 1,000 hybrid students) granted in centralindia | §5.3 |

**v3: zero-marginal-cost video-real** is the endgame. That means on-device Gaussian heads (LAM-style, sibling §9) driven by `FaceFrame`,
or server video if GPU cost per stream falls ≥ 4×. The `VideoTutorRenderer` and `FaceFrame` contracts keep both doors open.

**Reverse these conclusions if:**
- the owner lifts the Azure-only constraint for avatars (re-price Simli or LiveAvatar, and test Bey on-prem);
- Azure's avatar is shown to take native gpt-realtime audio *and* drops below $0.05/min;
- a measured A/B shows that video lifts paid conversion enough to fund it;
- a ≤ 1B real-time portrait model reaches ≥ 4 streams per T4.

---

## 10. Experiments, in priority order, with pass bars

| id | experiment | method | pass bar | cost |
|---|---|---|---|---|
| E-0 | GPU quota | request ACA T4 (centralindia) and NC A100 v4 VM quota on the grant subscription | quota granted | 0 |
| E-1 | **Does the Azure avatar take native gpt-realtime audio?** | Voice Live, `gpt-realtime-2.1`, `voice: {type: "openai"}` (or the native voice), `avatar: {character: "lisa"}`; also the photo avatar | session starts *and* lips track the native voice | ~1 h, <$5 |
| E-2 | If E-1 fails: a blind voice re-test | `diya`/`meera` (`azure-realtime`), MAI-Voice-2-Flash and Dragon HD vs gpt-realtime, Hindi-belt parents, blind (the portfolio's accent-identity method) | an Azure voice ties or beats gpt-realtime by ear | 1 day |
| E-3 | Live latency | LiveTalking + MuseTalk 1.5 on one NC24ads A100 v4 in centralindia, `batch_size` 4/8/16, behind a LiveKit SFU; real 4G phones in Jaipur or Delhi | added first-audio ≤ 250 ms p50 / 400 p95; barge-in to silence ≤ 150 ms; 0 `starved` events in 45 min | 2–3 days |
| E-4 | echosim with renderer playback | extend echosim's harness to treat the renderer's remote track as the playback path | floor tables unchanged vs baseline | 1 day |
| E-5 | **Hindi lip-sync** | 200 Hinglish tutor utterances; LSE-C/LSE-D (SyncNet), a bilabial-closure rate check (p/b/m/bh frames with lips closed), and a 5-rater MOS, for MuseTalk / Ditto / LatentSync | LSE-C ≥ the vendors' published band **[U]**; closure on ≥ 90% of bilabials; MOS ≥ 3.8/5 | 2 days |
| E-6 | Character asset path | `gpt-image-2` portrait → `sora-2` idle/listen/explain loops (no speech) → MuseTalk inpainting; check Azure Sora's acceptance of photoreal adults | 6 seamless loops per character at ≥ 512 px | 1–2 days |
| E-7 | Offline throughput | video-minutes per GPU-minute for MuseTalk / LatentSync 1.6 / EchoMimic v3 on a Spot A100 | confirms or corrects the 1.2× / 0.1× factors in the cost model | 1 day |
| E-8 | Children's preference | 30+ families, blind A/B: 3D tutor vs MuseTalk photoreal vs Ditto, 10-min lesson; also the "is she a real person?" probe | photoreal preferred by ≥ 60% *and* ≥ 90% of children correctly say she is an AI after the intro | 1 week |
| E-9 | Device and data | 540p/360p H.264 decode on the reference ₹10k devices: CPU, battery and thermal vs the 3D tutor; MB per lesson | ≤ 3D tutor's battery; ≤ 120 MB per 45 min at 360p | 1 day |
| E-10 | Licences | replace InsightFace in Ditto/LivePortrait with MediaPipe; legal read of LiveTalking's watermark clause, the Wav2Lip-256 weights and the CogVideoX licence | a clean commercial path for the chosen renderer | counsel |

---

## 11. Not recommended (candidates for `context/rejected.md` if someone tries them)

1. **Playing the direct Azure audio and a separately rendered video.** The lips lag by the renderer FFD (300–400 ms), outside BT.1359.
2. **A client-side relay of tutor audio to a cloud renderer** (architecture A). Two last-mile trips and a 256 kbps PCM uplink on 4G.
3. **Truncating on barge-in at the model's generated offset** instead of the renderer's played offset. The model "remembers"
   words the child never heard.
4. **Azure TTS avatar for full lessons.** $450 per student-month; it probably forces a voice change.
5. **Diffusion avatars live** (Live Avatar 14B, Hallo3, EchoMimic). About 5 H800s per stream, or minutes per clip.
6. **Shipping InsightFace-based detection** (LivePortrait, Ditto defaults) in a paid product. The models are non-commercial.
7. **A photoreal tutor with no persistent AI disclosure** for children aged 6–15.
8. **Per-character custom Azure avatars "just in case".** $0.60/h hosting each, about $438/month idle per tutor.
9. **Uploading real people's photos as tutor faces.** This is likeness abuse, and it would undermine trust in the whole product.

---

## 12. Proposed `context/` entries (for the main loop to merge; this workflow writes only to this folder)

- **decision `video-avatar-v2-shape`:** v2 = pre-rendered narration video (OSS on Azure Spot GPUs). Live video is a gated
  "Studio" tier per §9. *Reverse if:* the §9 reversal list is met.
- **measurement `azure-avatar-prices-2026-10-02`:** Retail Prices API, centralindia: $0.50 / $0.70 / $0.60 / $0.80 per min
  real-time; hosting $0.60/h; photo avatar creation $2 each. n = 10 meters. Method: `prices.azure.com` query.
- **measurement `azure-gpu-prices-india-2026-10-02`:** NC24ads A100 v4 $5.142/h (Spot $0.95); NV36ads A10 v5 $4.48/h;
  ACA T4 $0.000102/s. Serverless A100 is not available in Central India (doc region table).
- **rejection candidate `video-avatar-direct-audio`:** see §11.1 and §11.3. Not yet tried in this repo, so record it as a design rule.
- **correction to `tech-and-market` §2.1:** Tavus, D-ID, Anam and Synthesia accept BYO audio (echo modes or LiveKit plugins); Hedra has no realtime product.

---

## Sources

Azure (primary)
- Voice Live how-to, including the avatar, photo avatar (VASA-1), viseme, Live-Reference AEC and `azure-realtime` native voices (updated 2026-09-24): https://learn.microsoft.com/en-us/azure/ai-services/speech-service/voice-live-how-to **[V]**
- Voice Live overview: models, tiers, pricing scenarios, limited access: https://learn.microsoft.com/en-us/azure/ai-services/speech-service/voice-live **[V]**
- Speech regions, TTS-avatar and Voice Live tabs (updated 2026-09-30): https://learn.microsoft.com/en-us/azure/ai-services/speech-service/regions?tabs=ttsavatar **[V]**
- Voice Live FAQ: https://learn.microsoft.com/en-us/azure/ai-services/speech-service/voice-live-faq **[V]**
- Voice Live avatar sample (cloned; `src/app/chat-interface.tsx` voice and avatar config): https://github.com/microsoft-foundry/voicelive-samples/tree/main/javascript/voice-live-avatar **[V]**
- Azure Retail Prices API (avatar meters, GPU VMs, ACA GPU/vCPU, bandwidth; queried 2026-10-02): https://prices.azure.com/api/retail/prices **[V]**
- ACA serverless GPUs (regions, limits, quota; updated 2026-09-24): https://learn.microsoft.com/en-us/azure/container-apps/gpu-serverless-overview **[V]**
- ACA ingress (HTTP/TCP only): https://learn.microsoft.com/en-us/azure/container-apps/ingress-overview **[V]**

Vendors (primary docs, fetched raw)
- Simli docs index, audio format and WebRTC API: https://docs.simli.com/llms.txt , https://docs.simli.com/api-reference/simli-webrtc.md **[V]**; homepage (free tier, <300 ms): https://www.simli.com/ **[V/S]**
- HeyGen LiveAvatar LITE events, credits and overview: https://docs.liveavatar.com/docs/lite-mode/events.md , https://docs.liveavatar.com/docs/faq/credits.md , https://docs.liveavatar.com/docs/lite-mode/overview.md **[V]**
- Tavus pricing: https://www.tavus.io/pricing **[V]**; Echo mode: https://docs.tavus.io/sections/conversational-video-interface/echo-mode.md **[V]**; pipeline modes: https://docs.tavus.io/sections/conversational-video-interface/quickstart/pipeline-modes.md **[V]**
- D-ID Echo Sessions: https://docs.d-id.com/docs/echo-sessions-quickstart.md **[V]**; realtime overview: https://docs.d-id.com/docs/realtime-overview.md **[V]**
- Beyond Presence deployment, concurrency and FAQ: https://docs.bey.dev/production/deployment.md , https://docs.bey.dev/production/concurrency.md , https://docs.bey.dev/learn/faqs.md **[V]**
- LiveKit avatar providers, bitHuman and Synthesia plugins: https://docs.livekit.io/agents/models/avatar/ **[V]**
- Synthesia pricing: https://www.synthesia.io/pricing **[V]**
- Hedra docs index (no realtime pages): https://www.hedra.com/docs/llms.txt **[V]**
- Pipecat (cloned 2026-10-02): `src/pipecat/services/{simli,heygen,tavus}` **[V, source]**: https://github.com/pipecat-ai/pipecat

Open source (cloned 2026-10-02; READMEs, licences, source)
- MuseTalk (README, LICENSE, `scripts/realtime_inference.py`, `configs/inference/realtime.yaml`): https://github.com/TMElyralab/MuseTalk **[V]**; paper HTML (30 fps at 256² on V100; limits): https://arxiv.org/html/2410.10122 **[V]**
- LiveTalking (README perf table, `config.yaml`, `config.py`, `avatars/audio_features/base_asr.py`): https://github.com/lipku/LiveTalking **[V]**
- Ditto (README, `inference.py`, `stream_pipeline_online.py`, `core/atomic_components/avatar_registrar.py`): https://github.com/antgroup/ditto-talkinghead **[V]**; paper HTML (RTF 0.895, FFD 385 ms, module timings, controls): https://arxiv.org/html/2411.19509 **[V]**
- LivePortrait (`assets/docs/speed.md`, LICENSE InsightFace clause): https://github.com/KwaiVGI/LivePortrait **[V]**
- LatentSync: https://github.com/bytedance/LatentSync **[V]**
- EchoMimic v2 / v3: https://github.com/antgroup/echomimic_v2 , https://github.com/antgroup/echomimic_v3 **[V]**
- Hallo3: https://github.com/fudan-generative-vision/hallo3 **[V]**
- InfiniteTalk: https://github.com/MeiGen-AI/InfiniteTalk **[V]**
- Live Avatar (Quark): https://github.com/Alibaba-Quark/LiveAvatar **[V]**

Internal
- `../tech-and-market.md` §1.9, §2, §9; `../../harvest/companion-tech.md` §13–14; `audio-to-face-ml.md` §5, §8, §9;
  `web-3d-talking-heads.md` §1; `/home/user/Taxila/context/decisions.md#azure-only-compute`; `../market/market-size.md` (₹299–499 anchors).
- Not fetched this session (web-search budget exhausted): Simli per-minute pricing, D-ID pricing, ITU-R BT.1359 text
  (cited via the siblings), and MeitY synthetic-media rules. These carry **[S]** or **[U]** above.

---

## Graphics review

Reviewer stance: an adversarial real-time graphics engineer, 2026-10-02. I read the doc above as a design that will ship, and tried to break its performance claims, licences, A/V sync, child-facing quality and effort assumptions.

**What I re-checked this session:**
- Ditto: the paper HTML, plus `inference.py`, `stream_pipeline_online.py`, `core/atomic_components/source2info.py` and the HF model card API.
- LiveTalking: `base_asr.py`, `whisper.py`, `base_avatar.py`, `server/webrtc.py`, `config.py` and README-EN.
- MuseTalk: README.
- LatentSync: `latentsync/utils/face_detector.py` and `requirements.txt`.
- Wav2Lip: README.
- Azure Retail Prices API: queried again for NC24ads A100 v4 and all avatar meters in centralindia, plus the NC RTX PRO 6000 v6 SKUs.
- Azure docs: the NC RTX PRO 6000 BSE v6 size page and the Azure Sora 2 concept page.
- LiveKit: the avatar page, the KB article on A/V sync, and `TrackPublishOptions`.
- Through search: the BT.1359 thresholds, the NVIDIA NVENC matrix, Chromium issue 687574, Brink et al. 2019 and the MeitY 2026 rules.

**Overall verdict.** The strategic conclusion holds and gets stronger: no live video in v1, pre-rendered narration first, and live video only behind gates. Eight findings, however, change a design, a number or an experiment (R1). Live video is more expensive, slower to barge in, and more work than §2–§5 say.

### R1. Errors that change a design, a number or an experiment

1. **The A100 has no hardware video encoder. §5.4's "NVENC H.264" cannot run on the recommended VM.**
   - GA100 (A100) has zero NVENC engines; it has NVDEC only. The usual workaround is CPU x264 **[S, NVIDIA forum and support-matrix summaries]**. H100 has no NVENC either.
   - Fix: on NC24ads A100 v4, encode on the 24 vCPUs with x264 `ultrafast`/`zerolatency` (or openh264), at about 0.3–0.5 vCPU per 540p25 stream **[U]**. That CPU is shared with MuseTalk's CPU blending (LiveTalking pastes the mouth back with cv2 on the CPU) and with aiortc/PyAV in one Python process. CPU, not GPU, may then set the session ceiling, and LiveTalking's README says as much: "concurrent sessions when not speaking depend on CPU" **[V]**.
   - Alternatively, pick a GPU that has NVENC: A10 (NVads A10 v5), T4, or the RTX PRO 6000 v6. E-3 must report CPU% per session, not only GPU fps.
2. **Azure Sora 2 rejects input images with human faces. §5.5 step 1(a) and E-6 cannot work as written.**
   - The Azure Sora 2 page states: "Real people—including public figures—cannot be generated. **Input images with faces of humans are currently rejected.**" **[V, learn.microsoft.com video-generation, updated 2026-06-05]**.
   - The route "`gpt-image-2` portrait → `sora-2` image-to-video loops" is therefore blocked. Text-to-video can produce *a* person, but not the *same* person across 6–7 clip-bank loops, which MuseTalk needs. Identity would drift between idle and explaining clips.
   - Buildable alternatives:
     - (b) a filmed, consenting actor (the most reliable route);
     - a self-hosted OSS image-to-video model on Azure GPU (Wan-2.x-class I2V, Apache-2.0), run through E-6 instead of Sora;
     - Ditto or LivePortrait from a single generated portrait, which needs no clips at all.
   - Rewrite E-6 to test one of these.
3. **Licences: three more traps the doc misses or under-states.**
   - **LatentSync is not clean.** Its inference-time face detector is `insightface.app.FaceAnalysis(allowed_modules=["detection","landmark_2d_106"])`, and `requirements.txt` pins `insightface==0.7.3` **[V, source]**. That is the same non-commercial model trap as LivePortrait and Ditto. §5.1 lists LatentSync as plain Apache-2.0, and §5.5 and §9 v2a put it on the pre-render path. Add it to rejection #6 and to E-10.
   - **Ditto is worse than "swap the detector".**
     - `source2info.py` loads InsightFace **detection and the 106-point landmark model** (plus MediaPipe 478) **[V, source]**. The 106 landmarks feed the crop and keypoints, so the swap needs a quality re-validation, not only a dependency change.
     - The HF checkpoint repo `digital-avatar/ditto-talkinghead` **declares no licence** in its model card metadata **[V, HF API returned `license: None`]**. The Apache-2.0 badge covers the GitHub code. The weights need a written grant, or legal sign-off, before commercial use.
   - **Wav2Lip is non-commercial, code and weights.** The upstream README says: "This repository can only be used for personal/research/non-commercial purposes", and the LRS2-trained models make "any form of commercial use … strictly prohibited" **[V]**. LiveTalking's `wav2lip256` reuses that architecture with weights of unknown provenance.
     - Remove the "Wav2Lip-256 on ACA T4" row as a buildable option. It is the only row in §8 that fits full lessons, so §8's "only Wav2Lip-on-T4 fits full lessons at ₹1,499+" becomes "**nothing commercially usable fits full live lessons at any tier**".
   - **Unchanged, and verified:**
     - MuseTalk: code MIT; "the trained model are available for any purpose, even commercially"; dependencies (whisper, ft-mse-vae, dwpose, S3FD) carry their own licences **[V]**. It is the cleanest renderer in the table.
     - LiveTalking: the LICENSE is Apache-2.0. The watermark sentence applies to videos "published on platforms such as Bilibili, WeChat Channels, and Douyin" **[V]**. It is a README request, not a LICENSE term, so it probably does not bind in-app playback **[U, counsel]**.
4. **BT.1359 is cited in the wrong direction, and the correct bound is stricter.**
   - BT.1359-1 gives detectability **+45 ms (audio leads) / −125 ms (audio lags)** and acceptability **+90 / −185 ms** **[S, ITU text via search summaries; ITU PDF R-REC-BT.1359-1]**.
   - "Video lagging audio" means *audio leads*. That is the **+45 / +90 ms** side, not −125 ms.
   - The §2.1 and §11.1 conclusion stands, more firmly: playing direct Azure audio with renderer video (audio 300–400 ms early) is about 4× past acceptability.
   - It also means any residual A/V skew on the phone must stay **under about 45 ms in the audio-early direction**. Low-end Android audio output latency and WebView compositor delay can eat that budget even when the renderer is perfectly synchronised (see 5 and R2).
5. **Barge-in as designed fails its own ≤ 150 ms bar, and truncates at the wrong offset.**
   - **The wrong clock.** `renderer.interrupt()` returns the renderer's *sent* position. The child hears that position later, by the SFU hop, the 4G path and the receiver's jitter buffer (typically 80–250 ms on 4G **[U]**).
     - Truncating at `playedMs` from the renderer therefore repeats §11.3's error at a smaller scale: the model believes the child heard roughly 100–250 ms of words that were never played.
     - Fix: the client reports its own playout position for the tutor audio track over the data channel. Use `RTCRtpReceiver.getSynchronizationSources()` `rtpTimestamp`, mapped to utterance start, or `getStats()` `jitterBufferDelay`/`jitterBufferEmittedCount`. The worker truncates at `min(rendererSent − measuredDownstreamDelay, clientReported)`.
   - **Stale queues in LiveTalking.** Its `flush_talk()` clears only the **input** audio queue (`self.queue.queue.clear()`) **[V, base_asr.py]**. Frames already generated stay queued in:
     - `feat_queue` (maxsize 2 batches);
     - `res_frame_queue` (`batch_size*2` frames);
     - the aiortc track queue (`maxsize=100`) **[V, base_avatar.py, server/webrtc.py]**.
     - At the default `batch_size=16`, roughly 1–3 s of already-rendered speech keeps playing after an interrupt **[U, from queue sizes]**. A fork must flush every stage, and must close the mouth on the next frame instead of freezing mid-phoneme.
   - **The detection chain alone exceeds 150 ms.** Server-VAD detection (≥ 100–300 ms after onset), then a server round trip, then the downstream buffer, cannot meet "≤ 150 ms barge-in to silence".
     - The only way to meet it is the **client-side local VAD → immediate mute/fade of the `<video>` element's audio, plus a freeze to the "listening" clip**, with the server truncation following.
     - Add this to §5.4's client and to E-3. Measure it as onset-to-silence at the phone speaker.
6. **The renderer becomes a single point of failure for the *voice*, not only the face.**
   - In architecture B, the child hears the renderer's audio (§2.1). A `starved` event or a renderer or pod crash therefore silences the tutor mid-sentence. "Swap back to 3D driven by the same audio" (§5.4, Client) is impossible, because that audio dies with the renderer.
   - Fix:
     - The session worker keeps a **hot standby audio publication**: it publishes its own Opus track to the SFU, muted, and the SFU or client switches to it.
     - The worker retains the unplayed PCM, so it can resume from the client-reported playout position.
     - Fail over at an utterance boundary where possible.
   - Add an experiment for this (E-12 below).
7. **The RTX PRO 6000 v6 row is misread.** `Standard_NC24lds_xl_RTXPRO6000BSE_v6` is **¼ of a GPU (24 GB)** at $1.582/h. A full GPU (`NC144lds_xl`) costs **$7.70/h**, Spot $1.54 **[V, Azure size doc + Retail Prices API]**.
   - So it is not "Blackwell at a quarter of the A100 price". Per full GPU it costs **1.5× the A100**.
   - It is still worth one benchmark for a different reason: a ¼-GPU slice at $1.58/h that sustains **one** MuseTalk stream at 25 fps *with* NVENC would be the cheapest live unit. Whether a vGPU slice exposes NVENC needs measuring **[U]**.
8. **The capacity model assumes free statistical multiplexing and elastic VMs. Neither holds by default.**
   - **Pinned sessions.** "3.5 sessions per GPU" for MuseTalk (2 talking streams, 40% talk share, 0.7 derate) assumes that any talking utterance can land on any GPU. If a session is *pinned* to a GPU, which is LiveTalking's model (one avatar process with its latents and queues), then 3 sessions on a 2-stream GPU overrun **6.4%** of the time and 4 sessions **17.9%** (binomial, p = 0.4) **[U, arithmetic]**. Overrun means stutter or `starved`.
     - With pinning: **2 sessions per GPU for MuseTalk**, and **1 for Ditto**. Ditto's online pipeline is stateful per session (motion history, DiT window), and RTF 0.895 leaves no room for a second stream.
     - Revised marginal cost: **MuseTalk ≈ $0.044 per session-minute** (hybrid $10.4, moments $1.74 per student-month). **Ditto ≈ $0.086** (hybrid $20.7, moments $3.45) **[U, the doc's script with sessions_per_gpu = 2 and 1]**.
     - Recovering the doc's numbers needs **per-utterance scheduling across a GPU pool**: stateless MuseTalk workers with every character's latents preloaded on every GPU. That is feasible for MuseTalk and not for Ditto, and it is an engineering item missing from §5.4.
   - **Peak-hours fleet.** The fleet cost in `video-avatar-v2-cost.py` is `max(floor, gpu_hours × price)`, using **average** GPU-hours as if VMs tracked load minute by minute. A 15-GPU evening peak (1,000 hybrid students) must be allocated for the whole window plus warm-up, about 5 h/day: 15 × 150 h × $5.142 ≈ **$11.6k/month ≈ $11.6 per student**, not $5.88 **[U]**. With pinned sessions it is about 25 GPUs ≈ **$19k/month**.
   - VM boot plus model load is minutes, so scale-up must be scheduled, not reactive.

### R2. Performance claims to relabel or tighten

| § | claim in doc | what the source actually says | correction |
|---|---|---|---|
| 5.1, Ditto | "per frame: audio 23 ms, DiT 62 ms, render 15 ms" | the paper calls these "**single-step**" timings. Online steps are `chunksize=(3,5,2)`: 5 new frames per step **[V, paper + `inference.py`]** | per step, not per frame. 100 ms per frame would be 10 fps, which contradicts RTF 0.895 at 25 fps. Streams per GPU cannot be derived from RTF (a single-stream latency measure on a 12-core host); measure GPU occupancy with 2 sessions in E-3 |
| 5.1/5.3, MuseTalk | 2 talking streams per A100 "from 72 fps on a 4090" | 72 fps is LiveTalking at default `batch_size=16`. MuseTalk's own "30 fps+ on V100" is `realtime_inference.py` at `batch_size=20` with `--skip_save_images` **[V]** | §5.4 runs `batch_size` 4 for latency. Throughput at batch 4 is unmeasured and lower **[U]**, so the stream count and every $/min derived from it are **[U]** until E-3 reports fps at batch 4 *with* blending and encode on |
| 2.3, MuseTalk | "≈ 250–350 ms tuned" | the queue depths above, plus `r=10` lookahead, inference, CPU blend, x264, the SFU and the 4G jitter buffer, plus receiver A/V sync, which holds audio back to match video | my estimate is **≈ 450–700 ms tuned** unless every queue is held at ≤ 1 batch **[U]**. The ≤ 250 ms p50 bar in §9/E-3 is very likely to fail. Keep the bar (owner directive); expect E-3 to be what kills live video |
| 2.3 / 5.4 | LiveTalking as the harness | `get_audio_frame()` returns **silence** after a 10 ms queue timeout, and that silence is also pushed to the output audio **[V, base_asr.py]** | if Azure's first deltas arrive in bursts slower than real time, silence is spliced *into* the utterance: audible stutter, plus a lip closure mid-word. Add a 100–200 ms pre-roll per utterance (more latency) or pace from the worker |
| 5.4 | "Opus audio on the same RTP clock" | Opus RTP runs at 48 kHz and video at 90 kHz. Receivers sync through RTCP SR NTP mapping | "same capture wall-clock, with RTCP SRs". In LiveKit, publish both tracks with the **same `TrackPublishOptions.stream`** so they share one MediaStream; only camera+mic are grouped by default **[V, LiveKit TrackPublishOptions]**. Use `AVSynchronizer` with `queue_size_ms ≈ 200`, because large queues "introduce significant lag" and 1,500 ms is called out **[V, LiveKit KB]** |
| 5.4 / 7 | "fork LiveTalking" + "LiveKit SFU" | LiveTalking's WebRTC output is **aiortc** (Python, software VP8/H.264 via PyAV, one GIL) **[V, requirements + server/webrtc.py]** | the output layer must be rewritten onto `livekit.rtc` (or GStreamer), which is not a config change |
| 6.4 | 500 kbps → ≈ 170 MB per 45 min | video only | add Opus (≈ 32 kbps) and RTP/NACK/FEC overhead (≈ 5–10%): ≈ **190 MB**. The E-9 360p bar (≤ 120 MB) is marginal: 300 + 32 kbps × 1.08 ≈ 121 MB |
| 2.1 / E-4 | Chromium cancels echo for remote tracks on media elements | true, **but** remote WebRTC audio played through Web Audio is *not* echo-cancelled (Chromium issue 687574) **[S]** | the 3D fallback must not take over playback through an `AudioContext`. Analyse levels with a `MediaStreamSource` while the `<video>` element keeps playing. Put this in the E-4 harness |
| 5.2 | "Spot $0.950" | **[V]** re-queried: $0.950242. On-demand $5.142 **[V]** | none. All 10 avatar meters match exactly **[V]** |

### R3. Uncanny valley and children

- **Age changes which risk applies.** Brink, Gray and Wellman (Child Development 2019, n = 240, ages 3–18) found that **children older than about 9** rated a very human-like robot creepier than a machine-like one. **Younger children did not** **[V, PubMed 29236300 abstract via search]**.
  - For Taxila's 6–8-year-olds, the uncanny valley will not protect them: they will not dislike a near-miss face. They are also the group most likely to believe a real person is present.
  - E-8's "photoreal preferred by ≥ 60%" is therefore the wrong gate for that band. **Stratify E-8 by age (6–8, 9–11, 12–15).** For 6–8, gate on the "is she a real person?" probe (≥ 95%, not 90%), and treat preference as non-informative.
- **MuseTalk-specific expression failures.** MuseTalk masks and regenerates the **lower face** (`parsing_mode='jaw'` in LiveTalking's v15 path **[V]**). The upper face comes from the base clip.
  - **(i) Mouth and eyes disagree.** A "proud" or "explaining-warm" clip with smiling eyes, paired with a generated neutral speech mouth, reads as a fake smile.
  - **(ii) Base-clip leakage.** Base clips must be filmed closed-mouth and lower-face-neutral, or the source mouth leaks into the output. That removes most of the clip bank's expressive range.
  - **(iii) Pose and resolution limits.** Head turns beyond about 30°, and teeth at a 256² crop, are the documented weak spots ("occasional jitter", lip shape and colour not preserved **[V, paper limits]**).
  - Expression for MuseTalk therefore means *brows, eyes and head only*. §5.4's seven-clip emotional bank should be re-scoped. Ditto, which re-renders the whole face from controls, is the only candidate where emotion reaches the mouth.
- **Photoreal-to-stylised swaps are identity breaks.** The §5.4 failover to the 3D tutor mid-sentence will not read as "camera off". It reads as a different person. Fail over to **the last video frame held still, plus the live audio** (a "video paused" chip), and offer 3D only at a turn boundary. A paused photoreal face is also less uncanny than a jittering one.
- **Interrupt artefact.** A cut mid-phoneme freezes an open mouth. Always render 2–3 closing frames (the silence-feature mouth) before the listening clip.
- **Labelling is now law, not a rumour.** MeitY notified the IT (Intermediary Guidelines) Amendment Rules 2026 (G.S.R. 120(E), 10 Feb 2026, in force 20 Feb 2026). Synthetically generated video must be "clearly and prominently labelled" and carry **permanent provenance metadata** **[S, Freshfields / Lexology / HLC summaries]**.
  - Whether Taxila is an "intermediary" under them is for counsel.
  - Cheap to do regardless: a persistent on-video AI label for live and pre-rendered video, and C2PA-style provenance in every pre-rendered MP4/HLS segment. Replace §6.2's "[U, could not fetch]" with this.

### R4. Production effort (missing from the doc)

All estimates **[U]**, for one strong engineer per line, to production quality rather than a demo:

| work item | effort | why it is not free |
|---|---|---|
| Self-hosted LiveKit SFU on Azure VMs (UDP, TURN-TLS fallback, autoscale, monitoring) | 2–3 wk | ACA has no UDP **[V]**; the 4G TURN-over-TCP path needs tuning |
| Move the realtime voice transport server-side (worker ↔ Azure WS), rewire VAD, and re-run echosim end to end | 3–4 wk | it changes the audio floor the portfolio protects; E-4 |
| Renderer fork: LiveTalking → livekit.rtc output, every queue flushed on interrupt, pre-roll, closing frames, client playout reporting | 4–6 wk | R1.5, R2 |
| Per-utterance GPU-pool scheduler and admission control | 3–4 wk | R1.8; otherwise the cost is about 1.75× |
| Hot-standby audio and failover | 1–2 wk | R1.6 |
| Detector swap (InsightFace → MediaPipe/S3FD) and re-validation for Ditto or LatentSync | 1–2 wk each | R1.3 |
| Clip bank per character (film or I2V, loop seams, closed-mouth discipline, `bbox_shift`, `prepare_material`) | 1–2 wk per character | R1.2, R3. For 5 tutors that is 5–10 weeks of content work |
| Pre-render pipeline (batch on Spot, cache keys, HLS packaging, provenance, QA sampling for lip errors) | 3–4 wk | §5.5 |

Live v2b totals **≈ 5–7 engineer-months plus 5–10 weeks of character content**, before E-3/E-5/E-8 can be run at product quality. v2a (pre-render only) is **≈ 1.5–2 engineer-months plus content**. That strengthens §9: build v2a first, and treat v2b as a research spike (E-3 only, about 1 week on stock LiveTalking) until E-3 shows the latency bar is reachable at all.

### R5. Experiment changes

- **E-3**: add CPU% per session and fps at `batch_size` 4 with blend and encode on. Add *onset-to-speaker-silence* on a real phone with client-side mute. Add A/V skew at the phone, measured with a clapper or flash test (pass: audio-early ≤ 45 ms, audio-late ≤ 125 ms).
- **E-5**: run it on Ditto *only after* its detector swap, so the result reflects the shippable model.
- **E-6**: replace Sora I2V (blocked) with filmed-actor, OSS-I2V and single-portrait (Ditto/LivePortrait) arms.
- **E-8**: stratify by age. The 6–8 band is gated on the AI-probe at ≥ 95%.
- **E-10**: add LatentSync (InsightFace), Ditto's HF weights (no licence declared) and Wav2Lip (non-commercial: drop it).
- **E-11 (new) truncation accuracy**: compare client-reported playout vs renderer-sent position on 4G; pass when the truncation error is ≤ 40 ms p95.
- **E-12 (new) renderer failover**: kill the renderer mid-utterance; pass when the audio gap is ≤ 300 ms, with no repeated or skipped words.
- **E-13 (new) ¼ RTX PRO 6000 slice**: one MuseTalk stream at 25 fps with NVENC exposed in the vGPU; record $/session-minute.

### R6. What survived scrutiny

- **Azure prices.** All 10 avatar meters and the A100 on-demand and Spot prices match the API exactly **[V]**.
- **Ditto.** RTF 0.895 and FFD 385 ms on one A100 **[V, paper]**.
- **MuseTalk.** The MIT licence and the commercial-weights wording **[V]**.
- **LiveTalking.** Apache-2.0, `fps` "must be 25", `batch_size=16` default **[V]**.
- **Hedra.** Absent from LiveKit's 16-provider list **[V, re-fetched]**.
- **The architecture-B principle** (the renderer owns the audio clock) and the §11 rejections. All stand, and §11.1 stands more firmly under the corrected BT.1359 direction.

Sources added by this review:
- Azure Sora 2 restrictions: https://learn.microsoft.com/en-us/azure/foundry/openai/concepts/video-generation **[V]**
- NC RTX PRO 6000 BSE v6 sizes (fractional GPU): https://learn.microsoft.com/en-us/azure/virtual-machines/sizes/gpu-accelerated/nc-rtxpro6000-bse-v6-series **[V]**
- Ditto paper: https://arxiv.org/html/2411.19509 **[V]**
- Ditto source: https://github.com/antgroup/ditto-talkinghead **[V]**
- Ditto HF weights: https://huggingface.co/api/models/digital-avatar/ditto-talkinghead **[V]**
- LiveTalking source: https://github.com/lipku/LiveTalking **[V]**
- LatentSync source: https://github.com/bytedance/LatentSync **[V]**
- Wav2Lip licence: https://github.com/Rudrabha/Wav2Lip **[V]**
- ITU-R BT.1359-1: https://www.itu.int/dms_pubrec/itu-r/rec/bt/R-REC-BT.1359-1-199811-I!!PDF-E.pdf **[S, thresholds via summaries]**
- A100 has no NVENC: https://forums.developer.nvidia.com/t/nvenc-encoding-support-for-nvidia-a100-gpu-card/193480 **[S]**
- LiveKit `TrackPublishOptions.stream`: https://docs.livekit.io/reference/client-sdk-js/interfaces/TrackPublishOptions.html **[S]**
- LiveKit A/V sync KB: https://kb.livekit.io/articles/3726353370-debugging-audio-video-sync-issues-in-livekit-publishing **[V]**
- Chromium 687574 (no AEC through Web Audio): https://github.com/twilio/twilio-video.js/issues/323 **[S]**
- Brink, Gray & Wellman 2019: https://pubmed.ncbi.nlm.nih.gov/29236300/ **[S, abstract]**
- MeitY IT Amendment Rules 2026: https://www.freshfields.com/en/our-thinking/blogs/technology-quotient/india-targets-deepfakes-and-ai-generated-content-key-changes-under-meitys-2026-102mjwn **[S]**
