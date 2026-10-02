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


<!-- merged from inbox/psychology.json -->
## independent-prior-claim-budget
Proposed (`docs/research/psychology/parent-reports.md` PR-D5 and §4.2, 2026-10-02; rejected in methodologist review and by simulation before any build): each parent pattern claim gets an independent beta-binomial posterior with a weak band prior (a0 + b0 <= 4), is eligible at P >= .9, and a report admits eligible claims while sum(1 - P) <= epsilon, presented as a Bayesian expected-false-discovery bound. What breaks: the bound holds only if posteriors stay calibrated after screening, and independent weak priors are not. In `research-program-synthsim.py` §A (3,000 children, 30 screened contrasts, 12 per arm) a report with no true effects admitted 4.89 claims, all false, while the budget believed 0.21; the reviewer's simpler sim found 2.5 vs 0.11. A normal-normal pooled prior fixes the full null but not sparse real effects (2.22 false vs 0.17 believed). Replacement: two-groups (spike-and-slab) pooled posteriors per pre-registered menu item, a logged screened count, and simulated-null + sparse-mixture validation (`psych-parent-claim-gate`).

## raw-count-growth-route
Proposed (`docs/research/psychology/metacognition-srl.md` §6.3 rule 2; similar "≥ 3 windows" rules in `motivation-habits.md` §6 and `parent-reports.md` §4.2, 2026-10-02; rejected in review): a then -> now change statement is allowed when raw counts move consistently in one direction over >= 3 consecutive 28-day windows, as an alternative to a posterior rule. What breaks: with no true change, noise alone produces runs. MS review P2: 99% of children got at least one false row a year (mean 2.9). `research-program-synthsim.py` §B (4,000 children, 6 rows, n = 30 per window): 5.63 false rows per child-year and 100% of children affected. Replacement: `psych-change-rule-term`.

## grade-equivalent-parent-band
Proposed (`docs/research/psychology/learning-over-time.md` §3.7, §7 principle 7, [Progress] block; `parent-reports.md` level ribbon, 2026-10-02; rejected in review): show parents a grade-equivalent band for subject ability ("working at early Class 5 level"), framed as level, never rank. What breaks (LOT review R6): grade equivalents are not equal-interval, depend on a norming sample Taxila does not have, extrapolate beyond tested grades, and Taxila has no vertical scale yet; the statement is norm-referenced, contradicting the no-comparison rule, and for a Class 6 child it is a high-stakes below-grade label; parents misread GEs (Smith 1999: 76.7% of 30 parents misinterpreted them, as confident as those who were right [S]). Replacement: criterion-referenced rows against NCERT learning outcomes, and a theta trajectory with its uncertainty ribbon on an unlabelled scale at term (`psych-claim-tiers`). Could be revisited only after vertical scaling, a representative norming study and a parent-comprehension test; the default is never.


<!-- merged from inbox/content.json -->
## live-free-generation
**Tried (2026-10-02, genui and animation benches): free-form generation for the live lesson — free `scene@1` composition from primitives, free-form `explainer@1` beats, free SVG for exact school diagrams, and schema-less `json_object` output.** What broke:
- Latency: free scenes 11.9-18.2 s p50 per call plus 10-13 s per repair; free explainers 13.6-29.7 s; free SVG 8-25 s (sol) — all far past the 2-3.5 s the teacher's preamble covers.
- Validity: free scenes 0/8 (fast) and 3/8 (brain) lint-clean on the first call; free explainers 3/8 and 2/8, failing on geometric self-contradiction (morning shadow shorter than noon, integer marker placed by value not pixel, groundwater above rain, overlapping actors); json_object 7/8 schema-invalid and one repair fixed 0/7.
- Silent wrongness: luna drew a 13/19/148 deg triangle with the right labels, which a VLM glance or CLIP score would pass.
- Replaced by `content-live-tiers` (templates + engines live; free composition near-line or offline behind validators and review).

