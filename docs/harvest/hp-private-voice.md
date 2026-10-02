# Harvest: hp-private-voice (html-portfolio `codex/private-voice-requests25`)

- **Repo:** `/home/user/html-portfolio` (read-only; inspected with `git show` / `git diff` / `git log` against refs, no checkout).
- **Ref harvested:** `origin/codex/private-voice-requests25` at `f0246956` ("WIP: checkpoint private voice requests; runtime and live SQL validation pending", 2026-09-21).
- **Delta base:** `origin/codex/handoff206` at `20263775` (merge-base = handoff206 tip). **219 commits**, 774 files changed, +97,101 / -68,425 lines. handoff206 has 0 commits not in this branch.
- **Ref shorthand used below:** `pvr25@f0246956`. Anything marked **(inherited)** is byte-identical at `handoff206@20263775` and was not created in this delta; it is included only where the delta's voice work depends on it or where the measured number is the only real voice evidence available.
- **Secrets:** none printed or copied. `api/_config.js` is gitignored and absent from the ref. The grant script `docs/handoff/2026-09-14/grant-internal-voice-identity-personal-cloud-shell.sh` contains Azure subscription/resource identifiers (not secrets); Vercel/Azure keys are referenced only by env-var NAME in code/docs. Committed WAVs under `docs/handoff/2026-09-09/listening/audio/` are owner-voice-conditioned clips (biometric personal data) and were deliberately not opened or copied.
- **Taxila stack reminder:** Vite/React/TS + Vercel functions + Neon + Azure AI Foundry (`gpt-realtime-2.1` voice, `gpt-5.6` text, `gpt-image-2`). Most of this branch's voice stack is a **self-hosted TTS lane** (Chatterbox on Azure serverless GPU), not realtime speech-to-speech; the mapping below says where that matters.

---

## 1. What this is

This branch is the **Vyakti** product line (a person builds an AI of themselves: Feed knowledge -> Meet/correct it -> Deploy a "Room" for visitors), separated from Meera during wave 25. The separation **deleted** Meera's live-call stack from this ref (`src/voice/liveCall.ts` 3,408 lines, `src/voice/speech.ts` 2,099, `src/components/CallVoice.tsx`, `VoiceNote.tsx`, native watch/capture Java, and the `meera.ts` / `characters/maya.ts` personas). Harvest the realtime call client from the main/handoff segments, not here.

What the delta built, in order:

1. **Waves 21-23 (2026-09-13, WS-R151..R181, merged as batches):**
   - **"Sounds like you" + blind listening test** (WS-R155/R163/R179): paired, order-randomized, four-axis (owner likeness, naturalness, Indian accent, pronunciation) ratings stored as a new schema in `vy_replica_calibration` (migration 166); content-hash pair identity; ties are a real outcome; **activation guard** ("law 4": a losing candidate cannot become the primary voice without a logged override) wired through a wrapper; owner-only GET doors streaming the primary reference and sealed generations.
   - **EmotionOS** (WS-R153/R168/R176): `src/engine/register.ts` surface-feature register reader (60/60 labelled en/hi/Hinglish turns) and `api/_voice/prosody.js` mapping five vibe dials + register to closed prosody bands, bound into the Room's HMAC session so voice answers the register the text answered.
   - **Voice replies that start fast** (WS-R156): sentence splitter with Devanagari danda support; one synthesis call per sentence; buffer-one-ahead client loop; **5.00x sooner first audio** (fake synthesizer, real browser, n=10/arm).
   - **Reply-language policy** (WS-R180): a person's declared language/script/register drives the compiled prompt AND the TTS language id; the visitor's UI locale is deliberately ignored.
   - Personal studio in Hindi, mobile app flavour, erasure-order FK graph, gate-under-load tooling (not voice; see other segments).
