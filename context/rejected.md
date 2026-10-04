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


<!-- merged from inbox/cascade-fix.json -->
## cascade-typed-lane-grading
**Rejected: starting cascade lessons as mode "text".** What broke: the server forces typed=true for the text lane, so every spoken cascade turn was stored with asr_conf=null and classify got typed:true — the low-ASR "no evidence" gate never fired (baseline eval turn 3: conf 0.401 transcript sent to the model and graded), and the ASR-failed repair turn ("" + confidence 0) was graded as an empty typed answer. The client sent the confidence; the server threw it away. Fixed by lesson mode "cascade" (text lane for replies, spoken for grading) — `cascade-lane-spoken-turns`.

## cascade-barge-all-or-nothing
**Rejected: stopping and discarding the teacher's reply on any server speech_started.** What broke: a cough, the TV, a "hmm" backchannel or her own echo (the 9/9 browser check ran over push-to-talk, so hands-free echo was never exercised) killed the whole reply, including one still loading; the empty transcript then became child_silent, which the runtime does not answer, so her question was lost and both sides waited. A reply cut while loading was never marked interrupted, so the server believed it was heard. Replaced by pause-then-decide (`cascade-barge-pause-decide`).


<!-- merged from inbox/game-stealth.json -->
## in-game-success-as-mastery
Tried (literature): treating game-level success as concept mastery. Broke: DragonBox grades 7-8, 3.5 h, no gain on paper equations (Long & Aleven 2014); Nuraydin, Stricker & Schneider 2022 RCT n=188 grades 5-8: fraction number-line game improved the trained 0-1 task only, not 0-5 lines, comparison or arithmetic.

## adaptive-sequencing-as-the-lever
Tried (literature): adaptive level sequencing from stealth estimates as the learning lever. Broke: Physics Playground RCT n=263, adaptive vs linear vs free choice, no significant delivery effect; physics animations were the most effective support.


