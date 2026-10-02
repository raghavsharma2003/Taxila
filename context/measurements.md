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


<!-- merged from inbox/learner.json -->
## onboarding-cat-sim-2026-10-02
**Onboarding CAT simulation, Class 6 maths strand unless noted (computed, not children).** (2026-10-02)
- Method: `docs/research/learner/onboarding-cat-sim.mjs`, seeded, about 45 s, byte-identical output across runs; 1,500-3,000 simulated children per row; item parameters misspecified (b +/- 0.4 GE, a x e^N(0, 0.25)); mixed oral/tap; ASR miss 15-25% and per-item times are model inputs [U].
- Results: mean posterior SD after 12 items 0.52-0.63 (SD < 0.35 unreachable); success-first targeting cut runs of 3+ wrong answers from 44% to 8% at +0.13 GE RMSE; a single class-based prior placed 28% of far-behind children > 1 GE too high vs 7% with the 0.6/0.4 mixture (2% when the prior matches the population); within 1 GE of truth: 78% at 8 items, 91% at 16, 96% at 24.
- Limits: the generating model shares the estimator's family and is unimodal, so every 'within 1 GE' rate is an upper bound; the ASER-ladder arm was scored with the grid posterior mean, not the bracket rung, so its '40% too high' figure measures prior shrinkage and is NOT evidence against ASER's rule (onboarding review R1). Re-run with a bracket-rung arm and 15-20% non-monotone responders before any further entry.

## prod-lesson-e2e-2026-10-02
**First production lesson on Azure (`taxila-web`, image 91c104c), text mode, n=1 lesson, 3 turns, 2026-10-02.**
Method: curl from the US build sandbox: signup → consent → class-4 child → `/api/lesson/start` → 3 typed turns →
`/api/realtime/token`. start 2467 ms (topic c4-maths-ch01-t01 chosen by nextTopicFor; Hinglish opening by Asha);
turns 3124 / 2443 / 4014 ms (moves hook → explain → worked_example; teacher set up teach-back to protégé "Golu");
realtime ephemeral token minted for the lesson. Text-mode turn latency is dominated by the taxila-fast reply
call + guards; voice lane does not wait on it (director runs off the critical path).


<!-- merged from inbox/avatar.json -->
## avatar-lipsync-bench-2026-10-02
**How well audio-only lip-sync tracks a Hindi and English tutor voice, scored against Azure's phone-aligned viseme timelines (2026-10-02).**

Method:
- **Stimuli.** `docs/research/avatar/bench/` (`gen.mjs`, `bench.mjs`). 14 Azure Neural TTS utterances: 10 hi-IN on Swara and Madhur, 4 en-IN on Neerja and Prabhat. That is 93.9 s of Hindi and 29.8 s of English, containing 84 Hindi and 34 English bilabial segments.
- **Ground truth.** Azure `visemeReceived` events mapped to the 15 Oculus visemes, converted to a fixed openness table and smoothed with a one-pole filter, τ = 50 ms.
- **Arms.** Each arm runs causally at 48 kHz in 128-sample quanta and is read at 60 fps instants. One fixed lag per arm and language.
- **Machine.** 4-vCPU Xeon at 2.1 GHz, Node 22.22.

Results, Hindi / English:

| arm | r(open) | bilabial closures (hi) | vowel false-closure (hi) | lag |
|---|---|---|---|---|
| RMS envelope | 0.563 / 0.697 | 28/84 | 15.9% | 0 ms |
| HeadAudio 0.1.0 as shipped | 0.431 / 0.521 | 55/84 | 35.1% | 0–33 ms |
| HeadAudio + per-voice `speakerMeanHz` | 0.443 / 0.534 | 50/84 | 28.5% | |
| HeadAudio + 120 ms minimum hold | 0.155 / 0.263 | 14/84 | | |
| wawa-lipsync 0.0.2 | 0.450 / 0.518 at its best lag | 11/84 (0/34 en) | | 217–233 ms |
| wav2arkit (wav2vec2 + LAM, offline) | jaw 0.525 / 0.581 | | | leads audio by 100–167 ms |

- **Hindi penalty.** Every arm loses 0.09–0.13 r on Hindi.
- **HeadAudio processing cost** per 128-sample quantum: p50 0.005 ms, p99 0.076–0.088 ms (n = 46,403), against a 2.667 ms budget.
- **wav2arkit cost and size.** It needs a 402 MB weight file and takes 491 ms per audio second on 1 thread (165 ms on 4) in onnxruntime-web WASM.

