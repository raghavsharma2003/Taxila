# Harvest: hp-gurukul-chain (voice-cloning → gurukul-ws-v … ws-as → claude/gurukul-platform)

Harvested 2026-10-02 from `/home/user/html-portfolio`, read-only (`git show` / `git log` / `git diff` against refs; nothing
checked out, committed or pushed). `@GP` = `origin/claude/gurukul-platform` at tip `771feef9` (2026-08-28). Commit hashes are
cited where a claim comes from a commit body.

**Relation to `docs/harvest/gurukul.md`.** That report (read first, in full) already covers the product arc, the practice engine
(`session.ts`/`mastery.ts`/`practiceTalk.ts`), the teacher sheet and mentor arc, the safety floor, the Azure deploy gotchas, the
design system and the headline voice bake-off table. **This report does not repeat those.** It goes deeper on what that report
skimmed or missed: (1) the per-commit content of the ws chain, (2) the enrollment pipeline internals (DAG runner, diarization,
separation, enhancement, window selection, chunked long-media diarization, ASR, storage, format gates), (3) the synthesis-lane
mechanics (broker, warmup state machine, language conditioning, text frontend), (4) the listening/evaluation instruments in code,
(5) the practice store and runner, (6) the Mirror Call learning mechanics that transfer to learning-profile discovery, and (7) the
measured voice results and rejections from 2026-08-26..28 that were not in the earlier report.

**Secrets.** None copied. `api/_config.js`, `.sec/*`, `vyakti-local.env` were not read. A commit (`d448211e`) records that a local
handover file "holds nineteen live secrets" and is gitignored by name: secret present at `vyakti-local.env` (not in repo, gitignored).
Endpoint hostnames, Neon project ids, replica UUIDs and egress IPs that appear in `context/measurements.md` are deliberately omitted.

**Notation.** "[inference]" = my reasoning for Taxila, not something Gurukul measured.

---

## 1. What this is

### 1.1 The chain, commit by commit

Every `origin/gurukul-ws-*` tip has **0 commits not on `@GP`** (`git rev-list --count GP..ws-x` = 0 for all 20 branches), so the
ws branches are merged history. `git log prev..this` ranges overlap because workstreams branched from different points of GP;
the table names the commits that are genuinely each step's own work.

