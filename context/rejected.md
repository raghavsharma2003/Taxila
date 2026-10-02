# Rejected

What was tried and what specifically broke. Read this first.

## meera-realtime-azure
(Inherited from html-portfolio `context/rejected.md#realtime-azure`.) Azure gpt-realtime-mini as Meera's live
voice: turns ran 41-53 words — 14 s monologues — and it lacked a continuous frame channel. Re-tested for
Taxila with a teacher prompt (`realtime-teacher-bakeoff-2026-10-02`): mini still 38 words even with structural
brevity, so mini stays rejected as the primary teacher voice.

## brevity-by-instruction
Asking the realtime model for "two or three short sentences" inside the brief: 64 words/turn median on both
2.1 and mini (n=6 each). Instruction-as-prose does not bound turn length; structure does (see
`voice-realtime-model`).

## claude-on-foundry-credits
Tried deploying Claude Opus 5.5 (`claude-opus-5-5` v2, format Anthropic, GlobalStandard 50) and Sonnet 5.5 on the
Foundry resource as the Forge game-building model (2026-10-02). The deployment API first demanded
`properties.modelProviderData {industry, organizationName, countryCode}` (only accepted on api-version
`2025-10-01-preview`), then provisioning FAILED with "This purchase cannot be completed. Please contact Microsoft
support". Claude on Foundry is a Marketplace (third-party) purchase; this subscription's credits/payment profile
cannot buy it. First-party OpenAI models on the same resource deploy fine. Unblock path is owner-side (Microsoft
support / a payment method that allows Marketplace) — until then the Forge runs on gpt-5.3-codex.

## vm-per-student
A persistent VM/container per student. Rejected by cost arithmetic, NOT by trial: ~$0.50/student-month
(snapshot storage) to ~$20/student-month (always-on), with no capability the Postgres+Blob workspace lacks — nothing a
child owns needs a live process between lessons. If ever tried, measure snapshot size and resume time first.
(`docs/research/factory/sandboxes-per-student.md` §9.4)


<!-- merged from inbox/design.json -->
## ds-rejected-percentage-layout
Tried (lesson-arc §3, 2026-10-02): lesson-stage layout as percentage shares of an 800 dp phone (e.g. L2 Teach Young: teacher 40%, module 35%, plus a 72 dp whiteboard, two >= 96 dp tiles, an 88 dp mic, caption and top bar). What broke: the regions sum to ~117% of 800 dp (ui-teardown measured ~854 dp of 744 usable) before system insets; the micro-session wireframe overflowed the same way; and budget phones are 360 x 640-720 dp after browser and system bars, so the wireframes could not render. Replaced by `ds-layout-dp-budget`. Lesson: never specify a stage in percentages without summing the fixed-size rows at the floor height.

## ds-rejected-chalk-mark-gold
Tried (visual-identity §3.2, §9, 2026-10-02): a `chalk-mark #F2CF6B` gold underline on the newest chalk-ledge chip, on the same screen as the marigold YOUR TURN ring. What broke: it is a pale marigold (hue 44 deg); CIEDE2000 vs `turn` is 6.7 under deuteranopia and 7.9 under protanopia (`design-token-contrast-2026-10-02`), so a colour-blind child sees two gold highlights and cannot tell which is the turn; it violates the one-marigold rule that `ds-status-carriers` depends on. Replaced by a white hand-drawn chalk underline (shape, not hue; 10.86:1 on the board) and a lint: no token within 12 deg of `turn`'s hue on a screen that renders YourTurn.


<!-- merged from inbox/learner.json -->
## cat-sd035-first-session
**Tried (in simulation): stopping the first-session placement CAT at posterior SD < 0.35, as kt-algorithms D4 specified.** (2026-10-02)
- What broke: within the 12-item first-session budget the stop is never reached; mean posterior SD at 12 items was 0.52-0.63 (onboarding-cat-sim-2026-10-02), so the rule silently degrades to 'always hit the item cap', which lengthens session 1 for 6-9-year-olds without the precision it promises.
- Replaced by: learner-ge-scale-one-cat (SD < 0.55 after >= 4 items, strain/time/cap stops, provisional placement topped up by just-in-time items).
- Would be revisited if: an item bank with much higher information per item (a > 2.5 per GE) is calibrated on Taxila children.