Caveats:
- The ground truth is TTS phone alignment, not filmed lips.
- The RMS arm shares the τ = 50 ms smoothing with the ground truth, which flatters its zero lag (review R-2a/R-7). Re-score against unsmoothed ground truth before quoting any lag.
- The voices are Azure, not gpt-realtime. Received WebRTC/Opus audio is not tested yet (E-3).
- The sample is small. Differences between HeadAudio variants (±0.03 r) are within noise. The RMS-vs-HeadAudio gap and the wawa lag are not.

## avatar-asset-perf-2026-10-02
**Asset and runtime cost of a face avatar for ₹10k Android (2026-10-02). All runs were in this container; phone figures are scaled estimates [M→U] until the device lab runs.**

Method:
- **Scripts.** `docs/research/avatar/bench/perf/`, `bench/glbstat.mjs`, `bench/review/` and `character-pipeline-proto/`.
- **Inputs.** TalkingHead's five sample avatars (measurement only; four of them are non-commercial) and the ICT FaceKit head.
- **Tools.** three 0.180.0 / r186 source, gltf-transform 4.5, Chromium 141 with SwiftShader, and CDP CPU throttling at 4× (≈ G85) and 6× (≈ G35).
- **Repeats.** Codec timings are the median of 15 runs, textures 9, frame-cadence arms 2–4 runs of 10 s.

Results:
- **Geometry codec.**
  - Meshopt with quantize: 0.96–2.86 MB. Draco without quantize: 2.15–19.6 MB (raw 2.3–20.4 MB).
  - Morphs are 80–91% of a face avatar's geometry bytes.
  - Decode: 2.0–7.9 ms meshopt against 5.9–17 ms Draco. Decoder: 6.5 KB gz against 100 KB gz.
- **Textures, one 1024² map.**
  - WebP lands as RGBA8 and takes 5.59 MB on the GPU; decode 22–31 ms.
  - KTX2 ETC1S takes 0.70 MB (ETC1) or 1.40 MB (ETC2/ASTC); transcode 3–5 ms. Files: ETC1S ≈ 105 KB, UASTC ≈ 650 KB.
  - The basis transcoder is 260 KB gz.
- **Tier-B character pipeline** (drop the 15 visemes, drop morph normals, drop normal and ORM maps, one ETC1S atlas): GLB 0.87–1.44 MB and 10–17 MB resident, against 4.2–8.5 MB and 17–41 MB as shipped.
- **Morph memory** in three.js: GPU 16·k + JS texel copy 16·k + JS geometry 6–9 B per vertex per target, where k = 1 position-only and 2 with normals. MPFB as optimised: ≈ 111 MB total (GPU 48.6 MB). Eyelashes and eyebrows hold 54% of it.
- **Main-thread JS per frame,** 13k-triangle avatar: 0.6 / 2.1 ms (p50 / p95) at 1×, 3.9 / 19.4 ms at 4×, 7.1 / 32.8 ms at 6×. First render of MPFB at 4×: 1,771 ms, mostly morph-texture packing.
- **Same-process iframe busy 50 ms in every 100 ms.** Lip gap p99 ≈ 76 ms via the main thread against 35–40 ms worklet → worker. Maximum 136–303 ms against 42–66 ms. Desktop proxy, n = 4 runs per arm.
- **Bundles, gz:** three + TalkingHead 217.5 KB, Babylon 777.8 KB, Rive 368–821 KB.
- **Export.**
  - Custom split normals: 102,530 GPU vertices against 27,956 after clearing.
  - Meshopt on a 7.9k-vertex, 67-morph head: 4.05 MB → 0.82 MB.
  - MPFB headless `create_human`: 1.3 s, with a 4,048-vertex head.
- **TalkingHead's 30 fps frame cap** delivers ≈ 23 fps on a 60 Hz panel (simulation with jitter).


