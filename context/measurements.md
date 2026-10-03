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

## model-bakeoff-BC-2026-10-02
**Teacher-reply (B) and answer-classification (C) bake-off across 11 Azure-billed Foundry models, 2026-10-02.**
Method: `evals/model-bakeoff.mjs B` / `C` from the US build sandbox. B: system prompt = Asha teacher brief with
turn-shape rule last; 6 scripted Hinglish child turns (n=6 per model). C: classify 12 hand-labelled child answers
vs a verified key (1/4 vs 1/2 item; includes 3 misconception cases) with JSON output (n=12 per model).
B scores are SHAPE only (latency, words, ends-with-question, crude Hinglish ratio, answer leak) — not teaching
quality; quality judging is in the voice-and-model-routing workflow.

| model | B p50 | B words | B q-end | C acc | C p50 |
|---|---|---|---|---|---|
| taxila-fast (gpt-5.6-luna) | 1990 ms | 20 | 5/6 | 11/12 | 1632 ms |
| taxila-brain (gpt-5.6-sol) | 2094 | 17 | 5/6 | 11/12 | 1394 |
| taxila-codex (gpt-5.3-codex) | 1796 | 25 | 6/6 | 11/12 | 1778 |
| DeepSeek-V4-Flash | 1386 | 39 | 4/6 | 11/12 | 667 |
| **taxila-ds41 (DeepSeek-V4.1-Flash)** | **1156** | 23 | **6/6** | 11/12 | 814 |
| **DeepSeek-V4-Pro** | 1439 | 28 | 5/6 | **12/12** | 822 |
| taxila-kimi-code (Kimi-K2.7-Code) | 5592 | 15 | 2/6 | 11/12 | 2296 |
| taxila-oss120 (gpt-oss-120b) | 945 | 17 | 5/6 | 0/12 (JSON output unparsed — harness/format issue, not judged) | 1394 |
| taxila-grok46 (grok-4.6) | 51040 | 17 | 5/6 | 12/12 | 14664 |
| grok-4-1-fast-non-reasoning | 986 | 26 | 1/6 | 11/12 | 533 |
| Mistral-Large-3 | 5043 | 40 | 1/6 | 12/12 | 907 |

No model leaked the answer in B. Reading: DeepSeek-V4.1-Flash is the strongest live-reply candidate on shape+speed
(1.2 s vs 2.0 s for the current taxila-fast); DeepSeek-V4-Pro / Mistral-Large-3 top classification. n is small
(6/12); treat as direction, confirm with quality judging before switching the router.

## cascade-latency-2026-10-02
**Cascade voice lane latency (child speech end → teacher first byte), evals/cascade-latency.mjs, 2026-10-02.** n=6-8 turns
per run, synthetic child speech (gpt-4o-mini-tts), WebSocket STT, API in the US sandbox against Neon over HTTP.

| run | endpoint | STT | Director | TTS 1st byte | total median (p90) |
|---|---|---|---|---|---|
| first build | 1095 | 318 | 4417 | 384 | 6365 (8710) |
| after fixes + speculative replies (taxila-fast) | 1063-1086 | 320-339 | 2405-3341 | 350 | 4230-5193 |
| DEPLOY_REPLY=taxila-ds41, DEPLOY_CLASSIFY=DeepSeek-V4-Pro | 1096 | 310 | 3813 (6108) | 485 | 5682 (7966) |

0 turns met the 2.0 s budget in any run. The Director stage makes 2-3 sequential model calls (classify → reply →
guard rewrite); swapping to faster open models does NOT fix it (each call ~1.0-1.6 s, still serial). Structural fix
needed (single combined call / streamed guarded reply / parallel classify+reply). Endpointing (900 ms silence) is
the second-largest cost and is a deliberate child-pause choice (`voice-turn-config`).


<!-- merged from inbox/cascade-fix.json -->
## cascade-latency-2026-10-02
**Cascade lane, child's speech end → first TTS byte (`evals/cascade-latency.mjs`, 2026-10-02, n=8 turns per arm, one lesson per arm, class 4, topic c4-maths-ch01-t01).**
Method: synthetic child speech (gpt-4o-mini-tts "shy 9-year-old" + ×1.2 pitch shift) streamed in real time into the same transcription session the browser gets (server VAD 0.6 / 900 ms / prefix 300, near_field, logprobs) over the **WebSocket** transport (the browser uses WebRTC); API in-process on the sandbox with Neon over HTTP (~0.3-0.4 s per query from the sandbox, far worse than an in-region pg pool); tts-stream over loopback (no mobile link). `sound` adds the player's 60 ms START_LEAD and a NOMINAL 50 ms output latency (not measured).

| arm | endpoint | stt | director | tts | total (first byte) | sound | ≤2.0 s |
|---|---|---|---|---|---|---|---|
| baseline: mode text, sequential classify → reply | 1095 | 318 | 4417 (p90 6556) | 384 | 6365 (p90 8710) | — | 0/8 |
| mode cascade, TAXILA_SPECULATE=0 | 1078 | 306 | 4244 (p90 5532) | 391 | 6066 (p90 7625) | 6176 | 0/8 |
| cascade, speculation ×2 (correct/incorrect) | 1080 | 330 | 3584 (p90 4342) | 350 | 4945 (p90 6085) | 5055 | 0/8 — 5/8 hit |
| cascade, speculation ×3 + one-query turn auth | 1076 | 292 | 2886 (p90 3809) | 629 | 4957 (p90 5596) | 5067 | 0/8 — 7/8 hit |
| final: + one-query tts-stream auth | 1086 | 320 | **2405** (p90 3229) | 350 | **4230** (p90 5018) | 4340 | 0/8 — 6/7 hit |

All medians ms. Stored child rows in every cascade arm: 8/8 with asr_conf set and meta.typed=false (read back from Neon); in the final arm a conf 0.464 turn was gated (`no_evidence/asr`) instead of graded. Speculation misses: the classifier's model added `offTopic` or a hint-level change the speculated outcome did not have (debug.speculation.differs). Director remainder after speculation = the reply call (1.2-2.0 s, effort none) + an occasional guard rewrite (+1.3-1.8 s) + ~0.5 s of Neon round trips from the sandbox. Caveats: synthetic speech, one topic, n=8, sandbox network; not a child's phone in India.