| step | own commits (range count) | what it built / found | depth here |
|---|---|---|---|
| voice-cloning..ws-v | 160 | founding merge `554cc5dd` + waves WS-A..U (teacher sheet, practice engine, Azure GPU deploy, first real clone `1412ffa9`, `c62f7d96` first-clone.mjs), then `956b747d` **earbench** | §5 |
| ws-v..ws-w | 3 | `1b2fc6e0` forget follows the person (32 widened statements EXPLAIN clean, 39/39 live); `4328281a` **Preview my voice** with honest 202-warming | §4.2 |
| ws-w..ws-x | 7 | `1ffe46ec` MIRROR-CALL-SPEC; `3a80f20e` WS-Z research; `a35327ab` **Mirror Call backend: approval is one SQL clause, voice loop SELECTS not accumulates** | §7 |
| ws-x..ws-y | 1 | `b9966ca2` Mirror Call tab: 30 s windows, two labelled fidelity meters, chip rail 3/min, fuzz over 4,000 event sequences | §7 |
| ws-y..ws-z | 1 | `3a80f20e` mirror-learning research sweep (Chatterbox truncates reference to 10 s / 6 s) | §7 |
| ws-z..ws-aa | 2 | `03179bc6` journey audit + tokens.css + landing | (in gurukul.md) |
| ws-aa..ws-ab | 14 | `9de5e89c` **per-speaker LoRA end to end**; `4631ab3e` one-adapter-per-expert gate; `844439d5` window beats finetune; `1a254d3d` Context Locker | §4.6 |
| ws-ab..ws-ac | 3 | `91bc4c78` Mirror Call reply lane through the one gated door, no fallback persona; 202 read as corrupt audio fixed | §7 |
| ws-ac..ws-ah | 6 | `9f5b5ee5` DESIGN-LAW; `9e7c66ce` copy gate; `3ac7e6b4` **Activity surface**; `da5897a8` **something drains the queue** | §3.2, §8 |
| ws-ah..ws-ai | 12 | `812132c5` **one link, one clone + window scorer** + YouTube verdict; `4abfec31` 3-step wizard; `fcc2a38e` extraction routes + PO-token measurement | §3.5 |
| ws-ai..ws-aj | 1 | `98efb8de` **blocker class (you/us) as a type**; phone layout stated | §8 |
| ws-aj..ws-ak | 8 | `280d811b` worker as a Job, **commit statement could never commit**; `c8c6513f` first evidence GPU round trip; `23dafa19` duration cap; `5fdeaa4d` **wake-then-sign, diarize completes** | §3 |
| ws-ak..ws-al | 7 | `08b00fc0` 4xx keeps status; `c28f0f31` audio-protection deployed, build proves model runs | §4 |
| ws-al..ws-am | 12 | `bcd4668a` 503 by shape; `b0cf01d5` AGENTS.md; `f371512b`/`f3fceac2` nine grid track bugs + layout gate on real signed-in fixture | §8 |
| ws-am..ws-an | 1 | `a9149e82` transcribe via Sarvam (confidence reported 0, language = hint not detection) | §3.6 |
| ws-an..ws-ao | 3 | `f444d328` **separate windowed to owner's diarized speech** | §3.4 |
| ws-ao..ws-ap | 3 | `079fc25e` refusal names its first unmet precondition (15 preconditions in one CTE); `32815ced` sticky pager deleted | §8 |
| ws-ap..ws-aq | 3 | `1ddcd22e` env var name nobody sets; `1621e01c` fixture repeated the typo; `65f36fec` REPLICA_SELF_TEST_MODE | §10 |
| ws-aq..ws-ar | 3 | `8f70c83f`/`a696339d` **enhance emits 24 kHz**, transform_version bump; `235c1855` proof | §3.3 |
| ws-ar..ws-as | 5 | `298c1599` **skip 16 kHz Sepformer when one speaker dominates; cut delivery window from the original at 24 kHz** | §3.4 |
| ws-as..GP | 30 | 4 Claude context commits (`4a92cb05`, `332c413b` owner's ear) + 26 owner-account commits with empty bodies (2026-08-27..28): long-media enrollment (TUS, chunked diarization, Azure Blob), Hindi conditioning, multilingual qualification runtimes (IndicF5/Qwen3/VoxCPM2/OpenVoice/ZONOS2/MOSS), sealed exact-text pack, **blinded model selection in Studio** (`771feef9`) | §3.5, §4, §5 |

The empty-bodied commits are documented only through the `context/*.md` entries they append (e.g. `771feef9` adds 354 lines to
`measurements.md`, 233 to `rejected.md`, 226 to `decisions.md`). Read those, not the commit messages.

### 1.2 Where it ended (2026-08-28)

- **Pipeline works end to end on real audio**: the owner's 822.72 s MP3 and a 1:49:31 / 262,879,879-byte lecture both completed
  all 8 DAG stages; a protected (PerTh-watermarked, disclosure-prefixed) 24 kHz preview plays in the Studio
  (`measurements.md#long-lecture-eight-stage-draft-live-2026-08-27`, `#long-lecture-preview-warmup-window-live-2026-08-27` @GP).
- **The clone still does not sound like the person** and no human listening panel ever ran; the final state is an instrument
  (sealed packs, in-app blind experiment with signed reports) with `overallWinner: null` by construction (`src/studio/voiceExperiment.ts` @GP).
- For Taxila (stock realtime voices, no cloning), the reusable value is: **the async media DAG + worker discipline, the
  diarization/signal-quality service, the format/bandwidth gates, the cold-start honesty machinery, the listening instruments,
  the hypothesis-with-n learning mechanics, and ~50 rejections**.

---

## 2. Architecture of the enrollment lane (as built @GP)

```
browser ──signed TUS (6 MiB chunks) / Azure Blob block upload (CRC64-NVME LE)──► private storage
   │                                                                              │
   └─ POST source ─► vy_replica_source (quarantined) ─► integrity job queued      │
                                                                                  ▼
Azure Container Apps JOB  vyakti-replica-processing  (*/5 cron, 1 h replica timeout, 3,300,000 ms budget)
  run-once.js → runProcessingSweep → runNextProcessingJob (lease → execute → settle), maxAttempts 5
     integrity ─► malware_scan (clamd --fdpass on mode-0600 temp file) ─► media_probe (ffprobe on FILE)
        ─► diarize (14-min chunks, 60 s overlap) ──► voice-evidence GPU /v1/analyze  (wake on /healthz, THEN sign)
        ─► separate: best 10 s window of dominant cluster; Sepformer only if dominantShare < 0.90
        ─► enhance: DeepFilterNet3 @48 kHz, 2 variants, resampled to 24 kHz
        ─► transcribe: Sarvam batch (saaras:v3), stream with Content-Length, confidence 0
        ─► voice_quality: ECAPA + x-vector embeddings + signal quality
  settle: commitProcessingOutput (evidence rows + immutable artifacts), next step queued, or retry/blocked/failed
Vercel: /api/replica-activity (one job shape for 7 lanes) ─► Studio ActivityPanel (backoff 3 s→30 s, stop when idle)
```

Paths: `api/_replica-processing/{pipeline,runtime,queue,repository,worker,composition,sweep,native-tools,reference-window,
chunked-diarization,capability-codes,self-test}.js`, `api/_replica-processing/providers/{azure-voice-evidence,sarvam-transcription,
native-media,fake}.js`, `services/voice-evidence/app.py`, `services/replica-processing-worker/{run-once.js,clamav.js,db.js,infra/*.bicep}`,
`api/_video-enroll/windows.js`, `api/_audio/wav.js` — all @GP.

---

## 3. The enrollment pipeline in depth

### 3.1 The DAG and failure classification (`api/_replica-processing/pipeline.js` @GP)

- `AUDIO_PROCESSING_DAG` is a frozen linear chain of 8 steps; non-audio/video kinds get **no** initial job ("silently treating them
  as audio would manufacture evidence").
- `retryDelayMs(attempt, code)`: exponential `2000·2^(n-1)` capped at 1 h, plus a **stable jitter** derived from
  `sha256(code:attempt)` mod 751 ms, "avoids worker herds without making offline replay nondeterministic".
- `classifyProcessingFailure`: retry while `retryable && attempt < 5`; else `blocked` for `integrity_mismatch`/`malware_detected`,
  otherwise `failed`.
- Capability absence is a third outcome: six codes in `capability-codes.js` (`private_storage_not_configured`,
  `malware_scanner_unavailable`, `media_probe_tool_unavailable`, `reference_window_tool_unavailable`, `voice_evidence_unconfigured`,
  `asr_unconfigured`) route to `blocked` + "wait", never `failed` + "fix input"; the sweep requeues them (attempt reset to 0) once
  the capability is live (`decisions.md#capability-absence-is-not-a-failed-recording`, `#every-step-always-has-an-adapter`).

### 3.2 Worker runtime and the four hidden blockers

Found only by running on real bytes (commits `da5897a8`, `280d811b`, `c8c6513f`, `5fdeaa4d`):

1. **No caller.** Producer (`_replica-source.js` enqueued `integrity`) and runner (`runNextProcessingJob`) were both complete; nothing
   connected them. The owner's 32.9 MB upload sat `queued/attempt=0` with a null lease while every screen animated it as in progress.
2. **The commit could never commit.** `commitProcessingOutput` validated its own inserts by re-reading the tables in the same
   statement; data-modifying CTE rows are invisible to the rest of the statement, so the guard's deliberate `1/0` always fired
   (SQLSTATE 22012). Production held **0 evidence rows and 0 artifact rows, ever**; only the two steps that write neither had ever
   completed (`measurements.md#commit-guard-had-never-committed-evidence`). Fix: a row is valid if this statement inserted it OR an
   identical one already existed; a lost lease now says `lost_processing_lease`.
3. **Packaging.** `clamdscan` is only a *Recommended* of `clamav-daemon` (`--no-install-recommends` shipped a daemon with no client);
   `ffprobe` cannot read an MP3 duration from `pipe:0` (`format: {}` vs `"duration": "822.720000"` from a file path).
4. **Signature vs cold start.** The evidence service allows 60 s skew; the client signed before Container Apps held the request for
   ~161 s; first request after scale-to-zero always 401. Four sign-then-send attempts failed; **wake-then-sign completed a cold
   attempt in 50 s** (n=5, `measurements.md#wake-then-sign-unblocks-the-evidence-lane`). Attempt 3 returned
   `voice_evidence_response_signature_invalid`: an ingress error page during activation is indistinguishable from a tampered response.

Other runtime facts worth copying: ClamAV signatures baked at build (`main v63` 3,287,027 sigs, `daily v28104`), clamd started only
when the queue holds a scan step (idle execution 23 s vs ~33 s; at `*/5` = 288 executions/day), clamd child retained and killed in
`finally` (a foreground daemon otherwise kept a finished execution `Running` for 15+ min), and
`processingUnexpectedErrorDiagnostic()` emits only `{type, safe message, repo frame}` — that is how the
`evidence.value.diarize is not a function` bug at `composition.js:192:37` was found in one retry.

### 3.3 The voice-evidence service (`services/voice-evidence/app.py` @GP)

One FastAPI endpoint `/v1/analyze` with four operations behind an HMAC transport (protocol `vyakti-voice-evidence/v1`, timestamp +
nonce + body sha256 signed, 60 s skew, in-memory nonce replay cache, **signed responses**). Inputs are base64 audio with a declared
sha256; the service "never receives an account, replica, person, transcript, or provider ID". Caps: 32 MiB audio (env, hard max 48),
duration env default 600 s with a **compiled hard ceiling of 1,200 s**.

| op | mechanism (verbatim parameters) | output |
|---|---|---|
| `diarize` | Silero VAD (`threshold=0.5, min_speech_duration_ms=350, min_silence_duration_ms=180, speech_pad_ms=80`) at 16 kHz; each speech span cut into ≤8 s chunks (≥0.5 s); ECAPA (SpeechBrain VoxCeleb) embedding per chunk; **greedy online clustering**: assign to best centroid if cosine ≥ `0.68` (env, bounded 0.4–0.9), else open a new cluster up to `max_speakers=4` (env ≤8); running-mean centroid renormalised | segments `{start_ms,end_ms,speaker_key:"cluster-N",confidence=(cos+1)/2, target_likelihood:0.5, overlap:false}`, `target_anchor_used:false`, `overlap_detector:"not_available"` |
| `separate` | SpeechBrain `sepformer-whamr16k` over the whole input in one forward pass | 2 candidates `speaker-1/2`, `subject_selection_required:true` |
| `enhance` | DeepFilterNet3 at its native 48 kHz, two variants: `identity-preserving` (`atten_lim_db=12`) and `noise-suppressing` (no limit); output resampled with `torchaudio.functional.resample` to **24 kHz** | up to 8 candidates, `transform_version: deepfilternet3-enroll24k-v1` |
| `voice_quality` | per input: ECAPA (192-d) + x-vector (512-d) embeddings; `_signal_quality`: duration, usable speech ms (VAD), voiced ratio, RMS dBFS, **SNR = RMS(all)/RMS(non-speech)**, clipping ratio (|x|≥0.999); confidence = `min(1, speech_ms/10000)` | embeddings + measurements; `held_out_cross_source_calibration_required:true` |

Design facts:
- `target_likelihood` is **0.5 on every row by design**: "No target anchor is available in source processing. A human must identify
  the subject cluster; pretending otherwise would poison identity." Two evals gate that refusal.
- Measured on 822.72 s: 278 segments, mean confidence 0.877; cluster-1 663.5 s/231 segs, cluster-2 25.9 s/39, cluster-3 2.7 s,
  cluster-4 4.4 s, 0 overlaps (`#wake-then-sign-unblocks-the-evidence-lane`).
- **x-vector raw cosine is unusable**: clone vs reference 0.9974 (p10 0.9972) where ECAPA said 0.7753. "x-vectors need PLDA scoring
  to discriminate and a bare dot product over them saturates" (`measurements.md#first-real-clone`).
- `separate` on the whole 822.72 s file (13,163,520 samples in one tensor on a T4) failed 5/5 with the bare catch-all
  `voice_evidence_failed`; replica `restartCount` stayed 0, so an in-process catchable CUDA OOM is the structural diagnosis; the
  handler also would have returned ~70 MB base64 against an 80 MB client cap (`#separate-fails-on-the-whole-recording`,
  `#separate-underlying-error-confirmed-structurally`). The bare `except Exception` with **zero logging** is why no traceback existed.

[inference, Taxila] This service is the most directly reusable *analysis* asset for a voice tutor that will never clone: VAD +
speaker clustering + signal quality over a session recording answers "how much of this answer was the child's voice?", "was a
second voice prompting?", and "is this mic usable?". Two cautions: ECAPA/x-vector are VoxCeleb (adult celebrity) models, so child
voice clustering accuracy is unmeasured and must be benched on consented child audio before any decision rides on it; and a child's
voice embedding is sensitive personal data under DPDP, so store segments/statistics, not embeddings, unless guardian consent covers it.

### 3.4 Reference-window selection and the bandwidth bug (`reference-window.js`, `windows.js` @GP)

`windows.js` `rankReferenceWindows(bytes, {segments, minPurity, limit})` is **pure** (bytes in, numbers out; ties break on start
time; values rounded so determinism is assertable). 10 s windows (`WINDOW_MS`, "because that is what s3gen keeps"), 5 s hop, 20 ms
frames, 16 kHz PCM16 mono only (other rates refused, not resampled, so scores stay comparable). Per-file noise floor =
`min(p10(frame RMS), 0.2·median)`; voiced threshold = `max(60, min(3·floor, 0.4·median))`. Score (a stated prior, not fitted):

```
0.45·min(1, voiced/0.9) + 0.25·min(1, SNRdB/25) + 0.15·1/(1+spread) + 0.15·min(1, median/3000)
 − min(0.6, 12·clippingFraction) − 0.5·(1 − purity)   [purity only when diarization present]
reject: purity < 0.75 → multiple_speakers ; voiced < 0.4 → mostly_silence
```

Stats keep `head_window_score/rank` and `selected_over_head_delta`, i.e. how much better than "first 10 s" the choice was. Every row
carries `score_source: "wav-signal-probe/v1"` because it is a proxy, never ECAPA fidelity.

`reference-window.js` (WS-AO/AS): pick the cluster with the most diarized speech (`ownerClusterSegments` also returns
`dominantShare`), merge same-cluster segments with gaps ≤1,200 ms into runs, keep runs ≥10 s, extract at most 900 s of them via
ffmpeg, score each with `rankReferenceWindows`, keep the best. Then — the WS-AS fix — **re-cut the winning span fresh from the
ORIGINAL file at 24 kHz** (never deliver the 16 kHz scoring buffer), sanity-check the duration within 200 ms, and if
`dominantShare ≥ 0.90` skip Sepformer and emit a labelled `reference-window-passthrough` candidate.

The measured bug it fixed: the shipped reference had **0.000458%** of energy ≥8 kHz (79.61% 0–1 kHz, 10.43% 1–4 kHz, 9.50% 4–8 kHz,
0.46% ≥8 kHz in the comment's band split) — "8 kHz audio wearing a 24 kHz label" — from two causes: Sepformer runs at 16 kHz
unconditionally, and the scoring buffer was reused as the delivery buffer. After: **0.0224% (~49x)**, window score 0.8067 over 27
windows, dominantShare 0.9528 (`measurements.md#enrollment-reference-bandwidth-before-after`, n=1 pair, 2026-08-27). The owner, n=1
by ear: full-bandwidth "better", both "far from acceptable" (`#owner-ab-reference-quality-audible`).

[inference, Taxila] `rankReferenceWindows` is a ready, dependency-free "is this audio clean speech?" scorer for a mic-check step on
first launch (Android phones often route a Bluetooth headset mic through an 8/16 kHz HFP path) and for picking clean child
utterances for any offline ASR evaluation set.

### 3.5 Long media (2026-08-27, `decisions.md#large-replica-media-is-direct-disk-bounded-and-chunked`)

"A larger numeric upload cap alone leaves three independent ceilings" (browser monolithic PUT, 64 MiB heap read, 20-min evidence
ceiling) plus ClamAV INSTREAM's 70 MiB `StreamMaxLength`. Replacement:
- Signed TUS upload in 6 MiB chunks (separate public key + short-lived signature; issuance fails if public and service keys are
  identical), later Azure Blob block upload with **CRC64-NVME checksums little-endian** (big-endian returned HTTP 400; a 54,526,075-
  byte upload then completed in 7 blocks; unsigned read 409, commit replay 403, same-SAS path mutation 403 —
  `measurements.md#azure-blob-platform-and-contract-local-2026-08-27`).
- Worker streams the original to a mode-0600 temp file while hashing; ClamAV gets it by `--fdpass`; removed in `finally`.
- `chunked-diarization.js`: 14-min WAV chunks with 60 s overlap (bounds 1–15 min, overlap 5 s..chunk/2, ≤64 chunks). Local labels
  are joined across chunks **only where the same absolute-time speech overlaps**, greedily by overlap ms; "An ambiguous or silent
  boundary creates a new global speaker instead of guessing identity. That can split one person conservatively; it can never merge a
  guest into the owner merely because both were locally called `cluster-1`."
- Lease raised to 1 h so a two-hour Sarvam batch is not leased twice.
- Result on the 1:49:31 lecture: upload ~47 s; 8 stages complete; **1,683 speaker segments, 288 transcript spans, 288 language spans;
  transcript 72,921 Devanagari vs 555 Latin characters**; VoiceGenome draft build 21 s
  (`#long-lecture-eight-stage-draft-live-2026-08-27`). Six live defects were found on the way (adapter version `+` outside the safe
  alphabet; composition calling the adapter object not its method; Sarvam stream upload 400 until `Content-Length` and a truthful
  `.mp3` name were bound; ClamAV started only for pre-existing scan jobs; clamd outliving the run; readiness reading only the newest
  300 review rows, which displaced all 1,683 speaker rows).

### 3.6 ASR through Sarvam (`api/_asr/providers/sarvam-saaras.js`, `providers/sarvam-transcription.js` @GP)

- Batch protocol: init → upload to `<directory-SAS>/<name>?<sas>` (PUT to the bare directory = 409) → start → poll
  `/speech-to-text/job/{id}/status` (the guessed `/job/{id}` 404s forever and was read as "still running") → list the output
  directory and fetch the blob named by input index (`0.json`). Poll 5 s × 120.
- Sync `saarika:v2.5`: 25 s → 4,134 ms; **hard 30 s cap** (71 s → HTTP 400). Batch `saaras:v3`: 71 s → 136,874 ms, 5 diarized turns;
  the same bytes again → 12,024 ms because Sarvam caches on `audio_hash` (`measurements.md#first-real-clone`).
- Confidence is reported as **0** ("Sarvam's batch API returns none, at any granularity") so unscored text cannot pass the 0.55 claim
  gate; `language` is the request hint, not a detection; later switched to automatic language detection instead of forcing `hi-IN`
  (`decisions.md#hindi-voice-release-separates-mitigation-from-model-promotion`).
- Pricing was unresolved (₹30/hr vs ₹45/hr with diarization vs ₹90/hr from different sources) so the lane is env-gated and kept out
  of the spend fence: "a fence built on a rate that might be 3x wrong is a fence that reports a budget it is not holding".
- Reuse trap: routing `transcribe` through the shared ASR registry would have let a self-hosted lane receive a signed **pull URL**,
  breaking the DAG's bytes-only invariant the day an unrelated env var was set (`rejected.md#registry-selection-leaks-a-pull-url-into-the-dag`).

[inference, Taxila] Sarvam output for Hinglish speech is ~99% Devanagari (72,921 vs 555 chars on a real lecture). Any Taxila
comprehension signal computed from child transcripts (keyword match against an answer key, teach-back overlap) must normalise script
first, using the raw-vs-script-aware split already in `evals/speech/hinglish-script-score.mjs`.

### 3.7 Format and bandwidth gates

- `scripts/check-enrollment-sample-rate.mjs`: the enrollment rate (24,000) is named in four files across two languages and three
  deploy boundaries (`api/_audio/wav.js`, `api/_voice/contracts.js`, `services/open-voice-runtime/app.py`,
  `services/voice-evidence/app.py`); the gate mirrors each and asserts agreement, with a negative control pinning one at 48 kHz.
  Written after **23 real failed generations** with `wav_format_unsupported` (enhance emitted 48 kHz).
- `scripts/check-enrollment-bandwidth.mjs`: dependency-free radix-2 Hann FFT; threshold `MIN_ENERGY_ABOVE_8KHZ_FRACTION = 0.00003`
  calibrated between the broken (0.000458%) and fixed (0.0224%) real readings after a first guess of 1.5% failed the fix itself.
- `transform_version` must change whenever a transform's OUTPUT changes for the same input (artifact identity is keyed on it,
  not on bytes: re-run collided with 23505), and stay inside an 80-char `[a-z0-9._-]` alphabet.

[inference, Taxila] gpt-realtime audio is PCM16 24 kHz mono both ways; the same "mirror the constant, assert the mirrors agree" gate
should cover the Android capture path, the web capture path, the server relay and any TTS fallback.

---

## 4. Synthesis-lane mechanics

### 4.1 Admission broker and HMAC transport (`services/open-voice-runtime/broker.py` @GP)

A 0.25-vCPU public broker verifies HMAC (protocol, method, path, timestamp, nonce, body sha256), 60 s skew, nonce replay cache, size
caps, **before** anything can wake the private GPU app ("Random internet traffic can wake only the CPU broker, never the GPU
workload"). It checks the runtime's `/healthz` (returns `open_voice_runtime_warming` 503 if not ready), then **re-signs a fresh
internal request** (new timestamp + nonce), verifies the runtime's response signature against the internal nonce, and re-signs the
response against the caller's nonce. This re-sign exists because a cold broker forwarding the caller's original signature expired
inside the private cold start (`rejected.md#a-cold-broker-cannot-forward-the-original-expiring-signature`, IndicF5, 2026-08-28).

### 4.2 Cold-start honesty (`api/_voice/warmup.js`, `api/_voice/preview-panel.js`, `src/studio/VoicePreviewPanel.tsx` @GP)

- Three states `warm | warming | cold` in a bounded per-process registry; **a wake clears the ready belief** (two independent
  timestamps let a 504 leave "warm" standing and the next click hang for 4 minutes — `rejected.md#warming-that-does-not-clear-warm`).
- Wake the broker on unauthenticated `/healthz` (budget 45 s, under the 60 s skew), dispatch the synthesis, stop *waiting* after a
  12 s flush (never abort the request), answer `202 warming` with stage, ETA range and Retry-After. 202 is `response.ok`, so a
  client must test it before the ok check (it surfaced as an "audio integrity error" — `rejected.md#mirror-turn-voice-202-read-as-corrupt-audio`).
- Measured live: the first design (6 polls / 180 s) stopped exactly at the top of its own advertised "2–3 minutes"; 7 polls crossed
  the 200 s in-flight window but stopped on the second synthesis' warming response; final design: **10 polls over 300 s, a late
  provider success marks warmth without sealing the abandoned generation, copy says 2–5 minutes**; same-click trace completed in
  ~4 min 50 s (`measurements.md#long-lecture-preview-warmup-window-live-2026-08-27`). The wait survives tab switch/reload via
  sessionStorage (`32815ced`).

### 4.3 Language conditioning (`api/_voice/language-conditioning.js` @GP)

`voiceScriptMode(text)` counts Devanagari (U+0900–097F) vs Latin letters → `devanagari | mixed | latin_only | unknown`. For Hindi
synthesis, a `latin_only` or `unknown` reference forces **effective CFG 0** (Chatterbox's documented accent-transfer mitigation) and
records requested vs effective CFG, evidence scope (`source_transcript | exact_reference | unverified`) and warnings. "`latin_only`
is not called English: the transcript may be romanized Hindi." A requested CFG alone cannot identify what ran
(`rejected.md#requested-cfg-without-reference-evidence-is-not-an-ab-arm`). Measured latency side effect, n=1 per arm
(`#chatterbox-matched-blind-pack-live-2026-08-28`): general Devanagari CFG 0.5 **RTF 2.481** vs CFG 0 **RTF 0.781**; Hindi pack
CFG 0.5 RTF 2.287 vs CFG 0 RTF 0.824; general English RTF 0.833. No quality claim.

### 4.4 Hindi text frontend (`api/_voice/hindi-text-frontend.js` @GP)

Tokeniser keeps combining marks (`\p{L}[\p{L}\p{M}'’]*`). A reviewed, bounded Roman-Hindi table (~95 entries: aaj, aap, accha, hai,
hoon, kya, nahi, samajh, ...) and classroom borrowings rendered in Devanagari (chapter, concept, equation, formula, maths, physics,
question, science, teacher, topic ...) "because this is how Hindi TTS models preserve an Indian pronunciation without pretending the
word is Hindi". Unknown Latin stays byte-identical in an explicit English segment; output is ordered segments (`hi,en,hi`) joined by a
declared 60 ms zero gap; >16 segments refused; every transformation points at exact UTF-16 input slices; `the` and `he` are excluded
as confusables (`rejected.md#the-is-not-a-safe-unconditional-roman-hindi-alias`).

### 4.5 Model-load and receipt discipline

- `hindi_pack.py`: `strict=False` load is allowed only against an env allowlist of missing/unexpected keys, and **stale allowlist
  entries also fail** (the Hindi pack legitimately misses `tokenizer._mel_filters`, `tokenizer.window`).
- `duration_control.py`: F5 sizes frames by UTF-8 bytes, so Devanagari (3 bytes/char) planned 23.1–31.7 s instead of ~11.1–13.9 s and
  two requests hit the 4,096-frame cap; divide by relative bytes-per-codepoint density, clamp speed 0.75–3.5, refuse >30 s.
- PerTh works on 240-sample frames: pad only for framing, watermark, trim back to the exact length, then detect
  (`rejected.md#perth-watermark-needs-explicit-frame-padding`).
- Python emits integral floats as `1.0`, JS re-emits `1`: canonical-JSON receipt hashes differ across languages; normalise integral
  floats before hashing (`rejected.md#python-javascript-float-canonicalization-can-break-receipt-hashes`).
- Chatterbox is **not bit-deterministic** at a fixed seed on the GPU (same reference/seed → same 245,760-byte length, different hash),
  while three different references at the same seed gave three different outputs (288,000 / 284,160 / 245,760 bytes): the reference
  does condition synthesis (`#enrollment-reference-bandwidth-before-after`).

### 4.6 Fine-tuning laws (WS-U, `9de5e89c`, `844439d5`; Taxila v1 should not fine-tune voices, but the laws generalise)

- One `lora.py` shared by trainer and runtime ("cannot drift into two versions of the same maths"); training image derives FROM the
  runtime image.
- Adapters touch only T3 attention projections: s3gen excluded (on the watermark path), the voice encoder excluded "because it is
  what fidelity is graded with, and fitting the grader is the one result worth less than none".
- LoRA init must use a **private RNG**: textbook init consumed the global torch stream the runtime seeds per request, so the adapted
  arm sampled different tokens than its control — "anything a treatment does to shared global state is part of the treatment".
- Adapter travels inside the HMAC-signed request body; receipt carries `synthesis_commitment = sha256(model:lora:adapter)`; an eval
  asserts a runtime that silently IGNORES the adapter is caught.

---

## 5. Listening and evaluation instruments (copy these for Taxila's voice choice)

### 5.1 earbench (`evals/earbench/lib.mjs`, `scripts/earbench.mjs`, `docs/gurukul/EARBENCH.md` @GP; WS-V `956b747d`)

- Axes: similarity, naturalness, and **accent as its own axis** ("a line can be pronounced perfectly and belong to a different
  person's mouth"), 1–5.
- ABX asks speaker identity across **different items** ("X is a clip of a DIFFERENT item ... so the answer cannot be reached by
  matching words").
- Blind ids: `HMAC(runSecret, version|kind|arm|item)[0:16]` (a counter, an audio hash, or a hash of `arm|item` all leak).
- Counterbalance: four-cell cycle over (which arm X is from, which side matches), reset per arm pair; the naive alternation gave 10
  correct-A vs 8 correct-B over 18 trials (`rejected.md#alternating-is-not-counterbalanced`).
- Catch trials ≥2 or 15%; listener with catch accuracy < 0.9 is INVALID, not averaged in.
- Statistics: exact binomial (two- and one-sided), Wilson interval, t quantiles for df 1..30 ("using 1.96 at df=2 would report an
  interval about three times narrower than it is").
- **Three verdicts**: `distinguishable` (one-sided p < α/2 and CI low > 0.5), `indistinguishable` (CI high < equivalence bound
  **0.65**), else `inconclusive` with `trialsNeededForEquivalence`. "'not significant' is NOT evidence of equivalence."
- The listening pass is deliberately **not a CI gate** ("a gate that waits for headphones wedges every build"); 85 → 108 mechanical
  checks are.
- Trap: every synthetic clip speaks the disclosure; trim both arms through one path or the test is unblinded; `verify-trim` exists
  because the obvious ear-check unblinds the only listener.

### 5.2 Listening benchmark and exact-text pack (`scripts/voice-listening-benchmark.mjs`, `evals/voice-matched-pack/{pack,contract,run}.mjs`, `docs/gurukul/VOICE-LISTENING-BENCHMARK.md`, `VOICE-EXACT-TEXT-MATCHED-PACK.md` @GP)

- Four 1–5 axes: owner likeness, naturalness/humanness, Indian accent fit, pronunciation/intelligibility; **disclosure audibility**
  rated separately (full/partial/absent) because "a transport receipt that requested a disclosure does not prove a human can hear it".
- Every served WAV has identical geometry (e.g. 24 kHz mono PCM16, 13,280 ms, 637,484 bytes) after one RMS/fade/pad treatment;
  common RMS chosen as the **minimum per-clip peak-safe ceiling** (max-source RMS would have pushed a high-crest clip past the 0.92
  peak — `rejected.md#maximum-source-rms-is-not-a-peak-safe-listening-level`).
- Two hidden byte-identical repeats ≥4 screens apart (consistency, never extra model evidence); two tone attention checks whose
  answers never enter the served tree; a localhost server serving only the page, two public JSONs and 24-hex WAV paths.
- **Only exact language + exact target-text hash forms a comparison cell**; the 21-clip pack had 1 matched cell, 17 unmatched lanes,
  0 cross-provider cells, so `crossProviderWinner` stays empty (`rejected.md#language-match-is-not-a-matched-text-comparison`). Cells
  are **capability-shaped** (Qwen English-only, IndicF5 Hindi-only) instead of a symmetric grid that would fabricate capability.
- Spend guard: each network attempt permanently reserves USD 0.50 in a private ledger before execution; an 11th attempt or a
  caller limit above USD 5 is refused.
- In-app variant (`src/studio/voiceExperiment.ts`, `VoiceExperimentPanel.tsx`, `771feef9`): the pack is imported as one ≤20 MiB
  bundle into IndexedDB, answers checkpoint to localStorage, a `FORBIDDEN_METADATA` scan refuses bundles naming models or receipts,
  WAV geometry is asserted client-side, and the unsealed report is accepted only with an **RSASSA-PKCS1-v1_5/SHA-256 signature**
  verified by WebCrypto against a key id bound to the pack; `overallWinner: null`, descriptive means only.

### 5.3 Other probes

- `scripts/first-clone.mjs`: one command drives every stage and prints one row per stage; a missing credential is a printed SKIP
  naming the variable with non-zero exit; "no number is carried forward unless a live service returned it in this run"; every
  fidelity run prints its own ceiling ("0.7753 reads as mediocre until you know the subject's own voice reaches 0.8869").
- `evals/speech/l1-hinglish.mjs`: the live speech-to-speech lane "cannot be driven headlessly for a PRONUNCIATION probe" because it is
  conversational (asking it to "say X" is a user turn it may paraphrase), so pronunciation is probed on the cascade TTS lane with an
  ASR round trip. [inference] The same applies to gpt-realtime: bench pronunciation with a controlled-text path, not the live lane.
- `evals/voice-bakeoff/plan.mjs`: pre-registered prompts × seeds × arms with price arithmetic and hard stops (USD 35 bake-off,
  100 adapter, 250 Hindi adaptation, 1,000 frontier total), computed from Azure Retail Prices meters (T4-second USD 0.000102).

---

## 6. Practice store and runner (deeper than gurukul.md)

- `src/gurukul/practiceStore.ts` @GP: `localStorage` key `gurukul.practice.history.v1`, `MAX_ENTRIES = 500`, try/catch on every read
  and write ("storage full/absent — the session that just ran still showed its summary on screen; only cross-session history is
  lost"). Each entry = `{summary, xp, completedAt}`; **XP is computed once at record time from the graded list** because
  `summary.byTopic` does not keep per-attempt verdicts, so rushed attempts could not be excluded later. `recordPracticeSession` is a
  no-op on an unfinished session. It deliberately does not reach the prompt, the live call lane, or relational memory; wiring a
  finished set into memory "so she can bring it up unprompted" (`student-app-spec.md` §3.4) is named future work.
- `src/components/PracticeActivity.tsx` @GP: "THIS COMPONENT COMPUTES NOTHING"; `phase` is `answering` (no verdict at all) or
  `revealed` (exactly one); elapsed time is `Date.now() - startedAt` from question display, which is what `rushed` uses; session
  state is component-local `useState`, not the app's game slot; the set is hard-committed on every exit path (early exit, last
  commit, reload). Verdict copy: "Correct, full marks" / "Partial credit" / "Not quite, a slip" / "Missed" / "Skipped" / "Too fast to
  count as solved".

[inference, Taxila] Keep the screen/engine split and the verdict-after-commit rule; replace localStorage with a server table keyed by
child id under guardian consent; measure elapsed from *first interaction*, not display, for young readers (display-to-commit includes
reading time, which makes `rushed` a reading-speed signal for a 6-year-old); and wire finished sets into the tutor's memory through
the `ActivityState.record` seam rather than through prose.

---

## 7. Mirror Call mechanics that transfer to learning-profile discovery

`api/_mirrorcall.js` @GP (WS-X/Y/AC) — the owner calibrates a clone live; the same mechanics fit "the tutor proposes what it thinks it
learned about how this child learns, and a parent/teacher sees it with its evidence":

- `MIRROR_DELTA_KINDS`: every proposal kind declares its target field, signal, query type (`feature` vs `label`) and origin (`mined`
  vs `judgement`). Mined and accepted-from-judgement live in separate columns so sycophancy drift is measurable.
- `budgetChips(deltas, elapsedMs)`: **3 proposals per minute**; feature queries outrank label queries (an HRI study found feature
  queries preferred; search-summary tier), then more evidence first; the surplus is returned and deferred to a review queue, never
  dropped, never shown as applied.
- `corpusConfidence(tokens, occurrences)`: three **named bands** (`supported` if ≥2,000 tokens and ≥5 occurrences, `weak`, or
  `below-every-published-floor`) "rather than a score, because a decimal invites a UI to render it as a percentage and there is no
  measurement underneath it". `MIRROR_MIN_COUNT = 3` is deliberately below the publish rule's 5 so the held-out check stays held-out.
- `scrubPii(text)` at the store seam (email, 13–19-digit card shapes, Indian mobiles with/without country code, IPv4, any 6+ digit
  run: account numbers, Aadhaar fragments, OTPs); stated as a floor, not a guarantee.
- **Selection, not accumulation**: Chatterbox conditions on ≤10 s whatever the pool size, so `vy_mirror_window` is a scored candidate
  pool and `vy_mirror_conditioning` the single selection (replaced only by a strictly better candidate); two labelled meters ("how well
  we can measure you" vs "what the next reply is built from") with no combined figure
  (`rejected.md#mirror-reference-accumulation-was-inert`). "A pipeline whose inputs grow is not a pipeline that learns. Before
  building anything that accumulates, read the consumer's truncation."
- Never-silent-update: an un-acked chip renders "Applying...", only a server ack applies, a failed accept returns it to actionable;
  fuzzed over 4,000 event sequences with a negative control (`b9966ca2`).

[inference, Taxila] The learning profile ("this child does better with stories than drills") must be a set of context-keyed
hypotheses with n and a band, proposed at a budget, shown to a parent with the citations, and kept separate from parent-asserted
preferences, never one rewritten "learning style" field.

---

## 8. Honesty UX primitives (studio, transferable to the parent dashboard and module generation)

- `src/studio/blockerClass.ts`: `type BlockerClass = "you" | "us"`, exactly two ("When we do not know, the answer is `us`"); copy
  "Waiting on you / You can do this one now." vs "Waiting on us / This one is on us. Nothing for you to do here." (no apology, no
  invented ETA); detectors for blame and opaque counts ("9 things" fails); property-tested over 27,648 inputs with the owner's real
  bad sentence as the negative control.
- Activity surface (`api/_replica-activity.js`, `src/studio/ActivityPanel.tsx`): one job shape for seven async lanes
  `{job_id, ref, lane, subject, state, state_reason, started_at, updated_at, finished_at, progress, next_action, in_flight}`;
  **only the one lane with a real fraction gets a progress value**; an undeployed lane is a named absence; polling backs off 3 s→30 s
  and stops when nothing is in flight.
- Refusal names its precondition: an "eligible" CTE joining 15 preconditions returns no rows for any one of them; the generic
  `voice_preview_not_authorized` blamed the user for platform latency; a scoped diagnostic query now names the first unmet
  precondition in the order a person meets them, and falls back to the opaque code rather than guessing (`079fc25e`).
- `wizardModel.ts` readiness is a pure function tested exhaustively (6,912 inputs: ≤1 "your turn" ember; `null` = unknown, never
  "none"); `check-layout.mjs` measures prose width at 390/834/1,355 px on a fixture that mounts the **real signed-in** app and fails if
  it judged too few blocks (its first version passed against the bug because signed out it saw only a sign-in card).

---

## 9. Reusable assets

Maturity: shipped-measured / shipped / prototype / spec-only. Use: copy / adapt / idea / skip. All paths @GP unless noted.

| id | path @ref | what | maturity | use | Taxila subsystem |
|---|---|---|---|---|---|
| HGC-01 | `api/_replica-processing/pipeline.js` | frozen step DAG, dependency assert, stable-jitter backoff, retry/blocked/failed classifier | shipped-measured | adapt | infra / telemetry (textbook ingestion, session-recording analysis, module render jobs) |
| HGC-02 | `api/_replica-processing/{runtime,queue,repository,worker}.js` | lease → execute → settle runner, immutable artifacts, evidence rows with spans + lineage, cross-tenant tuple checks | shipped-measured | adapt | infra / db-schema |
| HGC-03 | `api/_replica-processing/{capability-codes,composition,sweep}.js` | capability-absence codes, every step always has an adapter, requeue on recovery, content-free sweep report | shipped-measured | copy | telemetry / evals |
| HGC-04 | `api/_replica-processing/worker.js` `processingUnexpectedErrorDiagnostic` | type + regex-safe message + repo frame only | shipped-measured | copy | telemetry |
| HGC-05 | `services/voice-evidence/app.py` | Silero VAD + ECAPA greedy clustering diarizer, Sepformer, DeepFilterNet3, signal quality, HMAC transport, refuses identity without anchor | shipped-measured | adapt | multimodal / realtime-voice analytics / safety (who answered) |
| HGC-06 | `services/voice-evidence/app.py` `_signal_quality` | usable speech ms, voiced ratio, RMS dBFS, VAD-based SNR, clipping | shipped-measured | copy | realtime-voice (mic check), evals |
| HGC-07 | `api/_video-enroll/windows.js` `rankReferenceWindows`, `speakerPurity`, `readPcm16Wav` | pure deterministic 10 s window scorer with named rejections and head-vs-best delta | shipped-measured | copy | realtime-voice (mic test), evals (clean ASR eval clips) |
| HGC-08 | `api/_replica-processing/reference-window.js` | dominant cluster share, run merging, full-band re-cut from original, separation skip ≥0.90 | shipped-measured | adapt | multimodal (speaker share per session) |
| HGC-09 | `api/_replica-processing/chunked-diarization.js` | overlapping-chunk diarization with conservative label reconciliation | shipped-measured | copy | memory/consolidation (offline 30-60 min session analysis) |
| HGC-10 | `api/_replica-processing/native-tools.js` | ffmpeg/ffprobe/clamdscan seam: files not pipes, mode-0600 temp dirs removed in finally, three outcomes OK/FOUND/throw | shipped-measured | adapt | infra (uploads: homework photos, audio) |
| HGC-11 | `services/replica-processing-worker/` (`run-once.js`, `clamav.js`, `infra/main.bicep`, `Dockerfile`) | Container Apps scheduled Job, ClamAV baked, pending-work-before-daemon, daemon lifetime owned | shipped-measured | adapt | infra/azure |
| HGC-12 | `api/_asr/providers/sarvam-saaras.js`, `api/_replica-processing/providers/sarvam-transcription.js`, `api/_asr/providers/sarvam-sync.js` | verified Sarvam batch + sync protocol, directory-SAS handling, diarization, honest confidence 0 | shipped-measured | adapt | realtime-voice (offline Hindi ASR of sessions), evals |
| HGC-13 | `api/_audio/wav.js` | RIFF chunk-walking WAV probe, enrollment format gate (PCM16 mono 24 kHz) | shipped-measured | copy | realtime-voice (24 kHz PCM16 checks) |
| HGC-14 | `scripts/check-enrollment-sample-rate.mjs` | cross-file/cross-language constant mirror gate with negative control | shipped | copy | evals/gates |
| HGC-15 | `scripts/check-enrollment-bandwidth.mjs` | dependency-free radix-2 FFT gate for energy ≥8 kHz, calibrated on real bytes | shipped-measured | copy | evals/gates (band-limited mic detection) |
| HGC-16 | `api/_replica-storage.js`, `src/studio/enrollmentApi.ts`, `services/replica-processing-worker/infra/replica-storage.bicep` | Azure Blob signed block upload (exact `sr=b, sp=c, spr=https` SAS), CRC64-NVME LE, private container, erasure | shipped-measured | adapt | infra / auth-consent (parent uploads) |
| HGC-17 | `services/open-voice-runtime/broker.py` | public CPU HMAC admission broker in front of private GPU, readiness check, internal re-sign, response signature chain | shipped-measured | adapt | infra (any self-hosted model) |
| HGC-18 | `services/voice-evidence/app.py` `_verified_json` / `_signed_response` | HMAC request + signed response + nonce replay cache, 60 s skew | shipped-measured | copy | infra / safety |
| HGC-19 | `api/_voice/warmup.js`, `api/_voice/preview-panel.js`, `src/studio/VoicePreviewPanel.tsx` | warm/warming/cold registry, wake-before-sign, 202 warming with ETA range, 10 polls/300 s, sessionStorage survival | shipped-measured | adapt | design-system/ux + generative-ui (slow image/module generation) |
| HGC-20 | `api/_voice/language-conditioning.js` | script-mode detector, requested vs effective CFG, evidence scope, warnings | shipped | adapt | tts-voice-identity |
| HGC-21 | `api/_voice/hindi-text-frontend.js`, `evals/speech/hindi-text-frontend.test.mjs` | reviewed Roman-Hindi + classroom-borrowing lexicon, ordered language segments, 60 ms gap, confusable controls | shipped (no listener) | adapt | tts-voice-identity / generative-ui (read-aloud of module text) |
| HGC-22 | `services/open-voice-runtime/hindi_pack.py` | strict-load allowlist that also fails on stale entries | shipped | idea | infra (model load safety) |
| HGC-23 | `services/indicf5-runtime/duration_control.py` | codepoint-normalised duration plan for Indic scripts | prototype | copy (if IndicF5 used) | tts-voice-identity |
| HGC-24 | `services/open-voice-runtime/app.py` | disclosure-text binding per language, seed bounds, PerTh verify-before-return, model/synthesis commitments in receipts | shipped-measured | idea | safety-floor / tts |
| HGC-25 | `services/open-voice-runtime/lora.py`, `services/voice-finetune/train.py` | one LoRA implementation for trainer and runtime, private RNG, grader excluded | prototype | skip (v1) / idea (laws) | voice-cloning |
| HGC-26 | `evals/earbench/lib.mjs`, `scripts/earbench.mjs`, `evals/earbench/{audio,server,page.html,run}.mjs` | blind ABX + rating bench: HMAC ids, four-cell counterbalance, catch trials, Wilson, exact binomial, three verdicts | shipped (instrument; 0 listeners) | copy | evals / tts-voice-identity |
| HGC-27 | `scripts/voice-listening-benchmark.mjs`, `evals/voice-listening-benchmark/*` | consolidated pack builder: equal geometry, hidden repeats, attention tones, exact-text cells, unseal gate | shipped (instrument) | adapt | evals |
| HGC-28 | `evals/voice-matched-pack/{pack,contract,run}.mjs`, `scripts/voice-matched-pack.mjs` | capability-shaped exact-text cells, peak-safe RMS normalisation, USD 0.50 reservation ledger / USD 5 cap, seal/verify/score/unseal | shipped (instrument) | adapt | evals / infra cost |
| HGC-29 | `src/studio/voiceExperiment.ts`, `src/studio/VoiceExperimentPanel.tsx` | in-app blind rating from a sealed bundle, IndexedDB + localStorage checkpoints, forbidden-metadata scan, RSA report attestation via WebCrypto | shipped (no rating yet) | adapt | evals / design (parent and child listener panels) |
| HGC-30 | `evals/speech/l1-hinglish.mjs` | TTS→ASR round-trip pronunciation probe with cited corpus; documents why live S2S cannot be probed | shipped | adapt | evals / realtime-voice |
| HGC-31 | `scripts/first-clone.mjs` | one-command end-to-end smoke printing every stage, SKIP rows named, numbers only from this run, ceiling printed | shipped-measured | adapt | evals (Taxila "first lesson" smoke) |
| HGC-32 | `evals/voice-bakeoff/{plan.mjs,prompts.v1.json,models.v1.json,frontier-plan.mjs,frontier.v1.json}` | pre-registered bake-off plan with price arithmetic and hard stops | shipped (plan only) | adapt | evals / tts-voice-identity |
| HGC-33 | `api/_mirrorcall.js` (`budgetChips`, `corpusConfidence`, `MIRROR_DELTA_KINDS`, `MIRROR_MIN_COUNT`) | proposal budget, feature-over-label ranking, named evidence bands, mined vs judgement origin | prototype (offline, 452 checks) | adapt | learning/pedagogy (learning-profile proposals), relational-os |
| HGC-34 | `api/_mirrorcall.js` `scrubPii` | store-time PII scrub incl. Indian mobile, Aadhaar fragments, OTPs | prototype | copy | safety / auth-consent (child transcripts) |
| HGC-35 | `api/_mirrorcall-store.js`, `db/migrations/059_mirror_call.sql`, `060_mirror_call_turn.sql` (`vy_mirror_window`, `vy_mirror_conditioning`, `vy_mirror_turn`) | candidate pool vs single standing selection; applied-implies-accepted CHECK | prototype (never applied live at the time) | idea | memory-graph |
| HGC-36 | `src/gurukul/practiceStore.ts` | screen-scoped practice history, XP summed once from graded list | prototype (never deployed) | idea | learning / gamification |
| HGC-37 | `src/components/PracticeActivity.tsx`, `src/components/MasteryMap.tsx` | runner that computes nothing; verdict only after commit; commit on every exit path | prototype | adapt | generative-ui / gamification |
| HGC-38 | `src/studio/blockerClass.ts`, `src/studio/wizardModel.ts`, `evals/studiowizard.mjs` | you/us blocker type, blame + opaque-count detectors, exhaustive property tests | shipped-measured | copy | design-system/ux |
| HGC-39 | `api/_replica-activity.js`, `src/studio/{ActivityPanel.tsx,activityApi.ts,activity.css}` | one job shape across async lanes, no fake percentage, named absence, backoff-and-stop polling | shipped | adapt | design-system / telemetry (module generation progress, parent view) |
| HGC-40 | `api/_replica-voice-preview.js` (diagnostic precondition query) | first unmet precondition named in user order, scoped to the same owner tuple | shipped-measured | idea | auth/consent / db-schema |
| HGC-41 | `scripts/check-layout.mjs`, `studio-layout-fixture.html`, `src/studio/layoutFixture.tsx` | readability gate on the real signed-in screen with coverage self-assertion and negative controls | shipped-measured | copy | design-system / evals |
| HGC-42 | `scripts/resolve-context-merge.sh` | union merge of append-only context files, header self-heal | shipped | copy | evals/gates (Taxila context/ discipline) |
| HGC-43 | `api/_video-enroll/quota.js` | per-owner/day + global/day caps, each refusing by name with numbers and reset | shipped (offline) | adapt | payments / infra (per-child generation quotas) |
| HGC-44 | `api/_video-enroll.js`, `services/media-extract/`, `api/_channel/extract-routes.js` | YouTube extraction lane with per-stage receipts incl. failed stages; route by env with no silent fallback | prototype (blocked live) | skip | knowledge-ingestion |
| HGC-45 | `api/_replica-processing/self-test.js`, `scripts/revoke-self-test-grants.mjs`, `docs/gurukul/REPLICA-SELF-TEST-MODE.md` | owner-bound three-part test bypass that tags every row it writes and is reversible in one statement | shipped-measured | idea | auth/consent (test-mode discipline) |
| HGC-46 | `src/engine/agents/teacher.ts` | demo teacher module; header states pedagogy fields are NOT compiled and Maya's photo/gif/voicenote catalogs are inherited wholesale | prototype | skip (warning) | prompt-compiler |
| HGC-47 | `services/audio-protection/` (`bake_models.py`, `app.py`) | PerTh + C2PA on CPU; build-time real watermark+detect proof; content-free `_diagnostic()` | shipped-measured | idea | safety-floor (if any generated audio leaves the app) |

---

## 10. Key code excerpts (verbatim, short, no secrets)

**Greedy online speaker clustering** (`services/voice-evidence/app.py` `_diarize`):

```python
for chunk in chunks:
    similarities = [_cosine(chunk["embedding"], centroid) for centroid in centroids]
    best = int(np.argmax(similarities)) if similarities else -1
    if best < 0 or similarities[best] < app.state.cluster_threshold or len(centroids) < 1:
        if len(centroids) < app.state.max_speakers:
            centroids.append(chunk["embedding"])
            counts.append(1)
            chunk["speaker"] = len(centroids) - 1
            continue
    ...
    updated = np.asarray(centroids[best]) * (counts[best] - 1) + np.asarray(chunk["embedding"])
    updated /= max(np.linalg.norm(updated), 1e-8)
```
and the refusal: `# No target anchor is available in source processing. A human must identify the subject cluster; pretending otherwise would poison identity.` → `"target_likelihood": 0.5`.

**Conservative chunk reconciliation** (`api/_replica-processing/chunked-diarization.js`):

```js
const usedGlobals = new Set();
for (const candidate of scores.sort((a, b) => b.score - a.score || a.localKey.localeCompare(b.localKey))) {
  if (mapping.has(candidate.localKey) || usedGlobals.has(candidate.globalKey)) continue;
  mapping.set(candidate.localKey, candidate.globalKey);
  usedGlobals.add(candidate.globalKey);
}
for (const localKey of localKeys) if (!mapping.has(localKey)) mapping.set(localKey, allocate());
```

**Separation skip** (`api/_replica-processing/reference-window.js`):

```js
export const SEPARATION_DOMINANT_SHARE_THRESHOLD = 0.90;
export function shouldSkipSeparation(owner) {
  return owner.dominantShare >= SEPARATION_DOMINANT_SHARE_THRESHOLD;
}
```

**Noise-floor correctness fix** (`api/_video-enroll/windows.js`):

```js
const noiseFloor = Math.max(1, Math.min(percentile(sorted, 0.1), 0.2 * median));
const voicedThreshold = Math.max(60, Math.min(noiseFloor * 3, 0.4 * median));
```

**Stable-jitter backoff** (`api/_replica-processing/pipeline.js`):

```js
const exponential = Math.min(3_600_000, 2_000 * 2 ** (normalizedAttempt - 1));
// Stable jitter avoids worker herds without making offline replay nondeterministic.
const jitter = Number.parseInt(sha256Hex(`${failureCode}:${normalizedAttempt}`).slice(0, 4), 16) % 751;
```

**Warmth registry, the line that fixed the 4-minute hang** (`api/_voice/warmup.js`):

```js
if (event === "ready") { record.lastReadyAt = now; record.lastWakeAt = 0; }
else if (event === "waking") { record.lastWakeAt = now; record.lastReadyAt = 0; }
else if (event === "unreachable") { record.lastReadyAt = 0; record.lastWakeAt = 0; }
```

**Broker re-signs fresh internal transport after readiness** (`services/open-voice-runtime/broker.py`):

```python
body, body_hash = await _admit(request)
if not await _runtime_is_ready():
    raise BrokerError("open_voice_runtime_warming", 503)
headers, internal_nonce = _internal_headers(body_hash)
upstream = await app.state.runtime_client.post(f"{app.state.runtime_origin}{PATH}", content=body, headers=headers)
expected = _signature(app.state.secret, (PROTOCOL, "response", PATH, internal_nonce, str(upstream.status_code), _sha(response_body)))
```

**Three-verdict ABX** (`evals/earbench/lib.mjs`):

```js
if (pOne < policy.alpha / 2 && interval.low > 0.5) return { ...base, verdict: "distinguishable" };
if (interval.high < policy.equivalenceBound) return { ...base, verdict: "indistinguishable" };
return { ...base, verdict: "inconclusive", trialsForEquivalence: trialsNeededForEquivalence(correct / n, policy) };
```

**Named evidence bands instead of a score** (`api/_mirrorcall.js`):

```js
const band = tokens >= MIRROR_STYLOMETRIC_FLOOR_TOKENS && n >= 5 ? "supported"
  : tokens >= MIRROR_STYLOMETRIC_FLOOR_TOKENS || n >= 5 ? "weak"
  : "below-every-published-floor";
```

**Script-mode conditioning** (`api/_voice/language-conditioning.js`):

```js
if (referenceMode === "latin_only") {
  effectiveCfgWeight = 0;
  qualityState = "accent_transfer_mitigation_applied";
  warnings.push("hindi_reference_latin_only_cfg_disabled");
}
```

**Codepoint duration normalisation** (`services/indicf5-runtime/duration_control.py`):

```python
raw_speed = _density(text) / _density(reference_text)   # bytes per codepoint ratio
speed = min(3.5, max(0.75, raw_speed))
```

**The honesty split as a type** (`src/studio/blockerClass.ts`):

```ts
export type BlockerClass = "you" | "us";
// When we do not know, the answer is `us`: an unexplained blocker is our
// failure to explain it, never the person's failure to act.
```

---

## 11. Measurements (with n, method, date; all from `context/measurements.md` @GP unless noted)

| # | claim | n / method | date | source |
|---|---|---|---|---|
| M1 | Zero-shot Chatterbox clone ECAPA 0.7753 (p10 0.7479) vs self-vs-self ceiling 0.8869; verdict warn, activation refused | n=2 end-to-end runs 25 min apart, spread 1e-6; 4 ref windows × 4 clips | 2026-08-26 | `#first-real-clone` |
| M2 | x-vector raw cosine clone-vs-reference 0.9974 (p10 0.9972): saturates, unusable without PLDA | same run, 512-d SpeechBrain x-vector | 2026-08-26 | `#first-real-clone` |
| M3 | voice-evidence warm round trip 4,977 ms (71 s, 4 windows, 8 embeddings); 3,956 ms for 45.2 s of candidates; cold start 176 s (second wake 194 s) | n=1 each, 5 s poll granularity | 2026-08-26 | `#first-real-clone` |
| M4 | Per-window usable speech 11.2–13.8 s of 17.75 s; SNR 8.5–27.4 dB; RMS −26 to −31 dBFS on a WhatsApp voice note | 4 windows, `_signal_quality` | 2026-08-26 | `#first-real-clone` |
| M5 | Chatterbox RTF 1.77 first call on a fresh replica, 0.79–0.80 warm; PerTh score 1.0 on every clip | n=1 + n=3 | 2026-08-26 | `#first-real-clone` |
| M6 | Sarvam sync `saarika:v2.5` 25 s → 4,134 ms; 71 s → HTTP 400 (30 s cap); batch `saaras:v3` 71 s → 136,874 ms, 5 diarized turns; repeat → 12,024 ms (cached on audio_hash) | n=1 per row | 2026-08-26 | `#first-real-clone` |
| M7 | Whole clone chain 643.6 s wall clock incl. two cold starts; ~USD 0.66 estimated, three of six GPU wakes produced no output (~1/3 of the bill) | n=1, wall-clock estimate not billing | 2026-08-26 | `#first-real-clone` |
| M8 | Sign-then-send cold: 401 at 227 s / 217 s; warm: 20 s; wake-then-sign cold: complete in 50 s | n=5 manual job executions | 2026-08-26 | `#wake-then-sign-unblocks-the-evidence-lane` |
| M9 | Diarize on 822.72 s: 278 segments, mean confidence 0.877; clusters 663.5 s / 25.9 s / 2.7 s / 4.4 s; 0 overlaps; target_likelihood 0.5 on all | n=1 file | 2026-08-26 | same |
| M10 | Whole-file Sepformer failed 5/5 (`voice_evidence_failed`), restartCount 0, 13,163,520 samples in one pass; response would be ~70 MB vs 80 MB cap | n=5 attempts observed live + code-path elimination | 2026-08-26 | `#separate-underlying-error-confirmed-structurally` |
| M11 | Before fix: 0 evidence rows and 0 artifact rows in production, only integrity/malware_scan ever completed | one query over the whole DB | 2026-08-26 | `#commit-guard-had-never-committed-evidence` |
| M12 | Worker: ACR build 98/96/107 s; idle execution 23 s; clamd ready 10,052 ms; 32.9 MB scan 1.4 s; integrity read+SHA-256 5.13 s | n=3 builds, n=1 others | 2026-08-26 | `#worker-execution-timings` |
| M13 | ffprobe `pipe:0` returns `format: {}`; file path returns duration 822.72 s | n=1 file, 2 invocations | 2026-08-26 | `#ffprobe-pipe-versus-file-on-the-owners-mp3` |
| M14 | Reference energy ≥8 kHz 0.000458% before, 0.0224% after (~49x); window score 0.8067 over 27 windows; dominantShare 0.9528 | n=1 window pair, radix-2 Hann FFT | 2026-08-27 | `#enrollment-reference-bandwidth-before-after` |
| M15 | Same seed/text, three references → three outputs (288,000 / 284,160 / 245,760 bytes, different hashes); repeat of the same arm → same length, different hash (not bit-deterministic) | n=3 refs + 1 repeat, live broker | 2026-08-27 | same |
| M16 | Owner by ear: full-bandwidth reference better than 8 kHz one; both "far from acceptable"; "very western and not indian" accent complaint survives the fix | n=1 listener (the subject), informal A/B | 2026-08-27 | `#owner-ab-reference-quality-audible` |
| M17 | 23 real failed generations with `wav_format_unsupported` before the 24 kHz fix; after: enhance artifact 480,044 bytes = 10.00 s @24 kHz; preview 200, 266,924 bytes, 5,560 ms, sealed | n=1 end to end | 2026-08-26/27 | `#wav-format-unsupported-fixed-and-proven-end-to-end` |
| M18 | Audio protection on CPU: watermark RTF 0.91 warm; independent detection confidence 1.000000 vs control 0.000000; cold start 35.6 s with the waking request 200 (GPU lane 161 s, waking request died at 240 s) | n=5 signed requests, n=1 cold | 2026-08-26 | `#audio-protection-cpu-serving` |
| M19 | 1:49:31, 262,879,879-byte MP3: upload ~47 s; 8/8 stages; 1,683 speaker segments; 288 transcript + 288 language spans; 72,921 Devanagari vs 555 Latin chars; genome build 21 s | n=1 source, production | 2026-08-27 | `#long-lecture-eight-stage-draft-live-2026-08-27` |
| M20 | Cold preview: 6 polls / 180 s client stopped before the 200 s server window; 10 polls / 300 s design completed same-click in ~4 min 50 s; output 389,804 bytes, 8.12 s, peak −0.67 dBFS, RMS −19.32 dBFS, 0 clipped | n=1 live trace + 95/95 offline checks | 2026-08-27 | `#long-lecture-preview-warmup-window-live-2026-08-27` |
| M21 | Production v2 Hindi preview: cold timed out, warm retry 29,547 ms, 263,084 bytes, RTF 3.216, PerTh 1 | n=1 | 2026-08-27 | `#production-long-media-and-agent-isolation-release-2026-08-27` |
| M22 | Hindi pack cold signed synthesis 293.478 s (RTF 2.050); production general arm cold 542.696 s (RTF 1.642): "unacceptable for an interactive path" | n=1 per arm | 2026-08-27 | `#hindi-voice-production-release-2026-08-27` |
| M23 | Matched blind pack RTF: general Devanagari CFG 0.5 2.481; CFG 0 0.781; Hindi pack CFG 0.5 2.287; CFG 0 0.824; general English 0.833; ~USD 0.68 list estimate (876 + 575 GPU-s, 1,514 broker-s) | n=1 per arm, sealed, no ratings | 2026-08-28 | `#chatterbox-matched-blind-pack-live-2026-08-28` |
| M24 | IndicF5 r7: 6 clips 71.069 s, mean RTF 2.8705 (2.13–4.16), PerTh min 0.998, ECAPA 0.8248 (p10 0.8154) vs the same 4 owner windows | n=6, signed receipts | 2026-08-28 | `#indicf5-owner-qualification-remote-2026-08-28` |
| M25 | F5 UTF-8-byte duration planned 23.1–31.7 s for six Hindi/Hinglish requests (two at the 4,096-frame cap) vs ~11.1–13.9 s codepoint-aligned | n=6 frozen requests | 2026-08-28 | `#indicf5-cross-script-duration-diagnosis-2026-08-28` |
| M26 | Consolidated listening pack: 21 clips, 23 screens (2 hidden repeats), 2 attention checks, 1 matched cell, 17 unmatched lanes, 0 cross-provider cells; 36/36 + 18/18 checks; 0 listeners | instrument audit | 2026-08-28 | `#consolidated-voice-listening-pack-indicf5-r7-local-2026-08-28` |
| M27 | Azure Blob: CRC64 big-endian → 400, little-endian → 201; 54,526,075 bytes in 7 blocks; unsigned read 409; commit replay 403; same-SAS path mutation 403 | n=1 live upload + 23/25 offline checks | 2026-08-27 | `#azure-blob-platform-and-contract-local-2026-08-27` |
| M28 | Sarvam batch protocol: job completed in 126 s but died at a 10-min timeout under the guessed poll path | n=1 live | 2026-08-26 | `rejected.md#sarvam-batch-paths-were-three-guesses` |
| M29 | Admission broker probe warm 250 / 253 / 334 ms; broker cold-from-zero 21.8 s (WS-L) | n=3 + n=1 | 2026-08-26 | `#voice-panel-admission-probe` |
| M30 | Owner-reference window choice spans ECAPA 0.7433–0.8058 (0.0625), 3x the 71 s LoRA delta (+0.0206); full 71 s reference worse than the best 10 s | n=1 per window arm | 2026-08-26 | `#reference-window-beats-the-finetune` |
| M31 | Azure retail meters Central India: T4-second USD 0.000102, vCPU-second 0.000024, GiB-second 0.000003 → USD 1.6632/h at 8 vCPU / 56 GiB | Azure Retail Prices API | 2026-08-28 | `#voice-bakeoff-plan-local-2026-08-28` |
| M32 | Studio wizard readiness properties hold over 6,912 inputs (≤1 ember) and the you/us split over 27,648 inputs | exhaustive property test | 2026-08-26 | `#wizard-input-space-6912`, `98efb8de` |
| M33 | Layout gate judges 264 prose blocks across 9 screens; negative controls (58 px rail back, chevron pin removed) fail with named elements; every primary CTA had shipped at 1.73:1 contrast (LightningCSS dropped `@layer` order) | gate run + negative controls | 2026-08-26 | `f3fceac2`, `#studio-layout-repair` |
| M34 | YouTube from Azure: enumerate 200 in 13.9 s; extract `extractor_bot_check` on 10/10 player clients; PO token metadata 5/6 vs 1/6, audio 0/12, benefit gone after ~40 requests | n=6 interleaved pairs etc. | 2026-08-26 | `#youtube-extraction-blocked-from-azure`, `#po-token-helps-until-the-ip-is-burned` |
| M35 | Mirror Call chip rail fuzzed over 4,000 event sequences; mirrorcall 452 offline checks; reply lane 110 checks; activity 221 checks | offline evals | 2026-08-26 | `b9966ca2`, `a35327ab`, `91bc4c78`, `3ac7e6b4` |

---

## 12. Rejections (tried → what broke), the highest-value part

All `context/rejected.md` @GP unless a commit is cited. Ones already detailed in `gurukul.md` are listed briefly at the end.

| # | tried | what broke | replaced by |
|---|---|---|---|
| R1 | Mirror Call voice loop: accumulate call audio into the reference and re-embed | Chatterbox slices to 10 s / 6 s and takes one prompt; the meter would rise while synthesis could not change | selection over a scored pool; two labelled meters (`mirror-reference-accumulation-was-inert`) |
| R2 | Sign the request, then let the platform wake the GPU | 60 s skew < 100–176 s cold start; every cold request 401 with a correct key; rotating keys "would have destroyed a working key" | wake on `/healthz`, then sign (`signing-before-a-cold-start-cannot-authenticate`, `hmac-skew-shorter-than-cold-start`) |
| R3 | Broker forwards the caller's original signature after waking a private runtime | expired inside the private cold start (IndicF5 canary 401 `transport_binding_invalid`) | broker re-signs fresh internal transport (`a-cold-broker-cannot-forward-the-original-expiring-signature`) |
| R4 | Widen the skew window | it IS the replay protection | rejected outright (`decisions.md#wake-then-sign-never-sign-then-wait`) |
| R5 | Warmth as two independent timestamps | a 504 left "warm" standing; next click took the blocking 4-min path | wake clears ready (`warming-that-does-not-clear-warm`) |
| R6 | Client stops after 6 (then 7) polls | stopped before/at the server's 200 s in-flight window and on the second synthesis' warming reply | 10 polls / 300 s, late success marks warmth (`preview-client-cannot-stop-before-the-server-wake-window`) |
| R7 | Treat the first post-idle preview as the product result | 9.84 GB image still pulling → honest warming; reporting a "bad clone" conflates infra with audio | wait for readiness with zero restarts; success only on a sealed browser audio element (`cold-runtime-warming-is-not-a-failed-clone`) |
| R8 | Read the 202 warming body after an `ok` check | 202 is `ok`; warming surfaced as "audio integrity error" | test 202 before ok (`mirror-turn-voice-202-read-as-corrupt-audio`) |
| R9 | Noise floor = 10th percentile of frame energy | on continuous lecture speech p10 IS speech; every window "mostly_silence"; lane refused its most normal input | cap floor at 0.2·median (`noise-floor-from-a-percentile-of-speech`) |
| R10 | Slice ffmpeg pipe output at a fixed 44-byte header | pipe WAV has `0xFFFFFFFF` size and a LIST chunk, payload at byte 78 | output via temp file, chunk-walking reader (`ffmpeg-pipe-output-cannot-carry-a-sized-wav-chunk`) |
| R11 | ffprobe the upload from a pipe | MP3 duration not readable from a non-seekable stream | ffprobe a file (`ffprobe-cannot-read-mp3-duration-from-a-pipe`) |
| R12 | Validate inserts by re-reading tables inside the same data-modifying CTE | invisible rows → guard `1/0` always fired; zero evidence ever committed | "inserted OR identical already present" (`data-modifying-ctes-cannot-see-each-other`) |
| R13 | Ship producer and runner without a sweep | nothing called the runner; upload sat queued while UI animated progress | Container Apps Job + manual-fallback endpoint (`a-runner-nobody-runs`) |
| R14 | A "graceful" scan adapter when no scanner is deployed | degrades into claiming a file is clean | three outcomes OK/FOUND/throw; named absence (`a-scan-we-did-not-run-must-never-say-clean`) |
| R15 | `--no-install-recommends` ClamAV image | shipped a daemon with no `clamdscan` client | REQUIRED_STEPS assertion caught it in 20 s (`clamdscan-is-only-a-recommended-package`) |
| R16 | Start ClamAV only if a scan job existed at run start | the run's own loop created the scan job after integrity → `clamav_daemon_unavailable` | integrity also triggers daemon start (`initial-queue-only-clamav-startup-misses-a-new-scan-child`) |
| R17 | Foreground clamd in a run-once job | kept a finished execution `Running` across three later schedules | own the child, kill in finally (`foreground-clamd-cannot-outlive-a-run-once-queue`) |
| R18 | Separate the whole recording on the GPU | single unchunked pass; CUDA OOM (structural); ~70 MB response | window to the owner's best 10 s (`windowing-belongs-at-separate-now-that-diarize-is-done`) |
| R19 | Window to 10 s before diarize | would destroy speaker evidence, starve separate/enhance, truncate transcript to 10 s; proxy scorer on a consent decision | rejected; window only after diarize (`decisions.md#windowing-belongs-before-the-embedder-not-before-diarize`) |
| R20 | Raise the evidence duration cap 600 → 1200 s as the fix | moved the wall from diarize to separate; 30-min lectures still fail; 1,200 s compiled hard ceiling | chunked analysis (`23dafa19`) |
| R21 | Run Sepformer (16 kHz) on every recording and deliver the 16 kHz scoring buffer | 0.000458% energy ≥8 kHz; identity cues gone | skip at ≥0.90 dominant share; re-cut 24 kHz from original (`298c1599`) |
| R22 | Bandwidth gate threshold guessed at 1.5% | failed the real fixed reference (0.022%) | calibrated 0.003% between two real readings (`bandwidth-threshold-first-guess-was-miscalibrated`) |
| R23 | Change enhance output format without bumping transform_version | artifact identity keyed on version → 23505 collision; suffixing broke the 80-char safe alphabet twice | short distinct id (`decisions.md#transform-version-must-move-with-output-format`) |
| R24 | Re-run one DAG step at a new revision | dependency check is per revision → `processing_dependency_missing` | copy forward unaffected rows (harness only) (`revision-bump-cannot-be-partial-across-the-dag`) |
| R25 | Let voice_quality auto-run after a partial regeneration | revision-agnostic input query collected 8 artifacts vs a 4-input cap; deleting stale ones would cascade-delete 23 incident rows | left failed, incident history kept (`voice-quality-cannot-see-a-partial-artifact-generation`) |
| R26 | Pick the newest enhance artifact in self-test mode | chose noise-suppressing over the identity-preserving sibling | rank identity-preserving first (`newest-enhance-artifact-is-not-the-best-identity-reference`) |
| R27 | Readiness from the newest 300 review rows | 1,683 speaker rows displaced by transcript rows → "zero speaker segments" | build-window query, 2,000-row fail-closed limit (`latest-300-review-rows-cannot-decide-long-source-readiness`) |
| R28 | Adapter version suffix with `+` | outside the persisted safe alphabet → `invalid_processing_adapter` | hyphen form (`plus-suffixed-adapter-version-is-not-a-valid-processing-fact`) |
| R29 | Composition called the adapter object | `evidence.value.diarize is not a function`; found only via content-free diagnostics | dispatch through the method (`diarization-adapter-object-is-not-the-diarize-function`) |
| R30 | Stream a 262 MB MP3 to Sarvam with chunked transfer and a `.wav` name | HTTP 400 before the batch job started | bind Content-Length and a truthful extension (`chunked-transfer-and-wav-name-do-not-describe-a-known-size-mp3`) |
| R31 | Raise the upload cap to 1 GiB alone | monolithic PUT, 64 MiB heap read, 70 MiB ClamAV stream, 20-min evidence ceiling all remain | TUS, disk streaming, fdpass, chunked diarization (`raising-the-upload-cap-alone-still-fails-long-media`) |
| R32 | Trust browser `File.type` as storage MIME | Azure stored `video/mpeg` for an MP3 → `mime_mismatch` rejection | MIME bound by the signed source contract (`raw-browser-file-type-is-not-storage-mime-authority`) |
| R33 | Per-bucket Supabase limit of 1 GiB | cannot exceed the project global limit (413) | account setting or Azure Blob (`per-bucket-limit-cannot-bypass-the-project-global-limit`) |
| R34 | Neon Object Storage beta as media plane | beta, us-east-2 only, branch inheritance unsafe for biometric erasure | private Azure Blob (`neon-object-storage-beta-is-not-the-production-media-plane`) |
| R35 | Read per-step durations from the attempt table after a requeue | requeue resets attempt to 0, retry reuses the first row: malware_scan reads 783 s for a 1.4 s scan | not fixed; named design choice (`requeue-resets-attempt-and-the-timing-row-survives`) |
| R36 | Reuse the shared ASR registry inside the DAG | could hand a signed pull URL to an external lane, breaking bytes-only | reuse the protocol, not the selection (`registry-selection-leaks-a-pull-url-into-the-dag`) |
| R37 | Romanised Hindi marker lexicon on Sarvam output; tokenizer without `\p{M}` | code-switch ratio 0.000 on bilingual speech; every matra became a space | script-aware scoring, keep marks (`romanised-lexicon-meets-devanagari-asr`) |
| R38 | Infer the CFG arm from the requested value | omitted reference mode → effective CFG 0, so a "0.5" arm could equal the mitigation arm | record requested + effective + evidence scope (`requested-cfg-without-reference-evidence-is-not-an-ab-arm`) |
| R39 | Rank providers by language-level average ratings | clips shared topic, not target text; prompt length/wording confound the model | exact-text cells only (`language-match-is-not-a-matched-text-comparison`) |
| R40 | Symmetric English/Hindi provider grid | Qwen English-only, IndicF5 Hindi-only; filling cells changes the model or text | capability-shaped cells (`a-symmetric-two-language-grid-would-fabricate-provider-capability`) |
| R41 | Normalise listening stimuli to the loudest source RMS | a high-crest clip would exceed the 0.92 peak | minimum per-clip peak-safe ceiling (`maximum-source-rms-is-not-a-peak-safe-listening-level`) |
| R42 | Alternate ABX choices at two periods | 10 A vs 8 B over 18 trials; side bias reads as signal | four-cell cycle per pair (`alternating-is-not-counterbalanced`) |
| R43 | PerTh on arbitrary-length converted audio | 240-sample framing → `perth_watermark_application_failed` | pad, watermark, trim, detect (`perth-watermark-needs-explicit-frame-padding`) |
| R44 | Verify Python receipt hashes in JS by ordinary canonical JSON | `1.0` vs `1` → different hashes; a good response discarded | normalise integral floats (`python-javascript-float-canonicalization-can-break-receipt-hashes`) |
| R45 | Textbook LoRA init from the global torch RNG | advanced the request-seeded stream; adapted arm sampled different tokens | private generator (`adapter-init-stole-the-sampling-seed`) |
| R46 | Second speaker-embedding family as a second opinion | raw x-vector cosine 0.997: saturated | ECAPA only; PLDA needed (`measurements.md#first-real-clone`) |
| R47 | Sweep YouTube levers against a just-updated app | `provisioningState=Succeeded` before the revision served; four results were stale | prove the lever is connected with a dead-proxy control (`provisioning-succeeded-is-not-serving`) |
| R48 | A single global `REPLICA_SELF_TEST_MODE=true` | a footgun for every account | owner-bound three-part guard; rows tagged and revocable (`single-self-test-boolean-is-a-global-footgun`) |
| R49 | Satisfy the voice-genome gate by hand-writing `source_set_hash` | builder refused `model_build_source_set_changed` (correctly) | bypass friction, never the hash (`self-test-mode-must-not-hand-write-source-set-hash`) |
| R50 | Self-test account attestation as consent for a third party's lecture | does not establish the speaker is the account owner | training consent binds the speaker (`self-test-account-attestation-is-not-third-party-speaker-consent`) |
| R51 | Map route errors only when they carry a code | 16 bare `{status:400}` throws became opaque 500s | honour any 4xx, match shape, always log (`a-coded-catch-hides-an-uncoded-throw`) |
| R52 | "Not authorized" for an empty eligibility join | blamed the user for platform latency across 15 preconditions | name the first unmet precondition (`decisions.md#refusal-names-its-precondition`) |
| R53 | Two-value `owner` field as the blocker class | a gate needing processed material is "ours" while owned by the user | separate `cls` type (`owner-field-was-not-the-blocker-class`) |
| R54 | Requirement list naming `SUPABASE_SERVICE_KEY`; fixture with the same typo | lane permanently "not connected" while 8 steps showed complete; test agreed with itself | negative control on the old name (`1ddcd22e`, `1621e01c`) |
| R55 | Layout gate on the signed-out page | measured six blocks of sign-in copy and passed against the bug | real signed-in fixture with coverage assertion (`a-layout-gate-that-cannot-reach-the-signed-in-screen`) |
| R56 | Shrink/reword the sticky bottom pager (twice) | same complaint each time | deleted outright (`the-sticky-pager-was-deleted-not-shrunk`) |
| R57 | `git stash` from a worktree | one global stash stack across all worktrees | never stash in a shared git dir (`stash-in-a-shared-git-dir`) |
| R58 | Trust a mission brief that the sweep was merged | it existed only on another branch | merge and verify (`the-mission-brief-said-the-sweep-was-already-merged`) |
| R59 | Probe live S2S pronunciation | the conversational lane paraphrases; cannot control spoken text | cascade TTS + ASR round trip (`evals/speech/l1-hinglish.mjs`) |
| R60 | Converter-first Hindi (IndicF5 → OpenVoice tone conversion) | ECAPA 0.7267 → 0.6810, script-aware WER 0.3036 → 0.375 | direct multilingual cloners first (`openvoice-tone-conversion-regressed-owner-proxy-and-asr`) |

Also present and already detailed in `gurukul.md` (not repeated): `disclosure-announces-the-clone`, `supabase-object-info-is-not-json`,
`sarvam-batch-paths-were-three-guesses`, `plausible-return-hides-a-dead-pipeline`, `readiness-probe-only-is-fatal`,
`a-green-build-and-a-green-healthz-can-both-lie-about-a-model`, `a-cuda-base-image-is-not-free-on-a-scale-to-zero-service`,
`utf8-byte-duration-inflates-devanagari-in-indicf5`, `uppercase-element-sequences-are-not-sufficient-chemistry-evidence`,
`text-coverage-is-not-acoustic-symbol-correction`, `sarvam-bulbul-existing-key-returned-payment-required`, the ZONOS2/MOSS/Fish
compute rejections, `offline-mocks-cannot-type-check-sql`, `statement-shapes-postgres-will-not-parse`, `mine-everything-you-are-handed`,
`pdf-text-is-whatever-the-bytes-decode-to`, `player-clients-do-not-beat-a-datacenter-ip`, `po-token-is-a-warm-ip-mitigation-not-a-route`.

---

## 13. Concepts worth carrying into Taxila

1. **Selection, not accumulation.** Read the consumer's truncation before building anything that grows its input. [Taxila: a
   realtime prompt has a budget; a learning profile that keeps growing changes nothing past what is selected into the slot.]
2. **Wake, then sign.** Never put a signature, a timeout or a user's patience inside an unbounded cold start; design the wait.
3. **Capability absence is not a failed input.** "Waiting on us" vs "waiting on you" as a type, never a sentence.
4. **Scoring bandwidth is not delivery bandwidth.** A buffer built for measuring must never be the buffer you ship.
5. **Identity needs an anchor.** Without an enrolled reference, a speaker cluster's likelihood is 0.5 = unknown, never a measurement.
6. **Conservative split over guessed merge** when reconciling labels across chunks.
7. **Calibrate thresholds on real bytes.** A guessed threshold that fails the fix it confirms is worse than no gate.
8. **Three verdicts for equivalence**: distinguishable / indistinguishable (CI under a bound) / inconclusive with trials needed.
9. **Exact-text, capability-shaped comparison cells**; semantic similarity does not make a fair head-to-head.
10. **A hypothesis carries its n and a named band**, never a decimal confidence a UI will render as a percentage.
11. **Proposals at a budget** (3/min), feature-queries over label-queries, surplus deferred not dropped, nothing applied without an ack.
12. **Reuse only when invariants are shared** (protocol yes, selection no).
13. **Do not fit the grader; treatments include their side effects on shared state** (RNG).
14. **Prove a lever is connected** with a control whose failure is unmistakable before sweeping it.
15. **Content-free diagnostics**: type + safe message + repo frame turns an opaque 503 into a one-retry fix without logging data.
16. **Cost reservation before network**: reserve per attempt in a ledger and refuse past a hard stop.
17. **Grep for a caller, not a definition**; and test both sides of every format boundary together.

---

## 14. Gaps / unread

- The 26 owner-account commits in `ws-as..GP` have empty bodies; I read their file stats and the `context/` entries they appended,
  not every diff line (e.g. the full `api/_replica-storage.js` rewrite, `src/studio/EnrollmentWorkspace.tsx`, `enrollmentLanguage.ts`).
- Runtime code for Qwen3-TTS, VoxCPM2, ZONOS2, MOSS, OpenVoice converter (`services/*-runtime/app.py`, `contract.py`) not read line by
  line; their results are taken from `measurements.md`.
- `services/voice-finetune/train.py`, `evals/earbench/audio.mjs` (disclosure trim), `evals/mirrorcall.mjs`, `api/_replica-activity.js`,
  `api/_replica-review.js`, `api/_fidelity.js`, migrations 057–065 were skimmed via headers/greps only.
- `docs/gurukul/{AZURE-DEPLOY-STATE,ENV-MANIFEST,DEPLOY,UX-QUEUE,ingestion-research,video-enrollment,youtube-extraction-*}.md` not
  re-read (covered by `gurukul.md` or out of Taxila scope).
- `decisions.md` (159 Gurukul-era entries) and `rejected.md` (146) were read selectively for voice/pipeline/UX; `graph.json` was
  not queried with `scripts/context.mjs`.
- No human listening result exists anywhere in this lineage; no measurement of child voices, of ECAPA on children, or of
  DeepFilterNet3 on vs off; these are open for Taxila to measure, not to assume.

---

## Verification

Adversarial pass, 2026-10-02, against `html-portfolio@771feef9` (read via `git archive`, nothing checked out in the source repo). All cited paths exist at the ref. No secrets present in any cited file (env-var names only). Taxila constraints applied: Azure-only AI (no Sarvam/ElevenLabs/etc.), no voice cloning in scope, Vercel-node plus Azure Container Apps, Neon.

Executed: `evals/earbench/run.mjs` (108 ok), `evals/studiowizard.mjs` (80 checks pass), `evals/speech/hindi-text-frontend.test.mjs` (pass), `check-enrollment-bandwidth.mjs` negative control (ok), `check-enrollment-sample-rate.mjs` (4 sites agree).

Refuted or corrected claims:
- **HGC-34** scrubPii does NOT cover what it says. Tested: `1234 5678 9012` (spaced Aadhaar), `98765 43210`, `+91 98765 43210` and Devanagari digits all pass through unredacted. Only contiguous digit runs, emails, IPv4 are caught. No names/addresses/school. Not adequate for child transcripts.
- **HGC-13** "handles 0xFFFFFFFF sizes" is false: no such handling in `_audio/wav.js` or `windows.js`; an unknown-size streaming header is rejected as `wav_chunk_truncated`. LIST-chunk walking is real.
- **HGC-10** "mode-0600 temp dirs" is not in the code; it uses `mkdtemp` (0700 default). Needs ffmpeg/clamdscan binaries, so runs only in a container, not a Vercel function.
- **HGC-03** is not a copy: only `capability-codes.js` (29 lines, leaf) is portable; `composition.js` (317 lines) imports native-tools, Azure voice-evidence, Sarvam and storage adapters.
- **HGC-12 / HGC-23 / HGC-32** depend on third-party or non-Azure-first-party AI (Sarvam, IndicF5, vendor arms in bake-off JSON); barred by the 2026-10-02 directive.
- **HGC-33** thresholds are stylometry for a speaker-style mirror; the source comment admits its citations are "search-summary tier, both PDFs failed to decode"; imports generated `_engine.gen.js`.
- **HGC-18 / HGC-17** nonce replay cache is in-process memory: resets on scale-to-zero and is not shared across replicas.
- **HGC-05** ECAPA (voxceleb) on children is unmeasured; `_signal_quality` SNR degenerates (noise floor 1e-6) when there is no non-speech.
- **HGC-30** corpus is Meera persona text and the "live lane cannot be probed" argument is about Gemini Live, not gpt-realtime.
- **HGC-15** threshold calibrated on one replica file (n=1) for a 16 kHz-resample artifact.

| id | exists | impl | portable | Q | use | note |
|---|---|---|---|---|---|---|
| HGC-01 | y | y | y | 4 | adapt | 82 lines, deps only `contracts.js`; DAG is audio-specific; blocked only for integrity/malware codes |
| HGC-02 | y | y | partial | 4 | adapt | real lease CTE; welded to `vy_replica_*` tables and `_provider-budget.js`; default lease 120 s (1 h is the max) |
| HGC-03 | y | y | partial | 4 | adapt | copy only capability-codes; composition drags Sarvam |
| HGC-04 | y | y | y | 4 | copy | 10 lines; frame regex hardcodes `api/_replica-processing`; allowed-message regex can still echo short data-bearing text |
| HGC-05 | y | y | partial | 3 | adapt | GPU image, 4 models; keep VAD+diarize only; nonce cache in-memory; adult-trained ECAPA |
| HGC-06 | y | y | partial | 3 | adapt | Python/torch; reimplement client-side for mic check |
| HGC-07 | y | y | y | 4 | adapt | pure JS, no imports; value low without cloning |
| HGC-08 | y | y | n | 3 | idea | clone reference selection; only dominantShare idea transfers |
| HGC-09 | y | y | partial | 4 | adapt | `reconcileDiarizationChunks` pure; adapter wrapper is not |
| HGC-10 | y | y | partial | 4 | adapt | container only; 0600 claim false |
| HGC-11 | y | y | partial | 4 | adapt | good Container Apps Job template; imports composition/runtime |
| HGC-12 | y | y | n | 4 | skip | Sarvam third-party API barred |
| HGC-13 | y | y | y | 4 | copy | parametrise 24 kHz; 0xFFFFFFFF claim false |
| HGC-14 | y | y | y | 4 | adapt | passes; pattern portable, SITES list is Gurukul-specific |
| HGC-15 | y | y | y | 3 | adapt | passes; n=1 calibration |
| HGC-16 | y | y | partial | 3 | adapt | hand-rolled SAS (682 lines); prefer `@azure/storage-blob`; keep CRC64 browser idea |
| HGC-17 | y | y | n | 3 | idea | only if self-hosting a GPU model; Taxila uses Foundry |
| HGC-18 | y | y | partial | 3 | adapt | prefer Entra/managed identity inside Container Apps; replay cache weak |
| HGC-19 | y | y | partial | 3 | adapt | state machine fits slow module generation; coded to GPU cold start |
| HGC-20 | y | y | n | 4 | skip | Chatterbox cfg_weight; irrelevant to gpt-realtime |
| HGC-21 | y | y | partial | 3 | idea | test passes; needs a text-to-TTS step Taxila's S2S voice does not have |
| HGC-23 | y | y | n | 4 | skip | IndicF5 not first-party Azure |
| HGC-26 | y | y | y | 4 | adapt | 108 tests pass, only node:crypto; identity-ABX is clone-specific, keep naturalness/stats; never used on a human |
| HGC-27 | y | y | partial | 3 | adapt | listening-bench plumbing; not re-run |
| HGC-28 | y | y | n | 3 | idea | Chatterbox/Perth specific; reuse spend-ledger idea |
| HGC-29 | y | y | partial | 3 | idea | 955 lines tied to earbench bundles; RSA attestation overkill |
| HGC-30 | y | y | partial | 3 | adapt | retarget to Azure/gpt-realtime; scorer reusable, corpus is Meera |
| HGC-31 | y | y | partial | 3 | adapt | 568 lines clone-specific; copy SKIP-row discipline |
| HGC-32 | y | y | n | 3 | idea | vendor arms and prices stale/barred |
| HGC-33 | y | y | n | 3 | idea | named evidence bands idea only |
| HGC-34 | y | y | y | 2 | adapt | fails spaced Aadhaar/mobile and Devanagari digits |
| HGC-37 | y | y | n | 3 | idea | imports Gurukul engine (practiceTalk, demoBank, practiceStore) |
| HGC-38 | y | y | y | 4 | copy | blockerClass.ts only (198 lines, no imports); 80 checks pass |
| HGC-39 | y | y | partial | 4 | adapt | pure normaliser, imports capability-codes; table is `vy_`-prefixed |
| HGC-41 | y | y | partial | 3 | adapt | needs playwright + dist; mounts Gurukul StudioApp; skips when dist absent |
| HGC-42 | y | y | y | 3 | adapt | Taxila already merges via `context/inbox`; union logic only |
| HGC-43 | y | y | y | 3 | adapt | 124 lines, named refusals; swap limits |