<!-- merged from inbox/market.json -->
## mk-tam-k9-tuition
- **Values.** K-9 enrolled 185.1M (UDISE+ 2025-26; class 9 estimated at 52% of classes 9-10, ±0.8M). Private unaided 37.9%. Hindi belt 93.5M (50.5%).
- **Coaching (CMS:E 2025).** 26.8% of K-9 take coaching, 49.6M children. TAM-1 is Rs35,554 cr/yr (~$4.0B at Rs88/$).
- **SAM-1.** Hindi-belt takers with phones plus non-belt CBSE takers: 19.1M heads (22.1M on the raw ASER basis). They spend Rs12.3-14.5k cr today. At Rs299-499 x 10 months the SAM is Rs5.7-9.5k cr.
- **n / method.**
  - CMS:E n=57,742 households, fieldwork Apr-Jun 2025. The reference period is open, so TAM-1 may be a floor.
  - ASER 2024 rural state rates, calibrated x0.72/x0.96.
  - BaSE 2025 phone access.
  - Model: docs/research/market/market_size_model.py. It reproduced exactly in fact-check.
- **Date.** 2026-10-02.
- **Source.** docs/research/market/market-size.md §5. PIB PRID=2160863. UDISE+ 2025-26 booklet.
- **Most sensitive inputs.** Bihar (−37% of SAM-1 if removed) and price.

