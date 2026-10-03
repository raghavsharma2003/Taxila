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