## cascade-2s-budget-unreachable-at-900ms
**2.0 s from speech end to her first sound is not reachable at 900 ms silence.** Endpoint (true speech end → server VAD speech_stopped) measured 1032-1146 ms in 32/32 turns across the four arms; STT completion +225-504 ms; first TTS byte +56-765 ms (cache hits low). That leaves ≤ 0.3 s for the Director, whose best measured turn is 1.9 s (one reply call alone is 1.2-2.0 s). Either re-baseline the budget (≈ 3.5-4.5 s measured; children answer ~1.5x slower and a beat reads as patience — learning-science §1.10) or measure a shorter silence on real children (voice-turn-config's reversal condition) — not decided here. Not tried yet: streaming the reply's first sentence into tts-stream before the guards see the whole reply (the leak/drift/hand-back guards read the full turn, so this needs a per-sentence guard design), and a speculative Director start at speech_stopped from live-transcribe partials.

## cascade-local-bargein-2026-10-02
Local barge-in timing, `tests/voice-cascade.test.mjs` (Node, fake AudioContext, MicVad polling a fake analyser every 20 ms, -20 dBFS step onset over a silent room; n=1 per run, timer-jitter bound): duck 83 ms, pause 104 ms after voice onset (budget 150 ms). EnergyVad frame math with defaults: onset ≤ 100 ms, sustain ≤ 140 ms; a 100 ms cough ducks but never pauses. NOT measured on a device: real AGC/AEC input, Android WebView, phone speaker echo — `bargeStats` on /dev/lesson (serverStartsWhilePlaying, localUnconfirmed, resumedEcho) is the counter to read on that device run, with and without the "cascade via <audio>" option.

## cascade-pcm-throttle-sim-2026-10-02
Simulation only (PcmStreamPlayer + fake clock, 4 s replies, 1 Mbit/s, 150 ms RTT + 300 ms server first byte, n=3 replies per profile): steady link and stalls after ≥0.4 s → 0 gaps (the stream arrives 2.6× faster than playback, buffer builds); a 250 ms stall 80 ms into the reply → gaps 158 / 119 / 79 ms as the adaptive start lead grows 60 → 100 → 140 ms. Not measured on a real 3G/4G link.


<!-- merged from inbox/game-stealth.json -->
## game-stealth-sim-2026-10-02
numberline-jump pack, 4 pads (key, add-across, whole-number-ish, filler), 4 levels, n=20,000 simulated players, seed 7, docs/research/comprehension/game-stealth-sim.mjs. Naive filler: second-smallest-pad policy 1.00 first-try / 1.00 pass-3-of-4 in both authored and shuffled layouts; first-slot policy 1.00 authored, 0.249 shuffled. Rank-balanced filler + shuffle: second-smallest 0.445 / 0.236 (chance 0.25 / 0.05). Posterior under LEARNER-MODEL rules from pL0=0.39: 8 probe.predict-right at w=0.5 -> 0.568 (w=1 -> 0.73); 4 predictions + 1 far transfer at w=0.5 -> 0.76; 4 predictions + 1 full teacher why -> 0.893. Model only; no children.


<!-- merged from inbox/kits-c2-hindi.json -->
## kits-c2-hindi-authored
**data/kits/c2-hindi.json: 26 of 26 curriculum topics (सारंगी, NCERT 2026-27), 307 items (min 11, max 12 per topic, min 7 distinct kinds), 4-5 skills and 2-3 misconceptions per topic.** (2026-10-02)
- n: 26 topics / 307 items. Method: build script ran normalizeKit() (server/content/kits.js) on every topic and kitFromFile() on the written file; 0 items dropped, 0 diagnostics dropped, 0 hints replaced (15 leaking hints were rewritten before writing). All passages and poems are original (no NCERT text). Answer keys are NOT yet blind-solver verified (no verified field).
- Kahani topics are T3/F4, kavita and khel-geet are T1/F5.

## norm-strips-devanagari-matras
**server/director/items.js norm() keeps only \p{L}\p{N}; Devanagari matras, anusvara, chandrabindu and nukta are \p{M}, so they are replaced by spaces. Measured: norm("दादी")===norm("दादा"), norm("पीला")===norm("पिला"), norm("मूली")===norm("मुली"), norm("बैंगन")===norm("बेंगन") are all true.** (2026-10-02)
- n: 5 pairs tried by hand, 4 collide (चाँद/चद did not, because the letter count differs). Method: node one-liner calling the exported norm().
- Effect: on any Hindi-language item whose skill IS the matra (ि/ी, ु/ू, े/ै contrasts), a wrong answer that differs only by a matra would match the key, and revealsAnswer() splits Devanagari words at every matra. Fix direction: add \p{M} to the kept classes in norm() (and wordsOf), then re-run the kit lint. Not fixed here; this workflow only authors kits.


<!-- merged from inbox/kits-c3-hindi.json -->
## kits-c3-hindi-authored
**data/kits/c3-hindi.json: 18 of 18 curriculum topics (वीणा, NCERT 2026-27), 216 items (12 per topic, 7-10 distinct kinds), 4-5 skills and 3 misconceptions per topic.** (2026-10-02)
- n: 18 topics / 216 items. Method: build script ran normalizeKit() (server/content/kits.js) on every topic and kitFromFile() on the written file. 0 items dropped, 0 diagnostics dropped, 0 hints replaced. 24 hints leaked before writing and were rewritten; most leaked because they quoted a Roman or English acceptable form (swing, gift, hawa). All passages, poems, letters and plays are original; folk-tale plots (Birbal, the clever jackal, the talking den, the farmer and the bear) are retold in new words. Answer keys are NOT yet blind-solver verified (no verified field).
- Kavita and khel-geet are T1/F5. Kahani, samvad, ekanki and jeevani are T3/F4. The patra topic (ch07) is T4/F2.
- Matra-contrast items (ि/ी, ु/ू, ै/े, ँ, ड/ड़) are still affected by norm-strips-devanagari-matras.


<!-- merged from inbox/kits-c5-hindi.json -->
## kits-c5-hindi-authored
**data/kits/c5-hindi.json: 12 of 12 curriculum topics (वीणा, NCERT 2026-27), 158 items (13-14 per topic, 10 distinct kinds), 5 skills and 3 misconceptions per topic.** (2026-10-02)
- n: 12 topics / 158 items. Method: build script ran normalizeKit() (server/content/kits.js) on every topic, revealsAnswer() on hint rungs 1-3, and kitFromFile() on the written file; tests/kit-budget.test.mjs passed. First pass: 9 items dropped by checkFits because their prompt carried the whole passage (370-544 Devanagari chars; about 340 is the ceiling measured by bisection on one item), and 6 hints leaked. Fix: each passage was split into excerpts quoted in the item that needs them. Final: 0 dropped, 0 diagnostics dropped, 0 hints replaced. All passages, poems and the play scene are original. The three-fish fable and the animal-walks-home test are folk motifs retold in new words. Facts in the yatra and atmakatha topics (Kaziranga, Ajanta/Ellora/Konark, the course of the Ganga, Sangken) were written from general knowledge and have not been checked against the chapter text. Answer keys are NOT yet blind-solver verified (no verified field).
- Kavita topics are T1/F5. Kahani and ekanki topics are T3/F4. Sansmaran, yatra and atmakatha topics are T2: ch07 uses F4, and ch08, ch11 and ch12 use F3 (map or picture first).
- The content of ch05 (सुंदरिया) and ch09 (न्याय) was written on the theme only, because the chapter plots were not available. The kit must not be presented as a retelling of either chapter.


<!-- merged from inbox/kits-c6-english-reauthor.json -->
## kits-c6-english-reauthored
**data/kits/c6-english.json re-authored against the NCERT Poorvi 6 unit PDFs fepr101-105 (Reprint 2026-27): 16/16 topics, 248 items (14-16 per topic, 8-10 kinds), 5 skills and 4 misconceptions per topic (64 in all).** (2026-10-02)
- n: 16 topics / 248 items / 64 diagnostics. Method: text extracted with pdftotext; the 'Rama to the Rescue' comic pages (pp. 21-25) were rendered to PNG and read, because their text is image-only. Every chapter-dependent key was checked by the fixer against that text, and each item's verified.note says what it was checked against. These are fixer checks, NOT fresh blind solves, so a second independent solver pass is still owed. normalizeKit plus revealsAnswer were run per topic. tests/kit-budget.test.mjs was pointed at a directory holding only this file: 3/3 pass, 7,104 lesson states compiled, 0 items dropped, 0 diagnostics dropped, 0 hints replaced. In the full `npm test` the only failure (1 of 314) is c7-english-ch03-t01-i07 (361 > 360 tokens), which is another kit.
- Also fixed: all 50 previous diagnostics were rebuilt so that each has exactly one correct option; diagnostic prompt_hi no longer adds cues the English prompt lacks; skill titles now match the real poems (ch08 ABCB, ch11 free verse, ch05 AABB couplets, ch14 'like coloured birds', ch16 eternal flame); ch03's theme is presence of mind. Still open: data/curriculum/c6-english.json gives ch03's theme as 'helping someone in trouble', which does not match the book.


<!-- merged from inbox/kits-c6-hindi.json -->
## kits-c6-hindi-authored
**data/kits/c6-hindi.json: 13 of 13 curriculum topics (मल्हार, NCERT 2026-27), 172 items (13-15 per topic, 9-10 distinct kinds), 4-5 skills and 3 misconceptions per topic.** (2026-10-02)
- n: 13 topics / 172 items. Method: a generator script built the file. normalizeKit() and revealsAnswer() were then run on every topic, and tests/kit-budget.test.mjs passed (3/3). First pass: 21 hint rungs leaked an acceptable form, mostly a short Roman variant or a Devanagari stem. They were rewritten. Final: 0 items dropped, 0 diagnostics dropped, 0 hints replaced.
- No NCERT text is reproduced. Every quoted line, stanza, doha-line and passage is original. Facts about the chapters (the plots of हार की जीत and परीक्षा, the Dhyanchand head-injury incident, Sattriya/Sankardev/Bohag Bihu, Mauritius and the girmitiya, Chetak/Haldighati, Surdas pad excuses) were written from general knowledge and have NOT been checked against the chapter text. The Rahim items paraphrase his best-known dohe (प्रेम का धागा, तरुवर फल, सुई-तलवार), which may not all be in Malhar. The मेरी माँ topic stays at the genre and values level, because the excerpt details were unavailable.
- Kavita, doha and pad topics are T1 with primary F5. Kahani, sansmaran, atmakatha, nibandh and yatra topics are T3 with primary F4 or F1; F5 is never used on them. Answer keys are NOT yet blind-solver verified (no verified field).


<!-- merged from inbox/kits-c8-hindi.json -->
## kits-c8-hindi-authored
**data/kits/c8-hindi.json: 10 of 10 curriculum topics (मल्हार, NCERT 2026-27), 131 items (12-14 per topic, 9-10 distinct kinds), 5 skills and 3 misconceptions per topic.** (2026-10-02)
- n: 10 topics / 131 items. Method: a generator script built the file. normalizeKit() and revealsAnswer() were run on every topic, and tests/kit-budget.test.mjs passed 3/3 with only this file in the kits dir (3624 lesson states compiled, 0 BudgetError). First pass: 5 hint rungs leaked an acceptable form (English glosses such as feminine, tradition, clean environment, plus a nukta form that the matra-stripping norm reduced to ज). One acceptable form was over 60 chars. All were rewritten. Final: 0 items dropped, 0 diagnostics dropped, 0 hints replaced. The full-repo run of kit-budget still fails, but on other files (107/10600 items dropped repo-wide, and c9-english-ch08-t01-i04 is over the voice cap). c8-hindi contributes 0 to either failure.
- No NCERT text is reproduced. Every stanza, scene and passage is original. The exceptions are Kabir dohas, which are public domain and widely known; they may not all be in Malhar. Chapter facts were written from general knowledge and have NOT been checked against the chapter text. These are: the स्वदेश stone-heart image, the father-and-sparrows arc in दो गौरैया, the blessing images in एक आशीर्वाद, the widow-and-basket plot in एक टोकरी भर मिट्टी, the room-to-universe chain in आदमी का अनुपात, and Bose addressing the youth. मत बाँधो and नए मेहमान stay at the genre, title and theme level, plus original stanzas and scenes, because the chapter details were unavailable. Kavita and doha topics are T1 with primary F5. Kahani, patra, ekanki and udbodhan topics are T3 with primary F4. Answer keys are NOT yet blind-solver verified (no verified field).


<!-- merged from inbox/ui-a-shell-parent-fix.json -->
## parent-gate-e2e-2026-10-02
`NODE_USE_ENV_PROXY=1 node tests/parent-gate-e2e.mjs` against Neon, one run, 35/35 PASS: onboarding PIN set → overview 403 {gate:'locked'}; consent/add/edit-class/delete/controls 403 once a PIN exists, avatar PATCH 200; parallel burst of 8 wrong PINs → 4 'wrong PIN', 1 lockout, rest wait/429 (pre-fix all 8 would read the same `failed`); burst of 7 wrong passwords → 0 checked (all saw count > 5); reset pending → new PIN refused until delay, cancelled by current PIN, applied after (delay forced via SQL). Playwright (Chromium, dev server, 360x640) walk 12/12: consent rows each have a speaker, handover locked, child at /parent meets PIN pad, browser Back out of corner → 403, /who 'Add a child' and post-setup /start/consent gated, P6 comfort saved via P7. Read-aloud: GET /api/parent/speak consent row → 200 audio/mpeg 172 KB (Azure gpt-4o-mini-tts), cached repeat 53 ms. (2026-10-02)


<!-- merged from inbox/voice-features-fix.json -->
## voice-features-wired-2026-10-02
**Voice features now reach the server from real lessons.** Before: `voice_feature` held 0 rows; nothing outside src/voice/ constructed VoiceFeatures. Now LessonRuntime attaches VoiceFeatures to the link's own mic (`TeacherLink.micTap()`: CascadeLink teacherEnd=local, VoiceLink teacherEnd=remote), feeds it every link event first, and a spoken child_final's features ride on that turn's POST /api/lesson/turn (`TurnRequest.voiceFeatures`); the handler runs `turnVoice()` in parallel with classify, under the server's activeItemId. (2026-10-02)
- n: 1 live Neon round trip (114 ms, row stored with item_id, then deleted); browser smoke (tests/voice-features-browser.test.mjs, VOICE_BROWSER=1): real runtime + CascadeLink in PTT-recording fallback, fake mic tone → 1 turn request, features numbers only, f0 240.02 Hz. Signals are returned in turn debug only: the Director does not consume them yet (server/director/** not this workstream's).

## voice-features-onset-one-clock
**Onset latency is computed in one clock.** Chunks stamped `now − (ctx.currentTime − chunkTime) − track input latency`; teacher end = receipt + ctx.outputLatency (read live, so speaker↔Bluetooth switches are followed); realtime lane holds the server's output_audio_buffer.stopped until the local teacher meter has been quiet 150 ms. (2026-10-02)
- n=5 trials, Chromium headless, oscillator gated 700 ms after a teacher_audio_end: 630, 647, 647, 646, 645 ms vs expected 668 (700 − outputLatency 32). Residual −21..−38 ms is the 40 ms analysis window's centre (a frame reads as speech when half-filled). Not measured: real Android/Bluetooth devices; input latency from getSettings().latency is 0 in headless Chromium.

## voice-signals-null-fire-rate
**Averaging correlated cue pairs cuts null false fires.** Monte Carlo n=40,000 under N(0,1) z with (pauseFrac,longestPauseMs) and (speechRate,articulation) correlated ρ=0.8: max/min-of-pair 5.71% followUpProbe / 0.56% gentlerHint / 1.13% slowerPace → mean-of-pair 3.54% / 0.25% / 0.37%. (2026-10-02, tests/voice-features-server.test.mjs)

## voice-rms-is-agc-output
**rms* features are AGC-normalised.** Both links capture with echoCancellation+noiseSuppression+autoGainControl; rmsMeanDb/rmsStdDb/rmsP90Db therefore describe the AGC output. rmsMeanDb removed from BASELINED (no z, no baseline); still stored. Soft fillers may be eaten by noise suppression (weakens flatVoicedRuns) — unmeasured. Reversal: a second, unprocessed analysis track measured to not disturb the AEC'd capture on Android. (2026-10-02)


<!-- merged from inbox/voice.json -->
## voice-research-probes-2026-10-02
**gpt-realtime-2.1 (taxila-realtime) behaviour and voice/ASR instrument probes, 2026-10-02, US container -> eastus2, text-in unless noted. Directions only; single coders; small n.**
- human-likeness probe (28 responses, 15 sessions, audio out re-transcribed): bracketed laugh direction in 4/4 transcripts, voiced per ASR in >=2/4 (ear pending); AI-identity truthful 12/12 (= n=6 sessions on a leading stimulus); 1/12 attachment promise (arm with the identity rule); 0 fillers in 28 turns; 6/8 praise/agreement openers incl. after a misconception (stub prompt); median TTFA 834 ms.
- character probe (360 responses, 6 arms x 2 scripts x 3 sessions, real compile()): kinship self-reference 0/36; a name in the self-note gave speaker labels 12/54 vs 0/54 without; director labels spoken in 10-20/54; floor phrase recited 22/33 at the attachment turn; 0/33 warmth-first boundaries; late cue: distinctness 9/18 -> 14-15/18 but English-dominant turns 11% -> 46-70%; cache 77.8% (static director state).
- relational probe (108 sessions, 12 moments x 3 arms x 3 samples, single coder, ~350-word prompt): violations A 20/36, B (mid-brief shape notes) 1/36, C (+ oracle move via response.create) 1/36; own-it note: false confessions 2/3 in B (C instructed 3/3); side effects masculine verbs 9/72, English-only 8/72, spoken planning 3/72, >25-word turns 3/66 -> 8-10/66.
- attunement probe (84 calls): audio-in same words bright vs near-tears 0/18 check-ins, 31/36 praise openers (synthetic, inconclusive); text-in notes 3/3 vs 0/3 on boredom, frustration and excitement; thinking-aloud filled with a hint 3/3 (no notes) and 2/3 (notes); unverifiable safety assurance 2/3 without notes; median TTFA 1083 ms.
- voices-hindi (221 clips, 44 arms, n=5/arm): first audio azure-realtime 476 ms, gpt-realtime-2.1 native 776 ms, Voice Live + Azure voice 858 ms, gpt-4o-mini-tts streamed 283 ms; every arm key-term recall >= 0.92 (ASR cannot rank voices); unhinted ASR wrote non-Devanagari script for 6/40 native-OpenAI Hindi clips vs 0/84 Azure Indian (single pass, observation only); raw loudness spread 16 LU.
- ASR E0 (1515 calls, synthetic child TTS pitch-shifted, clean/child/10 dB TV/silence): gpt-live-transcribe + keywords + script-only prompt skeleton CER 0.043, answers 14/15, 0/3 output on near-silence (upper bound wide); gpt-4o-transcribe text on near-silence 5/5 in every config; Azure Fast phraseList no effect for hi-IN (126 clips); 10 dB TV CER >= 0.56 on every engine.
- Method and raw data: docs/research/voice/{hl-probe-2026-10-02,characters/probe-2026-10-02,relational-probe-2026-10-02*.json,attune-probe-2026-10-02*,probe-2026-10-02-results.json,asr-e0}.


<!-- merged from inbox/comprehension.json -->
## comprehension-mc-2026-10-02
**Matched-model Monte Carlo of the comprehension engine, 2026-10-02.** Method: `node docs/research/comprehension/comp-engine-calc.mjs` (seed 7), output `comp-engine-calc-2026-10-02.json`. n = 20,000 simulated children per truth type (not_yet, shallow, fragile_bound, fragile_forgets, understood), answers drawn from the real launch emission tables in `server/learner/kt/outcomes.js` with LLM grader diagonal 0.7 (or 0.55 true vs 0.7 assumed), K updated with the real `bktr.js` spend/transition. Adaptive policy: 2 code-graded items per concept-session (first one in sessions >= 2 = delayed check at R = 0.9), <= 2 U probes (why LLM, error-spot code, teach-back LLM, predict code), <= 1 T probe (near in session 1, far later).
- Overt quiz (4 items/session) + K-only mastery rule, 3 sessions: shallow -> understood 0.862; macro accuracy 0.431.
- Covert spec, 3 sessions: macro accuracy 0.639; shallow -> understood 0.001; worst false-understood 0.015; understood detected 0.407 (median 2.55 sessions when correct); 1.83 probes per concept-session.
- Same, 5 sessions: macro 0.698; worst false-understood 0.022; understood detected 0.595.
- Grader true 0.55 vs assumed 0.7: detected 0.373, worst false-understood 0.014.
- U only from LLM-graded why/teach-back: detected 0.238. Max 1 U probe/session: 0.067. U mainly from game predictions at w = 0.5: 0.122. Stop probing a facet read low: 0.206.
- Deterministic: 8 game predictions at w = 0.5 -> K 0.825, U 0.342 (shallow).
- Scope: answers come from the same tables the engine inverts (inverse crime): upper bounds, no children, independent latent bits, no in-session learning, no ASR noise.


<!-- merged from inbox/kits-c4-hindi-reauthored.json -->
## kits-c4-hindi-reauthored
2026-10-02. Input: a blind checker read the real NCERT Veena 4 chapter PDFs (dhve101-113, Reprint 2026-27) and found 56 of 176 items disagreeing. The source text was invented in ch01, 02, 03, 07, 10, 11 and 12 and partly invented in ch04, 05, 06 and 09. Examples: a dawn/neem-branch bird poem in place of the egg-nest-branches-sky poem; a butterfly in the rain in place of the snail leaving the garden through a hole in the wall; Gudiya at a fair in place of the Kananpur king's fake diamonds; Tinku and Dadi in place of Madan's nonsense poem catching Dhannu Shah; Meenu, Rahul and Dadaji in place of Tenali Raman's chess play. ch13 was accurate but its hints named characters (Didi, Chintu) who are not in the dialogue. Fix: ch01-07 and ch09-13 were rebuilt from the real chapter texts. ch08 (Onam) was kept, with 3 leaking hints and one over-long acceptable list repaired. Each rebuilt chapter was read against its PDF text before it was written. Facts, plot and names are paraphrased. Quotes are kept to short single phrases: the longest shared Devanagari run is 24 characters, a list of names or a muhavara, and every quoted run over 24 characters was reworded. Checks: the c4 build lint (skills 3-5, items 10-14, at least 5 kinds, exactly one correct option per diagnostic, revealsAnswer on rungs 0-2, and normalizeKit with 0 items dropped, 0 diagnostics dropped and 0 hints replaced) passes. tests/kit-budget leak and compile tests pass for c4-hindi; the one failure in that suite is a pre-existing c7-english item. Not covered: no second blind solver has run on the rebuilt items. The `verified` blocks are from the re-authoring pass, which read the text, so a fresh blind check is still worth doing. Sources: scratchpad c4/*.mjs plus build.mjs.


<!-- merged from inbox/open-tts-on-azure.json -->
## oss-tts-hindi-landscape
2026-10-02. Method: model cards + licences for 13 open TTS families; passage (b) synthesised on public HF ZeroGPU Spaces (Svara, VoxCPM2 voice-design, Chatterbox-Multilingual-hi and IndicF5 cloning the vendor demo prompt hi_f1.flac) and Veena on local CPU; n=1 clip per model; round-trip ASR with taxila-transcribe counting 10 English-term slots. Svara 10/10 (13.0 chars/s), VoxCPM2 10/10 (11.7), Chatterbox-hi 10/10 (12.2), IndicF5 0/10 (pizza->hezaa, Latin words garbled/dropped, 17.6 chars/s). Intelligibility only — naturalness unmeasured (OpenRouter judge budget exhausted). Full: docs/research/voice/v2/open-tts-on-azure.md.

## indicf5-last-in-indian-preference-study
arXiv 2604.21481: 5,357 sentences, 10 Indian languages, 120k+ pairwise comparisons, 1,900+ native raters, Bradley-Terry. Gemini 2.5 Pro TTS 1128.53 (win 70%), ElevenLabs v3 1056.28, Sonic 3 1050.83, Bulbul V3 Beta 1021.91, Speech 2.8 HD 993.94, GPT-4o-mini-TTS 942.76 (40%), IndicF5 805.75 (19%).


<!-- merged from inbox/stt-hinglish-v2.json -->
## stt-hinglish-v2-synthetic
2026-10-02, US container -> eastus2. 30 child-answer utterances (Hinglish 10, Hindi 8, English 7, hesitant 5) synthesised by gpt-4o-mini-tts (child-instructed) and Azure neural hi-IN/en-IN (pitch +25%, rate +12%), clean/white/pink at 10 dB SNR + 3 non-speech; 11 arms x 183 clips = 2,013 calls, one pass; deterministic skeleton scorer (Devanagari<->Roman normalised). cerNorm / numSeq(96) / answers(78): live-tx kw+script 0.026 / 92 / 76; live-tx no context 0.068 / 78 / 65 (19 wrong-script clips); Azure Fast hi+en 0.072 / 78 / 73; Azure RT LID 0.071 / 73 / 74; Azure RT hi-IN 0.116 / 70 / 74; Azure RT en-IN 0.063 cer but raw WER 0.65 (Hindi romanised); gpt-4o-transcribe hi+script 0.225 / 58 / 51; 4o-mini 0.302 / 52 / 47. Latency: first partial Azure RT ~1.0 s (LID 2.3 s), live-tx 1.4 s after onset; final live-tx 657/760 ms p50/p90 after commit, Azure RT 820-880 ms p50 after speech end; batch 262-355 ms. SYNTHETIC - instrument only. Full: docs/research/voice/v2/stt-hinglish.md.


<!-- merged from inbox/voice-v2-reference-judge.json -->
## voice-v2-ai-judge-proxy
2026-10-02. Method: 278 clips (183 Azure, 90 OpenRouter reference-not-for-production, 5 IndicTTS human anchors), uniform loudnorm/-24 LUFS mp3 re-encode, blind to name; judges gemini-3.1-pro-preview, qwen3.8-omni-flash, gpt-audio via OpenRouter (experiments only). Headline = Gemini-Pro (only judge catching the American-accent control: native 2.4, leak 80%; test-retest Spearman 0.94, n=26). Composite: Gemini-3.8-flash-tts with director note 5.00; MAI-Voice-2.1 HD Priya 4.85; DragonHD Diya 4.70; MAI Flash Dhruv 4.65; Gemini Sulafat no note 4.45; other MAI 3.5-4.1; human anchor 3.25 (scale is not humanness). Azure leaders tie Gemini on native/Hindi (5.0, 0 leak) and trail only on naturalness. Coverage PARTIAL: 100 Azure clips (most en-IN DragonHD, omni, 4o-mini-tts, Swara) unrated — key cap. Possible judge self-family bias (Gemini TTS 4.94 vs others 3.57). Proxy only; human blind test decides. Full: docs/research/voice/v2/judge-summary.md.


<!-- merged from inbox/open-tts-on-azure-followup.json -->
## oss-tts-hindi-landscape-v2
2026-10-02. Supersedes oss-tts-hindi-landscape (that entry was logged before the Veena, Chatterbox V3 and IndicF5-Devanagari clips finished). Method unchanged: passage (b), one clip per model, round-trip ASR with taxila-transcribe, 10 English-term slots. Veena kavya (local CPU bf16, sentence-wise) 10/10, 14.4 chars/s; Svara 10/10 (13.0); VoxCPM2 10/10 (11.7); Chatterbox-Multilingual-hi 10/10 (12.2); Chatterbox V3 10/10 (13.1, possible inserted 'yaani'); IndicF5 0/10 with Latin-script English (17.6 chars/s, words dropped) and 10/10 with the same words transliterated to Devanagari (13.9). Consequence: the IndicF5/F5 family needs a Latin->Devanagari pass in the spoken-notation normaliser. Intelligibility only; naturalness unmeasured. Clips: docs/research/voice/v2/samples/oss-*.mp3; report docs/research/voice/v2/open-tts-on-azure.md.

## snac-82-tokens-per-audio-second
2026-10-02. Veena (maya-research/Veena, SNAC 24 kHz, 7 tokens/frame) on passage (b), 5 sentences: 308/217/511/308/476 tokens for 3.75/2.65/6.23/3.75/5.80 s = 82.1 tokens per audio second. Method: count of generated audio-code tokens vs decoded sample length. A real-time stream therefore needs >=82 tok/s of decode, with headroom ~1.5x.


<!-- merged from inbox/hindi-kits-open-flags.json -->
## hindi-kits-open-flags (2026-10-02)
n=2,688 items across c1-c9 Hindi (workflow wf_bc812b62-cb1, blind solve then fix). Disagreements per class: c1 3, c2 1, c3 13, c4 59, c5 12, c6 9, c7 15, c8 5, c9 28; all fixed except c7 1, c9 3. The unfixed ones are NOT disputed keys (verified.agrees is true, so the loader serves them): loose acceptable answers (c5 गाय for बछिया, दर for द्वार), d1 recall hints that nearly give the answer (c8), an interviewer name unverifiable against the 2026-27 गंगा text (c9-hindi-ch04-t01-i01), and gloss drift between prompt_hi and prompt_en (c9 ch01 i10/i13). Correction: commit cee90ee says these items are dropped; they are not. Next: human check against the books.


<!-- merged from inbox/learner-upgrade-fix.json -->
## learner-fold-cost-2026-10-02
**fold() cost per online event, 2026-10-02, scratchpad microbenchmark (n = 500 folds after 200 warm-up) on a generated 4,800-event ledger (makeLog seed 41, 120 sessions, 92 KB JSON).** Whole-ledger structuredClone (before): 6.7 ms (reviewer's figure on a 4,378-event ledger). Copy-on-write of touched skills/epochs/session (after): 1.8 ms, of which 1.6 ms is the flat copy of `seen` (4,800 keys; Map clone would be 0.5 ms). Pruning `seen` to the open session gave 0.13 ms but broke TP1 re-delivery dedupe and comprehension/fuse.js, so it was not kept. Regression guard: tests/learner-order.test.mjs (< 4 ms).


<!-- merged from inbox/comprehension-build.json -->
## comp-sim-2026-10-02
**Comprehension engine simulator, 2026-10-02.** `node evals/comprehension-sim/run.mjs --seeds 30 --llm --llm-seeds 2` → `evals/comprehension-sim/results/comp-sim-2026-10-02.json` (code-played + first LLM leg) and `comp-sim-2026-10-02-llm-echo.json` (LLM leg with the echo guard). Method: 24 personas (personas.mjs) with hidden per-concept truth (K, U, T, keep, misconception) and behaviour (verbal, deference, shyness, guessing, game skill, answer-seeking, learning rates); 6 real kit topics (c5/c6 maths + science) over 5 sessions (days 0, 1, 2, 5, 6), 2-3 topics a session, weave hosting, openers, games, re-teach with truth flips. The REAL engine code runs; the child is a separate generative model, not the engine's emission tables, but its probabilities are author-set, so this gates **mechanics, not efficacy** (SIM6). n = 4,320 child-concepts per code-played policy.

| policy | macro acc final (after 3) | understood found | false mastery (shallow) | verbal gap pp | probes / concept-session | load / 10 turns | over cap |
|---|---|---|---|---|---|---|---|
| **engine** | **0.650** (0.567) | 0.578 | **0.017** (0.001) | 7.2 | 4.37 | 2.25 | 0 |
| no delayed probes | 0.567 (0.515) | 0 | 0 (0) | 29.5 | 3.62 | 2.34 | 0 |
| no game evidence | 0.648 (0.602) | 0.610 | 0.022 (0.001) | 12.9 | 4.39 | 2.20 | 0 |
| no voice features | 0.641 (0.571) | 0.580 | 0.021 (0.001) | 15.5 | 4.37 | 2.26 | 0 |
| T threshold 0.7 (sensitivity only) | 0.634 | 0.565 | 0.016 (0.001) | 13.7 | 4.38 | 2.25 | 0 |
| freeze-low (rejected control) | 0.646 | 0.595 | 0.020 | 11.4 | 4.35 | 2.25 | 0 |
| quiz-bot, K-only rule | 0.369 | 0.890 | **0.593 (0.822)** | 0 | 0 | **4.30** | 0.017 |
| samjha | 0.378 | 0.922 | 0.637 (0.916) | 0 | 0 | 2.55 | lexicon 8,640 hits |
| lecture | 0.363 | 0 | 0 | 0 | 0 | 2.39 | 0 |
| why-every-turn | 0.690 | 0 | 0 | 65.4 | n/a | **4.17** | **1.0** |
| **LLM-played leg, engine** (n=288) | 0.708 → 0.731 with the echo guard | 0.724 → 0.798 | 0.011 → 0.015 | 5.7 | 4.43 | n/a | n/a |

Engine by truth type (final): not_yet 0.723, shallow 0.801, fragile_bound 0.420 (0.308 read not_yet, 0.061 false understood), fragile_forgets 0.728, understood 0.578 (0.184 shallow, 0.238 fragile). Weakest archetypes: deferential understander 0.29 (the sim does not exercise the E9 deference discount), confident misconception 0.33 and correct-for-wrong-reasons 0.36 (both lag after a re-teach fixes the misconception), shy understander 0.48. Median time to detect understanding: 2 sessions of exposure, with 42% never detected within the window. **Bars:** CE-M1 ≥ 0.70 FAILS on the code-played sim (0.650) and passes on the small LLM leg (0.731). CE-M3 ≤ 0.05 / ≤ 0.02 shallow passes. CE-M4 ≤ 10 pp passes (7.2). CE-M5 ≤ cap passes, with 0 lexicon hits and 0 repeats. The controls land on the required side: quiz-bot fails M3 and M5, samjha fails M3 and the lexicon rule, lecture fails M1, why-every-turn fails M5, no-delay never certifies. Caveats: one sim family (bkt2-like bits, no cfrag); no ASR noise; the LLM child cannot convincingly play "not knowing" (it leaks the real reason), which flatters the LLM leg.


<!-- merged from inbox/prod-smoke-32090f6.json -->
## prod-smoke-32090f6 (2026-10-02)
Method: `scripts/prod-smoke.mjs` from the sandbox (adds a US-east round trip from the sandbox), against https://taxila-web…eastus2 rev taxila-web--s32090f6-ni3g, driver pg. Child class 5 Hinglish, topic c5-maths-ch01-t01, teacher Arjun, 3 canned child lines. n=1 lesson per mode, 3 turns each.
| mode | start | turns (ms) | end |
|---|---|---|---|
| text | 1,705 | 1,688 / 1,694 / 1,223 | 1,565 |
| cascade | 947 | 1,218 / 1,307 / 1,345 | 1,540 |
The cascade figure is the Director only: speech-to-text, the end-of-speech wait and TTS first byte add about 1.8 s, so the estimated end-to-end time is about 3.0-3.2 s against the 2.0 s target. Observed: replies carry numerals ('45,000', '62,314', 'one lakh seven thousand forty'), which notation-probe-2026-10-02 measured as misread 9-11/15 when sent to TTS as written. The spoken rendering is not built yet. Also observed: 'mujhe nahi pata' was answered with explain-then-new-question, not a reteach move; this needs a check against the Director's affect rules.


<!-- merged from inbox/conductor-db-race-run.json -->
## conductor-db-race-2026-10-02
Method: `node --test tests/conductor-db.test.mjs` from the sandbox, against Neon branch `conductor-test` (br-nameless-snow-b7ldeg1h, branched from production at LSN 0/681DE58, so all migrations through 007 are present). CONDUCTOR_TEST_DATABASE_URL is in .env.local only. n=1 run: 14 pass, 0 fail, 0 skipped. Covers idempotent and concurrent ingest, exactly-once timers, job lock and fence, the step lease, has_more and replay. The suite had been skipped since wave 2 because no test branch existed. Reset the branch from its parent when it drifts.


<!-- merged from inbox/cascade-latency-2.json -->
## cascade-latency-v2-2026-10-02
**Cascade lane latency pass (`evals/cascade-latency.mjs --turns 10`, 2026-10-02): child speech end → first TTS byte, pooled over 1-4 runs (one lesson each) per config, class 4, topic c4-maths-ch01-t01.** Same method and caveats as `cascade-latency-2026-10-02` (synthetic speech, WebSocket STT, API in-process in the US sandbox, Neon over HTTP, loopback tts-stream). Run-to-run spread of the SAME config is large (baseline medians 3449 / 3679 / 4499 ms), so configs are pooled; arms after the first few ran from a clean worktree (HEAD + this change only) because concurrent workstreams were editing the tree.

| config | runs | n | endpoint | stt | director (p90) | tts | total median (p90) | ≤2.0 s | rewrites | spec hit |
|---|---|---|---|---|---|---|---|---|---|---|
| A baseline (pre-change code), classify=fast reply=fast | 3 | 28 | 1086 | 334 | 2044 (2783) | 362 | **3977** (4900) | 0/28 | — | 19/25 |
| B +1-clock spec, +low-ASR spec, +TTS prewarm; fast/fast | 4 | 38 | 1080 | 358 | 1867 (4036) | 216 | **3594** (5744) | 0/38 | 13/38 | 30/36 |
| C as B, classify=grok | 3 | 30 | 1076 | 334 | 1422 (2495) | 212 | **3055** (4054) | 0/30 | 8/30 | 29/30 |
| C' as C, TAXILA_TTS_PREWARM=0 | 1 | 10 | 1067 | 312 | 1298 (2915) | 343 | **3030** (4676) | 0/10 | 1/10 | 9/10 |
| D as C, reply=ds41 | 1 | 10 | 1079 | 334 | 2154 (4116) | 264 | **3783** (5484) | 0/10 | 4/10 | 9/10 |
| E as B, classify=V4-Pro | 1 | 10 | 1078 | 321 | 1972 (2601) | 219 | **3649** (4274) | 0/10 | 3/10 | 7/10 |
| F as C, 2 parallel reply drafts (rejected) | 1 | 10 | 1069 | 327 | 1577 (3459) | 239 | **3303** (5044) | 0/10 | 2/10 | 10/10 |
| G final (B + drift repair + classify hedge), fast/fast | 2 | 20 | 1073 | 338 | 1524 (2776) | 219 | **3275** (4422) | 0/20 | 3/20 | 14/18 |
| H final, classify=grok (drift repair; hedge in k-runs) | 4 | 40 | 1084 | 345 | 1301 (1872) | 217 | **3090** (4251) | 0/40 | 2/40 | 39/40 |
| H2 final, classify=grok, hedge on | 2 | 20 | 1080 | 337 | 1292 (1629) | 216 | **2966** (3163) | 0/20 | 1/20 | 20/20 |

All medians ms; "rewrites" = turns whose reply needed a second model call. C′ isolates the prewarm: TTS stage 343 → 212 ms (the rest of C′'s total is fewer rewrites in that run). 0 turns met 2.0 s in any config: endpoint + STT + TTS stage alone are ~1.63 s (1080 + 340 + 216), so 2.0 s needs a Director of ≤ 0.37 s; its floor is one reply call (TTFT ~0.6-1.3 s, taxila-fast) because speculation (20/20 hit in H2) already runs the reply beside the classifier. Partial transcripts (gpt-4o-transcribe) arrive only after speech_stopped: first delta +202-228 ms, last +304-363 ms vs completion +322-381 ms (n=10 per run) — a Director pre-run on them could start ≤ ~130 ms earlier, and only from a partial text.

## classify-accuracy-2026-10-02
`evals/classify-accuracy.mjs` (2026-10-02): the REAL classify() (prompt, strict schema, parse) on the verified kit c4-maths-ch01-t01, 20 hand-labelled replies that reach the model (Devanagari/Roman mixed, as ASR writes them: correct, misconception, other-wrong, no-attempt), 2 reps, run twice (n=80 per model), plus 5 distress / frustration lines × 2 (n=10).
| model | exact | graded-wrong | distress flag | p50 / p90 |
|---|---|---|---|---|
| taxila-fast | 72/80 | 0 | 10/10 | 1053-1067 / 1229-1306 ms |
| grok-4-1-fast-non-reasoning | 75/80 | 0 | 10/10 | 619-629 / 881-926 ms |
| DeepSeek-V4-Pro | 74/80 | 0 | 10/10 | 1139-1322 / 1411-1661 ms |
Misses are misconception-vs-incorrect splits ("बारह corners" → incorrect, all three models), never a wrong grade direction. One topic, n small; the distress lines may partly be caught by the predicate first.

## keepalive-2026-10-02
Outbound keep-alive (`server/net.js`, undici dispatcher keepAliveTimeout 30 s, no dependency): a tiny taxila-fast chat call after 6 s idle 1249/1562/1384/1019/1302 ms (median 1302) with Node's default 4 s → 638/862/678/698/787 (median 698) with net.js; after 1 s idle ~990 ms either way (n=5 each, sandbox via the egress proxy, 2026-10-02).

## reply-stream-ttft-2026-10-02
Streamed reply timing (~1.1k-token system prompt, 34-62 output tokens, n=5 per model, 2026-10-02): first content delta / call end — taxila-fast 1275/1320, 933/1031, 929/1003, 596/658, 855/907 ms; taxila-ds41 764/801, 760/857, 2993/3058, 613/707, 658/798 ms. The first delta already holds the first full sentence. TTS first byte vs input length: 2-word clause 732/248/300/259/273/251, 16-word sentence 659/256/254/261/259/270 ms (n=6 each).


<!-- merged from inbox/comprehension-review.json -->
## comp-review-2026-10-02
**Comprehension sim after the adversarial review, 2026-10-02.** `node evals/comprehension-sim/run.mjs --seeds 30` → `evals/comprehension-sim/results/comp-sim-2026-10-02-review.json`. n = 4,320 child-concepts per policy per family. There are two truth families: `bkt2`, fixed bits, which is a matched upper bound, and `cfrag-lite`, with continuous strengths, per-answer sampling, partial forgetting and trigger-agnostic re-teach gains. The LLM leg (`--llm --llm-seeds 2`, n = 288, 987 graded turns) is in `comp-sim-2026-10-02-review-llm.json`. Changes since comp-sim-2026-10-02: misconception tags are observable-only, E9 is on, C08 statements are 50% true, cross-day novelty is passed through, the grader chain is production, and R-MIS is real in the LLM leg.

| | bkt2 | cfrag-lite | bar |
|---|---|---|---|
| macro acc (final) | 0.627 | 0.475 | ≥ 0.70 both: FAIL |
| false mastery / shallow | 0.025 / 0.000 | 0.043 / 0.030 | ≤ 0.05 / ≤ 0.02: pass / FAIL (cfrag shallow) |
| verbal gap | 14.1 pp | 14.4 pp | ≤ 10: FAIL |
| understood found / never detected | 0.553 / 0.447 | 0.265 / 0.735 | median ttd 2 / 3 sessions |
| probes per probed concept-session | p50 3, p95 5, max 8 | p50 3, p95 5, max 8 | 46% mandatory (coincident_why 19%, first-correct 15%) |
| load/10, over cap, lexicon, cross-day repeats | 2.25, 0, 0, 0 | 2.24, 0, 0, 0 | ≤ 2.5 |

Controls fail where they should under both families: quiz-bot false mastery 0.595 / 0.456 and load 4.30; samjha 0.627 / 0.494 with 8,640 lexicon hits; why-every-turn over cap 100%; no-delay never certifies. E9 vs no-E9 (bkt2): 0.640 vs 0.653, inside seed noise. The deferential persona stays at 0.28. The 0.627 vs 0.640 spread between two 30-seed runs of the same engine policy (with and without the cross-day novelty pass-through) shows that run-to-run noise is about ±0.015. LLM leg: acc 0.702, false mastery 0.042 (shallow 0.011), present given U=1 0.87, given U=0 0.13, given fluent U=0 0.14, 15 echo demotions, 0 span demotions.


<!-- merged from inbox/model-router-research.json -->
## router-bench-2026-10-02
2026-10-02/03. `docs/research/models/router-bench.mjs` → `router-bench-2026-10-02.json`, tables `router-tables.md`, synthesis `MODEL-ROUTER.md`. T: 10 child turns (6 Hinglish, 3 English, 1 Devanagari) × 2 reps Azure / 1 rep OpenRouter-reference, production settings (effort none, streamed), two blind comparative judges (taxila-brain, grok-4-20-reasoning; self-preference visible). C 20 cases × 2; S production distress prompt 16 cases × 2; D 8 scenarios × 2; W 1 fact sheet × Hindi/English; V 4 synthetic handwriting-font images (CER); M 12 concepts cross-lingual. Key: see MODEL-ROUTER.md §1. Limits: small n, LLM judges, C/D at ceiling, synthetic OCR, US-side shared latency.


<!-- merged from inbox/spoken-notation-build.json -->
## notation-probe-2026-10-02
2026-10-02. G1 spoken-notation probe (`docs/research/voice/spoken-notation.md` §3; data in `docs/research/voice/notation-probe-2026-10-02/`).
- **Design.** 53 items × en/hl/hi × written (W) vs pre-rendered (P) × gpt-realtime-2.1 (RT) and gpt-4o-mini-tts (TTS), voice marin; n=159 per arm; 636 clips.
- **Method.** Two back-transcriptions with taxila-transcribe (language forced / no hint), a taxila-brain rubric judge, and a hand audit agreeing on 46/48.
- **Results.**
  - TTS: W 33% rendering error / 28% mixed convention / 18% misread; P 6 / 6 / 1%.
  - RT: W 20 / 23 / 11%; P 2 / 2 / 0%.
  - Indian-comma numbers misread written: TTS 11/15, RT 9/15. English-mode ₹ came out as dollars/cents.
  - Helplines in Hindi mode written 0/4 digit-exact; pre-rendered 11/12 (1 undeterminable).
- Written-arm rates are lower bounds (13% of rows undeterminable from transcripts).

## spoken-render-tts-rerun-2026-10-02
2026-10-02 (run crossed into 2026-10-03 UTC). The probe's own TTS arm re-run with arm **R** = the written item rendered by the shipped `toSpoken()` (renderer `sp1-2026-10-02`).
- **Method.** gpt-4o-mini-tts on Azure, voice marin, the probe's per-mode voice notes; both ASR passes; the probe's judge with its stored system prompt and mode rules (`rerun-tospoken.mjs`; data `notation-probe-2026-10-02/rerun-tospoken/`).
- **Sample.** 30 items (all 5 large-number, 3 currency, 4 exponent, 2 root, 3 negative, 3 unit, 2 fraction, 2 decimal, ratio, percent, time, formula, 2 helplines) × en/hl/hi = **n=90**, plus 4 helpline clips in hl·hindi and hi·english. 94 clips, 0 engine errors.
- **Baselines.** The probe's TTS W and P rows on the same 30 items (n=90 each).

| arm (same 30 items) | rendering error | mixed convention | number misread | any flag |
|---|---|---|---|---|
| probe W, written | 40% | 32% | 24% | 57% |
| probe P, hand-authored spoken | 8% | 8% | 2% | 14% |
| **R, toSpoken** | **4%** (3% excl. ASR-suspect) | **9%** (6%) | **6%** (3%) | **13%** |

- **Per mode, R any-flag:** en 0/30, hl 8/30, hi 4/30.
- **Indian-comma numbers misread:** W 11/15 → R 1/15. The one miss: Hindi लाख heard as नाग by both ASRs, which is pronunciation, not notation.
- **Currency, exponents, roots, mixed numbers:** 0 misreads. No dollars in English mode.
- **hl mixed convention** (8/30, P 7/30): the TTS voiced the English number words of a Hinglish sentence as Hindi words (spoken-notation §3.3 point 5). The input text was right; a renderer cannot fix this.
- **Residual Hindi-mode errors are pronunciation:** ऋण heard as रेर (again, the known watch item), लाख heard as नाग, and a clipped final छह in 14416.
- **Limits.** One voice, one take per cell, ASR-only plus a model judge; no listener.

## spoken-helplines-repeat-2026-10-03
2026-10-03. Childline 1098 and Tele-MANAS 14416 through `toSpoken()`.
- **Sample.** All 5 cells (en·english, hl·english, hl·hindi, hi·hindi, hi·english) × 3 takes = n=30 per arm. Same TTS, ASR and judge as above (`rerun-helplines.mjs`, `rerun-tospoken/helplines/`).
- **Plain digit words (shipped): 28/30 judged digit-exact, 0 confirmed wrong digits.**
  - One take had digits in both ASR transcripts (1098), so the reading is undeterminable.
  - One take had only one of the two ASR passes disagreeing (14486 vs एक चार चार एक छै).
- **Combined with the first re-run's 10 helpline clips: 37/40 exact, 0 confirmed wrong.** The third non-exact take was a Hindi-mode Tele-MANAS whose final छह both ASRs heard clipped (छा / छ).
- **Probe baselines:** written Hindi mode 0/4; hand-authored pre-rendered 11/12.
- **Comma arm:** see `helpline-digits-comma-separated`.
- Still unmeasured: the Tele-MANAS NAME, which ASR heard as Telly Savalas, Keli, Delhi, Dili Manas, and so on. It stays a §5.3 ear-panel item.


## comp-sim-ablation-2026-10-02 (2026-10-02)
Sim ablations (n=4320 child-concepts each): no delayed probes -> understood unreachable (0 of 1426), acc 0.567; no game evidence -> acc 0.648, false mastery 0.022, verbal gap 12.9 pp; no voice features -> acc 0.641, verbal gap 15.5 pp (vs 7.2); freeze-low -> acc 0.646 (no measurable harm, contra the matched-model MC); T threshold 0.7 -> acc 0.634.
The workflow's write-up is the prose merged from inbox/comprehension-build.json earlier in this file; this heading ties the graph node to it.


## comp-sim-llm-2026-10-02 (2026-10-02)
LLM-played leg (ds41 child, DeepSeek-V4-Pro closed-label grader, 24 personas x 2 seeds, n=288 child-concepts, 884 graded turns): acc 0.731, understood found 0.798, false mastery 0.015; grader present|U=1 0.88, present|U=0 0.146, present|U=0 fluent-shallow 0.386 -> 0.272 with the echo guard, contradicted|misconception 0.97, 0 span demotions.
The workflow's write-up is the prose merged from inbox/comprehension-build.json earlier in this file; this heading ties the graph node to it.


## sim-mutants-invisible-bkt2 (2026-10-02)
Mutants VC2 (partial scored as full) and VC4 (game at full weight, no E4) do NOT fail CE-M3 under bkt2 (false mastery 0.021 / 0.022); VC2 fails under cfrag-lite (0.056, shallow 0.040), VC4 does not (0.046) — the battery cannot see VC4.
The workflow's write-up is the prose merged from inbox/comprehension-review.json earlier in this file; this heading ties the graph node to it.


## image-bench-2026-10-02 (2026-10-03)
3 prompts × gpt-image-2 / FLUX.2-pro / FLUX.1-Kontext-pro, n=1, brain vision judge: gpt-image-2 25/25 on every prompt (37-47 s, $0.053); FLUX.2-pro labels on wrong parts, tutor character 5/5 in 6.2 s (~$0.03); Kontext gibberish caption.
The workflow's write-up is the prose merged from inbox/model-router-research.json earlier in this file; this heading ties the graph node to it.


## game-code-probe-models-2026-10-02 (2026-10-03)
Phaser 4 single-file probe (2 tasks × n=3) on 8 models: functional 6/6 codex, DeepSeek-V4-Pro (9.9 s), ds41 (5.7 s), brain, grok-4.3, oss120; 4/6 terra and kimi-code (95 s); tasks at ceiling.
The workflow's write-up is the prose merged from inbox/model-router-research.json earlier in this file; this heading ties the graph node to it.


## router-t-judge-split-2026-10-03 (2026-10-03)
Re-analysis of router-bench T (n=10 turns, 2 judges): judge agreement Spearman 0.43 on model means (p=0.10), 0.46 item-level; grok judge per-turn gpt-6.1-sol vs fast 3-6, gpt-6-luna vs fast 2-6; terra-fast combined +0.50 (bootstrap 95% CI 0.05-1.00, mostly sol judge), terra-ds41 +0.30 (CI -0.40-1.20); OpenRouter arms ran reasoning effort low vs Azure none; gpt-6.1-sol 3/20 leak flags; W: taxila-fast 5/5 overall both languages at ~$0.54/1k vs brain $16.6/1k.
The workflow's write-up is the prose merged from inbox/model-router-review.json earlier in this file; this heading ties the graph node to it.