## generated-media-carries-facts
**Tried (2026-10-02): letting generated pixels carry curriculum facts — gpt-image-2 labelled science diagrams (EN and HI, low and medium) and Sora 2 explainer clips.** What broke:
- gpt-image-2 spells labels but places them wrongly: Hindi leader lines on the wrong part 5/32 (परागकोश -> filament, वर्तिकाग्र -> style, बाह्यदल -> a petal), English 1/32; medium quality did not fix Hindi (3/6 wrong on the flower); every "closed circuit" (3/3, incl. a text-free base) showed an open switch; fully correct images EN 4/6, HI 1/6.
- The VLM OCR "spelling gate" transcribed the requested string for an image with a visibly corrupted glyph (false pass 1/1): it reads what it expects. OCR is valid only as a no-text presence check.
- Sora 2: asked for 3 red + 4 green apples merging under "3 + 4 = 7", it drew 3 + 3 merging into 6 under a perfect "3 + 4 = 7"; the germination clip opened leaves underground. Literature agrees (Code2Video: Veo3 2.5 vs agentic Manim 86.0 on TeachQuiz; PhysicsLENS 34/47 videos ignore the stated property).
- A child learning a wrong label or count from a picture learns a misconception no gate catches. Replaced by `diagram-router-no-baked-labels` and `explainer-templates-live`.

## karaoke-from-transcript-estimate
**Tried (2026-10-02, teacher-visual sync probe): placing word-lit karaoke captions and word-level board/pointer cues from a live estimate of when each transcript word is spoken.** What broke:
- The best live estimator (L) has 372 ms median / 863 ms p90 error and puts only 35% of words within +/-250 ms, while a spoken word lasts ~300-450 ms: it would light the wrong word about two times in three.
- Acoustic re-anchoring was worse, not better: envelope-pause re-anchoring (Q) 885 ms median (her pauses do not map one-to-one to punctuation); syllable-nucleus tracking (Y) 340 ms even tuned in-sample, not beating text-proportional S.
- Kept: phrase-level captions and clause-level board/pointer cues with 400 ms pre-roll (`teacher-stage-cue-scheduler`). Supersedes the PRODUCT-DESIGN R5 "lead >= 150 ms" gate as the wrong test (lead is plentiful; placement is the problem).


<!-- merged from inbox/factory.json -->
## sora-for-curriculum
Tried (2026-10-02): `taxila-sora` (sora-2 2025-12-08) for curriculum clips, 7 clips across two probes (`factory/video-probe.mjs`, `content/animation-video-sora-probe.mjs`), frames rated by one rater. What broke: a number line labelled -2 -3 -4 -1 -5 5 -9 -19; गुरुत्वाकर्षण misspelled; an object vanished between frames; "3 + 4 = 7" written over 3 + 3 apples; leaves opening underground; an unrequested soundtrack on every clip; 49-79 s per 4 s clip and 87-118 s per 8 s clip at $0.10/s with 2 concurrent jobs. Pixels cannot be checked against an answer key. The deployment retires 2026-10-15 with no replacement (OpenAI removed the Videos API 2026-09-24). Replaced by `forge-media-lanes`.

## content-safety-sole-gate
Tried (2026-10-02, `factory/asset-probe.mjs`): Azure AI Content Safety image analysis on 13 gpt-image-2 outputs. What broke: all 13 scored severity 0, including a near-facsimile ₹50 note (RBI wording, Gandhi portrait, State Emblem, serial number) and two scenes with baked Hindi/English wall text; it scores harm, not IP, emblems, text in pixels or stereotype. For text, Microsoft Learn (updated 2026-09-18) states the harm models were trained and tested on 8 languages that do not include Hindi; romanised Hinglish is weaker still. Replaced by the layered gate in `forge-qa-ladder` (per-string Content Safety + local Hinglish blocklist + taxila-brain classifier, fail closed; images: OCR any digit/operator + Content Safety + VLM checklist with a code verdict + human review).