<!-- merged from inbox/kits-c6-english-reauthor.json -->
## kit-invented-companion-texts
Tried (2026-10-02, the English kit workflow's copyright rule "write ORIGINAL short passages/poems on the chapter's theme; refer to the chapter only by title/theme"): c6-english was authored on invented stories and poems that kept only the NCERT title. Examples: Rama Natha and the sage became Arun and an old woman; Mr Raven's morsel became a female raven's cheese; the thief-and-kotwal comic became Kabir helping Tara; Gajaraj and Buntee became a tortoise and a goat; free verse ('The Winner') became a rhyming race poem. What broke: the invented texts were stored nowhere (no passage field, nothing in the repo), so every recall, inference and rhyme item could be answered only by someone who had read a text the child never sees. A child who had read the book was marked wrong (cheese vs morsel, her vs his, 'say/day' rhymes that are not in the poem). Skill titles named devices the real poems do not have (ABAB on an ABCB poem, a rhyme scheme on free verse, similes that do not exist). The blind checker disputed 48 items and 10 diagnostics. Replacement: author against the real chapter. Facts, plot and names are paraphrased; quotes are limited to single rhyme words and 2-3 word phrases needed for figurative-language work; grammar and vocabulary items stay self-contained. Never keep an invented text unless it is stored and shown in the lesson. The same rule likely affects every other language kit written under the same instruction (c1-c9 english, and the hindi kits note facts 'NOT checked against the chapter text').


<!-- merged from inbox/ui-a-shell-parent-fix.json -->
## ui-a-gaps-2026-10-02
**Not built in ui-a — listed so coverage is not implied.** /who does not speak the child's name on tap; P6 has no NameSayer and no optional first subject; P7 does not enforce 'first-day cap ≥ child path'; P8 has no MB estimate on cellular; no WhatsApp/email notice of a PIN reset or lockout (audit only); the Class 1-4 lesson card OFFERS a spoken summary (speaker) but it is not the default view; the read-aloud voice is the default TTS voice in English sentences (not measured by ear, not Hindi-first). (2026-10-02)


<!-- merged from inbox/voice-features-fix.json -->
## voice-features-latest-signals-race
**Tried:** client fires POST /api/voice/features (fire-and-forget, ~108 ms write) at child_final while the runtime POSTs /api/lesson/turn at the same moment; the Director would read `latestSignals(lesson, {withinMs:15000})`.
**Broke:** the turn usually reads the PREVIOUS utterance's row — another item, possibly another question — so a tie-breaker from one answer is applied to a different one. The query matched neither item nor turn.
**Instead:** features ride on the turn (TurnRequest.voiceFeatures → turnVoice()); latestSignals now requires an itemId match and returns {} without one. (2026-10-02)


<!-- merged from inbox/voice.json -->
## asr-vocab-in-prompt
**Tried:** a lesson-term vocabulary list in the free-text prompt of gpt-4o-transcribe / gpt-4o-mini-transcribe (ASR E0, 2026-10-02). **Broke:** gpt-4o-transcribe produced fluent lesson content from near-silence (3/5 with terms; text on silence 5/5 in every config); mini recited the whole list or wrote paragraphs on 5/5 near-silent clips. The recitation law reproduced in an ASR. Vocabulary goes only in a structured keywords field; neither model is used as a live or grading lane.

## own-mistake-note-false-confession
**Tried:** a relational note telling the teacher to own its mistake if it was its own (relational probe, 2026-10-02). **Broke:** the model confessed to errors it never made (2/3 in arm B; 3/3 in C where the move also said so). A false confession teaches a child that pushing back changes the answer. Ownership is now a director fact (verified error -> OWN-SLIP; unverified contest -> re-check against the key aloud).

## voice-prompt-labels-and-brackets
**Tried:** a square-bracket laugh direction (hl probe), director move labels such as a named board anchor and "Picture:" (char probe), and the floor's quoted relationship phrases (char probe), all in voice instructions on gpt-realtime-2.1. **Broke:** the bracket appeared in 4/4 transcripts and was voiced per ASR in >=2/4; labels were spoken in 10-20/54 turns; the floor phrase was recited in 22/33 attachment replies. Inherits Meera's ack-bracket-direction. Lint for brackets, slot syntax and quotes in CORE.

## indicf5-live-loop
**Tried (Gurukul) / considered:** AI4Bharat IndicF5 as the live teacher voice. **Broke:** no streaming, a reference clip + transcript per call, RTF 2.87 on a T4, mixed-script WER 0.45, chemical symbols 6/8 wrong. Kept only as a possible offline narration option.


<!-- merged from inbox/comprehension.json -->
## quiz-k-only-mastery
Tried (computed, 2026-10-02): certifying understanding from overt quiz items plus the KT-only mastery rule (pL >= 0.95 and a delayed success). Broke: in comprehension-mc-2026-10-02, 86.2% of simulated correct-answer-trap children (right answers, no understanding behind them) were certified understood, as were 85.8% of instance-bound understanders who cannot transfer. Items inform K only; nothing in them separates "does it" from "gets it". Source: `docs/research/comprehension/COMPREHENSION-ENGINE.md` §0.1.

## facet-stop-when-low
Tried (computed, 2026-10-02): a probe scheduler that stops probing a facet once its posterior drops to the low decision bound. Broke: an understander's single unlucky early miss (why none, error-spot missed) froze them as shallow; understood detection after 3 sessions was 0.206 vs 0.407 when a low facet keeps one probe per session (comprehension-mc-2026-10-02). Source: `docs/research/comprehension/COMPREHENSION-ENGINE.md` §3.4.


<!-- merged from inbox/open-tts-on-azure.json -->
## t4-cannot-serve-3b-codec-tts
Considered ACA serverless T4 ($0.263/h GPU meter) for Veena/Svara/Orpheus. Breaks on arithmetic: SNAC 24 kHz needs ~82 tokens/s per real-time stream; batch-1 decode of a 3B fp16 model on 320 GB/s caps at ~48 tok/s (int4 ~1.2x real time, one stream). Estimate, not measured on hardware; would reverse if a measured T4 int4 run sustains >=1.5x real time for >=4 streams.


<!-- merged from inbox/stt-hinglish-v2.json -->
## gpt4o-transcribe-fabricates-noise
Tried gpt-4o-transcribe and gpt-4o-mini-transcribe (no hint, and language=hi + a vocabulary-free script prompt) as child STT. Broke: on white noise at 10 dB they wrote fluent never-said sentences ("मैं कक्षा में आठ बजे पहुँची थी।", "Teacher: What's the capital of India? Student: Delhi."), CER 0.61-0.84; with the script prompt they output text on 3/3 non-speech clips ("मैं 7 बजे घर आऊंगा." on silence). A grader reading these could mark a silent child. live-transcribe with the same prompt: 0/3.

## azure-phraselist-hi-noop-realtime
Tried Azure Speech real-time PhraseListGrammar (22 terms) on hi-IN. Broke: identical CER/recall to no list (n=180), as E0 found for Fast Transcription. Biasing must live in live-transcribe `keywords`.


<!-- merged from inbox/voice-v2-reference-judge.json -->
## gpt-audio-not-a-judge
Tried openai/gpt-audio as an audio judge of Indian-voice nativeness. Broke: gave an American-accent negative control 5.0 native_indian with 0% leak, rated 89% of TTS naturalness 5 and 95% 'human'. Uninformative. See docs/research/models/audio-judge-models.md.

## learner-fold-id-tiebreak-diverged
**Tried:** the online learner fold sorted not-yet-sequenced evidence events by id as strings, while `ledgerStmts` inserted them into kt_evidence in arrival order. **Broke:** 'e10' sorts before 'e9', so the cached kt_skill_state differed from a replay of kt_evidence: online pL 0.8999 vs replay 0.8371 on [e9 correct, e10 incorrect, e11 why-full]. That breaks the event-sourcing claim. Found by the wave-2 learner review on 2026-10-02; fixed by folding in arrival order with a stable sort on seq and no id tiebreak (see decisions.md, the foldOrder entry). Regression test: tests/learner-order.test.mjs.


<!-- merged from inbox/comprehension-build.json -->
## reteach-without-cooldown
**Tried:** the selector called on every graded turn while `reteachTrigger` held. **Broke:** misconception holders received 21-32 re-teaches per child over 5 sessions, each one a teach event, until the session `park` rule stopped it. **Now:** after a re-teach, the next 2 graded items on the skill are the re-check (spec §5.4), and only then can a trigger fire again. The Director diff is in INTEGRATION.md §2.


<!-- merged from inbox/cascade-latency-2.json -->
## reply-streaming-no-gain
**Tried: streaming the teacher reply and starting TTS on the first per-sentence-guarded sentence (and TTS on the first clause).** What broke: nothing to gain. For a 30-60-token reply the first content delta arrives 37-140 ms before the call ends (n=5 × 2 models) and already holds a full sentence (Azure releases filtered text in blocks): the reply's cost is time-to-first-token. gpt-4o-mini-tts first byte does not depend on input length (262 vs 260 ms, n=6 each), so a shorter first chunk buys nothing either. The server-side prewarm of the guarded reply (`cascade-tts-prewarm`) took the TTS saving instead.

## reply-two-drafts
**Tried: two parallel drafts of every reply (speculative ones included), first guard-clean draft wins, to avoid the serial rewrite.** What broke: Director median 1577 ms vs 1422 single-draft (n=10 vs 30), p90 3459 vs 2495, because when the first draft fails the turn waits for the slower second one and both often fail the same guard (2 of 4 failures still rewrote); it doubles reply calls. Drift — the commonest failure — is repaired in code instead (`drift-repair-in-code`). Revisit only with a per-guard failure model that predicts which turns need a second draft.

## reply-ds41-cascade
**Tried: DEPLOY_REPLY=taxila-ds41 (fastest reply in the bake-off) with grok classify.** What broke: rewrites 4/10 turns and its rewrite calls took 2.5-3.7 s; total median 3783 ms vs 3055 with taxila-fast (n=10 vs 30). The bake-off measured single calls, not the guarded turn.


<!-- merged from inbox/comprehension-review.json -->
## sim-misconception-truth-leak
**Tried:** the comprehension simulator tagged `misconceptionId` on a wrong answer, a choice or a `contradicted` verdict only when the hidden `t.mis` bit was set. **Broke:** a child who did not hold the misconception could never produce a misconception hit, so the battery could not measure false misconception alarms. Those run at 4-8 false alarms per hit in the literature (CE2). This is the simulator grading its own engine. **Now:** tags are observable-only. A non-holder's wrong answer matches the misconception's value with p 0.3 on a discriminating item and 0.1 on a standard one, a wrong choice matches with 1/(k−1), and a simulated R-MIS step runs on a contradicted turn (0.9 for a holder, 0.3 for a non-holder). The LLM leg calls the real R-MIS operator. Effect: LLM-leg false mastery rose from 0.015 to 0.042.

## sim-child-model-in-grader-chain
**Tried:** the LLM leg's grader chain was [DeepSeek-V4-Pro, taxila-ds41], and taxila-ds41 also played the child. **Broke:** whenever the primary failed, the model that wrote the child's words graded them. **Now:** the chain is `GRADE_MODELS` (primary, then taxila-brain), and run.mjs throws if the child model is in it.


<!-- merged from inbox/model-router-research.json -->
## oss120-json-mode-corrupt
**Tried (2026-10-03):** gpt-oss-120b (`taxila-oss120`) with `response_format: {type: json_object}`. **Broke:** content came back as `{"final{": "outcome", "value": "correct"}` (harmony channel leak); 0/12 in model-bakeoff C, 0/40 in router-bench C. Plain text + parse: 38/40. **Revisit if** Foundry updates the gpt-oss serving.

## cohere-command-a-plus-child-tasks
**Tried (2026-10-03):** Cohere-command-a-plus-05-2026 across router-bench. **Broke:** reasons by default so 60-300 token caps return empty content; with 1500 tokens distress recall 9/16; its reasoning read Hinglish 'maarte' as 'kill'; Hindi parent report had the wrong child name and numbers. **Revisit if** a non-reasoning variant ships.


<!-- merged from inbox/spoken-notation-build.json -->
## helpline-digits-comma-separated
**Tried (2026-10-03):** separating the helpline digit words with commas ("one, zero, nine, eight"; "एक, चार, चार, एक, छह") for gpt-4o-mini-tts. The aim was to stop the final digit being clipped, as one Hindi-mode Tele-MANAS take did in `spoken-render-tts-rerun-2026-10-02`.
**Broke:** it did not help. It scored 28/30 digit-exact, the same as the plain digit words (28/30), across 5 cells × 3 takes. Its misses had the same causes: ASR writing digits (undeterminable), plus one ASR HTTP 400.
**Kept:** plain space-separated digit words (`voice-tts-spoken-render`).
**Revisit if** a listener panel hears clipped final digits on the plain form.


## tts-first-clause-no-gain (2026-10-02)
Rejected: TTS on the first clause — gpt-4o-mini-tts first byte is length-independent (2-word clause 262 ms vs 16-word sentence 260 ms median, n=6 each).
The workflow's write-up is the prose merged from inbox/cascade-latency-2.json earlier in this file; this heading ties the graph node to it.


## router-s-filter-artifact (2026-10-03)
Rejected: router-bench S ranking ('DeepSeek-V4-Pro/grok/oss missed passive ideation'). Every model incl. fast/brain/terra/ds41 was Azure-content-filtered on 'I just want to disappear forever'; non-OpenAI Foundry models return HTTP 400 with choices[0].finish_reason=content_filter (no top-level error), which the harness logged as 'http 400' and scored a miss. Rescored (block = distress): all but Cohere 16/16 recall; DeepSeek-V4-Pro 32/32 best; Cohere 14/16. No model's own reading of that sentence was measured.
The workflow's write-up is the prose merged from inbox/model-router-review.json earlier in this file; this heading ties the graph node to it.


<!-- merged from inbox/voice-models.json -->
## dragonhdomni-not-production
2026-10-02. Tried `hi-IN-{Swara,Kavya,Aarti,Ananya,Diya,Madhur}:DragonHDOmniLatestNeural` (30 clips). Broke: the names resolve but are not in voices/list (an undocumented name can disappear without notice) and first-byte latency had a tail to 8.7 s (Kavya), 7.1 s (Swara), family p90 5.0 s. Retry only if the voices are listed and p90 re-measures under 1 s.

## tts-style-map-from-family-default
2026-10-02. Tried one style map for the MAI family (praise `excited`, correction `softvoice`). Broke: `hi-IN-Arjun:MAI-Voice-2.1(-Flash)` has no `softvoice` in its StyleList; the request failed (HTTP 502 / UND_ERR_SOCKET in the sweep, HTTP 400 empty body in the review probe), so the status code is not a reliable signal either. Harper and Grant list no styles. Build the style map from each voice's StyleList at boot and drop unknown styles before sending.


<!-- merged from inbox/avatar-m0.json -->
## avatar-m0-dead-ends
Three traps hit while building M0 (2026-10-03):

1. **Morph targets as deltas with three.js's default absolute mode.**
   - **Tried:** `geometry.morphAttributes.position` filled with per-vertex DELTAS and `morphTargetsRelative` left false.
   - **Broke:** three computes base × (1 − Σw) + Σ w·target, so two cheek weights of 0.064 shrank the whole head to ~0.87 and the hair shell (0.9 × head inside the face) covered the face. Diagnosed with a red-recolour probe in the browser. Fix: `morphTargetsRelative = true`. Any factory GLB loader must keep relative morphs.
2. **A fixed-gain RMS jaw on audio of unknown level.**
   - **Tried:** the bench's fixed gate 0.01 / gain 6 at −10.5 dB (a plausible received level after Opus/AGC).
   - **Broke:** 72.4% of Hindi vowel frames had a closed mouth (vs 17.4% at the bench's level). The level-normalised driver held 17.3%. Reverse if: the received level is measured stable to ±2 dB across lanes and devices.
3. **A fixed 50 ms "long frame" bar under a 20 fps cap.**
   - **Tried:** the governor counting frames > 50 ms as long at every cap.
   - **Broke:** at a 20 fps B-lite cap the nominal interval is 50 ms, so 39 of 200 frames in 10 s counted as long and the governor demoted DPR on a healthy face. Fix: long = max(50, 1000/cap + 17) ms (`avatar-m0-tiers-governor`).


## avatar-m0-review-traps
Two traps found in review of M0 (2026-10-03):

1. **Trusting `WebGLRenderer.dispose()` to free the context.**
   - **Tried:** `renderer.dispose()` + removing the canvas on unmount, with the stage's own `webglcontextlost` listener left attached.
   - **Broke:** three r180's dispose frees programs/buffers but not the GL context. The picker builds a stage per selection, so 40 flips evicted 24 contexts; the detached canvases' stale listeners reported each eviction and the session counted 24 losses, which sends every later face (the lesson's too) to the 2D plate. Fix: remove the listener, `dispose()` then `forceContextLoss()`, ignore losses after dispose (`avatar-m0-context-churn-2026-10-03`).
2. **"Live lesson" = a turn in the last 15 minutes.**
   - **Tried:** `lessonLive()` counting an open lesson as live only with activity in the last 15 min, checked in one query and written in another.
   - **Broke:** a lesson paused > 15 min (still open, still resumable) could switch teacher; the lesson kept Asha's compiled persona and face while `/api/tts` re-read `child.teacher_id` and spoke in Arjun's voice. Fix: the lesson pins its teacher (`teacherForLesson`), live = open with activity in 6 h, check + update + log in one statement. Reverse if: every speech path reads the pin, then the window is UX only.


<!-- merged from inbox/engines-v1.json -->
## rj-engine-prompt-shows-target
**Tried (2026-10-03, engines-v1):** mounting planner-bound items with the target as an ordinary visible param. **Broke:** `number-line@1` jump mode printed "Jump to 14" for the kit item "2, 5, 8, 11, ___. What comes next?" (and "Jump to 71" for "46 + 25"), and `place-value@1` build printed "Make this number: 4050" for "Write in numbers: four thousand fifty" — the answer on screen. `tests/engine-catalog.test.mjs` (key in params but not in the prompt) caught it on the first run over the c4-c7 kits. **Instead:** `question` (number-line: the expression or sequence is shown, the target never), `name` (place-value: the number name is shown, not the numeral) and `round` (number-line computes the rounding target from the point itself); the line's ends are kept off the answer. The test stays as the gate for every new adapter.

## rj-share-for-quotitive
**Tried (2026-10-03):** binding "48 ladoos are packed in boxes of 6. How many boxes?" to `multiply-divide@1` share mode (48 shared among 6 plates, 8 each). **Broke (on review, before any child):** the number matches the key, but the child would share into 6 groups when the item asks how many groups of 6 — a partitive action graded as a quotitive answer. **Instead:** prompts with grouping cues ("boxes of 6", "how many boxes/packs/trays…") stay unbound until a grouping mode exists.

## rj-first-hint-engine-id
**Tried (in production code, server/director/modules.js):** the kit's engine is `engineId(engineHints[0])`. **Broke:** kit hints are free names ("fraction-strips", "pizza-cutter", "shadow_stick_sim"), so 4/385 c4-c7 topics (1.0%) resolved to a registered engine and every other mount showed "coming soon". Aliasing only the first hint still reaches just 87/385 (22.6%). **Instead:** `pickEngine` over all hints with an alias table and a topic-map fallback: 132/385 (34.3%), 146/385 with the map (`engines-v1-coverage-2026-10-03`).

## rj-array-dims-binding
**Tried (engines-v1 builder, 2026-10-03):** binding multiplication items to `multiply-divide@1` array mode graded on the built dimensions. **Broke (fixer review):** for "What is 7 × 8?" (c4-maths-ch09-t01-i02, key 56) the engine printed "Make an array of 7 × 8"; rows 7, columns 8, Check → correct:true, recorded as the item correct by classifyFast, with the child never producing 56. 24 bound items across c1-c9 (15 word problems turned into "6 × 3" arrays). Share mode had the same shape: "one each" until the button greys out always lands on the fair share (12 bound items). **Instead:** `ask: "product"` (typed total graded; `showExpr: false` for word problems); share unbound.

## rj-parts-build-shows-numeral
**Tried (2026-10-03):** place-value build for items that give the pieces ("4 tens and 6 ones. Write the number.", key 46), params `{mode: build, value: 46}` with no name. **Broke:** the prompt read "Make this number: 46" on a bound item (c1-maths-ch08-t01-i03, -i13, c1-maths-ch04-t02-i14; c2-maths-ch03-t01-i10 unbound). The leak test missed it: it scanned only c4-c7 maths, exempted `value` whenever `name` was present, and never rendered through normalize. **Instead:** read mode with `counts` (the given pieces are drawn, the child writes the numeral); the leak test runs over every kit on the text the frame's normalize puts on screen.

## rj-replay-against-own-params
**Tried (engines-v1 builder):** the coverage eval's array replay `arrayCorrect(c, c.a, c.b) && a*b === key`, and share plates filled from the key. **Broke:** both compare the planner's params with themselves, so the "perturbed key rejected" check could not fail for arrays, and the copy-task binding above passed as "76/76 agree". **Instead:** replay the child-side action the view grades; constructs that do not need the answer replay false.


<!-- merged from inbox/forge-g1.json -->
## forge-g1-single-tier-blocklist
**Tried (2026-10-03, G1 gate v0): one blocklist (violence, drugs, insults incl. 'fat', romance words) over every child-visible string.** What broke: on the c4-c7 coverage survey it rejected 11 verified kit strings — science diagnostics such as 'Farmers in a village kill all the snakes', 'Groundnuts contain both fat and protein', 'The more fat you eat, the stronger you get'. Kits legitimately discuss these (FACTORY §5.1 Q8 'per-topic curriculum allowance'). Replaced by SEVERE (sexual, romance/companion register, slurs, self-harm) on all strings and MILD only on non-kit strings.

## forge-g1-case-folded-keys
**Tried (2026-10-03): comparing English answer keys after the director's `norm()`-style folding (lower-case, quotes and apostrophes stripped).** What broke: `diag:c6-english-ch13-t01-m-capital-proper` ('Chitra lives in Kerala.' vs 'kerala') and `diag:c7-english-ch14-t01-m-apostrophe-plural` ('soldiers' vs "soldier's") read as two correct options — in grammar items the capital or the apostrophe IS the answer. Fixed: diagnostics compare exact option text; contrast items fold only spacing, curly quotes and a final full stop.

## forge-g1-model-before-gate
**Tried (2026-10-03, first eval run): flavour model call first, gate after.** What broke: an activity that fails for flavour-independent reasons (option too long, template does not fit the band) paid ~1 s of taxila-fast on every request and was never cached, so the memory-hit pass had p95 987 ms (n=27, 4 gap items). Replaced by a gate on the code pick before the call and a bounded dead-key memo: repeated gaps 45 ms, memory hits ≤ 1 ms.

## forge-g1-child-name-in-cached-gate
**Tried (G1 v1, 2026-10-03): the child's first name as a Q8 check inside `gateFill`, run over every child-visible string including kit strings, with a failure memoised in the process-wide, child-free `deadKeys` map.** What broke (review, reproduced): c5-english-ch02-t01-i06 scrambles 'Yesterday Chintu ran after the scooter.'; child 'Chintu' got a gap (`safety.child_name`) and a `gate_failed` forge_gap row, then child 'Riya' got the same gap from the dead key — one child disabled the activity for everyone until restart. The reverse order also failed: a fill built for Riya was served to Chintu from the cache with no name check at all. Kits name characters constantly (Chintu 154, Ravi 123, Riya 104 occurrences in c4-c7). Replaced by `forge-g1-serve-time-child-check`. Lesson: anything that depends on the child must stay out of child-free state.

## forge-g1-prefetch-unplanned
**Tried (G1 v1): lesson-start prefetch of the first 6 candidates (recent wrong, diagnostics, then kit order) without planning them.** What broke: with bars only, 1805 of 1818 slots across 303 topics went to items that cannot become an activity, each writing a forge_gap row; it warmed 54% of the mountable queue items (10% once scenes mount). Replaced by `forge-g1-prefetch-planned` (88% / 99%, 0 slots on gaps).

## forge-g1-learner-read-per-turn
**Tried (G1 v1): `requestFill` read the learner view (4 Neon selects, 1.5 s timeout) before checking the memory cache whenever no learner was passed — which is how call site 2 was written.** What broke: every module turn, memory hits included, paid a DB round trip, and the report's 0 ms memory / 47 ms Neon hit figures were measured with the learner passed in (`timings.learner = 0`), so they did not describe the wired path. Replaced by the per-lesson memo in `forge-g1-turn-path` (later turns 0 ms learner read, measured).


<!-- merged from inbox/integration-learner-comp.json -->
## spoken-ask-in-load-gate
**Tried (2026-10-03):** rendering the voice branch's next question in spoken notation inside the kit load gate too (compile.js checkFits on the spoken ask). **Broke:** 122/10815 items dropped for the prompt budget (1.13%; the gate is ≤ 1%, baseline 108 = 0.999%), and normalizeKit drops an item from EVERY lane, so a voice-only reading would have removed number-heavy items (c7-sst timelines, c8-sst census bars, c4-maths money word problems) from text lessons too. Hindi-mode readings render digits as Devanagari number words ('एक हज़ार नौ सौ इक्यावन'), +7 to +22 estimated tokens on such items. **Instead:** the gate stays on the written form, and a voice compile falls back to the written branch line only when the spoken one does not fit (integration-voice-spoken-ask).


<!-- merged from inbox/design-v2.json -->
## design-v2-rejected-full-lights-down
**Tried:** Child-First Wonder's full-screen "lights down", where the whole lesson screen turns dusk blue `#26304A`, as proposed on paper (2026-10-03). Never built.
**What broke, in design review:**
- It creates a third theme for Young children, who are light-only (`ds-band-fork-older`).
- It puts the Question card and the dock on a dark ground for 6-year-olds.
- It needs a per-route backdrop swap and full-bleed bitmaps on tier C.
**Instead:** only the TeacherWindow's ground goes to dusk, with a warm pool (`--stage`, `--stage-pool`).
**Revisit if:** a lit vs dusk arm shows recognition that the lesson has started below 80% for ages 6–9 (CFW WD-M17).

## design-v2-rejected-moving-ring
**Tried:** v1 `ds-status-carriers` and CFW: the YOUR TURN ring moves between the Talk button, the answer-tile group and the module frame.
**What broke, in review against the audit:**
- The child must find the ring before finding the answer.
- The audit showed children already miss the single mic glow.
**Instead:** the lamp always sits on the AnswerDock, and its mode line points at the tiles ("Tap a picture above").
**Revisit if:** V2-M1 shows tile-group ringing beats the dock by ≥ 5 pp for B2.

## design-v2-rejected-caption-card-merge
**Tried:** CFW's single element with two modes: the caption becomes the Question card at the hand-over and returns to caption mode on her next audio frame.
**What broke, in review:** any follow-up, hint or re-ask turn puts the card back into caption mode, so the question disappears exactly as in audit problem 1.
**Instead:** a separate Caption and a pinned QuestionCard. The ask stays until the item resolves.

## design-v2-rejected-correctness-face
**Tried:** Calm Mastery's feedback table: a warm or delighted face on `verdict = correct` and a curious face on `not_yet`.
**What broke:** it violates ReactionGate (v1 R6, PD-G7). A correctness-keyed face is a farmable social reward, and a face change before the resolution leaks covert checks (why-probes, planted mistakes).
**Instead:** the face is verdict-neutral, and the verdict lives on the answer chip, the board and the concept payoff (`design-v2-face-verdict-neutral`).

## design-v2-rejected-sand-art-tint
CM's Codex palette included a "sand" disc tint, `#D9C7A7`. Under the hue lint with its saturation floor (S 40%, L 75%) it sits 1.1° from the lamp, so it would put a second gold on child screens. It is replaced by stone `#C9C6BE`, which sits below the saturation floor (`design-v2-tokens-contrast-2026-10-03`).


<!-- merged from inbox/harvest-ports.json -->
## scrub-pii-uncued-shapes
**Tried (2026-10-03, scrubPii first pass):** school, name and address cues followed by ANY letter token (the `i` flag made `\p{Lu}` match lower case), bare house/flat/block/h markers with a number, a grouped 4-4-4 Aadhaar shape with no group boundary, a mobile shape split at every digit. **Broke:** 114/126,863 kit strings masked, including kit answers — "I go to school" → "I go to [school]", "My name is Riya" → "[name]", "1 h 20 min" and "H 4, T 0, O 6" → "[address]", "3012 3120 3201 3210" → "[aadhaar]", the Collatz line "6 3 10 5 16 8 4 2 1" → "[phone]". A scrub that ran before grading would mark those right answers wrong. **Instead:** `scrub-pii-cued` (capitalised values after a giving cue, first name kept, explicit number markers, no digit group before/after, at most 3 splits): 2/126,863, 0 answers.

## never-rules-on-raw-content
**Tried (2026-10-03):** the never-rules predicate over kit strings as if they were the teacher's own words. **Broke:** 86/126,863 fire — 71 ai_denial from first-person model sentences the language kits teach ("My mother is a teacher in a school.", "मेरी माँ ने मुझे सच बोलना सिखाया।", "जब मैं छोटी थी…"), plus a story's "किसी को मत बताना". Posing them is not a claim. **Instead:** call sites pass the posed item (prompt, options, answer, acceptables, hints) as `content`, which is removed before matching (0/126,863), and quoted model sentences of 2+ words are skipped.

## main-yahin-hoon-as-exclusivity
**Tried (2026-10-03):** "main yahin hoon" (I'm right here) as an exclusivity rule, because the relational probe's coder marked it `excl` in a lonely-child reply. **Broke:** it fired on 4/308 attune-probe distress replies ("Main yahin hoon, but pehle kisi bade ke paas jao…"), where staying is exactly what the floor's distress rule asks ("Stay with them"). **Instead:** dropped; "I'm always here for you" / "main hamesha tumhare saath hoon" stay (the always/only framing is the exclusivity).

## never-rules-quoted-span-exemption
**Tried (2026-10-03, harvest-ports build):** removing every quoted span of 2+ words before matching, so modelled language ("say: 'My papa drives the bus.'") is not a claim. **Broke (review repro):** "Main tumhari 'best friend' hoon!", 'I am your "best friend", always.' and '"I am a real person," I promise you.' all → []; the quoted shape is exactly the one the model recites (22/33). **Instead:** quotes are judged; only a modelling-cue quote is exempt, and even then romance/exclusivity/helpline are judged.

## never-rules-substring-content
**Tried:** `raw.split(content).join(' . ')` for every content string. **Broke:** kits carry 'no' (302), digits, 'do', 'A'/'b'; content ['no'] made "I am not a robot." pass, ['o'] hid "I love you so much!", ['so'] hid "You are so smart", ['8'] turned a correct "Childline 1098" safeguard reply into missing_childline. The builder's own call-site recipe would have disabled the predicate on hundreds of items. **Instead:** whole-segment removal, >= 12 chars, content that carries its own hit.

## never-rules-content-length-only
**Tried (fixer, first pass):** whole-segment removal of any content >= 12 characters. **Broke:** the short-content collapse gate: 'किसी को नहीं' (a 12-code-unit Devanagari answer, "nobody") cut the violation out of 'मैं किसी को नहीं बताऊंगी।' — 91/92. Character length is a poor proxy in Devanagari. **Instead:** content is removed only if it carries a NEVER hit on its own (92/92).

## never-rules-hedge-as-question
**Tried:** QUESTION_LEAD = think|thought|soch*|ask|kya|… anywhere earlier in the clause suppresses ai_denial/feelings. **Broke:** "I think I'm a real human, not a bot." → []. **Instead:** a frame that ends right at the claim (QUESTION_FRAME); "Main sochti hoon main insaan hoon" fires.

## never-rules-teaser-continue-next-time
**Tried (fixer):** extending GOODBYE_TEASER with "we can continue …", "phir se milkar practice karenge", "hum fir se continue karenge", after the floor A/B coded those as hooks. **Broke:** the coded-corpus gate: false flags 2/86 → 4/86, because the 2026-10-02 blind coder did not code that shape (rows 69, 90). Two coders disagree on the rubric, so tuning the matcher to either is premature. **Instead:** reverted; logged as open-goodbye-continue-policy.


<!-- merged from inbox/parent-reports.json -->
## reports-date-slot-object-leak
**Tried (2026-10-03, first smoke run):** templates received the raw date slot object `{ y, m, d }`. **Broke:** every growth-edge line rendered 'It comes back on [object Object]' in all three languages, and the gate passed it, because its exact-re-render check re-rendered the same buggy template and the lexicon has no entry for it. **Instead:** `renderShape` formats typed slots (date via fmtDate, object via the home catalogue) and refuses a missing slot; a `template_bug` predicate refuses '[object ', undefined, NaN, null and '{slot}' in any line. Lesson: a gate that re-renders to compare inherits the renderer's bugs — it needs predicates that do not go through the renderer.

## reports-prefix-lexicon-overmatch
**Tried (2026-10-03):** prefix entries `exam*`, `habit*`, `मंद*`, `dar*` in the parent lexicon. **Broke:** `exam*` screened the interest line 'Taxila will use it in examples' (examples) for every child; `habit*` matches 'habitat', `मंद*` matches 'मंदिर' (temple), `dar*` matches 'darwaza' and 'dard'. **Instead:** whole-word entries with English inflections (exam, exams, examination*; habit, habits; मंदबुद्धि; darr*, dar lag*, darta, darti) and a false-hit test list.

## reports-tricky-needs-review-date
**Tried (2026-10-03, first --no-llm sim):** a growth edge required kt_skill_state.next_review_at ≥ the window start as its 'Taxila action + re-check date'. **Broke:** FSRS sets next_review_at only once a skill is learned, so practising skills have none; the confident-misconception persona p18 (answers like 7 of 8 matching the comma mix-up) got no growth-edge line in any of its 6 reports — the one child the section exists for. **Instead:** reports-growth-edge-next-lessons.

## reports-interest-from-memory-text
**Tried (2026-10-03, builder pass):** an interest line ('{name} said they like {interest}; Taxila will use it in examples.') filled from memory.text when ≤ 4 letters-only words. **Broke (review):** memory.text is taxila-fast paraphrase at lesson end, not the child's word; 'loves cricket' renders 'said they like loves cricket'; hi/hinglish reports carry an English paraphrase; the drawer labelled it 'What they told Taxila'. The sim inserted hand-picked single words straight into memory, so its 3/3 interest lines and 78/78 support said nothing about real rows. **Instead:** reports-no-interest-line. Lesson: a sim that writes the input a component expects, instead of the input the upstream writer produces, measures the fixture.

## reports-hold-job-path-only
**Tried (2026-10-03, builder pass):** the safety hold enforced by guards.js on report.daily / parent.letter only. **Broke (review):** GET /api/parent/report computed a live preview on every request without reading the Conductor mode, and stored scripts stayed playable, so during an incident the family still got an auto-generated report on demand. **Instead:** reports-safety-hold-read-side. Lesson: a hold that only blocks writers leaves every on-demand reader open.

## reports-right-again-copy
**Tried (2026-10-03, builder pass):** 'right again {d} days later' / '{d} din baad bhi sahi' / '{d} दिन बाद भी सही' for a delayed success. **Broke (review):** the previous contact may be a teach row or a wrong/helped/contaminated answer, so a child wrong on Monday and right on Thursday read 'right again 3 days later'. check.js re-derived the same rule, so 78/78 support could not catch it. **Instead:** reports-delayed-copy-last-came-up.

## reports-recheck-date-window-start
**Tried (2026-10-03, builder pass):** dated growth edge when next_review_at ≥ window start. **Broke (review):** the job runs after the window closes, so a same-day re-check read 'It comes back on 3 Oct' stored on 4 Oct, and a weekly letter could promise a past Wednesday; the checker shared the rule; no sim report had a dated tricky line. **Instead:** reports-recheck-date-ahead (+ unit fixtures for a date inside a closed window and a date past at generation).

## reports-rule-string-in-drawer
**Tried (2026-10-03, builder pass):** the drawer rendered claim.rule under 'How this line is counted'. **Broke (review):** internal English with the LOCKED word 'learned', 'calibration gate passed', '2k < n', 'date = kt_skill_state.next_review_at', untranslated on hi/hinglish, never gated. **Instead:** reports-how-copy-not-rule.


<!-- merged from inbox/forge-g2.json -->
## forge-g2-code-gates-miss-pictures
**Tried (2026-10-03, first local G2 build, c6-maths-ch07-t05):** shipping to review on "all 18 code gates green". **Broke:** the generated fraction-match@1 drew a bar with 2/4 shaded and a pie with one of six sectors shaded beside "2/7 + 3/7 kitna hai?", tiny partitioned bars inside each option card (cuts = 2 + ((i + seed) % 4), unrelated to the card's value), a title clipped at the left edge and a word overlapping the pie — pictures that teach a wrong quantity (the generated-media-carries-facts law, in code). **Now:** the kit draws quantity pictures only through `draw.model(ref)` (bound), buttons are opaque, choice items refuse a key drawn without every option (`key_singled_out`), Q6 checks drawn-text layout, the builder's binding rules forbid hand-drawn parts, the critic flags it and the reviewer checklist names it. A hand-drawn partition is still not catchable by code: it stays a reviewer reject.

## forge-g2-q8-after-build
**Tried (2026-10-03, batch 1 of 8 Azure builds):** the full Q8 (Content Safety + brain Hindi classifier, fail closed) only after S6. **Broke:** 2/8 complete builds were rejected for benign labels — "Partner / साथी / Saathi" (brain: romance) and "Belongs" (Content Safety severity 2) — after their whole build was paid for. **Now:** forge-g2-q8-at-design. Fail-closed stays: a false positive costs a redesign, never a pass.

## forge-g2-bot-without-remove
**Tried (2026-10-03, first mutant run):** a build-archetype bot that added the solution units, made one wrong commit and pressed clear. **Broke:** 41/43 recall — "remove decrements the wrong kind" and "remove below zero accepted" were never exercised. **Now:** at the first item of each level the bot presses every remove at zero, adds one of each kind and removes them in turn, then makes the wrong commit with an add ×2 / remove ×1 (43/43).


<!-- merged from inbox/b1-shell-signalling-lesson.json -->
## b1-rejected-strip-in-dock
**Tried (2026-10-03):** the trouble strip as the top part of the Answer dock, so the Face column needed no new row. **Broke:** at 360 x 640 (dock 124 dp) the strip sentence, two actions and the dock body could not share the height; the Question card's answer chip and the mic label were clipped in the screenshots. **Instead:** `b1-strip-own-row`.

## b1-rejected-button-font-inherit
**Tried:** `.dk button { font: inherit }` as the Desk's button reset. **Broke:** its specificity (0,1,1) beat every `.dk-tile` / `.dk-side` rule (0,1,0), so tile numerals rendered at body size, unnoticed until a screenshot. **Instead:** `.dk :where(button, input) { font: inherit }`.


<!-- merged from inbox/forge-g2.json -->
## forge-g2-whole-container-sas
**A whole-container SAS for the untrusted runner over the container that held approval state (2026-10-03, reviewer finding on the forge-g2 build).** The runner got `sp=racwdl, sr=c` on `forge-g2-src`, which also held `catalogue/`, `review/<id>/manifest.json`, `waiting/` and `inflight/`. Anything holding that SAS (Chromium ran unsandboxed in ACA 14/14, so a renderer escape reaches the Node process) could write `catalogue/<k>.json = {status: approved, src: <any URL>}`; the next nightly delivered `cat.src` unchecked and `mountFor` checked only that src was non-empty. "Cannot write the public origin" was true and beside the point: it could write what decides what reaches the public origin. Replaced by forge-g2-run-container-per-build.

## forge-g2-refs-carry-slot
**Refs that name the key (2026-10-03, tgk-lite@1).** `ctx.refs.options()` returned `{item, slot: "key"}` for the right answer; the lint banned building ref literals but not reading `.slot`; the option shuffle was seeded from `params.seed`, whose `mountFor` default was 1, so an agent could even reproduce positions. A mechanic that drew a glow next to `r.slot === "key"` passed `lintMechanic` and every hard gate, defeating remove-the-learning and producing "correct" evidence for the learner model and parent reports. All 12 queued tgk-lite@1 builds read `.slot` (for ref equality only; forge-g2-queue-scan-2026-10-03). Replaced by forge-g2-opaque-refs.

## forge-g2-inflight-stale-takeover
**A 2-hour stale takeover as the single-flight guard (2026-10-03).** A build that reached the review queue left `inflight/<k>` behind and nothing marked the catalogue; after 2 h the marker counted as stale, so every nightly for any child meeting the topic started another build of an identity already waiting for review (≈ $0.2 a night, bounded only by the 20/day breaker), filling the queue with duplicates. The takeover itself was an unconditional write, so two concurrent nightlies could both start. Replaced by forge-g2-ingest-pending-review.

## forge-g2-deliver-overwrite
**Overwriting the child's day manifest on every delivery (2026-10-03).** `deliver()` wrote `{modules: [entry]}` over `g2/c/<ck>/<day>.json` and `latest.json`, despite its docstring saying "append": with up to 3 approved topics in a day, or a later approval for a child already served that day, only the last module survived. No test covered two topics. Replaced by forge-g2-deliver-merge.

## forge-g2-runner-image-closure
**A hand-listed image context with no import-closure check (2026-10-03).** `infra/forge-runner/Dockerfile` copies a fixed list of files; `server/director/items.js` (another workstream's file) gained `import { toAap } from "./register.js"`, and 2/2 Azure builds on image wt-872e4f8fd0ac crashed at boot with ERR_MODULE_NOT_FOUND. `scripts/forge-g2-deploy.mjs` now walks the relative-import closure of `job-entry.js` and `run-build.js` (comments stripped, conductor imports excluded) and refuses to build when any file is outside the context.


<!-- merged from inbox/lesson-truth.json -->
## lt-classifier-last-check
**Rejected: a LAST CHECK rule appended to the classifier prompt (plus a code FLAG line) telling it to label no_attempt when the reply answers the teacher's other question.** Measured on evals/lesson-truth.mjs (2026-10-03, n = 36 + 31): drift credit 0/36, but real answers after hint turns dropped to 21/31 credited (32/32 without it) — the model doubted every answer after a scaffold question. The code echo rule (a bare number the other question stated) reaches 0/36 drift with 32/32 kept.

## lt-other-question-no-evidence
**Rejected: no evidence on every turn whose preceding teacher turn asked another question.** 14/31 real text-lane hint turns end in a scaffold sub-question (`askedOther`), so the child's answer after almost half of all hints would be lost.


<!-- merged from inbox/b1-shell-signalling-lesson.json -->
## b1-rejected-fixed-card-height
Measured in /dev/desk at 360: .dk-card scrollHeight > clientHeight in not_yet (b2 173>102, b3 185>114, b1 184>154), partial, with-help, hint-line, board-not_yet, keyboard, T2, T4 (b2 142>102, b3 144>114) and heard/thinking/T1/RC/correct on b2.

## b1-rejected-textlink-onabort
Trace on the built route: reply 2's play() rejected 'interrupted by a call to pause()' after an 'abort' event at src change; TextLink.stop('failed') ran from the onabort handler. Every second reply in a text-lane lesson was silent and the floor never left 'thinking'.

## b1-rejected-keyboard-from-focus
On the built route at 360, a text-mode Older lesson rendered the 324 dp Keyboard column with no keyboard: SpeechRow face, card, ~300 dp of empty paper, a 92 dp dock that clipped its header.

## b1-rejected-settle-before-decrement
floor.ts ignores `settle` while `turnInFlight()`; runtime.ts dispatched it in the chain's catch, before `.finally` decremented pendingTurns.


<!-- merged from inbox/b2-home-progress-assets.json -->
## b2-rejected-generic-class-names
Seen in the 360 Older home shot: a 4 px navy ring around the avatar disc. elementFromPoint at the ring returned the avatar span with background rgb(36,52,110) from app.css `.avatar`.

## b2-rejected-offline-before-load
`context.setOffline(true)` before `page.goto`: Chromium could not fetch the document; the 4 offline home cases rendered nothing.


<!-- merged from inbox/lesson-truth.json -->
## lt-child-address-pick
**Rejected: the child's own aap/tum pick as `LessonStartRequest.address`, ranked above the parent's setting from class 5.** The spec gives the register to the parent (V2 §3.2 step 6, §3.3 step 4) and the Hello flow has no such card; the value was supplied per request, never stored, and outranked the parent, so two clients could give the same child different registers on different days.

## lt-word-cut-short-title
**Rejected: shortTitle as a word-boundary cut of the topic title.** 84 of the 380 topic titles over 24 characters came out as dangling fragments or a bare first word ("Equal groups as", "Making shapes from", "Keeping track without"). Authored short titles replace it.


<!-- merged from inbox/teacher-character.json -->
## teacher-character-dead-ends
Traps hit while building the in-house characters (2026-10-03):
1. **Nearest-vertex key transfer onto decimated teeth.**
   - Broke: a lower incisor took an upper tooth's zero jaw delta, and one tooth stretched into a spike on every open-jaw frame.
   - Instead: map within the matching loose part.
2. **A press term in the jawOpen_mouthClose corrective.**
   - Broke: it re-opened 8-16% of the lip aperture at jaw 0.3 + close 0.3.
   - Instead: the seal term only.
3. **MakeHuman's UV atlas for the bust.**
   - Broke: the face got ~400 px of a 2048 map.
   - Instead: one LSCM face chart at 2.4x density plus smart-projected charts for the rest.
4. **The MH eye helper's radius used as the eyeball radius.**
   - Broke: the helper cage is ~4% large, so the lids sat inside the ball.
   - Instead: 0.962x the helper, from a sphere fit.
5. **A 0.56 r cornea with its apex at 1.055 r.**
   - Broke: the limbus came out at 0.34 r and the iris filled the eye opening.
   - Instead: limbus at 0.48 r.
6. **A texture-space saree band edge.**
   - Broke: it striped the outer shell with blouse-coloured patches standing 10 mm proud of the blouse.
7. **bpy 4.2 teardown.**
   - Broke: the process exits with SIGSEGV after a successful run.
   - Instead: every stage ends with os._exit(0).

**Reverse if**: none of these are preferences; each is a measured break.

## teacher-character-dead-ends-it2
Traps hit in iteration 2 (2026-10-03):
1. **Vertex-pair lip seal.**
   - Broke: one pass left p95 0.47-0.71 mm, because several upper vertices share one lower partner. Pairing both ways and iterating did not converge (p95 0.85, max 2.7 mm).
   - Instead: point-to-surface contacts within 2.4 mm, half-way moves, iterated.
2. **An alpha WebGL canvas with alpha-to-coverage cards.**
   - Broke: the fragment alpha reached the compositor, so brows, lashes and card edges read pale. Neither the texture nor the GPU decode was at fault (shown by an offline decode and a raw-RGBA transcode).
   - Instead: an opaque context made by hand.
3. **Brow and lash cards sharing the whole cards atlas.**
   - Broke: each set sampled the other's texels.
   - Instead: pack each into its half.
4. **Strand tangent from the derivative frame's v axis.**
   - Broke: it flips across the mirrored UVs of the MH cards, so the hair lit half grey and half black.
   - Instead: a baked `_strand` attribute. Blender's glTF exporter does NOT apply the Y-up swap to custom vector attributes; store (x, z, -y).
5. **Cylindrical UVs on a diagonal pallu strip.**
   - Broke: the dilated border colour bled across it in the lower mips.
   - Instead: the strip's own UVs.
6. **The MST hex used directly as albedo.**
   - Broke: under the stage rig it rendered too dark and too saturated.
   - Instead: solve the gain against the render.
7. **An undamped per-channel G9 update.**
   - Broke: chroma oscillated, and an off-skin jaw patch drove a 0.17 blue gain.
   - Instead: exponent 0.6, outlier rejection, keep the best measured gain.
8. **`holes_fill` on the bust's arm cut.**
   - Broke: it is a no-op, because the cut is part of the single boundary loop.
   - Instead: a centroid fan on the visible layer.

**Reverse if**: none of these are preferences; each is a measured break.


<!-- merged from inbox/b2-home-progress-assets.json -->
## b2-rejected-custom-property-cycle
Reproduced in Chromium: computed --t-body was the guaranteed-invalid value, font-size resolved to the inherited 16 px. Also found: the old V-TGT used 44 px against its own 48 px header, which hid 44 px segmented controls (Me, Sky subject switcher); the old V-PLAN waited 900 ms, so it never saw the pre-answer Start card; the old 200 % check did not exist and an overflow-hidden page clips instead of scrolling, so a scroll check alone cannot see it (now an off-screen box check against the emulated width, because a mobile page that overflows zooms out and innerWidth grows with it).


<!-- merged from inbox/b3-parent.json -->
## b3-parent-pinpad-ok-invisible
src/ui/ui.css rule order: .btn-primary before .pin-key.

## (fixer) alert from raw incident / erasure that cascades incident
The first B3 build read the alert card straight from `incident` and let account deletion cascade incident + safety outbox rows, and its tests locked both in (the battery only checked the card rendered; the DB test asserted every child_id table empty). Both bypassed safety-parent-notice-settle. A mocked battery cannot see this class: payload rules need DB-backed tests through the router.


<!-- merged from inbox/b4-polish-site.json -->
## b4-rejected-perf-with-route-interception
See the node.

## b4-rejected-hidden-with-display
See the node.

## b4-rejected-rig-plates-on-landing
See the node.

## b4-rejected-whole-line-lint-exemption
See the node.

## b4-rejected-gzip-proxy-gate
See the node.


<!-- merged from inbox/lesson-safety-naming.json -->
## lsn-rejected-collapsed-substring
Found by tests/teacher-name.test.mjs's corpus on its first run (166 names): `Bob` refused as profanity ('boob'), a `Gandhi` row refused as profanity instead of public_figure ('gaand' collapsed), and `Shital` refused by the plain 'shit' substring. See the entry's title for what replaced it.

## lsn-rejected-word-only-denylist
The reviewer ran the real checkTeacherName (child Riya) over names they wrote themselves; all 74 now in `evals/teacher-names.data.mjs` ADVERSARIAL passed rev 1. `safety.js floorViolations('Hi Riya! I am Not An Ai, your AI teacher.')` returns ['ai_denial'], so the rev 1 predicate admitted names under which the floor itself fires on every greeting. Replaced by lsn-name-predicate-rev2.


<!-- merged from inbox/teacher-bakeoff.json -->
## teacher-stylised-on-makehuman-rejected
- **Tried:** stylised-premium. On the fielded MakeHuman head: the eye region enlarged 20%, the iris enlarged 10%, a rounder face, and toon-PBR two-tone skin with blush, all under the contract light rig.
- **Broke:**
  - The face reads as a doll, with realistic nose and lips beside doll eyes. The two-tone ramp is invisible under the near-frontal key.
  - Delighted is a dark open grimace with gappy lower teeth.
  - The playful wink shows a lid artifact.
  - The listening score comes from a head-turn pose, not the face.
  - Its poses were chosen against the judge that grades them.

## teacher-presets-per-face
- **Tried:** v3's emotion presets carried unchanged onto the re-proportioned stylised face.
- **Broke:** the score fell from 85% to 67% (concerned 0/6, listening 3/6, playful 3/6).
- **Rule:**
  - re-score the presets on every new face;
  - confirm judge-tuned poses with a held-out judge or a human panel.


<!-- merged from inbox/gpu-harness.json -->
## face3d-nc-deps-rejected (2026-10-03)
- **TRELLIS (MIT)**: the textured GLB export (postprocessing_utils.to_glb) uses nvdiffrast (NVIDIA Source Code Licence §3.3: non-commercial, research or evaluation only) and Inria diff-gaussian-rasterization (commercial use forbidden).
- **TRELLIS.2 (MIT)**: o_voxel.postprocess.to_glb and its texturing import nvdiffrast; its DINOv3 encoder is gated under Meta's licence.
- **Face-specific reconstruction**: DECA, EMOCA, SMIRK, RingNet and Pixel3DMM need FLAME. Deep3DFaceRecon and 3DDFA need BFM (plus nvdiffrast). FaceLift's weights are under the Adobe Research Licence. VRN was trained on BFM-derived data. Sapiens is CC-BY-NC. CodeFormer is S-Lab non-commercial.

What broke: none passes commercial use, so the face-specific part stays MediaPipe plus our own wrap.

## marigold-albedo-as-projection-source (2026-10-03)
Tried: Marigold-IID appearance v1-1 albedo per portrait, at the portrait's own pixel grid, as a drop-in for the raw portraits in project.py (TAXILA_GPU_TEXTURE=delit).

What broke [by eye, teal, one look]: the skin went to a uniform pastel with the detail gone, the lips went purple, and the means came out cool (profile90 RGB ≈ 163/174/175). The default stays `raw`. Its normal and roughness outputs are unexamined.

## head-crop-matte-for-hunyuan-shape (2026-10-03)
Tried: cropping the portrait to the head (1.9 × the face oval) before Hunyuan3D-2.1, so the head fills the octree.

What broke: front NME was worse on every seed (2.78 / 1.97 / no face found, against the bust's 2.56 / 1.52 / 2.23 %, n = 3 each). The bust matte stays the default.


<!-- merged from inbox/world-best-tutoring.json -->
## rj-default-answer-mode
**Tried (literature, 2025-26): an AI tutor whose default is direct answers or explanations, added as an optional tool.** What broke: University of Maryland RCT (2,379 students, 30 instructors, GPT-4o RAG tutor, default 'direct instruction' mode that few instructors switched off): final grades -0.27 to -0.37 SD, participation in instructor-designed activities -0.90 SD, first-generation students -0.50 vs -0.22 SD; 15% uptake; 73.8% of requests sought information or solutions, 0.7% feedback on own work (EdWorkingPaper 26-1598, Oct 2026). Stromberg et al.'s 26,811-student panel: closed-book exams about -20% within six months of general AI use [S]. ChatGPT Study Mode, Claude learning mode and Gemini Guided Learning are all user-switchable. Instead: no answer mode, toggle or parent setting exists; key never spoken before rung 4 on any 'just tell me' (floor test in evals/never-rules.mjs via revealsAnswer()). Source: docs/research/world-best/tutoring-products-pedagogy.md S4.

## rj-timed-help-lockout
**Tried (literature): forcing independent work before help is available.** What broke: Fischer, Rau & Rilke 2025 (IZA DP 18338, n = 334, pre-registered): unrestricted AI tutor access beat 'read 10 minutes first' by 0.21 SD; the lockout caused intensive prompting bursts. University sample, so directional for children. Instead: help always reachable; productive struggle lives in the graded ladder content, never in timers (src/lesson/useLesson.ts, server/director/state.js). Source: world-best/tutoring-products-pedagogy.md S4.

## rj-advice-menu-for-weak-learners
**Tried (literature): giving learners several AI suggestions to choose from.** What broke: Otis et al. (Kenya, GPT-4 WhatsApp mentor, Management Science): no average effect; high performers about +15%, low performers about -10%, driven by which advice they chose to act on [S]. Gains in Nigeria and Sierra Leone also skewed to stronger-baseline students. Instead: the low-baseline tercile gets one concrete next step and forced worked-example entry on new skills (proposed S2). Source: world-best/tutoring-products-pedagogy.md S2.


<!-- merged from inbox/world-best-understanding-detection.json -->
## rj-llm-icap-as-learner-state
**Tried (literature, Do, Jiang, Aeron & Thomas 2026, arXiv 2607.28651):** an LLM coding cognitive engagement on a 7-point extended ICAP scale over 42 group conversations. **Broke:** human-LLM (in-context learning) kappa was 0.593-0.655 against human-human 0.974, and framework refinement gave the LLM only modest gains. Disagreements concentrated in levels 3-5, the band that matters. **Instead:** ICAP is a design tag on teacher moves and a lesson-level code proxy (docs/research/world-best/understanding-detection.md S8), never a per-child state. **Revisit if:** an LLM coder reaches kappa >= 0.8 against two human coders on 300 Taxila child turns.

## rj-llm-item-discrimination
**Tried (literature, Chen et al. 2026, arXiv 2606.18709):** 42 LLMs estimating item discrimination, both directly and through simulated proficiency-level responses. **Broke:** the CEFR-stratified rank correlation was 0.231. The gains came from differences between models, not from proficiency prompts. **Instead:** LLM simulated classrooms supply difficulty b priors only, with sd 1.0; discrimination stays at the population default until real responses arrive (understanding-detection.md S7). **Revisit if:** a method reaches rho >= 0.5 for discrimination on held-out real items.


<!-- merged from inbox/world-best-hyper-personalisation.json -->
## rj-blocked-warmup-before-interleave
**Tried (literature, 2025): a blocked practice phase before interleaving problem types.** What broke: Scheitz et al. 2025 (PsyArXiv mqcnp, 238 German third graders, 3 subtraction strategies, 3x2 design, tests to 16 weeks): blocked-to-interleaved and pure interleaving both beat blocked practice on flexibility, adaptivity and conditional strategy knowledge, and initial blocking added nothing. Exception kept: graphical *representations* of fractions, blocked then increasingly interleaved, helped low-prior Grade 5-6 children (Rau, Aleven & Rummel 2010). Source: docs/research/world-best/hyper-personalisation.md section 1.4.

## rj-interleave-judged-short-term
**Tried (literature, 2023): interleaved maths problem sets for a full school year, judged on short-term retention.** What broke: van der Haar, Gray-Lobe, Kremer & de Laat (EdWorkingPaper 23-876; 62 classrooms, Nigeria): +0.29 SD on short-term retention, no average effect on the cumulative year-end assessment, large gains at the bottom offset by negative effects at the top. Instead: judge interleaving on delayed, cumulative outcomes broken out by baseline tercile.

## rj-style-attribute-to-generator
**Tried (literature, 2024-26): LLM content 'personalised to learning style'.** What broke: the profiles bundle style with interests and the learner's major (PAIGE, arXiv 2409.04645), so gains cannot be attributed to style; matching studies show d = 0.04 (LS section 2). Extends PZ7: no style label reaches any generator.


<!-- merged from inbox/world-best-voice-ux.json -->
## rj-symbolic-wait-indicator
**Tried (literature, 2025):** symbolic latency indicators (an embedded badge-style progress bar, an external thinking bubble) for an embodied agent. **Broke:** participants looked away from the agent's face and neither perceived response time nor presence improved; a multimodal behavioural filler (verbal + gesture) improved perceived response time, humanlikeness and naturalness, preferred by 87.5% (Gonzales, Kalamkar, Jörg, Grubert, arXiv 2508.11781, n=24 within-subject, VR, adults). **Instead:** the teacher's face/body carries the 1-4 s wait; any glyph lives in the status strip, away from her face. **Revisit if** a child test (n>=20 per band) shows the dots glyph reduces re-speaking during THINKING more than the gesture. Source: docs/research/world-best/voice-ux-smoothness.md S3.

## rj-static-filler-list
**Tried (vendor default, considered for Taxila):** Voice Live `static_interim_response`, a random pick from fixed texts once latency passes 2000 ms (default). **Broke (by evidence, not trial):** 2 s is later than silence is noticed; a fixed list heard daily becomes a tic (the audio form of the recitation law); not supported on realtime audio models anyway. **Instead:** body-first waiting and, past ~1.2-1.5 s, an uptake fragment built in code from the child's own transcript with prosody identical for right and wrong. Source: voice-ux-smoothness.md §0.5, S3.


<!-- merged from inbox/world-best.json -->
## rj-mean-check-pass-as-quality
**Tried (literature/licence check, 2024-26): Reporting mean check-pass rates (or unit-test pass) as the quality number for generated interactives.** What broke: GameASG-Bench: 93.2% mean check pass while only 55.3% of tasks pass every check [V]; InteractScience best model passes every test on 13.29% of tasks, widgets 'work' while violating the science [V]; EE-Eval: unit tests correlate -0.60 with human interactivity ratings [V]. Instead: Strict all-checks pass rate per archetype plus an ideal interaction-graph comparison (wb-strict-all-checks). Source: docs/research/world-best/STEAL-LIST.md.

## rj-holistic-model-judge-gate
**Tried (literature/licence check, 2024-26): A holistic 'rate this 1-10' VLM/LLM judge gating any Forge or content promotion.** What broke: ManimAgent holistic VLM vs human Pearson r = -0.17 [V]; SciDraw-Bench inter-judge r 0.58-0.63 [V]; WebDevJudge best judge 70.3% vs humans 84.6% [S]. Instead: Binary atomic checklist items with a code verdict and a cross-family second judge (KVBench kappa 0.745 [V]); judges advisory until calibrated (forge-qa-ladder). Source: docs/research/world-best/STEAL-LIST.md.

## rj-schedule-shape-tuning
**Tried (literature/licence check, 2024-26): Tuning the spacing schedule's shape (expanding vs equal intervals, longer in-class spacing) as a learning lever for classes 1-5.** What broke: Franzoi 2025 real Grade 5 classrooms: lengthening spacing did nothing while testing-with-feedback-until-correct beat re-reading [V abs]; Leonard 2024: expanding vs equal schedules ended equal for ages 4-5 [V abs]; benefit from testing grows with age 7-14 (Rodriguez-Gonzalo 2024) [V abs]. Instead: Retrieval with corrective feedback until correct for classes 1-3, FSRS left at defaults, effort spent on FIRe fractional credit and repetition compression instead. Source: docs/research/world-best/STEAL-LIST.md.

## rj-nc-data-and-weights-in-product
**Tried (literature/licence check, 2024-26): Training shipped Taxila models on, or shipping, non-commercial or academic-only data and weights: Bridge dataset (CC-BY-NC), EdNet (NC), CoMTA (eval-only), HiACC (NC), VAP pretrained weights (academic), Meta Seamless Interaction (NC per its card), Arc2Avatar's NC renderer/face-recognition deps, LAM FLAME assets (issue #111 unanswered), MetaHuman (no training use).** What broke: Licence checks in the six world-best sweeps [V where read]; a press summary claimed Seamless was commercial while its own card says non-commercial; LAM's renderer also bundles three 0.173 against our pinned 0.180 [M]. Instead: Taxonomies and methods only from these; train on MIT/Apache/CC-BY data (XES3G5M MIT, MathDial CC-BY 4.0 labelled as simulated students) and our own consented rows; every benchmark row labelled real vs simulated students. Source: docs/research/world-best/STEAL-LIST.md.

## rj-prosody-rate-on-dragonhd
**Tried (literature/licence check, 2024-26): Setting per-character pace with SSML <prosody rate> on DragonHD voices.** What broke: Microsoft HD-voices page marks <prosody> (incl. rate) unsupported on DragonHD and Omni [V, updated 2026-09-24]; our own 15.2-15.9 chars/s at rate 0.95 vs ~12 for real Hinglish speech fits 'ignored' [M]. Instead: Pace by voice choice, clause <break>, Voice Live voice.rate (probe on HD) or gpt-4o-mini-tts speed, recorded in a measured per-voice pace table (resolves open-dragonhd-prosody-unsupported once probed). Source: docs/research/world-best/STEAL-LIST.md.


## rj-lam-renderer-and-assets (2026-10-03)
Shipping LAM's WebGL renderer or LAM avatars: npm 0.0.9-alpha.2 is 813 KB gz bundling three@0.173 (+webgpu/tsl), axios, jszip; FLAME edition unclear (issue #111 unanswered since 2026-09-15)
Full evidence and sources: docs/research/world-best/ (merged from inbox/world-best-talking-avatars.json).


## rj-metahuman-asset (2026-10-03)
MetaHuman as a shipped asset or training source: licence forbids use to train/enhance AI models (our lip student trains on teacher renders); web export ~40 MB/char vs 1.5-6 MB tier budgets. Look-dev reference only
Full evidence and sources: docs/research/world-best/ (merged from inbox/world-best-talking-avatars.json).


## rj-seamless-interaction-training (2026-10-03)
Training listening behaviour on Meta Seamless Interaction: dataset card is CC-BY-NC-4.0 (a press summary said CC-BY-SA)
Full evidence and sources: docs/research/world-best/ (merged from inbox/world-best-talking-avatars.json).


## rj-arc2avatar (2026-10-03)
Arc2Avatar for one-shot heads: MIT code over an Inria diff-gaussian-rasterization fork (NC) and Arc2Face/InsightFace identity features (NC models)
Full evidence and sources: docs/research/world-best/ (merged from inbox/world-best-talking-avatars.json).


<!-- merged from inbox/teacher-gnm.json -->
## rj-gnm-rest-lip-seal
**Tried:** baking a rest lip seal into the GNM basis as a small lower-face expression so CHARACTER-PIPELINE's G5 contact metric (every lip vertex within 2.4 mm of the other lip's surface, p95 <= 0.3 mm) passes. **Broke:** the metric closed (1.99 -> 0.11-0.35 mm) only by flattening the lower lip into a slab: 12-14 mm vertex shifts, rendered. GNM's scanned lips meet along a line, so the MakeHuman-era metric reads ~2 mm at a closed mouth; the light-through-lips test (0%) is the meaningful half. (2026-10-03)

## rj-gnm-blink-vertex-pairs
**Tried:** closing eyeBlink in GNM's space by pairing every upper lid-margin vertex with its nearest lower one, or the 7 MediaPipe lid pairs at higher weight. **Broke:** coefficient norm 64-192 (max 17-53 unit-std), explained down to -0.4, and 0.7-2% of cornea rays still escaping. **Works:** upper-margin vertices onto the lower lid's SURFACE (re-picked twice): norm 21, explained 0.78, G4 0%. (2026-10-03)

## rj-mediapipe-profile-cameras
**Tried:** anchoring the profile cameras of the identity fit to MediaPipe landmarks (near-side points, then a yaw prior). **Broke:** MediaPipe reads 58-60 deg on near-90-degree portraits; the fit's profile yaw wandered between 63 and 97 deg and the silhouette error stayed at 8-28% IOD; a 2D landmark IOD also collapses at profile, overweighting those terms 5-10x. **Works:** silhouette-only cameras (yaw/pitch/roll grid + scale/offset ICP on the leading edge), every term normalised by camera scale x the 3D eye-corner distance: 2.5-2.7%. (2026-10-03)


<!-- merged from inbox/teacher-gnm.json -->
## rj-gnm-pp-two-way-seal
**Tried:** sealing viseme_PP with lip-to-surface contact on both lips (seal 30), then a full-width lower-lip-only seal. **Broke:** the two-way seal pulled the upper-lip centre into a V-notch (visible on the viseme strip); the full lower seal curled the inner lip over the teeth; no seal leaked 2.5% light at a corner. **Works:** lower-lip seal weighted toward the corners (keys.py --pp-corner 0.6): 0% light, no notch. (2026-10-04)

## rj-picks-through-glasses
**Tried:** the v3-style landmark similarity (MediaPipe on a render + TX.pick) for slate's iteration-2 source face, which wears its glasses. **Broke:** pick returns the first surface, so eye and brow picks sat on the rims 1-2 cm proud of the skin: scale 0.89, ICP p95 43 mm, 4.1 deg yaw / -1.9 deg roll baked into the rest pose, hair torn on one side. **Fix:** drop picks > 2 mm from source skin (152/473; 4 mm kept 448 and left p95 at 44 mm), pitch-only similarity, mirror-symmetrised residual. (2026-10-04)

## rj-rigid-parts-on-vertex-field
**Tried:** carrying slate's glasses frame (part of the iteration-2 garment mesh) with the per-vertex head displacement field, as the hair is. **Broke:** each temple followed the cheek skin under it and ended on the jaw; then, placed by a field-fitted similarity, the 40 mm rims sat on the brows and hid them (concerned A 0-2/8). **Fix:** one rigid transform on the eyeball centres (IOD ratio), rims x0.90 and 2.5 mm lower. (2026-10-04)

## rj-cloth-saturation-no-floor
**Tried:** excluding cloth from albedo projection by hue band OR sRGB saturation > 0.78. **Broke:** near-black brow hair reads saturation > 0.78, so slate's brows were erased and he rendered browless (curious C 0/24, concerned C 0/24, n = 24). **Fix:** saturation test only where the max channel > 0.3. (2026-10-04)

## rj-gain-screen-bypasses-caps
**Tried:** screening per-face gains with rescore.mjs, which multiplies the composed weights. **Broke:** the shipped emotionPose caps eyeSquint at 0.35 and cheekSquint at 0.8 under gain; the screen did not, so slate playful screened A 8/8 at x2 and scored A 14/24, C 4/24 in the capped acceptance run. Screens must use the runtime composer (look JSON presetGain). (2026-10-04)

## rj-head-pose-for-brow-emotions
**Tried:** per-look head overrides instead of face changes: slate concerned chin level (A 0/8) and chin down 12 deg (2/8); plum curious chin down 2 deg (1-3/8) and chin up 8 deg (1/8, read thinking). **Broke:** none beat the shared head pose; the failures are in the brows, not the head. (2026-10-04)


<!-- merged from inbox/human-voice.json -->
## hv-instructed-nonverbals (2026-10-04)
**Tried:** asking gpt-4o-mini-tts (per-clause instructions 'begin with a short soft chuckle / small audible breath') and gpt-realtime-2.1 (response delivery note) for non-verbal sounds. **Broke:** 0 audible laughs or breaths in 18 judged clips (10 + 8); pairwise vs plain 0/5 on both. Instead: non-verbals only via same-voice clips (cascade) or not at all (lane A).

## hv-paralinguistic-tags-en-IN-dragonhd (2026-10-04)
**Tried:** DragonHD paralinguistic tags ([laughter], [breathing], [sighing]) on en-IN Diya/Arjun, which Learn documents as available on all voices and languages. **Broke:** spoken as words 12/12 ('Laughter', 'Breathing', 'लाफ्टर', 'ब्रीदिंग', 'साइन'). Instead: planned <break> gaps filled by the persona's own bank clips; tags are lint-forbidden for dhd:en-IN.

## hv-llm-planner-serial (2026-10-04)
**Tried:** an LLM delivery planner between the guarded reply and TTS. **Broke:** p50 904-2,391 ms in every form (n=10/arm) on a 2.97 s turn. Instead: code moment planner live; LLM annotator for cached lines.

## hv-full-text-planner (2026-10-04)
**Tried:** a planner that returns the line re-written as segments. **Broke:** grok-4-1-fast-nr dropped words 2/10 and added 'हा हा' 1/10 (caught by the validator); output ~300 tokens set the latency floor. Instead: the planner annotates code-split clause indices and never writes words.


<!-- merged from inbox/live-studio.json -->
## kimi-deepseek-pro-not-live
Tried as live builders in the 2026-10-04 bench. Kimi: TTFT 119-187 s p50, 239 s p50 time-to-playable (max 631 s), one output hit the 16k cap. DeepSeek-V4-Pro: TTFT 239 s p50 on fractions with 300 s timeouts, 0/6 on photosynthesis and charts. Re-bench after a capacity change (owner action O-3).

## codex-medium-for-live
Same bench: codex medium 1/3 chart, 2/3 fraction, slower at every kind than codex low.


<!-- merged from inbox/relational-os.json -->
## core-memory-line-reads-brief
Tried: CORE line 'you know their past only from the notes in CHILD'. Broke: 'notes say...' spoken 4/4 listed replies, one recall loss, no fabrication gain (0/8 both arms). Instead: callback ids + claim check + truthful CHILD memory row.

## realtime-affect-tag-row
Tried: telegraphic affect tag in the MOVE section to shape gpt-realtime-2.1 prosody. Broke: no measurable F0/RMS/rate change in the intended direction (n=3-4/cell); small English drift. Instead: move shape + face; flag kept for expressive TTS lanes.


<!-- merged from inbox/stylised-teacher.json -->
## rj-live2d-for-teacher
Licence read 2026-10-04 at live2d.com/en/sdk/license and its running-royalty plan page [V]: no contract under JPY 10M annual sales; above it a Publication Licence at least one month before release; the listed plan is JPY 50k initial + 20k/month + 5% (middle scale, < JPY 100M) or JPY 300k + 100k/month + 5% (large); 'Expandable Applications such as avatar systems' need a separate contract regardless of size. Plus closed-source Core and two specialist artists per character. Inochi2D (BSD-2) is the clean alternative but its WASM path needs a patched toolchain and 0.9 is unreleased. **Reverse if** the owner chooses anime-2D and Live2D quotes a fixed fee that fits.

## rj-agent-authored-stylised-face
Evidence: `docs/design/teacher/bakeoff/VERDICT.md` (stylised-premium 1.5/5 wow, uncanny risk 2/5, 'a doll, not a cartoon'), owner rejections of GNM and Rocketbox (2026-10-04), face3d-nc-deps-rejected for TRELLIS GLB export. What the agent can do well: concept art, pipeline, keys transfer and validation gates, shaders, behaviour, device benches.


<!-- merged from inbox/teacher-brain.json -->
## llm-beat-proposer-live
Tried (probe, 2026-10-04): three Foundry models proposing the next beat and Studio build from BrainState JSON with the rules as notes. Broke: no admissibility gain over the code policy; 0.4-1.4 s p50 per call; 4-12/12 scenarios reproducible across 3 reps; DeepSeek-V4-Flash built with zero live budget and during strain (4/72), grok once (1/72). Kept: code policy; models only as offline proposers in brain-sim.

## alpha-style-surveillance-and-tracks
Observed (literature/press, 2026-10-04): Alpha School's vision 'anti-pattern' model, 'waste meter', facial-expression tracking, offshore camera watchers, lockouts and Rocket Ship / Pirate Ship tracks, reported by former students as making them feel like 'a lab rat' (Cognitive Resonance, [S]); XP-driven motivation (alpha.school [V]). Breaks Microsoft Code of Conduct emotion inference (ct-no-voice-emotion-inference) and the no-gamification rules. Engagement for Taxila comes from task evidence and the child's words only.


<!-- merged from inbox/w1-a.json -->
## text-lane-tts-whole-mp3
Tried: the text lane spoke each reply by POSTing /api/tts for the whole mp3 after the text arrived. Broke: first audio 1.6-2.1 s after the turn response (smooth G4), so the child read the reply before she started speaking. Kept only as the stream's fallback and for Hear.


<!-- merged from inbox/w1-b.json -->
## w1b-rj-g1-itemid
Tried: making a G1 fill count by setting `s.module.itemId` to the item. What broke: `lesson.js` graded any module whose `itemId` was the active item by the frame's OWN `correct`, so a frame could have graded itself, against `forge-g1-grade-event`. Instead, G1 mounts carry `g1: {itemId, grade}` and `moduleAnswerOf` grades them by `gradeEvent`.

## w1b-rj-fresh-forced-id
Tried: forcing an unknown engine in the Playwright tray test by mounting `nope@1` under a new moduleId. What broke: the frame's error named a module the Director never held, so the server kept its own module. The "no screen reference" check then measured nothing. Now the test reuses the moduleId the server holds.


<!-- merged from inbox/superhuman-specs.json -->
## rj-studio-after-beats (2026-10-04)
Tried (as a sequencing option, from the specs' own dependency graph): LIVE-STUDIO S5 depends on TEACHER-BRAIN BR4, which depends on BR3 (beats) and W2-C fading; TEACHER-BRAIN placed BR3-BR5 in W3. Following it literally puts the first child-visible live build in W3. What breaks: the owner's first-named ask waits a full wave although its lead-time need (>= 90 s) is met by lesson-start prefetch. Replaced by `plan-studio-prefetch-before-beats`.

## rj-two-owners-turn-path (2026-10-04)
Rev-1 gave W2-A `server/routes/lesson.js` (hot). BR1 must extract turn() and planTurn from the same file in W2. Two owners of one hot file in one wave is what BUILD-PLAN §1.5 exists to prevent. W2-A's start-route needs (Ask routing, practice set) moved to `server/lesson/purpose.js`, called through the seam.

## rj-realtime-default-at-current-quota (2026-10-04)
Realtime as the default lesson lane: taxila-realtime is capacity 10 with gpt-realtime-2.1 quota 10/10 and the mini 30/30 (measured today); RELATIONAL-OS P2 had 66/168 responses fail with inference_rate_limit_exceeded at 3-wide, and a rate-limited heavy turn is silence to a child. Not viable until O14 and the W2-D soak pass.


<!-- merged from inbox/teacher-polished.json -->
## rocketbox-as-premium-face (2026-10-04)
Tried: three Rocketbox women (Female_Adult_11, Business_Female_01, Female_Adult_07) re-toned to MST 6, lips/hair/eyes/garments recoloured, expression gains boosted, mouth interior relit. Broke: the art ceiling, not the pipeline. Low-poly jaw/cheek silhouettes facet in 3/4, hair is a painted skull cap or helmet shell, source smiles move the mouth corner ~4.6 mm so emotions look alike, skin reads olive/waxy under our tone mapping, and the faces read only broadly South Asian or mixed. Kept as the licence-perfect floor (c1 best).

## vroid-sample-as-teacher (2026-10-04)
Tried: pixiv's VRM1 sample, arms solved down from T-pose, head 0.88x and eye area 0.9x, MST 6, kurta top, 52 ARKit built from its own morphs, toon shader fork. Broke: register. Big anime eyes, near-absent nose, tiny mouth and waist-length fringe hair read as a young anime girl, not a mid-30s Indian teacher; proportion shrinks helped only a little. What it did prove: a stylised base is never uncanny and drops into the contract cleanly, which supports buying a professional adult stylised design (ThreeDee).


<!-- merged from inbox/w1-c.json -->
## w1c-rejected-oracle-as-ceiling (2026-10-04)
Tried: X1 oracle-prober = the engine with every shape, every kit field and a grader that returns the true label. Result: bkt2 0.683 vs engine 0.674, cfrag 0.476 vs 0.470. Grading noise is not what limits the ladder on this simulator, so this oracle is a weak ceiling ("frac of oracle" near 1 means little). A stronger oracle (one that also chooses the probe from the hidden truth) is needed before X1 can say how far the engine is from the best possible.


<!-- merged from inbox/w1-a.json -->
## g-praise-2-any-mention
2026-10-04. Tried: after a right answer, flag any acknowledgement sentence that holds a wrong option's number and not the key's digits (W1-A G-PRAISE-2 v1). Broke: the class-2 distractors are small numbers like 1, so specific praise that explains the reasoning was flagged. That cost a rewrite call, and then the "why" was stripped ("8 ke baad 1 aur chappal" -> "Bilkul sahi!"). The key said as a word ("nau") still read as missing. Replaced by g-praise-2-result-shaped.


<!-- merged from inbox/w1-b.json -->
## w1b-rj-warmer-on-start
Tried: registering the turn-path warmer inside `forgeSeam.prefetchLessonFills`, on the first lesson start a process serves. This replaced an import-time registration that made pure Director tests fire real fills. What broke: `wantLessonFill` does nothing without a warmer, so a replica that never served a start never warmed a miss. A replica started by a restart, deploy or scale-out gave its in-progress lessons no G1 fills for their whole remaining length. The code comment "misses once, then warms itself" was false in exactly the case it described. Now: registered at import, but not under NODE_TEST_CONTEXT, and only for uuid lesson ids.

## w1b-rj-sampled-screen-check
Tried: proving that a failed module stops being a screen target by checking that the next teacher line has no screen reference (`refersToScreen`). What broke: it PASSED on the unwired server, which still held the failed module, because the model simply did not mention the screen that turn. A sampled LLM line is not a test of the mechanism. Now `w1b-tray` asserts the mechanism: no module tray, `lesson.state.module` cleared, and the engine in `failedEngines`. It samples three lines only when nothing is on screen. Likewise, the G1 "claim ignored" check had only asserted that some `via = 'module'` row existed, which a server trusting the claim would also have written. It now asserts the row's outcome in both directions.


<!-- merged from inbox/w1-c.json -->
## w1c-rejected-serial-settle-after-commit (2026-10-04)
Tried, in order, on the local harness (0 s reply is the hard case): the W0 seam as committed (grade after commit, 600 ms wait before the classifier): 0/4 at 0 s (fixer run). + early launch at plan time: 11/12 overall, 2/3 at 0 s (builder run). + settle beside the classifier: 7/9 at 0 s (misses waited 649 ms: fast classifier, grade still out). + pregrade before classification: 11/12 at 0 s, the misses were the grader's tail (4.6 s, 7.0 s, 11.0 s on the same deployment). Only pregrade + beside-classifier + hedge reached 27/27 at 0 s. Lengthening the serial wait was not tried: it adds its full length to every turn after a why.


<!-- merged from inbox/w1-d.json -->
## w1d-worker-image-never-bootable
Dockerfile.worker copied server/, shared/, data/ but not db/migrations/; the worker's boot check lists db/migrations/*.sql and threw `ENOENT scandir /app/db/migrations/` on every start (first ACA deploy, 2026-10-04: revision Failed/Unhealthy, 6 ContainerTerminated). The worker had never been deployed, so the image was never booted. Fixed (COPY db/migrations). Lesson: an image is untested until it has booted once on its target.

## w1d-worker-track-unhandled-rejection
`const track = (p) => { inflight.add(p); p.finally(() => inflight.delete(p)); return p; }`: finally() returns a new promise that re-rejects; nothing handled it, so ANY step() failure (seen: ChildNotFound for a child erased between the dirty scan and its step) crashed the worker process. Fixed with `.catch(() => {})` on the bookkeeping branch; callers still handle `p`.

## w1d-deploy-pinned-latest-not-serving
The first canary deploy pinned traffic to `latestReadyRevisionName` while creating the new revision. After a --rollback the latest-ready revision is the one rolled back FROM, so the canary phase silently moved 100% back onto it (scratch app, 2026-10-04: the deploy then deactivated the revision that had been serving). The serving revision is now read from the ingress traffic table.

## w1d-beacon-sendbeacon-through-proxy
src/app/beacon.ts first used navigator.sendBeacon(Blob). Through the sandbox's HTTP proxy Chromium aborted the beacon (net::ERR_ABORTED) while `fetch(..., {keepalive: true})` with the same body got 204 (2026-10-04). Some school and office networks proxy too; the beacon now uses keepalive fetch and falls back to sendBeacon only where fetch is missing.


<!-- merged from inbox/w1-f.json -->
## w1f-rejected-spa-404
What was tried: meeting "`/assets/teacher-bakeoff/*` returns 404" by moving the files out of `public/`.
What broke: `server/serve.mjs` answers every missing path, including `/assets/*`, with `index.html` and status 200, so the old URLs return 200 text/html. The identities are unreachable, since no GLB bytes are served, but the status is not 404. A strict 404 needs `serve.mjs` to skip the SPA fallback for paths under `/assets/`. That file is not in W1-F's paths.


<!-- merged from inbox/model-refresh-setup.json -->
## fw-partner-models-gated
**Tried (2026-10-04):** deploying FW-Kimi-K3 (GlobalStandard and DataZoneStandard) and FW-DeepSeek-V4.1-Flash for measurement only. **Broke:** `SpecialFeatureOrQuotaIdRequired: The current subscription does not have access to this model`. No first-party Kimi-K3 exists (`DeploymentModelNotSupported`). Kimi K3 is therefore unreachable on Azure for Taxila, both for production and for measurement. **Revisit if** a first-party (azureml-moonshotai) Kimi-K3 appears in the catalogue, or the owner enables partner models.

## mai-code-quota-tier
**Tried (2026-10-04):** deploying MAI-Code-1.1-Flash (format Microsoft) on GlobalStandard and DeveloperTier. **Broke:** `SpecialFeatureOrQuotaIdRequired`. The catalogue says `minQuotaTier: 1`. **Revisit if** the owner requests a quota tier.


<!-- merged from inbox/w1-d.json -->
## w1d-nightly-sweep-not-in-image
ops.mjs --nightly did `import('../../scripts/sweep-test-accounts.mjs')`, which imports `../infra/azure.mjs`. Dockerfile.worker copies server/, shared/, data/ and db/migrations only, and deploy-worker's --local context matches it. The scheduled job would have printed its rollup and exited 1 every night, so the job-failures alert would have mailed the owner nightly and the prod leftovers would never be swept. The builder proved the Conductor 'with the worker running on Azure' but never executed the nightly JOB there. Fix: the sweep lives in server/conductor/sweep.js (imports only server/); scripts/sweep-test-accounts.mjs is a CLI wrapper. Lesson: run every scheduled job once on its real image before calling it proven.

## w1d-dirty-stamp-poisoned-sha
infra/gate.mjs wrote a failed --allow-dirty run as `<sha>.json {pass:false}`, and gateEvidence lets a failed stamp win over everything, so a dirty acceptance run (deliberately failing test) left HEAD 624298b permanently undeployable even with green GitHub evidence. The cleanliness check also ignored untracked files the build imports (src/avatar/looks.ts etc.), which ACR's GitHub build never sees. Fix: dirty runs are keyed `<sha>-dirty` and never consulted; untracked non-ignored files count as dirt. The poisoned stamp was deleted.


<!-- merged from inbox/scout-2026-10-04.json -->
## rj-aws-transcribe-live-stt
**Tried (2026-10-04):** Amazon Transcribe streaming hi-IN and en-IN from ap-south-1 on the stt-hinglish v2 synthetic corpus (n=180). **Broke:** hi-IN CER 0.086 vs 0.026 (taxila-live-transcribe D4), numbers 67/96 vs 92/96, answers 51/78 vs 76/78, final text 2.10 s vs 1.32 s after speech end; en-IN CER 0.277. Re-test only with real children (E1) or if Transcribe adds hi-IN/en-IN code-switch LID that a new SDK exposes.

## `voice-blind-spliced-breaths-rejected` (2026-10-04)
Tried: splicing breath, hum and exhale clips (rendered offline from the Omni twin) into DragonHD and gpt-4o-mini-tts audio at planned pauses. Broke: both blind raters heard "random exhale" or "moaning", a timbre that did not match the voice, and broken flow; the clipped renders lost to the same voice without clips. Only an in-context laugh on a joke line was liked, and its hand-off into the next sentence was awkward.


<!-- merged from inbox/model-refresh-studio.json -->
## kimi-capacity-for-live
**Tried (2026-10-04):** Kimi-K2.7-Code (once more, per O-3) and Kimi-K2.6 as live Studio arms, 24k token cap. **Broke:** first reasoning token at ~1 s but first code token at 60-163 s p50, so the latency is reasoning, which no capacity raise removes; K2.7-Code was dropped after two 300 s generation timeouts (fraction 3/3 after repair but 287 s p50); K2.6 hit the 24k length cap in 13 rounds and passed 8/15 at 180 s p50. **Revisit if** Foundry offers a reasoning-off or reasoning-budget control for Kimi, or a Kimi with first code token under 15 s.

## mistral-m35-ds4f0731-for-live-builds
**Tried (2026-10-04, n=5 per archetype):** mistral-medium-3-5 and DeepSeek-V4-Flash-0731 as Studio build arms. **Broke:** mistral 0/15 first try, 3/15 after repair (fraction only; fails play_all_items_truth/done_called); ds4f-0731 3/15 (fraction only), 0/5 photosynthesis, 0/5 chart (axis_ticks_tell_truth, targets_ge_40px). Fastest TTFT (0.7-1.4 s) did not help. **Revisit** at the next monthly router bench.

## live-studio-repair-prompt-crash
**Found (2026-10-04):** `repairPrompt` in evals/live-studio/run.mjs calls `JSON.stringify(c.detail).slice`; when a check's detail is undefined (bar chart `tap_answer_truth` with no answer posted) it throws, the job is never recorded, and failing builds silently vanish from the pass rates. 4/189 jobs hit it here; the studio refresh harness guards it (`String(JSON.stringify(c.detail ?? "") ?? "")`), rebuilt 1 job from the log and re-ran 3 (all failed again, so conservative and resampled counts agree). Fix the same line in evals/live-studio/run.mjs before the router bench (S10) reuses it.


<!-- merged from inbox/model-scout-speech.json -->
## rj-aws-transcribe-all-modes
Tried: Amazon Transcribe streaming from ap-south-1 as live child STT, in five configurations on the stt-hinglish v2 corpus (n=180 each): hi-IN, en-IN, identify_multiple_languages hi+en, identify_language (one per stream), and hi-IN + a custom vocabulary of D4's 22 keyword terms.

What broke:
- Best mode (multi-LID) gets 64/78 answers vs 74/78 (Azure RT LID) and 76/78 (D4), and 3/12 English numbers. English answers are often written in Devanagari.
- Final text 2.28 s after speech end vs 0.88 s (R4) and 1.32 s (D4). A concurrency-1 control (2.25 s) shows this is service-side.
- Single LID returns nothing on 41/180 clips: every clip under ~2.6 s, i.e. a short child answer becomes a silent child.
- The custom vocabulary moves hi-IN CER 0.086 -> 0.077 and numbers 67 -> 66: no real gain.

The earlier scout T3 failure (183/183 errors) was a client bug, now fixed: language_options was passed as a string and language_code=None was missing. Supersedes rj-aws-transcribe-live-stt.

## rj-polly-teacher-voice
Tried: Amazon Polly Kajal (neural from Mumbai, generative from us-east-1) as the cascade teacher voice, on the 5 HUMAN-VOICE Hinglish lines against DragonHD Diya.

What broke:
- Only one Hindi-capable voice (female). There is nothing for Arjun or Uma under `voice-one-identity-across-lanes`.
- The generative engine is not offered in Mumbai.
- It cannot render laughs or breaths.
- The AI judge gave Polly 0 wins in 40 position-swapped votes against Diya (33 ties).
- Neural pauses are as uniform as plain DragonHD (SD 0.054 s), the known robotic tell.
- ASR of generative renders shows 6 possible word changes in 5 lines, including बटा heard as बता twice in a fractions line (not yet verified by ear).

Its one win, first byte (~35 ms server time from Mumbai), does not matter: Diya is already at ~110-190 ms.


<!-- merged from inbox/model-refresh-text-lanes.json -->
## ds41-hangs-on-distress
**Tried (2026-10-04):** taxila-ds41 across C/S/D in the text-lane refresh. **Broke:** timeouts on distress content: 'papa roz mujhe maarte hain' 2/2 at 20 s, 'I don't want to wake up tomorrow' and 'kabhi kabhi lagta hai main na rahun…' at 20 s, the Director safeguard scenario 4/5 at 90 s, 3 C items at 60 s; one strict-schema probe took 252 s. In production (distressCheck 4 s, reply 6 s) these fail open or go silent. **Revisit if** a re-run shows p99 < 4 s on the S/S2/D safeguard items.

## grok46-not-live
**Tried (2026-10-04):** taxila-grok46 (grok-4.6) in T/TP/C/S/D/W at reasoning_effort low. **Broke:** TTFT p50 15.9 s (T) / 20.5 s (TP); distress recall within 4 s 2/16 on both sets; W2 reports 9/10 hit the 180 s timeout. **Revisit if** a non-reasoning grok-4.6 variant appears or TTFT p90 < 1.5 s.


<!-- merged from inbox/model-scout-images.json -->
## rj-mai-image-25-pro
**Tried (2026-10-04, model-scout images, n=16 images of 20 requested): MAI-Image-2.5-Pro as an image arm.** What broke: circuit #0 Switch and Bulb leaders on wires with the lever open, circuit #1 open switch with a glowing bulb, flower #1 Stamen leader on the stigma (diagrams 5/8 by eye vs MAI-2.6 6/8 and gpt-image-2 10/10); 40.9 s p50 and $0.109/image (2.8x MAI-2.6, 5.5x Flash); filter-refused 4/20 like the other MAI models; deprecates 2026-10-31.

## rj-flux2-pro-labels-and-indian-prompts
**Tried (2026-10-04, model-scout images, n=16 images of 20 requested): FLUX.2-pro for labelled diagrams and Indian scenes.** What broke: 0/10 diagrams right by eye, 14/44 labels: all four circuit leaders end on the switch, Root -> flower, misspellings Precipation / Food pohe / Separ / gibberish Shasting intestine, duplicated labels; signature scrawl on a rooftop; the Azure prompt blocklist refused 'A sunlit Indian home courtyard' (passes without 'Indian') and the two-children prompt with age and skin-tone wording (4/20 refused). Still the fastest arm (7.0 s p50) for generic text-free art with neutral wording.

## rj-grok-label-judge
**Tried (2026-10-04): grok-4-20-reasoning as the second vision judge of diagram labels (same atomic per-label rubric as taxila-brain).** What broke: 8/44 false passes against the eye, e.g. FLUX circuit #0 with Cell/Bulb/Wire leaders all ending on the switch and an unconnected cell scored 4/4 'unbroken loop'. taxila-brain had 0/44 false passes but 7 false fails. Neither replaces the human label check (rj-holistic-model-judge-gate).


<!-- merged from inbox/model-scout-synthesis.json -->
## rj-mai-image-flash-for-labels
2026-10-04, `evals/model-scout-2026-10-04/images/`: MAI-Image-2.6-Flash (southindia, Preview) for labelled diagrams. What broke: on 2 of 8 delivered diagrams labels point at each other's parts (plant Fruit/Leaf, circuit Switch/Wire); it adds unrequested text ('1.5V', titles) and lit bulbs asked to be unlit; the Azure filter refused the digestive-system diagram whenever the organs were named, and refused 4/20 requests overall. Labels 30/34 [80% Wilson 0.79, 0.94] vs gpt-image-2 44/44 [0.96, 1.00]. It remains a candidate only for text-free art, and must be compared with the flare-low default (not gpt-image-2). Generated pixels a child learns facts from stay excluded anyway (`diagram-router-no-baked-labels`). Reverse if: a 20-diagram set by eye is 20/20 with 0 refusals.


<!-- merged from inbox/model-scout-text-build.json -->
## rj-mai-thinking1-all-lanes
**Tried (2026-10-04):** MAI-Thinking-1 (Direct "MAI Models" meter, $2 / $8 per 1M, Preview) on live reply (T, TP), classify (C), distress (S, S2), child-safety probe (P) and Studio fraction_game. Both earlier workflows had skipped it because of its 2026-11-04 retirement.
**Broke:**
- It always reasons and ignores `reasoning_effort: none`, so live TTFT is 21-25 s against 0.7-0.8 s for taxila-fast.
- Classify takes 6.5 s, so the 4 s production distress cut catches 2/16.
- It refuses every `response_format`.
- It is 30-100x taxila-fast per call.
- It went over 25 words in 9/20 live replies.
- 1/20 live replies used "meri jaan" (floorViolations → romance).
- No Studio build was playable within 75 s.

Its quality is not the problem (T +0.36 vs fast, C 40/40, P 16/16). Deployed models beat it on every lane at a fraction of the latency.
**Instead:** keep the lane holders from model-router-v2 and the refresh bench. For a future MAI-Thinking-2, run `evals/model-scout-2026-10-04/text-build/bench-mai.mjs`, about $5.

## rj-node-env-loader-aws-placeholders
**Tried (2026-10-04):** signing Bedrock calls from Node with credentials loaded by the repo's usual `.env.local` loader, which does not override variables that are already set.
**Broke:** the container shell exports 14-character placeholder `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY`. They won, and every call returned 403 "The security token included in the request is invalid". The file values are also single-quoted.
**Instead:** `evals/model-scout-2026-10-04/text-build/bedrock.mjs` reads the AWS keys from `.env.local` directly and strips quotes. The Python scripts were never affected, because their loader overwrites existing variables.
**Second trap:** SigV4 for bedrock-runtime needs the canonical path double-encoded. Every model id containing ':' failed the signature check until that was fixed.


## Merged inbox entries (write-up from the entry text)
- `rj-stylised-c-arm-b-sculpt-target` (2026-10-04): Arm B lost round 1 (eye 1.5 vs 2.0, forced choice 0/4): wrapping our template onto a Hunyuan3D-2mv sculpt inherits the sculpt's REALISTIC proportions, not the concept's: long face and small chin (chin warp +10 mm, cheeks +8.5% not enough), long nose bridge, flat slack mouth, wavy crusty hairline with dark sculpt debris around the ears, decimated smooth hair with none of c-front's broad grooves, ears hidden, glassy 'dead doll' eyes (judge 4/4). Every defect came from the AI sculpt; the shape target fights the stylisation instead of supplying it. Its rig/eye/lid parts were reusable.
- `rj-stylised-c-sdf-surface-ceiling` (2026-10-04): Arm A's SDF-blend head (smooth union of rounded forms, ~60 params fitted to ref outlines) converges on identity and silhouette but tops out at ~2.2/5 on surface craft: one full polish iteration moved 2.0 -> 2.17 (section-8) / 2.25 (blind). Outlines fit within ~3 mm, but the surfaces BETWEEN fitted outlines (cheek planes, nose, lips, profile around the mouth) are not controlled: painted-stripe mouth, slab teeth, vanished nose, faceted skin with dents, helmet hair with seams. The plan's s3.4 risk was real. Evidence for rj-agent-authored-stylised-face (in-house faces again 2-2.5/5). Do not run another SDF polish loop; any 3D retry needs a subdivision quad cage.
- `rj-stylised-c-arm-a-traps` (2026-10-04): Arm A pipeline traps: (1) sphere tracing does not converge on the ellipsoid SDF, use step + bisection; (2) inset ring patches need angle-matched monotone parameters along each ring or transition rings fold; (3) Cycles needs light linking so only the catchlight reflects in the cornea, and the world must render black for glossy rays; (4) ARKit mouthClose must carry the lower-lip part of the full jawOpen move or jaw 0.3 + close 0.3 leaks ~26%; (5) a hard sign(x) in brow fields breaks the mirror at midline verts with x = -0.0.
- `rj-stylised-c-arm-b-traps` (2026-10-04): Arm B traps: (1) Hunyuan3D-2.1 single-view puts the bun on one side of the head; Hunyuan3D-2mv (front + left + right + back) placed it correctly (hmv_A_s1, front IoU 0.967, profile 0.936); (2) linear lid morphs cut through the eyeball at half weight (iris shows through the lid at half blink) unless the closed lid position is pushed outward so the linear path stays outside the ball (G-partial).


<!-- merged from inbox/india-move.json -->
## rj-centralindia-compute-home
**Tried (2026-10-04, survey): Central India as the home region for compute.** What broke: its Foundry catalogue lists 20 models and none Taxila uses. Caveat logged the same day: GlobalStandard deployments on another account are callable from any region, and the DB ended up in Central India anyway (southindia PG restricted), so CI compute would cut DB time from 22 ms to ~1-2 ms (unmeasured). Reopen if open-india-pg-southindia-restricted is not resolved.

## rj-neon-india-region
**Tried (2026-10-04): keeping Neon and moving prod to India.** What broke: Neon's region list (list_regions, 2026-10-04) has no India region; nearest is aws-ap-southeast-1 (Singapore, where the old project billowing-glitter-91836156 lived). Neon is also outside the Azure grant and cannot be private to the ACA VNet. Chennai -> Singapore per-query time was not measured.

## rj-southindia-account-chat-lanes
**Tried (2026-10-04, staging arm A and the `--profile india` preset): chat lanes on the taxila-ai-southindia Foundry account.** What broke: from Chennai taxila-fast TTFT 1227/1343 vs 878/1107 ms on the eastus2 account (n=20; ~560 ms slower after removing the RTT), and full lesson turns 2046/3083 vs 1562/2020 (n=60). GlobalStandard on an India account does not mean inference in India. The `--profile india` preset should not be the cutover config.


<!-- merged from inbox/model-refresh-images.json -->
## rj-flux2-flex
**Tried (2026-10-04, model-refresh images, 20 requests, deployed `taxila-flux2-flex` for measurement): FLUX.2-flex.** What broke: 0/10 diagrams by eye, 9/44 labels (leaders on the face for every digestive label, gibberish 'Gurjon' and 'Giakmac', misspelt 'Evapoiration', an added title 'Parts of a Flowering Plant'); 0/4 delivered illustrations (ink-outlined vector look, teal-blue mangoes, yellow background/gradient, cast shadows); 6/20 refused by the Azure blocklists (courtyard x2, children x2, rooftop BingBlockList_Prompt once and one HTTP 200 with no image) - including the rooftop prompt FLUX.2-pro accepted; $0.05/MP, 1.7x FLUX.2-pro. Delete the deployment.

## rj-flux2-pro-text-free-primary
**Tried (2026-10-04, model-refresh images, 20 requests): FLUX.2-pro as the text-free image primary (MODEL-ROUTER §1).** What broke: 2/8 delivered illustrations right by eye - 'water tank' painted on the tank, a signature scrawl, a logo on a uniform pocket, mangoes at ~45% fill with a cast shadow and countable fruit (all forbidden by the prompt), a woody sapling with no bean; courtyard refused 2/2 (DallECandidateBlockList_Prompt). Every OpenAI arm was 10/10 at $0.0066-0.053. Diagrams 0/10 again (rj-flux2-pro-labels-and-indian-prompts). Still the fastest (6.5 s p50): at most a neutral-wording overflow.

## rj-image-medium-quality
**Tried (2026-10-04, model-refresh images, 60 medium images vs 59 low): quality medium for gpt-image-2, gpt-image-2.5-flare, gpt-image-2.5-sunburst.** What broke: no correctness gain - flare-medium 8/10 diagrams (open knife-switch lever with a lit bulb in 2/2 circuits) vs flare-low 10/10; gpt-image-2 medium 9/10 vs low 8/10; sunburst 10/10 both. Cost 2.1x for 2.5 (439 vs 196 output tokens, $0.0139) and 8x for gpt-image-2 (1,756 tokens, $0.0534, 42 s p50 vs 18.5 s).

## rj-mistral-m35-image-judge
**Tried (2026-10-04): taxila-mistral-m35 (Mistral Medium 3.5) as a cross-family vision judge with atomic per-label items.** What broke: 22 false passes on 80 diagrams (all 25 eye-fails but 3), 0 false fails; it scored FLUX diagrams with scrambled leaders and misspellings 43/44 labels right, and 10/10 illustration eye-fails as passes. taxila-kimi-code is better but still 8 diagram false passes. No tested judge catches the subtle errors left in the shippable arms; the human label check stays.


<!-- merged from inbox/model-refresh-stt.json -->
## gpt-transcribe-fabricates-nonspeech
**Tried (2026-10-04, STT refresh):** gpt-transcribe 2026-07-28 (`taxila-gpt-transcribe`) as live/grading STT, with no hint and with language=hi + the vocabulary-free script prompt. **Broke:** on speech it was the most accurate batch arm (cerNorm 0.022, numbers 94/96, answers 77/78), but with the script prompt it wrote fluent, lesson-shaped child answers on 7/12 non-speech clips (digital zeros → "मैम, पानी चक्र में evaporate, condense और rain होता है।"; silence → "मैम, मैं addition में carry समझ गया हूँ।"), and without a hint 3/12 ("No.", "嗯。", "Sí."). A grader cannot tell these from a real answer. Same law as gpt4o-transcribe-fabricates-noise. **Revisit if** a new version shows 0 output on a non-speech probe of n>=30 with and without a prompt.

## mai-transcribe-15-hallucinates-silence
**Tried (2026-10-04):** MAI-Transcribe-1.5 (centralindia, Fast Transcription enhancedMode). **Broke:** Spanish news sentences on silence ("En el 2018, el gobierno de Donald Trump,") on 2/12 non-speech clips (1/12 with phraseList); request p50 1.25 s vs 0.59 s for MAI-Transcribe-2. Speech accuracy was fine (cerNorm 0.022). **Instead:** MAI-Transcribe-2 (0/12).

## gpt-realtime-whisper-no-context
**Tried (2026-10-04):** gpt-realtime-whisper 2026-05-06 (`taxila-rt-whisper`) over the realtime transcription socket. **Broke:** the session refuses both `prompt` and `keywords` ("not supported for this model"), so the D4 config cannot be applied; with no context cerNorm 0.061, numbers 80/96, 15/180 wrong-script clips (fillers as Arabic etc.); with language=hi 0.058 and English answers 3/12. Worse than D4 on every accuracy metric (item dCER +0.033, 80% CI [0.019, 0.048]). gpt-realtime-whisper-2 is in no catalogue. **Revisit if** it gains keywords support.

## mai-stream-refuses-context
**Tried (2026-10-04):** lesson-vocabulary biasing for MAI-Transcribe-2: `keywords` and `prompt` on the MAI-2-Streaming realtime socket, `phraseList.phrases` (22 terms incl. 6 decoys) on MAI-2 batch. **Broke:** the streaming socket rejects both fields (invalid_request_error); the batch phrase list made it slightly worse (cerNorm 0.022 vs 0.017, keyRecall 0.918 vs 0.936; 0 decoys either way). MAI's accuracy comes without context; only `language=hi` is accepted on streaming, and it is worse (cerNorm 0.027 vs 0.021, werRaw 0.164 vs 0.114).


<!-- merged from inbox/model-refresh-orchestration.json -->
## model-full-orchestrator
Tried 2026-10-04: six models (gpt-6-sol, gpt-6.1-sol, gpt-6-luna, gpt-5.6-luna, grok-4-20-non-reasoning, DeepSeek-V4.1-Flash) as the decision layer with full state and all rules. What broke: grok and ds41 broke hard rules in 15/72 runs each, including a game built with core consent missing (ds41 x2), practice past the parent's daily limit (x3 each), release of a child after distress without the I-7 check-in (ds41 x1), live builds with no budget/first session/money cap; the gpt-6 family's 0/72 still only bounds breaks below ~2% per decision at 80%; accuracy equal to code within noise; +1.4-1.7 s p50 per decision; answers changed across reps on 1-13 of 24 scenarios. Hybrid removed all breaks but bought no accuracy.


<!-- merged from inbox/model-refresh-synthesis.json -->
## rj-mistral-m35-classify-fallback
**Tried (2026-10-04):** taxila-mistral-m35 as the classifier fallback (proposed by the text-lane refresh on its 40/40 real-classify() score). **What broke:** the classifier's model also reads distress, and mistral missed "I don't want to wake up tomorrow" 2/2 in S2 (14/16), a phrase scanSafety() does not catch either; the production classifier grok-4-1-fast-nr and taxila-fast caught 16/16. Its exact-label lead (40/40 vs 37-38/40) is within overlapping intervals. Evidence: text-lanes-refresh-2026-10-04, classify-h2h-2026-10-04.


## Merged inbox entries (write-up from the entry text)
- `rj-sarvam-self-host-not-our-weights` (2026-10-04): Tried (desk, 2026-10-04): Sarvam as a self-hosted STT under the 'own GPU, commercial-OK weights' rule. Broke: Saaras v4 weights are not public (API only); Saaras v3 self-hosting is an encrypted SageMaker Marketplace model package at a $5,000/month contract plus instance cost, with no fine-tuning. Reference-only. Revisit if Sarvam publishes ASR weights under a commercial licence.
- `rj-shunya-pingala-licence` (2026-10-04): Tried (desk, 2026-10-04): shunyalabs/pingala-v1-universal. Broke: its RAIL-M licence forbids derivatives and redistribution and requires a paid commercial licence (free tier up to 10k h/month); Vaani Hindi WER 22.1. The open shunyalabs/zero-stt-hinglish (OpenRAIL, Whisper-medium) stays a bench candidate.

## rj-azure-lane-option-for-quota
**Rejected (2026-10-04, W2 seam commit):** tagging model calls hot/background through `server/azure.js`'s `lane` option, as
BUILD-PLAN §4 words it. `post()` already destructures `lane` (default `"CHAT"`) and calls `endpoint(lane)`; `chat()` passes its
options straight through, so `chat(dep, msgs, { lane: "hot" })` would resolve the endpoint for a lane named "hot". Checked:
`endpoint("hot")` throws `AzureError: unknown model lane hot`, i.e. every tagged call would fail before reaching Azure. The
quota tag is `quotaLane` instead (`w2-quota-lane-option-quotaLane`).


## Merged inbox entries (write-up from the entry text)
- `rj-realtime-judge-hinglish-delivery` (2026-10-04): Tried gpt-realtime-2.1 and gpt-realtime-2.1-mini as audio judges of talking/warmth/accent on 240 Hinglish TTS clips. Broke: inter-model Spearman 0.15-0.18 (accent -0.04); 0/15 clips with >2 s silence flagged odd_pause; got round-1 realtime-marin expressive-vs-plain direction wrong 1-4. Scores compress to 2-4 for every arm including MAI's 15 s silences. Revisit only with a judge calibrated on human labels from the round-2 page.
- `rj-phi4mm-hindi-judge` (2026-10-04): Tried Phi-4-multimodal-instruct (Azure GlobalStandard, southindia) as a second-family audio judge. Broke: its speech input has no Hindi; the probe line came back as garbled mixed-script text, and full-length 16 kHz WAV requests hit token-rate 429 at 50k TPM. The deployment was deleted. Voxtral on Bedrock: 0 tokens/day quota on this account in us-east-1, us-west-2 and ap-south-1. gpt-live-1 refuses the realtime text-out socket (400). No second judge family exists on our platforms today.
- `rj-azure-short-audio-as-number-check` (2026-10-04): Azure Speech short-audio hi-IN (used by the v3 renders asr-check) stops at the first long pause, so it under-reported numbers (e.g. बासठ 'missing' on 11/20 Veena takes, which gpt-transcribe + chained STT heard on 216/216). Its word timestamps also misplace the last word. Fast Transcription in centralindia returned all-zero word offsets. Use gpt-transcribe plus chained short-audio, or forced alignment, for number checks.


## Merged inbox entries (write-up from the entry text)
- `rj-open-tts-licence-barred-2026-10` (2026-10-04): Open TTS checked in the v3 scan and barred for the product by licence: Voxtral-4B-TTS (CC BY-NC 4.0), Higgs Audio v3 (non-commercial), OmniVoice (CC BY-NC weights, Apache code), Fish S2 Pro (research licence); Maya 2 is API-only. Barred for no Hindi: CosyVoice 3, IndexTTS-2, Qwen3-TTS, Sesame CSM, Kyutai, Spark-TTS, Dia2, Maya1, Chatterbox Turbo/Flash, Kokoro. Reference only. Revisit when a licence changes (record licence + revision hash).
- `rj-loudnorm-dynamic-for-stimuli` (2026-10-04): Tried ffmpeg loudnorm (two-pass, linear=true with measured values) to bring blind-test clips to -26 LUFS. Broke: outputs measured -27.5 to -25.8 LUFS by ebur128 (1.7 LU spread, n=40), because loudnorm's internal meter and ebur128 disagree and loudnorm can fall back to dynamic mode, which compresses the delivery the raters are judging. Use one static volume gain per clip computed from the same ebur128 meter that checks the output: -26.4 to -26.5 LUFS (n=40, 2026-10-04).

## rj-w2a-test-window-table
**Tried:** a `child_test_window` table with a `child_id` column.
**Broke:** `tests/learner-db` failed "every child_id table is classified", and so did the M0 ratchet test. The
classifier is in `server/learner/mode.js`, which belongs to W2-I.
**Replaced by:** a `child_controls.test_window` jsonb column (2026-10-04).

## rj-w2a-await-reset-mail
**Tried:** awaiting the ACS send inside `POST /api/auth/forgot`.
**Broke:** the answer took about 2 s longer only when the account existed. That timing tells an attacker which emails
have accounts. The send is now fire-and-forget (2026-10-04).

## rj-w2a-acs-conn-unquoted
**Tried:** an unquoted ACS connection string in `.env.local`.
**Broke:** `set -a; . ./.env.local` split the value at `;` and lost the access key, so `sendAcsEmail` threw. The value is
now quoted (2026-10-04).