## affect-not-stored-as-legal-shield
**Tried (as a proposed decision, dialogue-affect DA8): keep affect detectors as pure functions of the turn log, never store their outputs, recompute on replay, and treat that as keeping affect inference outside DPDP s.9(3).** (2026-10-02)
- What broke (on review, before build): (1) processing, not storage, is the regulated act, so not storing does not take real-time affect inference out of 'behavioural monitoring' [needs counsel]; (2) the LLM dialogue-act labeller is non-deterministic, so replay requires stored labels (a 30-day turn->acts cache), which is stored affect-adjacent data; (3) the session state has to live somewhere on Azure Container Apps.
- Replaced by: learner-legal-mode-ratchet (session-only processing in M1 with a defined in-memory home and an explicit-only fallback; research telemetry only under P4 with a 30-day TTL).
- Would be revisited if: counsel's opinion on dpdp-deep Q1(a) says within-session adaptation from a child's dialogue is not monitoring at all.


<!-- merged from inbox/avatar.json -->
## avatar-lipsync-dead-ends
Three lip-sync approaches were measured on the Hindi bench (`avatar-lipsync-bench-2026-10-02`, 2026-10-02) and rejected:

1. **wawa-lipsync 0.0.2 on live audio.**
   - **Tried:** the real code over a spec-faithful AnalyserNode.
   - **Broke:** its best alignment lags the audio by 217–233 ms, because of analyser smoothing 0.8 plus a 10-frame history. It closed the lips on 0 of 34 English bilabials and 11 of 84 Hindi ones.
   - **Reverse if:** a new version removes the smoothing and the history, and re-benches under 60 ms lag.