<!-- merged from inbox/conductor.json -->
## forge-live-codegen-race
Proposed (orchestration-architecture §5.2, 2026-10-02; rejected in review before any build): at lesson start the Director emits `module.requested`. A library miss becomes a `forge.build` codegen job with a deadline of "start + theory minutes", and if the generated game verifies in time it is pushed to the device as `module.ready`. What breaks: ARCHITECTURE §1.4, Forge's own promotion rule and day-cycle N5 all require human review before generated code reaches a child, so the race can never deliver. The library is empty at launch, so every lesson start would pay for codegen with up to 10 fix rounds (minutes and dollars per artefact) against ~$3 of monthly revenue. Replacement: the live path is T1 engine params and T2 scene DSL only; a miss writes `forge_request(objective, engine_gap, demand_count)` and T3 is built offline, demand-ranked, into human review. Do not market "a game is built while she teaches" beyond T1/T2.

## dek-in-pitr-database
Proposed (student-workspace W4, 2026-10-02; rejected in review): a per-child data-encryption key, wrapped by one Key Vault KEK, stored in `child_key` inside the main Neon project. Erasure deletes the row first ("crypto-shred"), so the copies in Neon history and Blob soft-delete become unreadable. What breaks: instant restore (default 1 d, up to 30 d) brings the wrapped DEK back, and the KEK is still live, so every "unreadable" copy is readable again. A working version needs the key store in a separate project with `history_retention_seconds = 0` plus a bounded 48 h key backup. v1 instead uses hard delete, a 7-day history window and 7-day Blob soft-delete, with the parent promise "removed now; backups expire within 7 days".

## per-child-night-pipeline
Proposed (day-cycle §9 and DC10, 2026-10-02; rejected in review): a 22:30 IST global fan-out that builds tomorrow's plan, engine params, scene DSL and medium images for 2 predicted topics per child, plus a lesson-brief draft. What breaks: plans are pure code (< 50 ms [U]) and engine params are a ~1-2 s luna call at open. Per-child speculation is wasted on the 40-60% [U] who don't open that day. Every IST child shares the same hour, which at 100k children is a ~200-minute backlog plus a luna TPM spike. Per-child medium images alone cost ~$3.2/child-month, more than revenue. The 22:30 global job reads KT before late consolidations commit (it broke the next-day re-check rule). Replacement: plan on open, with a topic-level library prefetch for the next 2 weeks of syllabus within a global Forge budget.

## conductor-commit-child-seq-first
Proposed (CONDUCTOR.md revision 1 §3.4, 2026-10-02, written by the synthesis itself; caught by the second architect pass before any build): the Conductor commit takes the per-child `child_seq` row lock FIRST ("lock order everywhere: child_seq BEFORE conductor_state"). The idea was that taking the shared per-child mutex first is safest, and that `has_more` should be computed before anything else. What breaks: the other writers already reach `child_seq` from the far end. `complete_job` locks the `job` row and then `child_seq` (through `ingest_event`), and `fire_wakeups` locks `wakeup` rows and then `child_seq`. The commit holds `child_seq` and then wants the same `job` row (cancel) and `wakeup` row (upsert), so there are two lock cycles. Measured: 5/5 deadlocks against each (scratch PG 16.14, `conductor-substrate-pg16-2026-10-02`). In production the window is narrower, but PG aborts one side after `deadlock_timeout`, and for `fire_wakeups` that rolls back a whole batch of up to 500 wakeups. Replacement: one global order with `child_seq` LAST for every multi-table writer, plus a 40P01 retry as a backstop. It gave 0/40 across 8 race cells. The only writer allowed to take `child_seq` first is one that afterwards only inserts new rows (`create_commitment`). The general lesson: "take the global mutex first" is wrong once other writers reach that mutex last. The order has to be global, and a writer table (CONDUCTOR.md §3.4) is the review artefact.
