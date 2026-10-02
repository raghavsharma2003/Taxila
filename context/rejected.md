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
