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