## mk-azure-voice-cost-per-hour
- **Values (two-way voice per session-hour, GST excluded, modelled).**
  - DIY cascade (MAI-Transcribe-2 -> GPT-6 Luna/terra -> Azure Neural TTS, 50% of narration pre-rendered): Rs28.
  - Luna-only: Rs19 ($0.198, which matches PW's claimed ~$0.20/h).
  - gpt-realtime-2.1-mini with a 1-turn audio window: Rs132. Unpruned: Rs1,063.
  - gpt-realtime-2.1 windowed: Rs512.
  - GPT-Live-1 Rs299: UNVERIFIED, because $3/h is not on the Azure page.
  - Cascade split: TTS 52%, terra 34%, STT 9%, Luna 6%.
- **n / method.** Model docs/research/market/pricing_unit_econ_model.py plus docs/research/realtime-cost-model.py. Inputs are Azure pricing-page data read 2026-10-02. Assumptions: VAD gating, a 15% terra share, pre-render share, and FX of Rs96/$.
- **Date.** 2026-10-02.
- **Source.** pricing-unit-econ.md §2-3. azure.microsoft.com/en-us/pricing/details/speech/ and /azure-openai/.
- **Supersedes.** Earlier sibling estimates: Rs68-126/h (Sarvam), Rs85-140/h (rt-mini) and Rs42/h (cascade).

## mk-discovery-channels-base2025
- **Values.**
  - How children discover EdTech: school or teachers 63%, friends 58%, tuition teachers 22%, community influencer 7%, ads 6%. 23% say use was mandated.
  - Tools used: YouTube 94%, WhatsApp 67%, DIKSHA 2%. 6% use a dedicated EdTech app (among EdTech users).
- **n / method.** BaSE 2025 survey of low-resource settings across 10 states. N=7,866 students for the tool and discovery items; 12,500 households overall.
- **Date.** Report 2025; read 2026-10-02.
- **Source.** https://www.edtechbase.centralsquarefoundation.org/BaSE%20Report%202025.pdf via gtm-distribution.md §1.
- **Caveat.** The sample is low-resource households, so it may understate app discovery among mid-fee urban families.


<!-- merged from inbox/psychology.json -->
## psych-identifiability-sims-2026-10-02
**Simulations of what Taxila's logs can identify about one child, and of the parent-claim gates (2026-10-02). Every generative assumption is [U]; the arithmetic is reproducible. Scripts are in `docs/research/psychology/`.**
- `learning-over-time-relsim.py` (numpy, seed 7, 300-400 simulated children/cell) + methodologist re-simulation (seed 11, 300/cell): iAFM intercept reliability .64-.68 at 35 obs, .80-.81 at 70; slope .01-.04 below 210 obs, .23 at 100 skills x 10, .53-.61 at 30 x 30 (Monte Carlo +/-.05-.08). Durability (HLR-C) .31/.43/.49 at 20/40/80 checks under the scheduler as specified; .36/.52/.67 in the widest window the R >= .6 bound allows; the original U(1,30) lag design (.40/.70/.82) is not a design Taxila may run.
- `metacognition-srl-calibsim.py` (seed 11, 2,000 children/band) + `metacognition-srl-reviewsim.py` (seed 7, 4,000/condition): offset test-retest .73-.75 at 30 bets, .92 at 120; resolution .36-.57 at 30, .72-.85 at 120; raw bias x ability r -.53 to -.74 with independent truth; r(dConf, d') = .85; help coupling lambda .21/.51/.66/.79 at 50/200/400/800 opportunities; raw-count change route gave 99% of children >= 1 false row/yr.
- `motivation-habits-habitsim.py` (400 children/span): D28 test-retest .83-.88; anchor share .58-.69; per-child habit t95 r .26-.42; median Lally fit R^2 .03-.21 over 12-36 weeks.
- `temperament-vibe-calc.py`: contingency reliability .70 needs 37/66/149/597 trials at tau 1/.75/.5/.25 (p .5); at r = .27 a 'top third' label is right 44% of the time.
- `cognitive-development-reviewsim.py` (20,000 diffusion trials, seed 7): 3% slow lapses bias EZ drift -35% (trimmed -4%); 5% mid lapses -15% after trim; 20% of 30-trial blocks hit the Pc = 1 edge correction.
- `learning-analytics-methods-sim.py` (fixed seeds): MRT power .83 for 3 pp at N = 400, T = 30 (upper bound); type-I .060 (MC SE .0069); Thompson no floor naive type-I .111; per-child format rho .70 needs 78/217/487 comparisons per arm at tau .5/.3/.2.
- `parent-reports-methodsim.py`: n-of-1 two-sided rule fires in 19% of null families; parent RCT needs 17,442/6,279/1,570 families per arm at d = .03/.05/.10.
- `research-program-synthsim.py` (seed 20261002, 3,000 children/cell, ~30 s): report gate under screening — independent priors 4.89 false claims per null report (budget believed 0.21); normal-normal EB 2.22 false vs 0.17 believed (K = 30, n = 120/arm, 10% real effects of +/-1 logit); two-groups EB 0.10 false vs 0.12 believed (30% real), yield 0-16% at 12-40 per arm. False change rows/child-year under the null: raw-count route 5.63 (100% of children), corrected term rule 0.107 (6 rows, P >= .95), 0.071 (4 rows), 0.050 (P >= .975). Reliability CI +/-.05 at r = .7 needs 403 children/band. GRR (sigma_eps .3, sigma_S .5) .35/.78/.92 at 6/12/18 months. TOST +/-0.10 SD: 2,569 children total.


<!-- merged from inbox/content.json -->
## content-generation-bench-2026-10-02
**Content-generation measurements made by the content/ workstreams on 2026-10-02, US build container -> eastus2, synthetic briefs, no child data.** Compiled in `docs/research/content/CONTENT-ENGINE.md`; raw outputs beside each script.
- T1 engine spec fill (`genui-bench.mjs`, fractions@1, strict schema): taxila-fast effort none n=10, 10/10 valid incl. engine-maths checks, 1,876 ms p50 / 2,050 ms p90, 191 output tokens; effort low 9/10, 3,459/5,094 ms.
- T2a scene template fill: 3.08 s p50 / 3.35 s p90 (n=8 briefs), 6/8 lint-clean as run, 8/8 after validator v1.1-v1.3 (in-sample). T2b free scene: 0/8 first call on fast (11.9 s p50), 6/8 after one repair; brain 3/8 -> 7/8 (18.2 s p50); json_object mode 7/8 schema-invalid, 0 repaired. Strict-mode null tax 24.5% of payload.
- Azure strict structured outputs (n=1 per probe): 400 properties accepted; nesting > 10 rejected; > 1000 total enum values rejected.
- explainer@1 (`explainer-bench.mjs`, 8 curriculum topics x 5 arms x 1 rep): template on taxila-fast effort none 8/8 at 2.88 s p50 / 3.46 s max (~$0.0007 each); free-form 3/8 at 13.55 s (fast, low) and 2/8 at 29.70 s (brain, low). Template choice right 24/24.
- Free SVG (`diagrams-images-svg-probe.mjs`, 4 pinned diagrams x 2 deployments x n=3): gpt-5.6-sol medium 12/12 exact at 8-25 s; luna low 10/12 at 5-11 s (one triangle 13.1/18.8/148 deg instead of 50/60/70; one minute hand 14 deg off).
- gpt-image-2 labelled science diagrams (`diagrams-images-image-probe.mjs`, 12 images, one rater): spelling EN 32/32, HI 31/32; leaders on the right part EN 31/32, HI 27/32; fully correct EN 4/6, HI 1/6; 3/3 circuits drawn with an open switch when "closed" was asked; VLM OCR passed the one corrupted glyph (1/1 false pass); text-free bases 4/4 clean. Low quality $0.0059 / 16-22 s; medium $0.0527 / 39-43 s.
- Sora 2 on Azure (`animation-video-sora-probe.mjs`, n=3 clips, 4 s 720p): 51-57 s each, 2-3 Mbps; 1/3 fully correct (count wrong, germination wrong, shadow right); text 2/2.
- Chant TTS (`songs-chant-probe.mjs`, 4 arms x 6 lines x 3 reps = 72 clips): Azure Speech Swara deterministic, 160 ms first byte / 297 ms total, table lines 12/12 phonetically right (hand-coded from ASR); gpt-4o-mini-tts "sing" held-note share 0.83 vs 0.80 plain (no measurable singing); ASR with language=hi returned non-Devanagari script for 7-9/15 mini-tts clips (Swara 1/15); ङ heard as म in every Swara condition.
- Teacher speech timing (`teacher-visual-sync-*.mjs`, 16 realtime turns, 60 digit anchors, Azure fast-transcription ground truth): transcript lead median 6.46 s, p10 0.94 s; audio_tokens = 20.00 per second in 15/16 turns; estimator L median 372 ms / p90 863 ms error, 35% within +/-250 ms; 400 ms pre-roll -> mark visible at word onset 86.7%, max 2.0 s early.
- Sandbox (`sandbox-probe.mjs`, headless Chromium 141): fraction-bars@1 first engine DOM 46/119/148 ms at 1x/4x/6x CPU (n=10); ~1.0 MB heap per frame; round trip p90 <= 11.2 ms; WebView-like (no site isolation) 1,500 ms frame busy loop froze host 1,501-1,503 ms (n=9).
- Caveat: small n everywhere; desktop/US-container numbers are proxies until the reference-phone device lab (V15) and India-latency runs.


<!-- merged from inbox/factory.json -->
## claude-deployments-404-2026-10-02
**Do the Claude deployments named in the Forge workflow brief exist? No.** (2026-10-02, 17:51Z)
- Method: `docs/research/factory/factory-synth-model-probe.mjs` from the US build container: one POST per deployment to `https://<account>.services.ai.azure.com/anthropic/v1/messages` (`x-api-key` = the resource key, `max_tokens` 8), plus a control POST to `<AZURE_OPENAI_ENDPOINT>/responses` for `taxila-codex`. Output: `factory-synth-model-probe-2026-10-02.json`. n = 1 per deployment.
- Results: `taxila-opus` 404 DeploymentNotFound (571 ms); `taxila-sonnet` 404 DeploymentNotFound (606 ms); `taxila-codex` 200 (2.4 s) with `x-ratelimit-limit-tokens: 500000`, `x-ratelimit-limit-requests: 5000`. Same key and account, so the 404 means no deployment, not bad credentials. Replicates the 15:33Z LG review probe (taxila-opus 404).

## kit-census-2026-10-02
**What the teaching kits actually contain for Forge.** (2026-10-02)
- Method: Python over all 23 `data/kits/c*.json` files: count topics, `misconceptions[]`, `items[]`, and items whose `verified.agrees === true`.
- Results: 565 topics; 1,691 misconceptions (3 per topic, including English and Hindi kits); 7,385 items; 1,653 verified-agree (22%) in c1-maths, c3/c4/c5-evs and c6-science; 3 disagreements; 5,729 items have no `verified` field, including every fraction topic in c4-c7 maths.
- Consequences: Forge answer truth for fractions comes from KitMath recompute, not the blind solver; "top-3 misconceptions per topic" is buildable from kits (this corrects multimodal-orchestration review R3, which counted `data/curriculum/`, where nodes carry <= 2).

## forge-azure-capacity-2026-10-02
**Azure capacity facts that bind Forge, consolidated from same-day probes.** (2026-10-02)
- codex (taxila-codex, gpt-5.3-codex): 500k TPM / 5000 RPM per 60 s (headers; n = 7 calls across two probes). Turn latency on a 10.9k-token prefix writing one ~40-line file: low 3.3 s, medium 4.3-6.5 s, high 10.9 s (n = 1 per cell; `llm-game-generation-review-probe-2026-10-02.json`). Prompt caching: 1 of 3 warm calls hit without `prompt_cache_key`, 5 of 5 with it (10,624 of 10,804 tokens cached); `remaining-tokens` dropped by the full prompt on cached calls, so the limiter appears to count cached tokens (inference, n = 6).
- taxila-image (gpt-image-2): three n=4 low generations 1 s apart, all 200 in 16.9-21.3 s, `x-ratelimit-remaining-requests` 3 -> 2 -> 1: the 4 RPM quota counts requests, so 16 images/min (`asset-pipeline-review-probe-2026-10-02.json`, n = 3 requests, 12 images).
- Live fill latency anchors (from content/genui-reliability and video-animation-gen review): T1 spec on taxila-fast 1.88 s p50 / 2.05 s p90 (n = 10, 10/10 valid); scene@1 template 3.08 / 3.35 s (n = 8); explainer@1 template 3.47 s p50, max 3.73 s (n = 6; 2/6 broke segment limits).
- All from the US build container; India RTT not included.


<!-- merged from inbox/conductor.json -->
## conductor-substrate-pg16-2026-10-02
**Functional check of the Conductor SQL substrate in CONDUCTOR.md §2.4, §3.1, §3.8, §3.9, §4.10.3, §8.3 (2026-10-02).**
Method: `001_core.sql` + the CONDUCTOR.md DDL and functions applied to a scratch local PostgreSQL 16.14 (Ubuntu package, default config). Then scripted SQL cases, plus two two-session concurrency cases using `pg_sleep(2)` inside an open transaction. n = 1 run per case. This is a correctness check, not a performance number. Database dropped afterwards.
- Idempotent ingest: duplicate `idem_key` → `ingest_event` returns null and adds no row.
- `fire_wakeups`: 2 due + 1 future wakeup → 2 `clock.wakeup` events (seq 2, 3); a second call fires 0; orphaned fired wakeups = 0 (I-R2).
- `complete_job`: wrong attempt (zombie) → false. ok → `done` + one `job.done` event; repeat → false. `cancel_requested` → `cancelled`, no event. Exhausted retries → `dead` + `job.failed`. A child workspace in `erasing` → `cancelled`, 0 events (erasure fence).
- Caps: a third 5-min reserve against a 12-min `conductor_usage` cap updates 0 rows. A p1 admission needs 2 tokens and a p0 reconnect takes the last one. A third learning `notify_slot` for the same week is refused. A stale-version CAS updates 0 rows. Child erase cascades `student_event`, `job`, `wakeup`, `child_seq`, `notify_slot` to 0.
- Concurrency: an ingest started 0.5 s into another child-transaction's open ingest blocked until that commit (≈ 1.5 s) and received seq + 1 (I-R1, commit order = seq order). The commit's `update child_seq … returning last > cursor` issued during an in-flight ingest waited and returned has_more = true with `pending_since` kept (no lost wake-up).
- Defect found and fixed: orchestration review R2.3's `complete_job` set `run_after = case when retry then … end`, which writes NULL into a NOT NULL column on every non-retry outcome (it errored on the first successful completion). Fixed with `else run_after`.
- Lock order, part 1 (orchestration R10.1; `docs/research/conductor/orchestration-lock-order-probe.{sh,schema.sql,reset.sql}`; n = 5 per cell; `pg_sleep` widens the race window so each cell is deterministic). A commit that locks `child_seq` FIRST (CONDUCTOR.md revision 1) deadlocked 5/5 against `complete_job` (job -> child_seq) and 5/5 against `fire_wakeups` (wakeup -> child_seq). With `child_seq` LAST: 0/5 and 0/5. A `complete_job` that took `child_seq` first gave 0/5. With `child_seq` last, an ingest in flight during the commit made it wait and return has_more = true (n = 1).
- Lock order, part 2 (synthesis revision-2 pass, 2026-10-02; `docs/research/conductor/conductor-lock-order-rev2-probe.{sh,extra.sql,reset.sql}` on top of the part-1 schema; fresh scratch PG 16.14 cluster, n = 5 per cell, about 55 s). Controls: `child_seq` first vs `complete_job` and vs `fire_wakeups`, 10/10 deadlocks. The revision-2 commit (CAS conductor_state -> job -> wakeup -> child_seq -> lease decision on the held state row) gave 0/5 in each of 8 cells, 0/40 in total. The cells: vs `complete_job` and vs `fire_wakeups` with each side first; vs a `create_commitment` holding `child_seq` as its mutex; vs an in-flight ingest; and one ticker batch over 2 children racing 2 concurrent commits. `has_more` was true in 20/20 runs where an ingest committed or was in flight before the commit's `child_seq` update. Fired wakeups equalled `clock.wakeup` events in every run. A first attempt at part 2 was invalid: the probe's `has_more` statement had a SQL syntax error, so the commit aborted before locking `child_seq`. It was caught by reading the output and re-run. Not covered: the parent API under load, and the real cascade delete.