2. **Wave 24 (2026-09-14):** ten parallel workstreams exhausted the session limit; preserved as patches under `docs/handoff/2026-09-14/wave-24-wip/` (incl. **WS-R188 voice dry-run + VOICE-DAY-ONE runbook**, never merged).
3. **Wave 25 (2026-09-14):** Vyakti made standalone (Azure Foundry the only text provider; GroupAI repo archived), Azure/Vercel bindings read back, Face liveness parser fixed, capture duration aligned (25 s UI / 30 s decoder), **enrollment-reality audit** (public voice enrollment is blocked on a missing audiovisual evidence producer, not on a credential). Owner then said: *skip reviews/compliance for now, build and test privately first*. Result: the **internal owner voice lane** - `services/internal-voice/*` (Azure Container Apps CPU service + independent supervisor + Azure Blob ETag-CAS state), reusing the Chatterbox adapter and a **supervised scale-to-zero GPU controller**, fronted by a Vercel same-origin proxy and a Studio panel with four 1-5 ratings. A dedicated managed identity got a five-action custom role on the Hindi GPU app (granted from the owner's personal device). Live readback: CPU `/healthz` 200, retained 10 s reference primed (480,044 bytes), GPU dormant. **No synthesis was ever run.**
4. **Wave 26 (2026-09-14):** owner's real phone test failed (capture overlap, upload stuck at "Paused"). Root cause: Studio CSP (`connect-src 'self'`, no `media-src`) blocked the Azure Blob PUT and `blob:` playback. Fixed with real-header Chromium counterfactual tests, an ambiguous-PUT reconciliation, a compact "silver" recorder, a unified Sources ledger; commit `39a7ffc8` "**Allow saved private Azure audio auditions under Studio policy**" = adding the exact Azure Blob origin to `media-src` because the review screen plays a short-lived signed audition URL directly in `<audio>`.
5. **Tip WIP `f0246956` - "private voice requests":** any signed-in account may request a private sample of its *own* ready voice artifact via an explicit self-use attestation. Migration 171 (`vy_private_voice_run`), store, handler (not routed), erasure fence and 13 offline tests. Fixed server config: Hindi text, `hindi_v3` pack, seed 31001, style 0.2/0.78/0.6, and - because a fresh reference's language is unverified - **effective CFG 0**. No route, no CPU consumer, migration not applied, SQL not parsed live.

**How far it got (honest status):** extensive, well-tested *infrastructure and contracts* for private voice testing; **zero new generated voice clips and zero human listening verdicts** in this delta. All real voice-quality numbers in this report are inherited from August (Chatterbox ECAPA proxies, T4 latency/cost, two rejected-by-ear Azure options).

**Azure Personal Voice / custom neural voice specifically:** a complete Azure Custom Voice API (2026-01-01) Personal Voice adapter exists (inherited, `api/_voice/providers/azure-personal-voice.js`) but is **not** the live provider: the owner made the self-hosted Chatterbox lane primary on 2026-08-26 ("Azure Personal Voice drops to optional; its Microsoft Limited Access application is no longer on the critical path"). It is gated on `AZURE_PERSONAL_VOICE_LIMITED_ACCESS_APPROVED`, was never live-called, and hardcodes `xml:lang="en-US"` plus an English disclosure (a Hindi bug). The only live Azure Speech fact in the delta: the bound key lists **774 voices, 18 hi-IN, 20 en-IN**. Stock Azure neural voice "coral" was previously **rejected by ear** despite winning every measured axis (accent identity), and `gpt-realtime-2.1-mini` was rejected for monologue-length turns and implausible voices - both directly relevant to Taxila's choice of `gpt-realtime-2.1`.

---

## 2. Reusable assets

Legend: maturity = shipped-measured | shipped | prototype | spec-only. Taxila use = copy | adapt | idea | skip.

| id | path@ref | what | maturity | Taxila use | target subsystem |
|---|---|---|---|---|---|
| pv-01 | `api/_voice/hindi-text-frontend.js` @ pvr25@f0246956 (inherited) | **Hindi text frontend: reviewed Roman-Hindi + classroom-borrowing lexicon, single-utterance text plan**. Deterministic text normalizer for Hindi-conditioned TTS. ~150 reviewed Roman-Hindi words (aaj->आज, samjho->समझो), ~150 Indian-English classroom borrowings rendered in Devanagari (chapter->चैप्टर, ncert->एनसीईआरटी, physics->फिज़िक्स, equation->इक्वेशन, formula->फ़ॉर्मूला, jee/neet/iit), A-Z Devanagari letter names for single uppercase symbols, unknown Latin tokens left byte-identical and audited. Emits a signed text-plan (hashes, token-language audit, transformations) and refuses multi-segment plans downstream. | shipped-measured | **adapt** | tts-voice-identity; learning/pedagogy (NCERT term pronunciation) |
| pv-02 | `api/_voice/language-conditioning.js` @ pvr25@f0246956 (inherited) | **Script-mode detector + Hindi reference-language CFG conditioning**. voiceScriptMode() counts Devanagari vs Latin code points -> devanagari\|mixed\|latin_only\|unknown. voiceLanguageConditioning() forces Chatterbox cfg_weight=0 when a Hindi target is conditioned on a latin_only/unknown reference (accent-transfer mitigation from Chatterbox guidance) and emits explicit quality warnings and evidence scope (source_transcript\|exact_reference\|unverified). | shipped | **adapt** | tts-voice-identity |
| pv-03 | `api/_voice/providers/open-chatterbox-preview.js`<br>`services/open-voice-runtime/` @ pvr25@f0246956 (inherited) | **Open Chatterbox Multilingual V3 provider (HMAC broker protocol, receipts, PerTh watermark, continuous-utterance law)**. Client for the self-hosted Chatterbox Multilingual V3 (general + hi_v3 packs pinned by commitment) behind an HMAC-signed CPU broker on Azure Container Apps. Signs request (protocol, method, path, timestamp, nonce, body sha) and verifies a signed response; binds request id, reference sha, model pack commitment, text-plan sha, disclosure, conditioning, PCM sha, duration, RTF; requires perth_watermark_verified and perth_score>=0.5; refuses any plan that is not ONE acoustic call; optional LoRA adapter binding; 30 status polls inside an allocation window for cold start. | shipped-measured | **adapt** | tts-voice-identity; infra/azure |
| pv-04 | `api/_voice/providers/azure-personal-voice.js` @ pvr25@f0246956 (inherited) | **Azure Personal Voice adapter (Custom Voice API 2026-01-01)**. Full enrolled-voice lifecycle: uploads a consent statement recording (voiceTalentName, companyName, locale) to /customvoice/consents, creates /customvoice/personalvoices from 30-90 s of prompts (product floor above Azure's 5 s minimum), idempotent Operation-Id from stable UUID, waits for Succeeded, synthesizes via SSML <mstts:ttsembedding speakerProfileId> to raw-24khz-16bit-mono-pcm, budget reserve/begin/settle/uncertain around every paid call, signed-URL allow-list for private audio, sha256+WAV probe of every reference, and a deliberately smaller erasure config so deletion never depends on approval flags. | prototype | **adapt** | voice-cloning; tts-voice-identity |
| pv-05 | `api/_voice/registry.js`<br>`api/_voice/providers/elevenlabs-pvc.js`<br>`api/_voice/providers/sarvam-bulbul.js`<br>`api/_voice/providers/vendor-common.js` @ pvr25@f0246956 (inherited) | **Voice lane registry: self-hosted-first order, single VOICE_PRIMARY_LANE switch, vendor bench arms**. One file owns provider order (open_chatterbox first, azure_personal_voice second) with a written reversal condition tied to a fidelity bench; vendor arms (ElevenLabs PVC, Sarvam Bulbul) exist only as bench arms, enabled by VOICE_VENDOR_ARMS and selected only via VOICE_PRIMARY_LANE, which throws rather than silently falling back. Erasers reachable even when an arm is off. | shipped | **adapt** | tts-voice-identity; evals/gates |
| pv-06 | `api/_voice/contracts.js` @ pvr25@f0246956 (inherited) | **Spoken synthetic-audio disclosure (en/hi) + provider contract check**. SYNTHETIC_AUDIO_DISCLOSURES {en:'This is an AI-generated voice replica.', hi:'यह एआई से बनाई गई आवाज़ की प्रतिकृति है।'}; renderTextWithDisclosure prefixes every synthesis; providers must echo the exact disclosure or the call fails. | shipped | **adapt** | safety-floor/honesty; parent visibility |
| pv-07 | `api/_voice/prosody.js`<br>`evals/prosody/run.mjs`<br>`evals/prosody/fixtures.mjs` @ pvr25@f0246956 | **Prosody plan (EmotionOS in the voice): vibe dials + register -> closed rate/energy/pitch bands, pauses, bounded style deltas**. Pure mapper: five 0-4 vibe dials (warmth, energy, humour, directness, formality) + optional high-confidence register -> {rateBand, energyBand, pitchRangeBand, pauseSentenceMs (160-700), pauseClauseMs=0.45x, pauseGlyph ('…' only for slow), styleDelta on provider numeric fields, appliedRegister, planSha256}. Neutral input is byte-identical to no plan. Never emits free text into any prompt or TTS input except a single punctuation glyph. | shipped | **adapt** | emotional-lens/affect; tts-voice-identity |
| pv-08 | `src/engine/register.ts`<br>`evals/emotionos/run.mjs` @ pvr25@f0246956 | **Register reader: surface-feature delivery classifier for en/hi/Hinglish turns**. LLM-free, pull-only classifier of HOW a turn was delivered (rushed, upset, excited, flat, neutral + high/low confidence) from length, punctuation, letter repeats, shouting, laughter tokens (incl. Devanagari हाहा), Hindi marker density, gap since last turn and hour. Render gate: only high-confidence non-neutral renders a hint; never stored; never names an emotion as fact. | shipped-measured | **adapt** | emotional-lens/affect; learning (covert comprehension cue) |
| pv-09 | `api/_room-speak-plan.js`<br>`evals/room-speak-plan/run.mjs` @ pvr25@f0246956 | **Sentence splitter with Devanagari danda + abbreviation/decimal/initial/list-marker exceptions**. planReplySentences(text): pure, never throws; splits on . ! ? । ॥ runs, keeps decimals (₹49.99), abbreviations (Dr., etc., डॉ.), initials (A.P.J.), list markers (1.), absorbs closing quotes. roomSpeakPlan returns {sentences,count}; roomSpeakLanguageId maps hindi/hinglish->hi, english->en from the same policy as the text. | shipped | **copy** | tts-voice-identity; avatar-visual (caption/lip-sync chunking); generative-ui |
| pv-10 | `src/room/voiceSequence.ts`<br>`evals/room-speak-plan/benchmark.mjs` @ pvr25@f0246956 | **Buffer-one-ahead voice clip sequencer (framework-free)**. runVoiceSequence({fetchClip, playClip, isActive, waitForResume, onFirstAudio}): fetches clip i+1 as soon as clip i arrives, plays sequentially, pause/resume between clips, supersession checked after every await, count re-read from every server response. | shipped-measured | **copy** | realtime-voice (TTS fallback lane); avatar-visual |
| pv-11 | `api/_room-surface.js`<br>`api/room.js`<br>`api/_room-voice.js` @ pvr25@f0246956 | **Per-sentence speak op bound to an HMAC session (server recomputes plan; register bound in session)**. roomSay mints an HMAC session token binding the reply hash (lr) plus closed register pair (rg/rc); roomSpeak accepts {session,text,index}, refuses if sha(text)!=lr, recomputes the sentence plan every call, never trusts a client count, builds prosody from the bound register and the declared language policy. | shipped | **adapt** | safety-floor/honesty; realtime-voice |
| pv-12 | `src/studio/ListeningTest.tsx`<br>`src/studio/ListeningTest.css`<br>`api/_replica-calibration.js`<br>`api/_replica-runtime.js`<br>(+2 more) @ pvr25@f0246956 | **Blind paired listening test + verdict storage + activation guard (law 4)**. UI randomizes sample order once per mount with crypto.getRandomValues, hides identity until both samples are rated on 4 axes (owner_likeness, naturalness, indian_accent, pronunciation; 1-5), shows a reference clip outside the blinded grid; server stores verdict as schema vyakti.voice-listening-verdict.v1 in vy_replica_calibration with pair_sha256 = sha(sorted candidate audio hashes + reference hash), winner null on tie; guardedActivateOwnedRuntime refuses activating a candidate that lost its latest verdict unless an override is explicitly passed and audited. | prototype | **adapt** | evals/gates/verification; tts-voice-identity (teacher voice selection) |
| pv-13 | `api/replica-source-audio.js`<br>`api/_replica-source-audio.js`<br>`api/replica-generation-audio.js`<br>`api/_replica-generation-audio.js` @ pvr25@f0246956 | **Owner-only private audio streaming doors (reference + sealed generation)**. GET-only, bearer-authenticated, rate-limited (two-tier) doors that stream an owner's own primary recording or sealed generation through the private signed-read seam; identical refusal codes for wrong owner/forged id/unsealed/malformed/signed-out so existence is not leaked; never re-encodes. | shipped | **adapt** | auth/accounts/consent; parent visibility |
| pv-14 | `services/internal-voice/contract.mjs`<br>`services/internal-voice/runtime.mjs`<br>`services/internal-voice/http.mjs`<br>`services/internal-voice/server.mjs`<br>(+5 more) @ pvr25@f0246956 | **Internal owner voice CPU service (Azure Container Apps) orchestrating one zero-shot Hindi synthesis on scale-to-zero GPU**. Exact-owner/replica env binding, SHA-pinned authorization JSON (scope, expiry, identity_claim_allowed=false, release_eligible=false, training_allowed=false, ordered purposes), one attempt by default, 202-then-poll run model with client UUID idempotency, uncertain attempts never auto-retried, provider receipt checks (PCM sha, PerTh), WAV wrap, 4-axis ratings, revoke+erase, metrics {total_ms, model_elapsed_ms, duration_ms, real_time_factor, first_audible_ms:null until the browser measures}. | prototype | **idea** | infra/azure; voice-cloning |
| pv-15 | `services/internal-voice/blob-store.mjs` @ pvr25@f0246956 | **Azure Blob ETag compare-and-swap JSON state store**. Durable cross-process state in one state.json blob: read with ETag, mutate synchronously, PUT with If-Match (or If-None-Match:* on create), retry on 412 up to 6x, refuse async mutators, 1 MiB cap; audio blobs create-only; delete includes snapshots. | prototype | **copy** | infra/azure/vercel/deploy |
| pv-16 | `services/azure-voice-app/controller.mjs`<br>`services/azure-voice-app/controller.test.mjs`<br>`api/_voice/allocation-runtime.js`<br>`api/_voice/allocation-boundary.js`<br>(+1 more) @ pvr25@f0246956 | **Supervised scale-to-zero Azure GPU controller (exact revision activate/deactivate, deadlines, micro-USD reservation)**. Validates an approved plan (ARM app id, revision name, isolation tag, internal ingress, image pinned by @sha256, minReplicas 0/maxReplicas 1, Single revision mode, configuration/template hashes, optional separate revision_template_sha256) and a policy (900 s envelope, 420 s dispatch, rate microUSD/s x contingency <= per-allocation cap <= limit, hard_invoice_cap=false, supervisor source sha). Activates only the exact revision inside a durable window, issues one-use child headers per operation, closes idempotently (claimClose), and an independent supervisor deactivates at the dispatch deadline; uncertain ARM mutations are retained, never replayed. | prototype | **adapt** | infra/azure/vercel/deploy (self-hosted GPU for avatar/TTS/image models) |
| pv-17 | `services/internal-voice/supervisor.mjs` @ pvr25@f0246956 | **Independent heartbeat supervisor with self-hash**. Persistent CPU loop every 5 s: verifies its own source sha matches policy, ticks every open GPU window (deactivate at deadline), commits a 30 s heartbeat lease; the runtime refuses to dispatch unless the lease is fresh and from the exact supervisor source. | prototype | **adapt** | infra/azure/vercel/deploy |
| pv-18 | `docs/handoff/2026-09-14/grant-internal-voice-identity-personal-cloud-shell.sh` @ pvr25@f0246956 | **Least-privilege custom role grant script for GPU revision control**. Cloud Shell script creating a deterministic custom role with exactly five actions (containerApps/read, revisions/read, revisions/replicas/read, revisions/activate/action, revisions/deactivate/action) scoped to one container app and assigned to a dedicated user-assigned managed identity; idempotent with GET readback and mismatch refusal. | shipped | **adapt** | infra/azure/vercel/deploy |
| pv-19 | `db/migrations/171_private_voice_request.sql`<br>`api/_private-voice-store.js`<br>`api/_private-voice-handler.js`<br>`api/_private-voice-erasure.js`<br>(+3 more) @ pvr25@f0246956 | **Private voice request model: per-request self-use attestation, frozen server config, snapshot/receipt/config hashes**. One row per attempt (vy_private_voice_run) holds the owner's attestation receipt (statement set private-own-voice/v1, own_voice_private_use:true), a server-resolved snapshot of source/artifact/job/consent rows, a frozen server config (text, model pack commitment, seed, style, conditioning), all SHA-256 hashed over canonical JSON; client may send only selectors + expected snapshot hash; any extra field is a 400; UUID replay is idempotent; requirePrivateVoiceRun re-reads authority before every effect and refuses on drift; revoke closes the lifecycle window; output path reserved at admission so erasure can delete even if the upload ack is lost; erasure fence waits for live leases/windows. DB CHECK constraints enforce scope flags and the output path shape. | prototype | **adapt** | auth/accounts/consent (DPDP parental consent receipts); db-schema |
| pv-20 | `scripts/private-voice-sql-packet.mjs` @ pvr25@f0246956 | **EXPLAIN-only SQL packet generator**. Emits the store's real parameterized statements with synthetic parameter values wrapped for EXPLAIN (never ANALYZE/execution) so an operator can parser-check new SQL against the live schema in a READ ONLY transaction. | prototype | **adapt** | evals/gates/verification; db-schema |
| pv-21 | `api/internal-voice.js`<br>`api/_internal-voice-proxy.js` @ pvr25@f0246956 | **Vercel same-origin proxy to an Azure Container Apps service (no secrets in Vercel)**. Vercel function (maxDuration 30) that 404s unless configured, verifies the Supabase bearer, enforces exact owner, validates the target origin (https, *.azurecontainerapps.io, no port/path/query), forwards the bearer, caps response at 25 MB, passes audio/wav or JSON only. Vercel holds only mode vars and the origin; Blob/ARM credentials live in the Azure service. | shipped | **adapt** | infra/azure/vercel/deploy |
| pv-22 | `src/studio/InternalVoicePanel.tsx`<br>`src/studio/internalVoiceApi.ts`<br>`src/studio/internal-voice-panel.css`<br>`evals/internal-voice-ui.mjs`<br>(+1 more) @ pvr25@f0246956 | **Private Voice Studio panel (explicit generate, poll, authenticated playback, 4-axis ratings, revoke)**. Panel hidden on 404; generation only from an explicit button; polls the same run UUID; fetches reference and sample WAV with bearer and plays via Blob URLs; ratings form placed after the two-column comparison in document flow (phone-safe); failed/unknown runs can only be checked or removed; strict response validation. | prototype | **adapt** | design-system/ux; evals (internal voice QA tool) |
| pv-23 | `src/studio/wavCapture.ts` @ pvr25@f0246956 | **Browser 24 kHz mono PCM16 WAV capture with strict header inspection**. getUserMedia with echoCancellation/noiseSuppression/autoGainControl OFF, 48 kHz AudioContext + ScriptProcessor capture, OfflineAudioContext resample to 24 kHz, own PCM16 WAV encoder, inspectPcmWav24kMono rejects anything not exactly RIFF/PCM/mono/24k/16-bit with consistent sizes, duration cross-check, level+peak callback, friendly permission error messages, loopback mock microphone for tests (AudioContext resumed inside getUserMedia). | shipped | **copy** | voice-cloning; realtime-voice (diagnostic recordings); android/capacitor |
| pv-24 | `src/studio/recordingUpload.ts`<br>`evals/recording-upload-repair.mjs` @ pvr25@f0246956 | **Ambiguous-upload reconciliation (PUT failed -> ask idempotent finalizer)**. transferRecording(): if the browser-to-Blob PUT throws (CORS, network handoff, lost response), call the server's owner-scoped idempotent finalizer; if the object committed, continue without re-upload; otherwise rethrow the original error and keep File/source/intent for Retry. | shipped | **copy** | infra; android/capacitor (flaky mobile networks in India) |
| pv-25 | `vercel.json`<br>`evals/studio-media-policy/run.mjs` @ pvr25@f0246956 | **Studio CSP that actually permits Azure Blob uploads and signed-media playback, with real-browser counterfactual tests**. connect-src 'self' https://<account>.blob.core.windows.net plus media-src 'self' blob: https://<account>.blob.core.windows.net on /studio and /studio.html; Chromium suite serves the exact old and new header and proves old blocks upload/blob playback/signed audition while new decodes a 13 s WAV from both blob: and the Azure origin. | shipped-measured | **adapt** | infra/azure/vercel/deploy; design-system/ux |
| pv-26 | `src/studio/CloneExperience.tsx`<br>`evals/rehearsal/personal.mjs` @ pvr25@f0246956 | **Recording quality gate + non-clipping fake microphone WAV for browser tests**. ResonanceRecorder accepts a take only if long enough, samplePeak<0.995 and audibleRatio>=0.35 (else 'The microphone clipped...'); tests feed Chromium --use-file-for-fake-audio-capture with a generated 20 s 48 kHz mono WAV at peak 0.3 with light amplitude modulation, because Chromium's built-in fake tone clips. | shipped | **adapt** | evals/gates/verification; voice-cloning |
| pv-27 | `src/studio/CloneExperience.tsx`<br>`src/studio/clone-experience.css`<br>`evals/clone-experience-qa/mobile-studio26.mjs` @ pvr25@f0246956 | **Compact 'silver' capture surface (waveform + timer + one control) for phones**. Replaced an oversized decorative dial with a compact waveform driven by mic history, timer and one rectangular control; idle/recording/preview share a 342 px minimum surface; errors persist until dismissed, transient notices expire after 6 s and clear on navigation. | shipped-measured | **idea** | design-system/ux |
| pv-28 | `src/studio/LivenessCapture.tsx`<br>`src/creatorStudio/LivenessCapture.tsx`<br>`services/voice-evidence/identity_audio.py` @ pvr25@f0246956 | **Capture duration contract: 25 s UI timer under a 30 s decoder ceiling**. Both capture surfaces auto-stop at 25 s; decoder MAX_FRAMES = 24 kHz x 30 s; oversized/padded media refuse 413 server-side rather than silent trim. | shipped-measured | **idea** | voice-cloning; multimodal-vision |
| pv-29 | `services/azure-verifier/src/liveness.js`<br>`services/azure-verifier/test/liveness.test.mjs` @ pvr25@f0246956 | **Azure Face liveness v1.2 result parsing (nested latest.result.verifyResult)**. Parser fixed to Microsoft's documented nesting; flat shape, non-identical identity and low confidence fail closed; model version pinned 2025-05-20. | shipped | **skip** | auth/accounts/consent |
| pv-30 | `docs/handoff/2026-09-14/VOICE-PRODUCER-NEXT.md`<br>`docs/handoff/2026-09-14/VOICE-ENROLLMENT-REALITY.md` @ pvr25@f0246956 | **Audiovisual evidence producer audit (YuNet + Light-ASD active speaker, AASIST spoof baseline)**. Source + primary-doc audit of what it takes to prove 'the visible person spoke this audio': pinned YuNet ONNX and Light-ASD checkpoint (MIT), CPU-loader caveats, per-window track reset and tail-drop defects in the old runner, diarizer placeholders that must never be used as evidence, a 30-adult consented corpus design (10/10/10 split), five acceptance tests, dataset licence notes (AVA-ActiveSpeaker CC BY 4.0 labels; IndicSynth/AV-Deepfake1M CC BY-NC). | spec-only | **idea** | multimodal-vision; learning (who is answering?) |
| pv-31 | `docs/handoff/2026-09-09/listening/manifest.json`<br>`docs/handoff/2026-09-09/listening/index.html`<br>`docs/handoff/2026-09-09/evidence/VOICE-LISTENING106-RECEIPT.json` @ pvr25@f0246956 (inherited) | **Science-teaching listening pack with critical units (Hindi, Hinglish, English)**. Six paired texts (pendulum period, Ohm's law current, units check, length ratio) in Hindi, Hinglish and English, each with criticalUnits (e.g., '4 ओम', '12 वोल्ट', 'गुरुत्वीय त्वरण', 'नहीं बढ़ता') that must be pronounced correctly; static blinded A/B page; receipt preserves reference/PCM hashes and only a 44-byte WAV header transform. | prototype | **adapt** | evals/gates/verification; learning/pedagogy |
| pv-32 | `docs/gurukul/VOICE-LISTENING-BENCHMARK.md`<br>`scripts/voice-listening-benchmark.mjs`<br>`evals/voice-listening-benchmark/lib.mjs`<br>`docs/gurukul/research/expert-fidelity-20260907/voice-listening-methodology.md` @ pvr25@f0246956 (inherited) | **Sealed blind listening benchmark harness (HMAC ids, attention trials, hidden repeats, unseal after lock)**. Build/verify/listen/score/unseal CLI; 24-char listener ids minted with a fresh HMAC secret; mapping only in a private sealed key; tone attention checks; hidden repeats for listener consistency; disclosure audibility recorded separately; crossProviderWinner left empty unless an exact-text matched cell exists. | prototype | **adapt** | evals/gates/verification |
| pv-33 | `docs/gurukul/AZURE-DEPLOY-STATE.md`<br>`docs/gurukul/research/voice-stack.md` @ pvr25@f0246956 (inherited) | **Serverless T4 voice deployment runbook with measured cold start and cost**. Central India Container Apps env with Consumption-GPU-NC8as-T4; CPU admission broker (public) in front of internal GPU runtime; scale-to-zero verified; traps (usages API shows 0 A100 but serverless T4 works; GPU env takes ~45 min extra to create; gpu:1 resource key invalid); hidden runtime network dependency; cold-start timeline. | shipped-measured | **adapt** | infra/azure/vercel/deploy |
| pv-34 | `src/studio/VoicePreviewPanel.tsx`<br>`api/_replica-voice-preview.js`<br>`api/_fidelity.js` @ pvr25@f0246956 | **Likeness card: fidelity shown 0-100 only at display; human listening method reported as a separate field**. ECAPA cosine stays 0..1 in storage; card shows Math.round(mean*100); listening_method {verdict_count, axes, measured} rendered as its own sentence; never blended into the automated score. | shipped | **idea** | telemetry/tracing; parent visibility (learning reports) |
| pv-35 | `api/_provider-budget.js`<br>`api/_replica-dialogue.js`<br>`evals/text-ready/run.mjs` @ pvr25@f0246956 | **Shared provider spend ledger (reserve -> begin -> settle \| release \| uncertain) applied to first text reply**. Every paid model/voice call reserves against a shared pilot budget before dispatch, begins, then settles real usage; ambiguous begin/provider/settlement keeps the reservation for reconciliation; cancellation before begin releases it. Wave 25 found and fixed a caller that bypassed it. | shipped | **adapt** | payments; telemetry/tracing (per-student cost caps) |
| pv-36 | `src/engine/agents/fromSheet.ts`<br>`src/engine/compiler.ts`<br>`api/_room-speak-plan.js` @ pvr25@f0246956 | **Person-declared reply language policy driving both text and TTS language**. Closed {language: hindi\|hinglish\|english, script: devanagari\|roman, register: formal\|mixed\|casual, codeSwitchNote?} projected from a validated sheet into its own compiled tail block; the voice language id is derived from the same policy (hinglish->hi); the follower's UI locale is deliberately ignored (proven by negative control). | shipped | **adapt** | prompt-compiler/persona-engineering; learning/pedagogy (medium of instruction) |
| pv-37 | `services/open-voice-runtime/broker.py`<br>`api/voice-allocation-admission.js`<br>`api/_voice/allocation-admission-handler.js` @ pvr25@f0246956 | **HMAC admission broker in front of GPU + six-field one-use child admission callback**. Public CPU broker verifies HMAC and asks the app plane (POST /api/voice-allocation-admission with {window_id, child_id, operation, body_sha256, broker_origin, runtime_origin}) whether this exact operation is authorized inside an open window before forwarding to the internal GPU; each child id consumable once. | prototype | **adapt** | infra/azure/vercel/deploy |
| pv-38 | `evals/room-speak-plan/benchmark.mjs` @ pvr25@f0246956 | **Real-browser benchmark of the shipped client loop (esbuild-transpiled, fake handlers)**. Transpiles the unmodified src/room/voiceSequence.ts and times it in Chromium against a fixed-cost fake synthesizer; numbers are of the code that ships, not a model of it. | shipped-measured | **adapt** | evals/gates/verification |
| pv-39 | `evals/emotionos/run.mjs`<br>`evals/prosody/fixtures.mjs` @ pvr25@f0246956 | **Affect + prosody fixture corpora (60 labelled turns; 60 prosody lines) in en/hi/Hinglish**. REGISTER_FIXTURES: 4 turns per register bucket per language; prosody fixtures: 20 lines per language. | shipped | **adapt** | evals/gates/verification; emotional-lens/affect |
| pv-40 | `docs/handoff/2026-09-14/wave-24-wip/ws-r188-the-voice-programs-dry-run.patch`<br>`docs/gurukul/waves/wave-24/ws-r188-the-voice-programs-dry-run.md` @ pvr25@f0246956 | **VOICE-DAY-ONE runbook + voice dry-run rehearsal (wave-24 WIP patch, not merged)**. Preserved patch: one Chromium rehearsal walking enrol -> process -> candidate -> listening verdict -> activation guard -> 'Hear the vibe' -> sentence-by-sentence Room clip on the fake provider, plus scripts/voice-day-one.mjs that refuses by env-var NAME and is dry-run by default. | spec-only | **idea** | evals/gates/verification |
| pv-41 | `src/voice/liveCall.ts (deleted)`<br>`src/voice/speech.ts (deleted)`<br>`src/components/CallVoice.tsx (deleted)`<br>`android/app/src/main/java/app/meera/companion/*Watch* (deleted)` @ pvr25@f0246956 | **Meera live-call voice client removed in this branch (liveCall.ts, speech.ts, CallVoice.tsx, VoiceNote.tsx, native watch Java)**. Product separation (Vyakti stays, Meera moves out) deleted the Meera audio floor and voice call UI from this ref. | shipped | **skip** | realtime-voice |

### 2b. Evidence and porting notes per asset

- **pv-01 Hindi text frontend: reviewed Roman-Hindi + classroom-borrowing lexicon, single-utterance text plan** - Evidence: One-pass continuous Hinglish (the plan this frontend feeds) raised owner ECAPA proxy 0.433967 -> 0.825082 and cut a line from 25.98 s to 7.72 s (context/measurements.md, 2026-08-29, n=1 clip per arm). Acoustic pronunciation benefit of the lexicon itself is NOT measured (file header says so). Notes: Best direct reuse for Taxila: extend the borrowing table with NCERT class 1-9 vocabulary (photosynthesis, denominator, etc.) and keep the 'additions need a pronunciation example + regression test' rule. Works for any Hindi TTS (Azure hi-IN neural voices, gpt-realtime text, Chatterbox).
- **pv-02 Script-mode detector + Hindi reference-language CFG conditioning** - Evidence: Receipts carry requested vs effective CFG; wave25 control proved wire cfg_weight .78 for the matched-reference profile and 0 for unknown (services/internal-voice tests n=38, 2026-09-14). Notes: voiceScriptMode is copy-ready for Taxila (route TTS language, detect child's Roman-Hindi typing). The CFG rule is Chatterbox-specific; keep only if Taxila self-hosts Chatterbox.
- **pv-03 Open Chatterbox Multilingual V3 provider (HMAC broker protocol, receipts, PerTh watermark, continuous-utterance law)** - Evidence: AZURE-DEPLOY-STATE.md 2026-08-26: warm RTF 0.79 (4359 ms for 5520 ms audio) on Central India serverless T4; first call on fresh replica ~17 s; synthetic buzz-tone reference only (quality unmeasured). Notes: Only relevant if Taxila wants a self-hosted cloned teacher voice; for gpt-realtime-2.1 this is a fallback/offline-lesson-audio lane. Watermark + signed receipt pattern is worth keeping for any generated audio of a child-facing persona.
- **pv-04 Azure Personal Voice adapter (Custom Voice API 2026-01-01)** - Evidence: Never live-called in this segment: gated on AZURE_PERSONAL_VOICE_LIMITED_ACCESS_APPROVED; rejected.md ws-r168 confirms it is not the live Room/preview provider. Speech catalogue GET returned 774 voices, 18 hi-IN, 20 en-IN (measurements wave25-runtime-bindings-and-live-integrity-20260914, n=1). Notes: BUG to fix before reuse for Hindi: synthesizeStream hardcodes xml:lang="en-US" and calls renderTextWithDisclosure(text) without a languageId, so a Hindi lesson would get the English disclosure. Requires Microsoft Limited Access; VOICE-ENROLLMENT-REALITY.md warns open-ended clones may not fit approved categories. For Taxila, a licensed voice-actor teacher voice or stock hi-IN/en-IN neural voices avoids cloning minors entirely.
- **pv-05 Voice lane registry: self-hosted-first order, single VOICE_PRIMARY_LANE switch, vendor bench arms** - Evidence: Code read; no live vendor call in this segment. Notes: Pattern for Taxila: gpt-realtime-2.1 voice primary, Azure neural TTS for generated lesson modules, vendor arms only behind a bench. 'Never silently substitute a provider' is the reusable law.
- **pv-06 Spoken synthetic-audio disclosure (en/hi) + provider contract check** - Evidence: Enforced on every Chatterbox receipt; rejected.md disclosure-announces-the-clone shows it breaks blind benches. Notes: For a children's teacher, a per-clip disclosure is noisy; adapt to a per-session spoken+visual disclosure ('I am an AI teacher') and keep the contract check pattern. Keep the never-deny-being-AI rule.
- **pv-07 Prosody plan (EmotionOS in the voice): vibe dials + register -> closed rate/energy/pitch bands, pauses, bounded style deltas** - Evidence: evals/prosody 20/20; proxy timing table n=60 lines (20 en/20 hi/20 Hinglish): fast 1163 ms < medium 1594 ms < slow 2214 ms, strict ordering on every line (authored constants, not acoustic). No real synthesized duration measured. Notes: Taxila: map the same bands to Azure SSML <prosody rate/pitch> and <break> for generated lesson audio, and to closed-enum delivery hints for gpt-realtime (never sentence-shaped). Slow+clear for a confused 7-year-old, energetic for a celebrating one.
- **pv-08 Register reader: surface-feature delivery classifier for en/hi/Hinglish turns** - Evidence: 60/60 hand-labelled turns (20 en, 20 hi, 20 Hinglish), 36/36 high-confidence correct, 2026-09-13; first run 59/60 until the Devanagari matra fix. Authoring-time self-check, not a held-out corpus. Notes: For Taxila feed it ASR transcripts + timing of the child's answers: 'flat'/'rushed' answers after an explanation are cheap covert signals that the child did not engage. Needs re-labelling for child speech (short answers are normal for 6-year-olds).
- **pv-09 Sentence splitter with Devanagari danda + abbreviation/decimal/initial/list-marker exceptions** - Evidence: 40 fixture cases; room-speak-plan 125-130 checks green 2026-09-13. Notes: Directly reusable for chunking teacher replies into TTS clips, captions, and karaoke-style highlighting for early readers.
- **pv-10 Buffer-one-ahead voice clip sequencer (framework-free)** - Evidence: Real Chromium, real loop, fake 400 ms/sentence synth, 5-sentence reply, n=10/arm: time to first audio mean 2001.5 ms -> 400.7 ms (5.00x), reproduced twice 2026-09-13. Real provider per-sentence latency unmeasured. Notes: Use for any non-realtime spoken output (generated module narration, story read-aloud, avatar). gpt-realtime-2.1 streams natively, so not needed on the live call path.
- **pv-11 Per-sentence speak op bound to an HMAC session (server recomputes plan; register bound in session)** - Evidence: room-speak-plan 130, room-doors 2333, emotionos 45 (60 rows end to end) offline 2026-09-13. Notes: Pattern: audio can only ever be synthesized for text the safety-gated text turn already approved. Essential for a child product: TTS endpoint must never speak arbitrary client text.
- **pv-12 Blind paired listening test + verdict storage + activation guard (law 4)** - Evidence: listening-test 52 -> 63 -> 86 checks offline 2026-09-13; no human verdict on real generated audio recorded anywhere in this segment. Notes: Taxila use: pick the teacher voice per language with parents/teachers/kids via this exact blind form (swap owner_likeness for 'sounds like a kind teacher'/'child understood it'), and gate any voice change on a recorded verdict.
- **pv-13 Owner-only private audio streaming doors (reference + sealed generation)** - Evidence: listening-test +11 and +13 door checks incl. 5 negative controls each (2026-09-13). Notes: Template for 'parent can replay their child's session audio' without exposing storage URLs.
- **pv-14 Internal owner voice CPU service (Azure Container Apps) orchestrating one zero-shot Hindi synthesis on scale-to-zero GPU** - Evidence: 40 node tests with synthetic Blob/ARM/broker (2026-09-14); live: CPU /healthz 200, reference primed (480,044 bytes), GPU dormant; zero synthesis or GPU activation ever performed. Notes: Owner-only scoping is not reusable as-is; the run model (202 + poll same UUID, never replay uncertain work, honest null metrics) is the reusable idea for Taxila's on-the-fly module generation jobs.
- **pv-15 Azure Blob ETag compare-and-swap JSON state store** - Evidence: Concurrent CAS claim and lost-ack cases in services/internal-voice tests (n=37-40, synthetic transport). Notes: Handy for small per-job state where Neon is overkill (e.g., a generation job ledger for a GPU worker).
- **pv-16 Supervised scale-to-zero Azure GPU controller (exact revision activate/deactivate, deadlines, micro-USD reservation)** - Evidence: 28 controller controls + 12 internal-voice controls offline; live read-only preflight verified dormant Hindi GPU (3 revisions inactive, 0 replicas) 2026-09-14. Notes: If Taxila runs its own GPU models (video avatar, open TTS) on Container Apps serverless GPU, this is the cost-safety envelope. Not needed for Azure AI Foundry managed models.
- **pv-17 Independent heartbeat supervisor with self-hash** - Evidence: stale-supervisor refusal case in tests; never run live with a GPU window. Notes: Do not run cleanup from an HTTP-scaled-to-zero process; keep it a separate always-on cheap CPU process.
- **pv-18 Least-privilege custom role grant script for GPU revision control** - Evidence: Owner ran it; root verified grant via API (measurements wave25-owner-grant-verified-20260914, n=1). Notes: Contains subscription/resource identifiers (not secrets) - copy the pattern, not the file.
- **pv-19 Private voice request model: per-request self-use attestation, frozen server config, snapshot/receipt/config hashes** - Evidence: 13 node:test cases with synthetic SQL (2026-09-14); migration 171 NOT applied live; no route registered; SQL not yet parsed by live Postgres (WIP commit f0246956 says so). Notes: Strong template for DPDP: a consent receipt per processing purpose, server-frozen config, hashes, re-check before each effect, reserved erasure paths. Taxila would key on parent_user_id + child_profile_id.
- **pv-20 EXPLAIN-only SQL packet generator** - Evidence: Pattern used live for other statements (e.g., private follow-up ADMIT/COMPLETE n=2 EXPLAIN passed 2026-09-14). Notes: Cheap way to catch Neon schema drift before deploy.
- **pv-21 Vercel same-origin proxy to an Azure Container Apps service (no secrets in Vercel)** - Evidence: Live preview: unauthenticated internal voice 401 (measurements wave26-mobile-notice-and-voice-binding-20260914). Notes: Matches Taxila's Vercel + Azure split for long-running module generation.
- **pv-22 Private Voice Studio panel (explicit generate, poll, authenticated playback, 4-axis ratings, revoke)** - Evidence: Chromium fixture at 390x900 and 1440x1000, no overflow, all four touch ratings saved (2026-09-14); synthetic audio only. Notes: Reuse as an internal 'teacher voice QA' admin screen.
- **pv-23 Browser 24 kHz mono PCM16 WAV capture with strict header inspection** - Evidence: wave26 recording-upload-repair n=7 groups incl. Chromium metadata + AudioContext decoding of the exact bytes (2026-09-14). Notes: ScriptProcessorNode is deprecated; Taxila should port to AudioWorklet but keep the inspector and resample logic. Do not disable AEC for live tutoring calls - only for clean enrollment samples.
- **pv-24 Ambiguous-upload reconciliation (PUT failed -> ask idempotent finalizer)** - Evidence: recording-upload-repair suite registered in release; live logs showed source authorization 201 then no PUT reached storage (root cause was CSP). Notes: Small, high-value for Indian 4G conditions.
- **pv-25 Studio CSP that actually permits Azure Blob uploads and signed-media playback, with real-browser counterfactual tests** - Evidence: Chromium n=16 checks across both routes (2026-09-14); live header readback n=3 confirmed the old broken policy. Notes: connect-src does not govern <audio>; Vite dev server does not serve production headers - test with real headers.
- **pv-26 Recording quality gate + non-clipping fake microphone WAV for browser tests** - Evidence: Personal rehearsal 28/28 over 3 runs and later 63/63 walks (2026-09-13/14). Notes: Use for Taxila's mic-check step before a lesson (too loud/too quiet/noisy room).
- **pv-27 Compact 'silver' capture surface (waveform + timer + one control) for phones** - Evidence: n=20 real Chromium renders at 360/390/768/1440 px: zero overflow, 44 px control floor, min contrast 6.13:1, 3 px focus (2026-09-14). Notes: Owner explicitly rejected decorative 'scanning' metaphors; for kids keep one obvious control.
- **pv-28 Capture duration contract: 25 s UI timer under a 30 s decoder ceiling** - Evidence: Native decoder 7/7: 25 s WebM and MP4 -> 600,000 frames; exact 30 s -> 720,000; padded AAC 720,512 frames refuses 413 (2026-09-14). Notes: General rule: UI limits need headroom below server limits; JS timers are not media-duration guarantees.
- **pv-29 Azure Face liveness v1.2 result parsing (nested latest.result.verifyResult)** - Evidence: 9 liveness tests (2026-09-14). Notes: Face biometrics on minors is a DPDP/child-safety risk; Taxila should not collect it. Listed only for completeness.
- **pv-30 Audiovisual evidence producer audit (YuNet + Light-ASD active speaker, AASIST spoof baseline)** - Evidence: Historical synthetic CPU run produced finite Light-ASD [25,2] logits; no real-media inference or calibration. Notes: Idea for Taxila: active-speaker detection (camera on) could flag when a parent answers for the child, keeping comprehension signals honest. Do not treat as ready.
- **pv-31 Science-teaching listening pack with critical units (Hindi, Hinglish, English)** - Evidence: 12/12 clips verified, humanRatings 0, automaticWinner null (2026-09-09). Notes: Copy the TEXT + criticalUnits structure to seed Taxila's NCERT pronunciation corpus. Do NOT copy the WAVs: they are conditioned on the owner's voice (biometric).
- **pv-32 Sealed blind listening benchmark harness (HMAC ids, attention trials, hidden repeats, unseal after lock)** - Evidence: Instrument ready 2026-08-28 (21 clips, 23 screens, 2 tone checks); no human result recorded. Notes: Use for Taxila's teacher-voice bake-off (Azure hi-IN neural voices vs gpt-realtime voices vs custom).
- **pv-33 Serverless T4 voice deployment runbook with measured cold start and cost** - Evidence: 2026-08-26 measured: cold ready +161 s, request 504 at ~240 s; image 9.70 GB pulled in 78.65 s; T4 ~$0.53-0.60/hr active; idle ~$5/mo; warm ~$0.0007/utterance. Notes: Directly relevant if Taxila self-hosts a video-avatar or open TTS model on Azure GPU.
- **pv-34 Likeness card: fidelity shown 0-100 only at display; human listening method reported as a separate field** - Evidence: listening-test 86 checks incl. 'not measured' negative controls (2026-09-13). Notes: Same law for Taxila parent reports: never average a human rating and a model score into one number without a validating study.
- **pv-35 Shared provider spend ledger (reserve -> begin -> settle \| release \| uncertain) applied to first text reply** - Evidence: text-ready 65/65 incl. 9 budget scenarios (2026-09-14), synthetic DB/provider. Notes: Taxila needs per-child daily cost caps across gpt-realtime minutes, gpt-image-2 and module generation; reuse the state machine.
- **pv-36 Person-declared reply language policy driving both text and TTS language** - Evidence: room-reply-language 13, person-sheet 46, text-ready 42 (2026-09-13). Notes: Taxila: the child's medium of instruction (Hindi-medium RBSE vs English-medium CBSE) and script literacy should drive both the teacher's words and TTS language from one closed policy.
- **pv-37 HMAC admission broker in front of GPU + six-field one-use child admission callback** - Evidence: Rebuilt broker image cu3u verified by digest (2026-09-14); deployed brokers had lacked the allocation origin (rejection wave25-deployed-broker-source-is-not-runtime-proof). Notes: Random internet traffic can wake only the cheap CPU broker, never the GPU.
- **pv-38 Real-browser benchmark of the shipped client loop (esbuild-transpiled, fake handlers)** - Evidence: 5.00x TTFA, n=10/arm, twice. Notes: Same discipline as the Meera echosim floor.
- **pv-39 Affect + prosody fixture corpora (60 labelled turns; 60 prosody lines) in en/hi/Hinglish** - Evidence: Used by 60/60 table and prosody 20/20. Notes: Seed Taxila's child-turn affect fixtures; re-author for child speech.
- **pv-40 VOICE-DAY-ONE runbook + voice dry-run rehearsal (wave-24 WIP patch, not merged)** - Evidence: Patch only; rejected.md in the patch: shared fake adapter name 'deterministic-fake'/'0-test' trips the anti-poisoning regex downstream. Notes: Idea: one end-to-end voice rehearsal on fakes before first paid call; a live script that refuses by missing env NAME.
- **pv-41 Meera live-call voice client removed in this branch (liveCall.ts, speech.ts, CallVoice.tsx, VoiceNote.tsx, native watch Java)** - Evidence: git diff --name-status handoff206..private-voice-requests25: D src/voice/liveCall.ts (3408 lines), D src/voice/speech.ts (2099). Notes: Harvest the realtime call client from handoff206/main segments, not from this ref.

---

## 3. Key code excerpts worth porting (verbatim, no secrets)

### 3.1 Classroom borrowings rendered in Devanagari for a Hindi-conditioned voice (inherited)
`api/_voice/hindi-text-frontend.js` @ pvr25@f0246956 - the table already contains NCERT/school vocabulary; extend, keep the rule "additions require a pronunciation example and a regression test".
```js
// Common Indian-English borrowings are rendered in Devanagari to give a
// Hindi-conditioned model an explicit Indian-script target. This is an
// orthographic intervention, not proof of the resulting acoustic
// pronunciation. Unlisted English remains byte-identical and auditable.
const REVIEWED_HINDI_BORROWINGS = Object.freeze({
  ai: "एआई", api: "एपीआई", algebra: "एल्जेब्रा", app: "ऐप", audio: "ऑडियो", answer: "आंसर",
  biology: "बायोलॉजी", call: "कॉल", chapter: "चैप्टर", check: "चेक", clone: "क्लोन",
  chemistry: "केमिस्ट्री", class: "क्लास", concept: "कॉन्सेप्ट",
  ...
  math: "मैथ", maths: "मैथ्स", memory: "मेमरी", mobile: "मोबाइल", model: "मॉडल",
  nasa: "नासा", natural: "नैचरल", ncert: "एनसीईआरटी", need: "नीड", neet: "नीट",
```
and the guard that stops acronyms colliding with Roman-Hindi words:
```js
  // Capitalized acronyms/names are not Roman-Hindi words merely because their
  // lowercase spelling collides with one (BAS, HUM, MAIN). Only the explicit
  // borrowing table defines multi-letter uppercase pronunciation.
  if (/^[A-Z]{2,}$/.test(token) && !Object.hasOwn(REVIEWED_HINDI_BORROWINGS, key)) {
    return { languageId: "en", text: token, transformation: null };
  }
```

### 3.2 Script-mode detection (copy) and the Hindi CFG rule (Chatterbox-only) (inherited)
`api/_voice/language-conditioning.js` @ pvr25@f0246956
```js
export function voiceScriptMode(value) {
  let devanagariChars = 0;
  let latinChars = 0;
  for (const character of String(value || "")) {
    const code = character.codePointAt(0);
    if (code >= 0x0900 && code <= 0x097f) devanagariChars += 1;
    else if ((code >= 0x41 && code <= 0x5a) || (code >= 0x61 && code <= 0x7a)) latinChars += 1;
  }
  const mode = devanagariChars > 0
    ? (latinChars > 0 ? "mixed" : "devanagari")
    : (latinChars > 0 ? "latin_only" : "unknown");
  return Object.freeze({ mode, devanagariChars, latinChars });
}
```
```js
    if (referenceMode === "latin_only") {
      effectiveCfgWeight = 0;
      qualityState = "accent_transfer_mitigation_applied";
      warnings.push("hindi_reference_latin_only_cfg_disabled");
    } else if (referenceMode === "unknown") {
      effectiveCfgWeight = 0;
      qualityState = "reference_language_unverified";
      warnings.push("hindi_reference_language_unverified_cfg_disabled");
```

### 3.3 One continuous utterance, fail closed (inherited)
`api/_voice/providers/open-chatterbox-preview.js` @ pvr25@f0246956
```js
function combinedResult(input, segments) {
  // A natural preview must be one continuous acoustic generation. Joining
  // independently conditioned language fragments cannot preserve breath,
  // pitch or co-articulation, even with a crossfade. Fail closed if a future
  // text-plan change accidentally reintroduces that path.
  if (segments.length !== 1 || input.textPlan.synthesisSegments.length !== 1) {
    fail("open_voice_text_plan_not_continuous", 409);
  }
```

### 3.4 Buffer-one-ahead clip sequencer (copy)
`src/room/voiceSequence.ts` @ pvr25@f0246956
```ts
export async function runVoiceSequence(handlers: VoiceSequenceHandlers): Promise<void> {
  let index = 0;
  let total = 1;
  let pending: Promise<VoiceClip> | null = null;
  while (index < total) {
    // eslint-disable-next-line no-await-in-loop
    const clip = await (pending ?? handlers.fetchClip(index));
    pending = null;
    if (!handlers.isActive()) return;
    total = clip.count;
    // Buffer one ahead: the NEXT clip's fetch starts NOW, in parallel with
    // this one's own resume-wait and playback, never after this one ends.
    if (index + 1 < total) pending = handlers.fetchClip(index + 1);
    // eslint-disable-next-line no-await-in-loop
    await handlers.waitForResume();
    if (!handlers.isActive()) return;
    if (index === 0) handlers.onFirstAudio?.();
    // eslint-disable-next-line no-await-in-loop
    await handlers.playClip(clip, index);
    if (!handlers.isActive()) return;
    index += 1;
  }
}
```

### 3.5 Sentence splitter terminators and exceptions (copy)
`api/_room-speak-plan.js` @ pvr25@f0246956
```js
const TERMINATOR = new Set([".", "!", "?", "।", "॥"]);
const CLOSER = new Set(["\"", "'", ")", "]", "”", "’"]);
...
    if (j - i === 1 && c === ".") {
      const prevChar = i > 0 ? s[i - 1] : "";
      const nextChar = j < n ? s[j] : "";
      if (prevChar >= "0" && prevChar <= "9" && nextChar >= "0" && nextChar <= "9") {
        isBoundary = false; // decimal point
```
```js
const VOICE_LANGUAGE_FOR_POLICY = Object.freeze({ hindi: "hi", hinglish: "hi", english: "en" });
export function roomSpeakLanguageId(policy, fallbackLocale) {
  const mapped = policy && typeof policy === "object" && !Array.isArray(policy)
    ? VOICE_LANGUAGE_FOR_POLICY[policy.language]
    : undefined;
  return mapped || fallbackLocale;
}
```

### 3.6 Prosody bands (adapt: map to SSML `<prosody>`/`<break>` or closed realtime hints)
`api/_voice/prosody.js` @ pvr25@f0246956
```js
  const energyIndex = clamp(energy + delta, 0, 4);
  const rateBand = bandOf(energyIndex, RATE_BANDS);
  const energyBand = bandOf(energyIndex, ENERGY_BANDS);
  ...
  const pitchBaseIndex = Math.round((warmth + humour + (4 - formality)) / 3);
  const pitchIndex = clamp(pitchBaseIndex + delta, 0, 4);
  const pitchRangeBand = bandOf(pitchIndex, PITCH_RANGE_BANDS);
  ...
  const pauseSentenceBaseMs = { slow: 560, medium: 380, fast: 220 }[rateBand];
  const directnessAdjustMs = directness >= 3 ? -60 : directness <= 1 ? 60 : 0;
  const pauseSentenceMs = clamp(pauseSentenceBaseMs + directnessAdjustMs, 160, 700);
  const pauseClauseMs = Math.round(pauseSentenceMs * 0.45);
```
Register gate restated at the voice render site:
```js
function appliedRegisterOf(register) {
  if (!register || typeof register !== "object") return null;
  if (!REGISTERS.includes(register.register)) return null;
  if (register.confidence !== "high") return null;
  if (register.register === "neutral") return null;
  return register.register;
}
```

### 3.7 Devanagari-safe token padding (the matra fix)
`src/engine/register.ts` @ pvr25@f0246956
```ts
function padT(s: string): string {
  return (
    " " +
    s
      .toLowerCase()
      .replace(/[^\p{L}\p{M}\p{N}]+/gu, " ")
      .replace(/\s+/g, " ")
```

### 3.8 Blind listening: random order, content-hash pair, tie, activation law
`src/studio/ListeningTest.tsx` and `api/_replica-calibration.js` @ pvr25@f0246956
```ts
function randomOrderIsSwapped(): boolean {
  if (typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function") {
    const buffer = new Uint32Array(1);
    crypto.getRandomValues(buffer);
    return (buffer[0] & 1) === 1;
  }
  return Math.random() < 0.5;
}
```
```js
export function listeningPairSha256({ leftSha256, rightSha256, referenceSha256 }) {
  ...
  if (left === right) listeningFail("listening_distinct_candidates_required");
  return sha256Hex({ schema: LISTENING_VERDICT_SCHEMA, candidates: [left, right].sort(), reference_sha256: reference });
}
```
```js
export function decideVoiceActivation({ verdict, candidateGenerationId, override = false }) {
  if (!verdict) return Object.freeze({ allowed: true, reason: "no_verdict_on_record" });
  if (!verdict.winner_artifact_id) return Object.freeze({ allowed: true, reason: "verdict_was_a_tie" });
  if (String(verdict.winner_artifact_id) === String(candidateGenerationId))
    return Object.freeze({ allowed: true, reason: "candidate_won_latest_verdict" });
  if (override) return Object.freeze({ allowed: true, reason: "override", overridden: true, blockedBy: String(verdict.winner_artifact_id) });
  return Object.freeze({ allowed: false, reason: "candidate_lost_latest_verdict", blockedBy: String(verdict.winner_artifact_id) });
}
```

### 3.9 Ambiguous upload reconciliation (copy)
`src/studio/recordingUpload.ts` @ pvr25@f0246956
```ts
  try {
    await put(file, onProgress);
    return "uploaded";
  } catch (transferCause) {
    if (!isActive()) throw transferCause;
    onReconciling();
    try {
      await finalize(sourceId, uploadIntentId);
      return "reconciled";
    } catch {
      throw transferCause;
    }
  }
```

### 3.10 Azure Blob ETag compare-and-swap state (copy)
`services/internal-voice/blob-store.mjs` @ pvr25@f0246956
```js
  async function update(fn){
    for(let attempt=0;attempt<6;attempt++){
      const{state,etag}=await snapshot();const result=fn(state);
      if(result?.then)fail('internal_voice_store_async_mutation',503);
      const bytes=Buffer.from(JSON.stringify(state));if(bytes.length>1024*1024)fail('internal_voice_state_oversized',503);
      const response=await request('state.json',{method:'PUT',body:bytes,headers:{'x-ms-blob-type':'BlockBlob','Content-Type':'application/json',...(etag?{'If-Match':etag}:{'If-None-Match':'*'})}});
      await response.body?.cancel();
      if(response.status===201)return structuredClone(result);
      if(response.status!==412)fail('internal_voice_storage_write_unknown',503);
    }fail('internal_voice_store_contended',503);
  }
```

### 3.11 GPU cost policy shape (adapt if self-hosting GPU models)
`services/azure-voice-app/controller.mjs` @ pvr25@f0246956
```js
  // This is a supervised estimate, never an Azure invoice or hard replica bound.
  if (policy?.envelope_seconds !== 900 || policy.dispatch_seconds !== 420
    || !Number.isSafeInteger(policy.rate_microusd_per_second) || policy.rate_microusd_per_second<=0
    || !Number.isSafeInteger(policy.contingency_multiplier) || policy.contingency_multiplier<1 || policy.contingency_multiplier>10
    || !Number.isSafeInteger(policy.limit_microusd) || policy.limit_microusd<=0
    || !Number.isSafeInteger(policy.per_allocation_cap_microusd) || policy.per_allocation_cap_microusd<=0
    || policy.per_allocation_cap_microusd>policy.limit_microusd || policy.hard_invoice_cap !== false
    || !HASH.test(policy.supervisor_source_sha256 || ''))
    fail('voice_app_policy_invalid');
```
and the isolation checks on the target app:
```js
      || p.template?.scale?.minReplicas !== 0 || p.template.scale.maxReplicas !== 1
      || p.template.containers?.length !== 1 || p.template.containers[0].image !== plan.image
      || p.configuration?.activeRevisionsMode !== 'Single')) fail('voice_app_target_not_isolated');
```

### 3.12 Server-frozen private sample config + self-use attestation (adapt as a consent-receipt pattern)
`api/_private-voice-store.js` @ pvr25@f0246956
```js
export const PRIVATE_VOICE_STATEMENT='This recording is my own voice. Use it to make this private AI voice sample for me.';
...
export function privateVoiceSampleConfig(){
  const style={exaggeration:0.2,cfgWeight:0.78,temperature:0.6};
  return {version:'private-hindi-sample/v1',scope:PRIVATE_VOICE_SCOPE,text:PRIVATE_VOICE_TEXT,
    text_sha256:createHash('sha256').update(PRIVATE_VOICE_TEXT).digest('hex'),language_id:'hi',
    model_arm:'hindi_v3',model_commitment:OPEN_CHATTERBOX_HINDI_PACK_COMMITMENT,seed:31001,style,
    conditioning:voiceLanguageConditioning({languageId:'hi',referenceLanguageMode:'unknown',referenceLanguageEvidenceScope:'unverified',
      textLanguageMode:voiceScriptMode(PRIVATE_VOICE_TEXT).mode,requestedCfgWeight:style.cfgWeight,disclosureLanguageId:'hi'}),
    text_provenance:'server_fixed_sample',reference_language_provenance:'unassessed',
    identity_scope:'account_self_attestation',identity_claim_allowed:false,release_eligible:false,training_allowed:false};
}
```
```js
function inputRequest(input){
 const allowed=['action','replica_id','source_id','artifact_id','run_id','expected_snapshot_hash','statement_set','attestations'];
 if(Object.keys(input).some(k=>!allowed.includes(k)))fail('private_voice_unexpected_input',400);
```
DB-level enforcement (`db/migrations/171_private_voice_request.sql`):
```sql
 constraint vy_private_voice_output_path check(output_object_path=owner_user_id::text||'/'||replica_id::text||'/'||source_id::text||'/derived/private-voice/'||run_id::text||'.wav'),
 constraint vy_private_voice_scope check((receipt->>'scope'='private_voice_test' and receipt->>'statement_set'='private-own-voice/v1'
   and receipt->>'method'='account_attestation' and receipt#>>'{attestations,own_voice_private_use}'='true'
   and config->>'scope'='private_voice_test' and config->>'identity_claim_allowed'='false'
   and config->>'release_eligible'='false' and config->>'training_allowed'='false') is true),
 constraint vy_private_voice_ready check(state<>'ready' or (output_sha256 is not null and output_receipt is not null))
```

### 3.13 Studio CSP that permits Azure Blob upload + signed audio (adapt; replace account)
`vercel.json` @ pvr25@f0246956 (commit `39a7ffc8`)
```
connect-src 'self' https://vyaktireplicamedia.blob.core.windows.net; media-src 'self' blob: https://vyaktireplicamedia.blob.core.windows.net;
```

### 3.14 Azure Personal Voice SSML (adapt; note the en-US / English-disclosure bug) (inherited)
`api/_voice/providers/azure-personal-voice.js` @ pvr25@f0246956
```js
      const renderedText = renderTextWithDisclosure(text);
      const ssml = `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xmlns:mstts="http://www.w3.org/2001/mstts" xml:lang="en-US"><voice name="${xml(config.model)}"><mstts:ttsembedding speakerProfileId="${xml(profile.speakerProfileId)}">${xml(renderedText)}</mstts:ttsembedding></voice></speak>`;
```
`renderTextWithDisclosure(text)` defaults `languageId` to `"en"`, so Hindi text gets the English disclosure; `xml:lang` is fixed to en-US. Both must be parameterized before any Hindi use.

### 3.15 Honest run metrics (idea)
`services/internal-voice/runtime.mjs` @ pvr25@f0246956
```js
        r.metrics={total_ms:now()-started,model_elapsed_ms:synthesized.receipt.elapsedMs,duration_ms:pcm.length/48,real_time_factor:synthesized.receipt.realTimeFactor,first_audible_ms:null};return true;});
```
`first_audible_ms` stays `null` until the browser actually measures playback; nothing is guessed.


---

## 4. Measurements

Every number below carries n, method and date as logged in the source. Items tagged [inherited] predate this delta but are the only real (non-fixture) voice-quality evidence the delta builds on. Offline suite counts prove control flow only.

| # | claim | n | method | date | source |
|---|---|---|---|---|---|
| M1 | Time to first audio for a 5-sentence reply fell from mean 2001.5 ms (median 2001.4) to mean 400.7 ms (median 400.4), 5.00x, using per-sentence clips + buffer-one-ahead playback | 10 per arm, reproduced once | evals/room-speak-plan/benchmark.mjs: real voiceSequence.ts in Chromium, fake synthesizer 400 ms/sentence, both arms same page | 2026-09-13 | context/measurements.md#ws-r156-time-to-first-audio @ origin/codex/private-voice-requests25@f0246956 |
| M2 | Register classifier 60/60 (100%) on hand-labelled turns, en 20/20, hi 20/20, Hinglish 20/20; high-confidence calls 36/36; first run 59/60 until Devanagari matra (\p{M}) fix | 60 | evals/emotionos/run.mjs over authored fixtures, offline | 2026-09-13 | context/measurements.md#ws-r153-register-confusion-table @ origin/codex/private-voice-requests25@f0246956 |
| M3 | Register threaded end to end: compiled prompt carries a hint iff high-confidence non-neutral (60/60) and the voice prosody plan applies the same register (60/60); low-confidence row byte-identical to neutral | 60 (+2 sequential turns) | real roomSay/roomSpeak over fake Room, fixed clock | 2026-09-13 | context/measurements.md#ws-r176-register-in-reply-and-voice @ origin/codex/private-voice-requests25@f0246956 |
| M4 | Prosody proxy timing means: fast 1163 ms, medium 1594 ms, slow 2214 ms; slow/fast ratio 1.89-1.92 per language; strict ordering on all 60 lines (authored ms-per-char constants, not acoustic) | 60 lines x 3 plans | estimateProsodyTimingMs over evals/prosody/fixtures.mjs | 2026-09-13 | context/measurements.md#ws-r168-prosody-timing-table @ origin/codex/private-voice-requests25@f0246956 |
| M5 | Listening test suite grew 52 -> 63 -> 86 offline checks (verdict math, pair hash, activation guard, owner-only audio doors, method text) with negative controls; zero human verdicts on real audio | 86 assertions | node evals/listening-test/run.mjs | 2026-09-13 | context/measurements.md#ws-r155-listening-test-suite-2026-09-13, #ws-r163-..., #ws-r179-... @ origin/codex/private-voice-requests25@f0246956 |
| M6 | Azure Speech catalogue reachable with bound key: 774 voices, 18 hi-IN, 20 en-IN (proves key/endpoint, not synthesis or likeness) | 1 | Speech voices list GET | 2026-09-14 | context/measurements.md#wave25-runtime-bindings-and-live-integrity-20260914 @ origin/codex/private-voice-requests25@f0246956 |
| M7 | Internal voice runtime + controller: 37 -> 38 -> 40 node tests pass (real Chatterbox general/hi_v3 provider and real ARM controller over synthetic signed broker, ARM and Blob transports); one synthesis + one activation + one deactivation per run; duplicate request not replayed | 40 | node --test services/internal-voice/*.test.mjs | 2026-09-14 | context/measurements.md#wave25-internal-owner-voice-controls-20260914, #wave25-owner-anchor-effective-cfg-20260914, #wave25-exact-revision-template-controls-20260914 @ origin/codex/private-voice-requests25@f0246956 |
| M8 | Live infra: dedicated UMI grant verified, CPU service /healthz 200 (gpu_probed:false), retained 24 kHz reference primed (480,044 bytes); Hindi GPU dormant (3 revisions inactive, 0 replicas); zero synthesis/GPU activation | 1 | ARM/API readback receipts | 2026-09-14 | context/measurements.md#wave25-owner-grant-verified-20260914 @ origin/codex/private-voice-requests25@f0246956 |
| M9 | Azure returned different app vs revision template JSON for the same Hindi GPU (ephemeralStorage '' vs absent, revisionSuffix '' vs null, cooldown/polling populated vs null) -> separate hashes required | 1 | read-only ARM GET of app, revision and revision list | 2026-09-14 | context/measurements.md#wave25-exact-revision-template-controls-20260914 @ origin/codex/private-voice-requests25@f0246956 |
| M10 | Private voice request store/handler: 13 node:test cases pass (owner/session boundaries, immutable config, duplicate UUID, source/permission change, withdrawal/expiry, receipt tampering, erasure path); no live parse; fresh-reference effective Hindi CFG is 0 while requested is 0.78 | 13 | evals/private-voice/run.test.mjs with synthetic SQL results | 2026-09-14 | context/measurements.md#private-voice-request171-offline @ origin/codex/private-voice-requests25@f0246956 |
| M11 | Studio CSP: old policy blocked Azure upload, blob: playback and signed-origin audition; repaired policy accepted block+commit upload and decoded a 13 s WAV from blob and Azure origin | 16 checks | Chromium with exact production headers, Azure intercepted | 2026-09-14 | context/measurements.md#wave26-saved-audio-csp-20260914 @ origin/codex/private-voice-requests25@f0246956 |
| M12 | Owner phone failure diagnosis: n=5 /api/replica-source POSTs (201,201,200,202,202), zero 5xx, no PUT reached storage; Azure OPTIONS n=3 all 200 -> CSP (connect-src self, no media-src) was the cause, not CORS | 5 + 3 + 3 | read-only Vercel logs + Azure preflight probes + live header readback | 2026-09-14 | context/measurements.md#wave26-recording-upload-repair-20260914 @ origin/codex/private-voice-requests25@f0246956 |
| M13 | Mobile capture surface: zero overflow, 342 px panel, 44 px control floor (record 54, retry 48), min button contrast 6.13:1, 3 px focus outline | 20 renders | mounted CloneExperience in Chromium at 360/390/768/1440 px, synthetic 24 kHz mic | 2026-09-14 | context/measurements.md#wave26-silver-capture-mounted-states-20260914 @ origin/codex/private-voice-requests25@f0246956 |
| M14 | Identity audio decoder: 25 s WebM and MP4 -> 600,000 frames; 30 s -> 720,000; padded AAC 720,512 frames (30,021.33 ms) refuses 413 | 7 | 7 RealDecodeTests with FFmpeg/ffprobe 9.0.1, Python 3.14.2 | 2026-09-14 | context/measurements.md#wave25-worker-digest-native-decoder-and-ci-20260914 @ origin/codex/private-voice-requests25@f0246956 |
| M15 | Mobile auth CLS 0.109821 -> 0.002132 after reserving artwork geometry, opaque card (no backdrop-filter blur) and action-first order | deterministic per run | CI performance/visibility gates | 2026-09-14 | context/rejected.md#wave25-separate-premium-tokens-and-blurred-mobile-auth-broke-release-evidence @ origin/codex/private-voice-requests25@f0246956 |
| M16 | Studio TBT on a quiet machine: /studio median 104 ms, studio-hi 164 ms (budgets tightened to 220/260 ms) | 12 per target | scripts/check-performance.mjs | 2026-09-13 | commit 123aa347 / context/measurements.md#ws-r177-studio-tbt-on-a-quiet-machine-2026-09-13 @ origin/codex/private-voice-requests25@f0246956 |
| M17 | [inherited] Same 10 s owner reference, protected Azure Chatterbox: general Hindi ECAPA mean 0.858449 (p10 0.838685); Hindi pack 0.832045; fragmented Hinglish 25,980 ms at 0.433967; one-pass general Hinglish 7,720 ms at 0.825082; one-pass Hindi-pack Hinglish 9,240 ms at 0.826010; PerTh 1.0 on all | 2 Hindi clips per arm, 1 Hinglish per arm | 192-dim ECAPA evidence service, signed protected synthesis | 2026-08-29 | context/measurements.md (line ~15240) @ origin/codex/private-voice-requests25@f0246956 (inherited; identical at origin/codex/handoff206@20263775) |
| M18 | [inherited] Fragmented vs one-pass Hinglish near-silence frames 65.47% vs 24.58% | 1 clip per arm | analysis of saved owner-reference artifacts | 2026-08-30 | docs/gurukul/research/HINDI-HINGLISH-VOICE-QUALITY-FRONTIER-2026-08-30.md @ origin/codex/private-voice-requests25@f0246956 (inherited; identical at origin/codex/handoff206@20263775) |
| M19 | [inherited] Chatterbox on Azure serverless T4: warm 7.2 s wall / 4,359 ms service for 5,520 ms audio (RTF 0.79); first call on fresh replica ~17 s (RTF ~3.1); broker /healthz cold 21.8 s, warm 0.8 s | 3 synth calls + probes | real HTTP requests through HMAC broker, synthetic 6 s reference | 2026-08-26 | docs/gurukul/AZURE-DEPLOY-STATE.md §1, §8 @ origin/codex/private-voice-requests25@f0246956 (inherited; identical at origin/codex/handoff206@20263775) |
| M20 | [inherited] Cold start from zero: GPU scheduled +34 s, 9.70 GB image pulled by +114 s (78.65 s), ready +161 s, triggering request 504 at +242 s (ingress ~240 s, broker 220 s timeout) | 1 | platform log timeline | 2026-08-26 | docs/gurukul/AZURE-DEPLOY-STATE.md §8 @ origin/codex/private-voice-requests25@f0246956 (inherited; identical at origin/codex/handoff206@20263775) |
| M21 | [inherited] Cost: NC8as-T4 ~$0.53-0.60/hr active, $0 idle (scale-to-zero); standing ~$5/mo (ACR Basic); warm ~$0.0007 per utterance; one 161 s cold wake ~= 35 warm syntheses; warm 30 s clone speech ~1 cent vs cold request 23-35 cents | estimate | Central India list prices x measured uptime | 2026-08-26/29 | docs/gurukul/AZURE-DEPLOY-STATE.md §9; context/rejected.md#one-flat-voice-price-cannot-hide-cold-gpu-and-carrier-cost @ origin/codex/private-voice-requests25@f0246956 (inherited; identical at origin/codex/handoff206@20263775) |
| M22 | [inherited] Azure coral (stock neural) vs incumbent: Hindi words 15/15 vs 11/15, first audio 255 ms vs 4.9-12.7 s, $0.0029 vs $0.0148 per utterance, pitch 210 vs 266 Hz - rejected by owner ear for accent identity | 15 words; owner verdict | pronunciation battery + owner listening | pre-2026-08 | context/rejected.md#azure-tts @ origin/codex/private-voice-requests25@f0246956 (inherited; identical at origin/codex/handoff206@20263775) |
| M23 | [inherited] gpt-realtime-2.1-mini voice call: barge-in VAD 6/6, median 271 ms (incumbent 279); vision 5/5 correct, 0 fabricated; steady first audio 1458-1497 ms median (incumbent 1370); words/turn 41-53 vs 20.5; spoken turn median 14.0 s (p90 18.2); available voices 137-192 Hz | 72 turns | 9 sessions / 72 turns on startup credits | pre-2026-08 | context/rejected.md#realtime-azure @ origin/codex/private-voice-requests25@f0246956 (inherited; identical at origin/codex/handoff206@20263775) |
| M24 | [inherited] OpenVoice V2 tone conversion on IndicF5 base: ECAPA 0.726677 -> 0.680976, script-aware WER 0.3036 -> 0.375, CER 0.2562 -> 0.2975 | 2 | matched prompts, same 12 s reference, tau 0.3 | 2026-08-28 | context/rejected.md#openvoice-tone-conversion-regressed-owner-proxy-and-asr @ origin/codex/private-voice-requests25@f0246956 (inherited; identical at origin/codex/handoff206@20263775) |
| M25 | [inherited] VoxCPM2: three owner-bound clips on T4, ECAPA mean 0.766255; IndicF5 bounded equation normalization reduced symbol errors 4/4 -> 2/4 and numeral errors 3/5 -> 0/5 | 3; 4 and 5 items | ECAPA proxy; ASR-based error counts | 2026-08-30 | docs/gurukul/research/HINDI-HINGLISH-VOICE-QUALITY-FRONTIER-2026-08-30.md @ origin/codex/private-voice-requests25@f0246956 (inherited; identical at origin/codex/handoff206@20263775) |
| M26 | [inherited] Science listening pack: 12/12 clips verified (6 paired texts x 2 models), humanRatings 0, automaticWinner null | 12 clips | packaging receipt | 2026-09-09 | docs/handoff/2026-09-09/evidence/VOICE-LISTENING106-RECEIPT.json @ origin/codex/private-voice-requests25@f0246956 (inherited; identical at origin/codex/handoff206@20263775) |
| M27 | [inherited] hmac-skew: voice-evidence 60 s clock skew vs 176 s cold start -> guaranteed 401 on first request; warm-up via unauthenticated /healthz measured 194,505 ms | 1 | real cold call | 2026-08-26 | context/rejected.md#hmac-skew-shorter-than-cold-start @ origin/codex/private-voice-requests25@f0246956 (inherited; identical at origin/codex/handoff206@20263775) |

**What is NOT measured anywhere in this segment:** any human listening verdict on a generated clip; any real per-sentence or end-to-end TTS latency on the private lane; any likeness of a fresh account's voice; Azure Personal Voice synthesis; real prosody-plan acoustic effect; Hindi pronunciation accuracy of the borrowing lexicon.

---

## 5. Rejections (tried -> what broke)

Ordered: this delta first (R1-R32), then inherited rejections the delta explicitly builds on (R33-R41). These are the highest-value findings for Taxila.

**R1. Tried:** Express the EmotionOS prosody plan as SSML <prosody> inside azure-personal-voice.js, assuming 'Azure-only serving' meant Room voice uses Azure Personal Voice  
**What broke:** Reading api/room.js showed the live Room and studio preview both construct the Chatterbox provider; Personal Voice is not the live caller. Caught before code.  
**Taxila relevance:** Before wiring any voice feature, read the real dependency-construction site, not a policy name or registry comment.  
*Source:* `context/rejected.md#ws-r168-assumed-azure-personal-voice-was-the-live-room-provider @ origin/codex/private-voice-requests25@f0246956`

**R2. Tried:** Encode vibe/prosody identity into the existing style_key string to bust the preview cache  
**What broke:** voicePreviewStyle() 400s on any unknown key, so every 'hear the vibe' request would have failed. Fixed by folding planSha256 into regeneration_key instead.  
**Taxila relevance:** Cache/dedup keys for generated audio must include every parameter that changes the audio; check validators before overloading a key.  
*Source:* `context/rejected.md#ws-r168-vibe-encoded-into-style-key-throws-on-every-request @ origin/codex/private-voice-requests25@f0246956`

**R3. Tried:** Copy moment.ts's padT (strip non-\p{L}/\p{N}) into the register classifier  
**What broke:** Devanagari matras are \p{M}; 'हाहा' shattered into 'ह ह', laughter missed, 59/60. Fix keeps \p{M} and adds Devanagari laughter tokens -> 60/60.  
**Taxila relevance:** Any Hindi text normalizer for a child's typed/ASR answers must keep combining marks; same bug previously produced 74 single-glyph 'tokens'.  
*Source:* `context/rejected.md#ws-r153-padt-without-combining-marks-breaks-devanagari-laughter @ origin/codex/private-voice-requests25@f0246956`

**R4. Tried:** Derive the 'sounds like you' percentage by averaging the owner's 1-5 blind ratings and blending with the ECAPA cosine score  
**What broke:** Rejected before code: creates a second unvalidated scorer for one number; human perceptual ratings and embedding cosine are different instruments. Replaced by a separate listening_method field.  
**Taxila relevance:** Taxila parent reports must not blend teacher-observed comprehension with quiz scores into one number without a validating study.  
*Source:* `context/rejected.md#ws-r179-listening-method-does-not-recompute-the-fidelity-score @ origin/codex/private-voice-requests25@f0246956`

**R5. Tried:** A speak_plan endpoint returning {sentences,count} so the client can request clip i of n  
**What broke:** Would make a client-sent count load-bearing; replaced by recomputing the plan from the HMAC-bound reply on every call.  
**Taxila relevance:** TTS chunk endpoints should re-derive chunks from server-approved text, never trust client indices.  
*Source:* `context/rejected.md#ws-r156-a-plan-endpoint-that-trusts-a-client-count @ origin/codex/private-voice-requests25@f0246956`

**R6. Tried:** Test 'replay' by reusing an old session token after a newer turn and expecting refusal  
**What broke:** Session tokens are immutable and bind their own reply; that is a legitimate re-listen, not a replay. The real replay case is the new session asking to speak old text.  
**Taxila relevance:** Let a child re-hear an earlier explanation; refuse only text the current credential never authorized.  
*Source:* `context/rejected.md#ws-r156-an-old-session-replaying-its-own-reply-is-not-stale @ origin/codex/private-voice-requests25@f0246956`

**R7. Tried:** Prepend the voice activation guard's queries inside activateOwnedRuntime's atomic SQL; then a variant that activates and reverts on block  
**What broke:** Broke four suites that assert exact call order/count; the revert variant briefly makes a losing candidate active, violating law 4. Replaced by a wrapper that decides before the write.  
**Taxila relevance:** Gate voice/persona changes before the write, never 'activate then undo'.  
*Source:* `context/rejected.md#ws-r163-guard-queries-prepended-to-activateownedruntime-broke-four-unrelated-suites @ origin/codex/private-voice-requests25@f0246956`

**R8. Tried:** Treat vy_replica_profile.definition.speech (inferred from uploaded material) as the person's declared 'how I talk'  
**What broke:** Different system, row and authority; inferred claims can disagree with an explicit declaration. Built a closed declared policy instead.  
**Taxila relevance:** Keep the parent/teacher-declared medium of instruction separate from the language the model infers from the child's speech.  
*Source:* `context/rejected.md#ws-r180-replica-profile-speech-is-not-persontalk @ origin/codex/private-voice-requests25@f0246956`

**R9. Tried:** Initial internal owner voice runner used .5/.5/.8 style and unknown/unverified reference language  
**What broke:** Existing Hindi conditioning mapped unknown to effective CFG 0, so it could not reproduce the measured .2/.78/.6 identity-anchor baseline; a test also used a nonexistent wire field (effective_cfg_weight vs cfg_weight).  
**Taxila relevance:** A voice A/B is only meaningful if conditioning and seeds match the baseline; log requested vs effective parameters.  
*Source:* `context/rejected.md#wave25-unmatched-cfg-zero-is-not-baseline + #wave25-default-voice-conditioning-and-code-only-memory @ origin/codex/private-voice-requests25@f0246956`

**R10. Tried:** Make the retained owner-only internal voice runtime generic by removing its owner check  
**What broke:** Its Blob state holds one static reference, authorization, budget reserve and GPU exclusion; per-account copies would multiply budget and allow concurrent target activation. Replaced by per-request SQL attestations (migration 171) reusing the shared SQL GPU meter. A first SQL draft used USING after an ON join exposing duplicate owner tuple columns.  
**Taxila relevance:** Do not scale a single-tenant diagnostic by deleting its guard; budget and GPU exclusivity must be shared and per-tenant.  
*Source:* `context/rejected.md#private-voice-static-grant-expansion @ origin/codex/private-voice-requests25@f0246956`

**R11. Tried:** Assume the deployed CPU broker already implemented the six-field allocation callback; use fsync local files for attempt durability  
**What broke:** ARM metadata showed brokers had only HMAC/runtime origin config; no shared durable filesystem exists across Vercel/Container Apps. Switched to Blob ETag CAS and a documented broker rebuild.  
**Taxila relevance:** Verify deployed image capability by metadata/digest, not by source; serverless needs object-store CAS, not local files.  
*Source:* `context/rejected.md#wave25-deployed-broker-source-is-not-runtime-proof @ origin/codex/private-voice-requests25@f0246956`

**R12. Tried:** Controller assumed app template and target revision template serialize identically  
**What broke:** Azure returns different JSON (ephemeralStorage '' vs absent, revisionSuffix '' vs null, cooldown/polling vs null); runtime would refuse with revision_template_drift before synthesis. Bind both hashes; never normalize away fields.  
**Taxila relevance:** When pinning Azure Container Apps state by hash, pin app and revision documents separately.  
*Source:* `context/rejected.md#wave25-app-template-is-not-revision-template + #wave25-premium-gate-and-voice-template-shape @ origin/codex/private-voice-requests25@f0246956`

**R13. Tried:** Reuse four existing attachable managed identities for GPU lifecycle control; browser sign-in on employer laptop  
**What broke:** None had applicable role assignments; operator lacked roleAssignments/write. Owner forbade personal Microsoft browser use on that laptop. Solved with a dedicated UMI plus a five-action custom role run from a personal device.  
**Taxila relevance:** Least-privilege dedicated identities per capability; never assume attachability equals authority.  
*Source:* `context/rejected.md#wave25-attachable-identity-is-not-gpu-authority + #wave25-browser-login-and-assumed-identity-rights @ origin/codex/private-voice-requests25@f0246956`

**R14. Tried:** Treat a successful role-grant script output ('Verified') as the voice service being created  
**What broke:** Grant only confers permissions; CPU service, broker update, priming and supervisor were separate steps.  
**Taxila relevance:** Report infra steps by their actual effect.  
*Source:* `context/rejected.md#wave25-successful-role-grant-is-not-service-creation @ origin/codex/private-voice-requests25@f0246956`

**R15. Tried:** Studio deployed CSP connect-src 'self' only and no media-src  
**What broke:** Browser refused the cross-origin Azure Blob PUT after a 201 source authorization; blob: recording playback showed 0:00/0:00. Vite fixtures did not serve production headers so tests stayed green.  
**Taxila relevance:** Run recorder/upload tests against the real production CSP; this exact failure would hit Taxila's mic + Blob upload on Vercel.  
*Source:* `context/rejected.md#wave26-self-only-csp-killed-upload-and-local-playback + #wave26-vite-recorder-fixture-missed-production-csp @ origin/codex/private-voice-requests25@f0246956`

**R16. Tried:** Repair CSP by allowing Azure in connect-src only  
**What broke:** ProcessingReview sets a short-lived signed Azure URL directly on audio.src; media-src governs that, so the next listening action was still blocked.  
**Taxila relevance:** Signed media URLs need media-src (and img-src for images from gpt-image-2 stored in Blob).  
*Source:* `context/rejected.md#wave26-connect-src-does-not-authorize-saved-audio @ origin/codex/private-voice-requests25@f0246956`

**R17. Tried:** Accept green CI plus a retained-owner-only voice panel as product completion  
**What broke:** Owner on a phone could not complete audio/video upload: oversized capture, overlapping text, sticky notice, raw consent_pending/enrolling strings. API 201 is not upload success.  
**Taxila relevance:** Test the real phone journey with real headers; never show raw lifecycle enums to a child or parent.  
*Source:* `context/rejected.md#wave26-green-gates-and-owner-pinned-sample-are-not-product-completion + #wave26-floating-orb-and-fixture-layer-order @ origin/codex/private-voice-requests25@f0246956`

**R18. Tried:** Freeze the whole wavCapture.ts / recorder logic byte-for-byte as a merge control  
**What broke:** Blocked the requested playback validation and new recorder; frozen-file controls break on the next legitimate change. Narrowed to persisted saga, primary selection and PCM encode/resample invariants.  
**Taxila relevance:** Freeze invariants (WAV encoding, resample), not whole files.  
*Source:* `context/rejected.md#wave26-historical-recorder-freeze-and-missing-source-stubs + #frozen-file-merge-controls-break-on-the-next-change @ origin/codex/private-voice-requests25@f0246956`

**R19. Tried:** Leave new mobile recorder/upload suites unregistered (run only when called directly)  
**What broke:** Full releases would omit exactly the states that failed on the owner's phone.  
**Taxila relevance:** Every new capture/upload test must be in the release registry.  
*Source:* `context/rejected.md#wave26-unregistered-recorder-test-is-not-a-release-gate @ origin/codex/private-voice-requests25@f0246956`

**R20. Tried:** Place four rating controls in the left column of the two-column voice comparison  
**What broke:** At 390 px the right stage covered the lower-left controls and intercepted taps.  
**Taxila relevance:** Put rating/answer controls after media in normal flow on phones.  
*Source:* `context/rejected.md#wave25-internal-owner-voice-rating-overlap @ origin/codex/private-voice-requests25@f0246956`

**R21. Tried:** Decorative giant green dial / spinning 'scanning YOU' orb for recording  
**What broke:** Owner screenshots: cropped dial, instructions over the control, compressed paragraphs; read as a policy document with dead gaps. Replaced with compact silver waveform UI.  
**Taxila relevance:** Kids need one obvious recording control; avoid technical metaphors.  
*Source:* `context/rejected.md#wave25-green-everywhere-and-a-scanning-you-orb-are-not-premium + #wave26-floating-orb-and-fixture-layer-order @ origin/codex/private-voice-requests25@f0246956`

**R22. Tried:** 60 s liveness capture auto-stop; then exactly 30 s  
**What broke:** Decoder enforces MAX_FRAMES = RATE*30, so 60 s always refuses; 30 s has zero margin for scheduling/upload overshoot. Settled on 25 s.  
**Taxila relevance:** UI timers need headroom below server limits.  
*Source:* `context/rejected.md#standalone25-capture-duration-60s-rejected-20260914 + #standalone25-capture-duration-zero-margin-rejected-20260914 @ origin/codex/private-voice-requests25@f0246956`

**R23. Tried:** Read Face liveness result at latest.verifyResult  
**What broke:** Microsoft v1.2 nests it at latest.result.verifyResult; two fixtures repeated the wrong shape.  
**Taxila relevance:** Provider-shaped fixtures from official docs, not from your own parser.  
*Source:* `context/rejected.md#standalone25-face-v12-flat-result-rejected-20260914 @ origin/codex/private-voice-requests25@f0246956`

**R24. Tried:** Treat the voice program as blocked only by a missing Azure credential  
**What broke:** With access working, the real gap was a missing producer binding the visible person to the audible speech plus synthetic-risk decision; ASR + speaker embeddings do not supply that.  
**Taxila relevance:** If Taxila ever clones a voice (e.g., parent), consent/identity evidence is the hard part, not the API key.  
*Source:* `context/rejected.md#wave25-voice-blocker-was-not-only-a-credential + #wave25-public-verifier-is-not-internal-test-readiness @ origin/codex/private-voice-requests25@f0246956`

**R25. Tried:** Use Chromium's built-in fake audio device to drive the real recorder in tests  
**What broke:** Built-in tone clips (peak >= 0.995) and the real quality gate correctly refuses it. Use --use-file-for-fake-audio-capture with a generated non-clipping WAV.  
**Taxila relevance:** Direct recipe for Taxila's mic-flow browser tests.  
*Source:* `context/rejected.md#ws-r158-chromiums-built-in-fake-audio-device-clips-the-real-recording-quality-gate @ origin/codex/private-voice-requests25@f0246956`

**R26. Tried:** Loopback mock microphone created its AudioContext at module load  
**What broke:** Context started suspended under autoplay policy; the mock stream carried zero energy unnoticed. Resume inside the overridden getUserMedia.  
**Taxila relevance:** Same autoplay trap applies to Taxila's audio contexts on Android WebView.  
*Source:* `context/rejected.md#ws-r157-loopback-mock-microphone-context-never-resumed @ origin/codex/private-voice-requests25@f0246956`

**R27. Tried:** Rely on the hourly Vercel cron for automatic owner memory on a Preview deployment  
**What broke:** Vercel cron runs only on Production; Preview never consolidated. Added a narrow post-turn authenticated caller instead of a global drain.  
**Taxila relevance:** Taxila's memory consolidation after each lesson must not depend on Preview cron.  
*Source:* `context/rejected.md#wave25-preview-cron-only-memory-has-no-caller @ origin/codex/private-voice-requests25@f0246956`

**R28. Tried:** First text-ready Meet reply called the generator directly (billing_state not_metered)  
**What broke:** Bypassed the shared provider budget ledger; tests on other callers could not catch it.  
**Taxila relevance:** Audit every paid call site, not just the main path.  
*Source:* `context/rejected.md#wave25-first-reply-bypassed-shared-budget @ origin/codex/private-voice-requests25@f0246956`

**R29. Tried:** Report TypeScript success from tsc --noEmit on a project-reference solution  
**What broke:** Android CI exposed a widened role string; noEmit and Vite build both passed falsely. Use npx tsc -b --force.  
**Taxila relevance:** Taxila CI must run the composite build.  
*Source:* `context/rejected.md#wave25-noemit-solution-root-false-confidence @ origin/codex/private-voice-requests25@f0246956`

**R30. Tried:** Launch ten parallel agent workstreams at once (wave 24)  
**What broke:** Exhausted the session limit before any finished; WIP preserved as patches. Rule: five agents max, hourly WIP commits.  
**Taxila relevance:** Directly relevant to how Taxila's own build is orchestrated.  
*Source:* `context/rejected.md#ten-parallel-agents-exhausted-the-session-limit-before-any-finished @ origin/codex/private-voice-requests25@f0246956`

**R31. Tried:** Apply a preserved wave-24 patch wholesale onto the newer tree  
**What broke:** Predated the partial-forget requeue; forgotten content could be resurrected; three-way apply failed. Rebase behavior manually.  
**Taxila relevance:** When harvesting from these branches, port behavior onto Taxila's design rather than pasting old patches.  
*Source:* `context/rejected.md#wave25-r182-preserved-patch-precedes-current-forget-requeue + #wave25-stale-sources-patch-invented-a-quarantine-cause-and-underreported-removal @ origin/codex/private-voice-requests25@f0246956`

**R32. Tried:** [WIP patch] Reuse the shared deterministic fake processing adapters downstream of the anti-poisoning check  
**What broke:** Adapter name 'deterministic-fake'/version '0-test' trips the (fake|fixture|test|mock) regex that blocks synthetic evidence from building a voice genome.  
**Taxila relevance:** Keep a hard 'no fake/test adapter output in production artifacts' guard; relabel fakes locally in rehearsals.  
*Source:* `docs/handoff/2026-09-14/wave-24-wip/ws-r188-the-voice-programs-dry-run.patch (rejected.md hunk) @ origin/codex/private-voice-requests25@f0246956`

**R33. Tried:** [inherited] Move the companion's voice to Azure stock neural voice 'coral'  
**What broke:** Won every measured axis (15/15 Hindi words, 255 ms first audio, 5x cheaper) but owner heard it as 'not human and not Indian'; the battery measured pronunciation, not accent identity.  
**Taxila relevance:** Taxila's teacher voice bake-off must include accent authenticity as a first-class axis, judged by Indian listeners (kids + parents).  
*Source:* `context/rejected.md#azure-tts @ origin/codex/private-voice-requests25@f0246956 (inherited; identical at origin/codex/handoff206@20263775)`

**R34. Tried:** [inherited] gpt-realtime-2.1-mini for the voice call lane  
**What broke:** Barge-in and vision passed, latency close, but 41-53 words/turn and 14 s spoken turns (monologue), weak Hinglish ('doesna nahi chahiye'), and no voice near the target pitch; 'the prompt sets a ceiling, the model decides how close you get'.  
**Taxila relevance:** Taxila runs gpt-realtime-2.1: measure words/turn and turn length for child-appropriate brevity, Hinglish quality and voice choice before committing; build turn-length enforcement.  
*Source:* `context/rejected.md#realtime-azure @ origin/codex/private-voice-requests25@f0246956 (inherited; identical at origin/codex/handoff206@20263775)`

**R35. Tried:** [inherited] Synthesize each Hindi/English token run separately and join with 60 ms silence; use identity_anchor (.2/.78/.6) as default delivery  
**What broke:** Every switch reset seed/conditioning/prosody; clip 3.36x longer, 65.47% near-silence; anchor preset heard as flat and robotic.  
**Taxila relevance:** Never stitch code-switched TTS; one utterance per sentence. Note the private-voice branch deliberately reuses .2/.78/.6 for baseline comparability only.  
*Source:* `context/rejected.md#per-token-voice-fanout-and-flat-identity-anchor @ origin/codex/private-voice-requests25@f0246956 (inherited; identical at origin/codex/handoff206@20263775)`

**R36. Tried:** [inherited] OpenVoice V2 tone-colour conversion on top of an India-native base TTS  
**What broke:** Lost both identity proxy (0.727 -> 0.681) and intelligibility (WER 0.30 -> 0.375) on n=2.  
**Taxila relevance:** Do not plan a 'native TTS + voice converter' pipeline for a custom teacher voice without new evidence.  
*Source:* `context/rejected.md#openvoice-tone-conversion-regressed-owner-proxy-and-asr @ origin/codex/private-voice-requests25@f0246956 (inherited; identical at origin/codex/handoff206@20263775)`

**R37. Tried:** [inherited] Build a blind bench with opaque filenames only  
**What broke:** Every clone clip speaks 'This is an AI-generated voice replica' first, unblinding every trial; operator spot-checks unblind the only listener.  
**Taxila relevance:** Trim spoken disclosures identically across arms in any Taxila voice bench.  
*Source:* `context/rejected.md#disclosure-announces-the-clone @ origin/codex/private-voice-requests25@f0246956 (inherited; identical at origin/codex/handoff206@20263775)`

**R38. Tried:** [inherited] Sign a request then let it wake a scale-to-zero service  
**What broke:** 60 s HMAC skew vs 176 s cold start -> guaranteed 401 marked non-retryable. Wake on unauthenticated /healthz first.  
**Taxila relevance:** Any Taxila signed call to a scale-to-zero Azure service needs a wake-then-sign pattern.  
*Source:* `context/rejected.md#hmac-skew-shorter-than-cold-start @ origin/codex/private-voice-requests25@f0246956 (inherited; identical at origin/codex/handoff206@20263775)`

**R39. Tried:** [inherited] Quote one flat voice price; label cold GPU wakes as failed generations  
**What broke:** Warm vs cold vs always-warm are different products (1 cent vs 23-35 cents vs hundreds/month); 45 rows mislabelled failed taught the owner to retry useful wake work.  
**Taxila relevance:** Price model per lesson-minute must separate cold/warm; show 'warming up' honestly to kids.  
*Source:* `context/rejected.md#one-flat-voice-price-cannot-hide-cold-gpu-and-carrier-cost + #cold-gpu-attempts-cannot-be-model-failures @ origin/codex/private-voice-requests25@f0246956 (inherited; identical at origin/codex/handoff206@20263775)`

**R40. Tried:** [inherited] Build the Sarvam arm as a voice-cloning arm from marketing copy  
**What broke:** Public API exposes ~40 preset speakers only; no custom-voice endpoint (cloning only in Dubbing).  
**Taxila relevance:** Sarvam Bulbul is usable only as a stock Indian voice / pronunciation anchor.  
*Source:* `context/rejected.md#ws-r6-sarvam-cloning-from-the-marketing-page @ origin/codex/private-voice-requests25@f0246956 (inherited; identical at origin/codex/handoff206@20263775)`

**R41. Tried:** [inherited] Route Hindi automatically to the Chatterbox Hindi pack  
**What broke:** Hindi pack 0.832 vs general 0.858 ECAPA on matched clips; model switching did not fix the Hinglish failure.  
**Taxila relevance:** A language-specific model card is not evidence; bench before routing.  
*Source:* `context/rejected.md#hindi-pack-and-segmented-hinglish-cannot-be-promoted-from-this-pack @ origin/codex/private-voice-requests25@f0246956 (inherited; identical at origin/codex/handoff206@20263775)`


---

## 6. Concepts

- **Honest capability flags on every artifact** - Every voice run/receipt carries identity_claim_allowed=false, release_eligible=false, training_allowed=false, identity_scope (owner_asserted_internal | account_self_attestation) and scope; DB CHECK constraints enforce them. A private test can never be mistaken for public verification. *Taxila:* Child-data processing purposes (lesson, memory, parent report, model improvement) as explicit flags per artifact for DPDP.
- **Frozen server config + content hashes per request** - Clients send selectors and an expected snapshot hash; the server resolves sources, freezes text/model/seed/style/conditioning, hashes snapshot/receipt/config over canonical JSON, and re-checks authority before every effect. *Taxila:* Generated-module jobs and consent receipts should be immutable, hashed and re-validated before each paid step.
- **One acoustic utterance per sentence (never stitch code-switched audio)** - Hindi/Hinglish preview must be one model call; multi-segment plans fail closed. Code-switch quality is a model property; the frontend only normalizes spelling. *Taxila:* Teacher speech in Hinglish must be generated as whole sentences by one voice.
- **Audio only for already-approved text** - Speak endpoints accept only text whose hash is bound into an HMAC session minted by the safety-gated text turn; server recomputes chunking. *Taxila:* Child-safety: TTS cannot become a bypass for unsafe content.
- **Pronunciation is not accent identity** - A voice can pronounce 15/15 Hindi words and still be rejected as not human/not Indian; accent authenticity is a separate first-class axis. *Taxila:* Teacher-voice selection must be judged by Indian children and parents on accent/warmth, not by an ASR word battery.
- **Four-axis blind listening form with ties allowed** - owner_likeness, naturalness, indian_accent, pronunciation (1-5), randomized order, content-hash pair identity, tie stored as null winner; a losing candidate cannot be activated without a logged override. *Taxila:* Reusable for teacher voice choice and for any generated-audio module QA.
- **Never a second scorer** - Human ratings and automated metrics are displayed separately with their method and count; no blended number without a validating measurement. *Taxila:* Parent reports: observed comprehension vs quiz outcomes vs time-on-task stay separate, each with method and n.
- **Prosody as closed bands, not prose** - Emotion-to-voice mapping emits rate/energy/pitch bands, numeric pauses and bounded parameter deltas, never instruction text near a generation path (sentence-shaped text gets recited). *Taxila:* Emotional OS -> voice delivery for the AI teacher without prompt recitation.
- **Surface-feature register read, pull-only, high-confidence-only render** - Delivery register from text shape (length, punctuation, repeats, laughter, gap), never stored as a trait, rendered only at high confidence. *Taxila:* Cheap covert engagement signal on each child answer.
- **Supervised scale-to-zero GPU with deadlines and reservations** - Activate an exact pinned revision only inside a durable window, one-use child admissions per operation, independent supervisor deactivates at 420 s, 900 s planning envelope, micro-USD reservation, uncertain mutations retained not replayed. *Taxila:* If Taxila self-hosts avatar/video/TTS on Azure GPU, this prevents runaway GPU bills.
- **Wake-then-sign and never let a user request absorb a cold start** - Cold start (161 s) exceeds request timeouts (220-240 s) and HMAC skew (60 s); warm via unauthenticated health check, show honest warming state. *Taxila:* Lesson start should pre-warm any self-hosted model before the child arrives.
- **Ambiguous write reconciliation** - A failed client PUT may have committed; ask the idempotent server finalizer before retrying. *Taxila:* Recording uploads and module asset uploads on flaky Indian mobile networks.
- **Real-header, real-browser counterfactual tests** - Release gates serve the exact production CSP and prove both the failing old policy and the passing new one. *Taxila:* Vercel CSP for mic, Blob, gpt-image-2 images and generated HTML modules (iframe sandbox) must be tested this way.
- **Owner-observed evidence outranks green gates** - Phone screenshots from the owner superseded CI acceptance; 'green fixtures are not a complete product'. *Taxila:* Taxila acceptance must include real child/parent phone sessions.
- **Private-first internal testing before public verification** - Owner deferred enrollment review/compliance to test internally with explicit restricted authority, without relabelling it as public readiness. *Taxila:* Taxila can pilot with consenting families under explicit scoped flags while DPDP processes mature, without claiming compliance it lacks.
- **Critical-unit pronunciation checks for teaching content** - Listening texts carry criticalUnits (numbers with units, scientific terms, negations) that must be heard correctly. *Taxila:* Taxila TTS QA: every generated explanation's numbers/units/negations must be intelligible; a mispronounced 'नहीं' flips meaning.

---

## 7. What Taxila should do with this (recommendations)

1. **Teacher voice (tts-voice-identity).** Do not clone a child or parent voice for v1. Run a blind bake-off with the pv-12/pv-32 form between `gpt-realtime-2.1` voices, 2-3 Azure hi-IN/en-IN neural voices (18 hi-IN and 20 en-IN were listed on the bound key, M6), and optionally a licensed voice actor via Azure Personal Voice/custom neural voice (pv-04, needs Microsoft Limited Access). Axes: replace `owner_likeness` with "sounds like a kind teacher"; keep `naturalness`, `indian_accent`, `pronunciation`; listeners = Indian kids aged 6-15 and parents. R33 (Azure coral) proves pronunciation scores alone choose the wrong voice.
2. **Realtime lane.** `gpt-realtime-2.1` was not measured in this repo; its *mini* sibling was rejected for 41-53 words/turn and 14 s turns (R34, M23). Taxila must measure words/turn and spoken-turn length on child sessions in week one and enforce brevity (CLAUDE.md law: position is mechanism; sentence-shaped examples get recited).
3. **Hinglish/Hindi text frontend.** Port pv-01 + pv-02 `voiceScriptMode` into Taxila's TTS path for generated module narration (Azure TTS), extend the borrowing table with NCERT class 1-9 terms, and build a critical-unit pronunciation corpus from pv-31 (numbers+units, negations, scientific terms). Never stitch code-switched audio (R35).
4. **Generated-module narration.** Use pv-09 splitter + pv-10 sequencer + pv-11 "speak only approved text" binding for non-realtime audio (stories, module voice-over, avatar captions). Measure real per-sentence latency (only fake-synth measured here, M1).
5. **Emotional OS.** Adapt pv-08 register reader to child transcripts (re-label fixtures; short answers are normal for young kids) as one covert-comprehension signal, and pv-07 prosody bands to drive SSML for generated audio (slower, longer pauses when the child is confused). Render only at high confidence; never store as a trait.
6. **Consent and DPDP.** Model parental consent like pv-19: one receipt per processing purpose, server-frozen config, canonical-JSON hashes, re-check before every effect, reserved erasure paths, DB CHECK constraints on scope flags (`training_allowed=false` by default for children's data). Use pv-13 for parent replay of a child's session audio.
7. **Infra.** If Taxila self-hosts any GPU model (video avatar, open TTS), copy the envelope: pv-16/17/18/33/37 (scale-to-zero, exact pinned revision, deadlines, micro-USD reservation, independent supervisor, least-privilege role, wake-then-sign). Otherwise stay on Foundry managed endpoints.
8. **Web/Android audio plumbing.** Ship pv-23 capture (port ScriptProcessor to AudioWorklet), pv-24 reconciliation, pv-25 CSP with real-header tests (also `img-src` for gpt-image-2 assets in Blob), pv-26 mic quality gate as a pre-lesson mic check.
9. **Cost.** Reuse the pv-35 ledger for per-child daily caps across realtime minutes, image generation and module generation; separate cold vs warm costs in any price (R39).

---

## 8. Gaps / unread

- Not read: `services/open-voice-runtime` Python internals (app.py, broker.py, lora.py); `services/voice-evidence` Python beyond the frame ceiling; `services/azure-verifier` beyond the Face parser fix; ElevenLabs/Sarvam adapter internals (bench arms only).
- Read via context entries rather than line by line: the 219-line `api/_room-surface.js` delta and `api/room.js` speak wiring.
- Wave-24 WIP patches other than ws-r188 (memory, RelationOS, EmotionOS test-and-tweak, sources, sharing, my-data, evals sweep, phone Hindi) - not voice-focused.
- `context/graph.json` delta (18,576 lines) not traversed; of ~450 new context entries (149 rejections, ~150 decisions, ~150 measurements), roughly 60 voice-relevant ones were read in full.
- HumanOS/RelationOS/owner-memory/teacher-sheet deltas only where they touch voice; see sibling harvests (hp-vyakti-a/b, hp-handoffs).
- Inherited voice research docs dated 2026-09-06..08 (EXPERT-VOICE-BENCHMARK, VOICE-FRONTIER-NEXT-EXPERIMENT, VOICE179/182/183/184) were not in this delta and not re-read.
- No audio was listened to; committed owner-conditioned WAVs were intentionally not opened. No live call, SQL, or provider request was made by this harvest.
- **Open questions for Taxila the repo cannot answer:** real per-sentence TTS latency on any production provider; any human listening result on any generated clip; gpt-realtime-2.1 (non-mini) behavior with children; whether Azure Personal Voice approval is obtainable for an education use case; acoustic effect of the Devanagari borrowing table.

## Verification

Adversarial pass, 2026-10-02. Every cited path was read at `f0246956` (git archive into the scratchpad; source repo untouched). All 33 claimed paths exist at the ref and none is a spec-only stub. What changed is how much of each is reusable in Taxila.

Facts that apply to the whole segment:
- **Azure OpenAI realtime speaks for itself.** gpt-realtime-2.1 produces its own audio, so the Chatterbox-specific pieces (text frontend, prosody deltas, CFG conditioning, sentence-clip sequencing) only matter for a separate TTS lane. That lane would serve pre-rendered narration, Forge videos or the avatar, not the live call.
- **The Chatterbox lane has no quality evidence.** `context/measurements.md` records "no ABX ran" and "no sound-quality winner is claimed". `docs/gurukul/AZURE-DEPLOY-STATE.md` §8 records a 161 s cold start that killed the triggering request at 240 s, RTF 0.79-0.83 warm at CFG 0, and RTF 2.3-2.5 at CFG 0.5. The Hindi pack's cold start is "unacceptable for an interactive path".
- **Vendor arms never ran live.** The ElevenLabs and Sarvam arms were proven against recorded fixtures only, and the file header says so. Both are barred by Taxila's Azure-only directive.
- **Hard Vyakti coupling.** Most infra and DB files reference `vy_*` tables (replica, consent, lifecycle, spend), `_replica-storage`, `_provenance/contracts`, `_model-serving-policy` and `_auth`.
- **Per-sentence spoken disclosure is wrong for a tutor.** `contracts.js` prepends "This is an AI-generated voice replica." to every synthesis. `context/rejected.md#disclosure-announces-the-clone` already records this as a defect for benches.
- **Hardcoded identifiers.** The grant script (pv-18) and `vercel.json` hardcode the Vyakti subscription, tenant, principal and storage-account identifiers. They are not secrets, but they must be parameterised.

| id | exists | implemented | portable to Taxila stack | entanglement | quality | secret risk | corrected use | note |
|---|---|---|---|---|---|---|---|---|
| pv-01 | yes | yes | yes (node:crypto only) | `contracts.js`, `language-conditioning.js` | 3 | no | adapt | Counted 136 Roman-Hindi and 121 borrowings, not ~150 each. Borrowings are mostly voice-product vocabulary (clone, gpu, rlhf, tts, llm, login); only ~25 are classroom terms. The plan prepends the disclosure segment and collapses Hinglish to one `hi` segment. The "signed" plan is hash-only. Strip the disclosure and rebuild the lexicon from NCERT glossaries. |
| pv-02 | yes | yes | yes | none (84 lines, pure) | 3 | no | adapt | `voiceScriptMode` (12 lines) is generally useful. The cfg_weight=0 rule only matters for a Chatterbox zero-shot clone with a reference clip, which Taxila lacks. Keep the script counter and drop the rest. |
| pv-03 | yes | yes | partial | `allocation-boundary`, `_audio/wav`, `_provenance`, `_model-serving-policy`, `vy_*` SQL, `preview-authority`; Python runtime is 1945 lines | 3 | no | idea | Real and well pinned (broker.py, app.py, main.bicep, offline model closure). Cold start 161 s, no quality evidence, no streaming (whole signed clip per call). Unfit for the live tutor. HMAC request/response binding is the reusable idea. |
| pv-04 | yes | yes | partial | `_provider-budget` (`vy_provider_*`), `_replica-processing/contracts`, `_audio/wav`, `_provenance` | 3 | no | idea | No live run is recorded anywhere; the grant-script entry in `measurements.md` is the only hit. Needs Microsoft Limited Access approval. Vyakti demoted it. Use only if Taxila licenses a human teacher voice talent. Re-derive from the Azure REST docs. |
| pv-05 | yes | yes | no as-is | imports 3 vendor providers plus Azure and Chatterbox lanes | 3 | no | idea | ElevenLabs and Sarvam arms are fixture-only and forbidden by the Azure-only directive. Reusable ideas: one file owns lane order with a written reversal condition, and an env switch that throws instead of falling back. Skip the vendor files. |
| pv-06 | yes | yes | yes | `contracts.js` is standalone | 2 | no | idea | A spoken per-utterance disclosure of a "voice replica" is wrong for a tutor. Disclose once per session and in the UI. Hindi string is fine as raw copy. |
| pv-07 | yes | yes | partial | imports `_room-speak-plan` only | 3 | no | idea | Eval passes 20/20 standalone. Output fields (exaggeration, cfgWeight, temperature) are Chatterbox-only. `rejected.md#ws-r168-register-not-threaded-into-roomspeak`: every shipped caller passes `register: null`, so the register-to-voice path was never live. Timing proxy only; no acoustic measurement. |
| pv-08 | yes | yes | yes (pure TS, no imports) | none; the eval bundles `compiler.ts` | 2 | no | idea | Built for adult chat texting (lone-period = upset, missing punctuation = flat). Taxila input is child speech transcribed by STT, which carries no punctuation or letter repeats. Fixtures are 60 hand-authored turns checked against the author's own rules (in-sample). Detects delivery, not comprehension; the "covert comprehension cue" claim is unsupported. |
| pv-09 | yes | yes | yes | none (zero imports) | 4 | no | copy | Ran it: Devanagari danda, double danda, `Dr.`, `3.14`, `Fig. 2`, initials and `m/s` all split correctly. `run.mjs` needs Vyakti's `_room-surface.js` and `_config.js`, so rewrite the tests. Add science abbreviations (cm. etc.) and a `श्री` entry. Known false negative on a dangling `Dr.` is documented. |
| pv-10 | yes | yes | yes (framework-free TS, 97 lines) | none | 4 | no | copy | Correct and tiny. The 5.0x time-to-first-audio figure is n=10 against a fixed 400 ms fake synthesiser; real per-sentence latency is unmeasured. Applies only to non-streaming TTS, not to gpt-realtime. Independent per-sentence clips also risk prosody breaks, which is the opposite of the "continuous-utterance law" in pv-03. |
| pv-11 | yes | partial | no | `roomSay`/`roomSpeak` live in a 4330-line `_room-surface.js` (plus `room.js` 752 lines), with `vy_room_*` SQL and the engine bundle | 3 | no | idea | Server-recomputes-plan plus hash-bound reply is a sound pattern. The "register bound in session" part is inert (register is null in the shipped path). Re-implement in about 60 lines against Taxila's Director. |
| pv-12 | yes | yes | no | stores in `vy_replica_calibration`, `calibrationApi`, owner-self-voice semantics; migration 166 has no FK by Vyakti convention | 3 | no | idea | Built for an adult owner judging their own clone. Teacher-voice selection in Taxila is a one-off panel decision, better served by pv-32. Reusable ideas: crypto-shuffled order, pair hash, tie stored as null winner, activation guard. |
| pv-13 | yes | yes | partial | `_db`, `_auth`, `_ratelimit`, `_incidents`, `_replica-storage` | 3 | no | idea | Refusals are not fully uniform: 400 for a bad UUID and a single 404 code per door, but the two doors use different codes. CORS is `*` on a bearer door. Child-audio parent playback in Taxila needs a parent-child relationship check, not an owner check. |
| pv-15 | yes | yes | partial | `_replica-storage.internalVoiceStorageRequest`, `contract.mjs` | 3 | no | idea | The core is a 15-line If-Match/If-None-Match retry loop in minified style. Postgres on Neon already gives compare-and-swap, and `@azure/storage-blob` supports conditions natively. Do not copy; rewrite if ever needed. |
| pv-16 | yes | yes | yes (crypto only, injected fetch/token) | uses `lifecycle` store contract | 4 | no | adapt | 30/30 of `controller.test.mjs` pass standalone. A real ARM revision activate/deactivate controller with a window model. Useful only if Taxila self-hosts GPU TTS/avatar on Container Apps. 161 s cold starts mean scale-to-zero cannot serve live lessons. |
| pv-17 | yes | yes | partial | `runtime.mjs`, `contract.mjs`, controller (not in the claim) | 3 | no | idea | 19 lines. Self-hash and lease checks are sound but depend on the rest of the internal-voice service. Only worthwhile with pv-16. |
| pv-18 | yes | yes | partial | none (bash + az CLI) | 3 | identifiers only | adapt | Hardcodes Vyakti subscription, tenant and principal IDs; they are not secrets, but they must be parameterised. Doubles as a template for a least-privilege custom role. |
| pv-19 | yes | yes | no | FKs to `vy_replica`, `vy_replica_source`, `vy_replica_processing_artifact`, `vy_voice_app_lifecycle`; store imports `_replica-processing`, `_voice` | 3 | no | idea | Models an adult's attestation to use their own voice privately. It is not a parental-consent receipt, so reusing the DDL would mislead. Tests: 12/13 pass; the one failure is a missing `db/schema.sql` in my partial archive, not a code fault. Reuse only the canonical-hash receipt, strict-selector and idempotent-replay patterns. |
| pv-20 | yes | yes | no | imports `_private-voice-store` and fixtures | 2 | no | idea | 9 lines, specific to this store. The idea (EXPLAIN-only from the real parameterised statements) is cheap to redo. |
| pv-21 | yes | yes | no | `services/internal-voice/contract.mjs` and `http.mjs`, `_auth` | 3 | no | idea | Taxila deploys on Azure Container Apps, not Vercel, so a same-origin Vercel proxy is moot. The pattern of 404 unless configured, https and `.azurecontainerapps.io` origin pinning, redirect error and a response cap is the reusable part. |
| pv-22 | yes | yes | no | `localeContext`, `replicaApi`, `internalVoiceApi`, owner-only studio | 2 | no | skip | Admin studio for adult self-clones; no counterpart in a children's tutor product. |
| pv-23 | yes | yes | yes (browser APIs only) | none | 3 | no | adapt | The strict 24 kHz WAV inspector and the resample/encode are reusable. It deliberately turns AEC/NS/AGC off for cloning, which is wrong for a live call over speakers. No Capacitor or Android WebView test exists, so that claim is unverified. Recording a child's voice for cloning is not a Taxila goal. |
| pv-24 | yes | yes | yes | none (44 lines) | 3 | no | copy | Correct and trivial. Useful for any resumable upload (worksheet photos, recordings). |
| pv-25 | yes | yes | no | hardcoded `vyaktireplicamedia.blob.core.windows.net`; Chromium eval | 2 | no | skip | Taxila hosts on Azure Container Apps, so Vercel headers do not apply. Redo the CSP in the Taxila server. |
| pv-26 | yes | partial | no | gate is three lines inside a 1598-line `CloneExperience.tsx`; fake-mic generator is inside the 1599-line `evals/rehearsal/personal.mjs` | 3 | no | idea | Constants confirmed (peak < 0.995, audible ratio >= 0.35, 20 s fake WAV at 0.3 peak). Extract them; do not copy files. |
| pv-31 | yes | yes | yes | static HTML + manifest + 12 WAVs (7.6 MB) | 3 | biometric | idea | 6 pairs, `humanRatings: 0`, `automaticWinner: null`. Content is class 11-12 physics (pendulum, Ohm's law), not classes 1-9. The `criticalUnits` idea is good; rebuild it with NCERT 1-9 texts. Do not import the audio; it is cloned-voice biometric data and `reference.wav` is the owner's voice. |
| pv-32 | yes | yes | yes | `lib.mjs` depends on node crypto and fs only; the script is 885 lines | 4 | no | adapt | Sealed design is sound. No human quality result exists ("No human quality result or model winner exists yet"). Axes are owner-likeness oriented; retarget to clarity, warmth and child comprehension. Panel is a person, not 5-15-year-olds. |
| pv-33 | yes | yes | n/a (doc) | none | 4 | no | adapt | Measured and honest: 161 s cold start, 504 at 240 s, $0.53-0.60/hr T4, "quality unmeasured", "no load testing". Read the traps; the numbers are for Vyakti's subscription, not Taxila's grant. |
| pv-35 | yes | yes | partial | `db` function injection, but SQL hardwired to `vy_provider_budget`/`vy_provider_spend`; the file also holds vendor meters | 4 | no | adapt | Reserve, begin, settle, release and uncertain on Foundry token cost is a sound design for gpt-5.6/realtime cost control. Re-key the tables for Taxila; drop the OpenRouter and ElevenLabs/Sarvam meters. |
| pv-36 | yes | yes | no | `fromSheet.ts` (850 lines) and `compiler.ts` (2076 lines) | 3 | no | idea | Only the closed policy type {hindi\|hinglish\|english} and the 4-line `roomSpeakLanguageId` map are extractable. Taxila needs its own medium-of-instruction policy. |
| pv-37 | yes | yes | partial | Python FastAPI broker and a Node handler importing `allocation-boundary` (`vy_*`) | 3 | no | idea | Real and unit-tested in Python. The six-key binding (body_sha256, broker_origin, child_id, operation, runtime_origin, window_id) only pays off with a scale-to-zero GPU on a separate plane. |
| pv-38 | yes | yes | yes | needs Chromium plus esbuild | 3 | no | adapt | Real. It measures the loop against a fake 400 ms synthesiser, so it says nothing about real latency. |
| pv-39 | yes | yes | yes | fixtures standalone; the eval harness needs repo paths | 2 | no | idea | 60 self-authored turns (en/hi/hinglish, adult chat) and 60 prosody lines ("I am fine."). Neither has child speech, and prosody lines feed a timing proxy, not audio. Taxila needs its own labelled child corpus. |