2. **A 120 ms minimum viseme hold** (the fix proposed in HeadAudio issue #3 to stop chatter).
   - **Tried:** the hold applied to HeadAudio's output.
   - **Broke:** r fell from 0.43 to 0.16, and closures fell from 55 to 14 of 84. A hold buys smoothness by keeping wrong mouths on screen longer. Hold time is the wrong knob; RMS for the jaw plus classes for lip shape is the structure.
3. **wav2vec2/HuBERT-class face models on the phone** (`wav2arkit_cpu` in onnxruntime-web).
   - **Tried:** the model in onnxruntime-web WASM.
   - **Broke:**
     - The "1.8 MB" model needs a 402 MB `.onnx.data` weight file.
     - It ran at 491 ms per audio second on one Xeon thread (165 ms on 4 threads), so it is at or past real time on an A55.
     - Its output leads the audio by 100–167 ms, so it needs lookahead that the WebRTC path does not have, and delaying the audio is forbidden.
   - **Reverse if:** a model of 1.5 MB or less meets p95 < 2 ms per frame on an A55 with no lookahead. That is what the v1.5 distilled student targets.

## avatar-asset-dead-ends
Avatar asset approaches measured in `avatar-asset-perf-2026-10-02` and `character-pipeline-proto/` (2026-10-02) and rejected:

1. **Draco (KHR_draco_mesh_compression) for face avatars with unquantized morphs.**
   - **Tried:** Draco on 5 face avatars.
   - **Broke:** files stayed at 89–96% of raw, because the encoder leaves morph targets uncompressed, and morphs are 80–91% of the geometry. Decoding was 2–5× slower than meshopt, and the decoder is 15× larger.
   - **Caveat:** the comparison did not quantize the Draco arm. The spec is silent on morph targets, so this is a property of the encoder.
   - **Reverse if:** a Draco encoder compresses morph targets and beats meshopt's decode time on device.
2. **Naive shape-key delta transfer onto a stylised identity**, i.e. W(neutral) + δ.
   - **Tried:** enlarging the eyes ×1.15 / 1.3 / 1.5 on the ICT head, then adding the original blink delta.
   - **Broke:** 1.3% / 3.4% / 8.1% of the cornea stayed visible at blink = 1 (3, 8 and 19 of 236 rays). Baking each key through the warp, W(neutral + δ), gave 0.0%.
   - **Note:** warp-baking is exact only at weight 1 and one key at a time, so partial weights and combinations still need tests and in-between correctives.
3. **Decimating a finished realistic head for mobile.**
   - **Tried:** ICT 26k → 6.7k / 3.3k vertices, with closest-point shape transfer.
   - **Broke:** the lid and lip loops were destroyed. Cornea stayed visible at blink (6 of 56 and 1 of 27 rays), and open-eye visibility fell to 82% and 78%. Author low-poly topology with lid and lip loops instead (MPFB has them).
4. **Exporting OBJ-imported heads with custom split normals.**
   - **Broke:** 102,530 GPU vertices from 25,959 mesh vertices (3.95×). That inflates the morph texture to 110 MB. Clear the split normals and shade smooth (27,956), and gate GPU/Blender vertices at ≤ 1.3.
5. **WebP textures for GPU memory.**
   - **Broke:** WebP saves wire bytes but lands as RGBA8: 5.59 MB per 1024² against 0.70 MB for ETC1S, with a 6–10× slower decode.


<!-- merged from inbox/market.json -->
## rj-paid-install-engine
**Tried (by incumbents).** Ad-led app-install growth.
- Seekho spent Rs134.2 cr on ads for Rs141.5 cr of revenue (FY25).
- Doubtnut spent Rs194 cr to earn Rs10 cr (FY22) and was later sold for ~Rs83 cr.

**What broke.**
- At Rs299/month the base contribution LTV is about Rs1,267, so CAC must stay at or below about Rs422 for 3x.
- Paid installs would then need about 9.5% install-to-payer. The global median is 2.1% for freemium (RevenueCat 2026).
- Only 6% of children discover EdTech through ads (BaSE).

**Instead.** School-seeded, referral and CTWA. Paid social is capped at 15% of the budget until measured install-to-payer reaches 8% or more.
- Source: gtm-distribution.md §2, §5. failures.md B4/B9.

## rj-hour-for-hour-realtime
**Tried (modelled).** Replacing a tutor hour for hour with realtime two-way voice: 26 h/month at a 55% gross margin.

**What broke.**
- The price would have to be Rs10,106/month on rt-2.1-mini and Rs22,653 on GPT-Live (the GPT-Live price is unverified).
- Even the cascade needs Rs2,283, which is at par with a Rs1,500-3,000 tutor, not cheaper.

**Instead.** Lane mix: about 30-35% two-way voice and the rest tap practice with cached narration (mk-tiers-as-voice-budgets).
- Source: pricing-unit-econ.md §4.3.

## rj-passive-tutor
**Tried (Khanmigo, two-year independent RCT, Tennessee, 18 schools).** A Socratic tutor that waits for the student to ask.

**What broke.**
- Students messaged it in a median of 17% of practice sessions with a mistake.
- The ITT effect was 0.06-0.08 SD per year, resembling Khan Academy practice without AI.

**Instead.**
- The tutor leads every exchange: auto-start, specific answerable questions, "show me how you got that".
- The Conductor schedules sessions. There is no "ask me anything" home screen.
- Release metric: tutor dialogue in at least 80% of mistake moments, reported as the median.
- Source: https://edworkingpapers.com/sites/default/files/ai26-1551.pdf via global-ai-tutors.md and failures.md P2.

## ct-no-voice-emotion-inference
**Constraint (sourced).** The Microsoft AI Code of Conduct v4.0 bans inferring emotional states from speech patterns or facial expressions. It binds Taxila under the Azure-only directive.

**Consequence.** The child's "vibe" and engagement are inferred only from task evidence and what the child says. Prosody-based affect detection is rejected.

**Open.** Ask Microsoft in writing whether text-only affect signals are allowed.
- Source: https://learn.microsoft.com/en-us/legal/ai-code-of-conduct via bigtech.md.

## ct-no-gemini-api-for-minors
**Constraint (sourced).** The Gemini API terms bar services likely to be accessed by under-18s. Gemini is also outside the Azure-only directive.

**Consequence.** Never propose Gemini Live, or any Gemini Developer API path, as a voice or LLM fallback for a child-facing lane.
- Source: https://ai.google.dev/gemini-api/terms via bigtech.md.

## op-pw-k8-ai-tutor-watch
**Open.** PhysicsWallah's Socratic AI Tutor is in beta: 300+ users, ~95% satisfaction, ~$0.20/h, "remembers mistakes" (all company-reported via MediaNama, 2026-08).

**Inference.** It extends to K-8 within 6-12 months. CuriousJr already has 5.5M installs and 4x revenue YoY.

**Watch.**
- PW's Q2 FY27 shareholder letter (~Nov 2026).
- LEAD Ms Curie expanding beyond English.
- Google: Gemini Live Hindi for Family Link children, or an NCERT deal.

**If PW ships K-8 at Rs300/month or less,** re-run the wedge and pricing decisions.
