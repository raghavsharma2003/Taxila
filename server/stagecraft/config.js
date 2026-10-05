// STAGECRAFT constants (docs/design/stagecraft/STAGECRAFT.md §2-§4; types shared/stagecraft.ts). Plain data, no I/O.
// Every number is tagged: [M] measured in this repo (cited), [E] a starting estimate that evals/stagecraft sweeps.
// Nothing here is sentence-shaped text a model could recite: ids, numbers and closed vocabularies only.

export const VERSION = "stagecraft/2026-10-05";

/** Rung → scheduler tier (shared/stagecraft.ts RUNG_TIER, repeated here so plain JS never imports a .ts file). */
export const RUNG_TIER = Object.freeze({
  steer: "instant", library: "instant", engine_default: "instant", board: "instant",
  generated_spec: "spec", image: "image", live_codegen: "live",
});
export const TIERS = Object.freeze(["instant", "spec", "image", "live"]);

/**
 * How good a rung is when it serves a want (§4.2 step 7: a passed live build, then a personalised spec, then a library
 * variant, then the engine default; an image only where the want is a picture; the board always last but always there).
 */
export const RUNG_RANK = Object.freeze({ board: 0, image: 1, engine_default: 2, library: 3, generated_spec: 4, live_codegen: 5 });
export const STRENGTH_RANK = Object.freeze({ weak: 0, stable: 1, planned: 2, explicit: 3 });

/**
 * Build-time distributions per rung, as lognormal p50/p90 in ms.
 *   generated_spec  [M] RS-4 spec bench, n = 30 per archetype, taxila-fast-bg, JSON mode, effort low
 *                   (docs/design/reset/prework/rs4/spec-bench.json, 2026-10-05); p90 ≈ the bench's p95 (conservative)
 *   image           [M] flare-low 15.1 s p50 (MODEL-ROUTER §0); p90 30 s [E]
 *   live_codegen    [M] router bench, n = 30 per archetype, race path (context/inbox/w2-f-router-bench.json, 2026-10-04)
 *   library         [T] LIVE-STUDIO §7: a library mount ≤ 1 s
 * E-ST4 (evals/stagecraft/real-arm.mjs) re-measures spec and image and the simulator reads its calibration file when present.
 */
export const BUILD_MS = Object.freeze({
  library: { p50: 350, p90: 1000 },
  generated_spec: {
    _default: { p50: 4700, p90: 6900 },
    "catch-on-line@1": { p50: 4765, p90: 6089 }, "circuit-bench@1": { p50: 5423, p90: 7513 }, "orbital-explainer@1": { p50: 6968, p90: 9647 },
    "slice-at@1": { p50: 3971, p90: 5541 }, "line-runner@1": { p50: 4732, p90: 6243 }, "area-claim@1": { p50: 4218, p90: 5389 },
    "vault-heist@1": { p50: 3677, p90: 4880 }, "angle-cannon@1": { p50: 4256, p90: 5769 }, "food-web@1": { p50: 3602, p90: 4768 },
    "phase-shift@1": { p50: 5246, p90: 6815 }, "balance-beam@1": { p50: 6811, p90: 9097 }, "shadow-play@1": { p50: 3425, p90: 4480 },
    "water-cycle@1": { p50: 5745, p90: 7874 }, "scale-cinematic@1": { p50: 6145, p90: 7757 }, "angle-sum@1": { p50: 5275, p90: 6075 },
    "data-rush@1": { p50: 3698, p90: 4802 },
  },
  image: { p50: 15100, p90: 30000 },
  live_codegen: {
    _default: { p50: 24000, p90: 42000 },
    shade_fraction: { p50: 29145, p90: 42957 }, bar_chart_read: { p50: 18711, p90: 32599 }, hub_flows: { p50: 27517, p90: 44976 },
    number_line_jump: { p50: 20305, p90: 31191 }, pictograph: { p50: 17310, p90: 28594 }, process_chain: { p50: 31836, p90: 60757 },
    sequence_steps: { p50: 15053, p90: 23270 }, slider_law: { p50: 17439, p90: 29792 }, sort_bins: { p50: 18709, p90: 34859 },
    timeline: { p50: 17556, p90: 22824 },
  },
});
/**
 * The share of generated specs that come back usable (validateSpec did not fall back to the reviewed default) [M] same
 * spec bench, n = 30 each. A fallback is a VALID piece but not a personal one, so the spec rung discards it
 * (validation_failed) and the engine default keeps serving the family.
 */
export const SPEC_USABLE = Object.freeze({
  _default: 0.92,
  "catch-on-line@1": 25 / 30, "circuit-bench@1": 26 / 30, "orbital-explainer@1": 7 / 30, "slice-at@1": 1, "line-runner@1": 20 / 30,
  "area-claim@1": 1, "vault-heist@1": 1, "angle-cannon@1": 1, "food-web@1": 1, "phase-shift@1": 1, "balance-beam@1": 27 / 30,
  "shadow-play@1": 1, "water-cycle@1": 1, "scale-cinematic@1": 1, "angle-sum@1": 1, "data-rush@1": 1,
});
/** Mean $ per build. spec [M] spec bench $0.0013 on fast-bg (gpt-6-luna is half that list price); image [M] flare low; live [M] router bench mean per passed build. */
export const COST_USD = Object.freeze({ generated_spec: 0.0013, image: 0.0066, live_codegen: 0.055, library: 0, engine_default: 0, board: 0, steer: 0 });

/** Signed learning value per need (§3.1 value column) [E]. Off-topic or seductive pieces are never nominated at all. */
export const NEED_VALUE = Object.freeze({
  contrast_misconception: 1.0, re_represent: 0.9, explain: 0.8, verify: 0.7, practice: 0.6, introduce: 0.55,
  switch_modality: 0.5, explore_question: 0.5, probe: 0.45, celebrate_mastery: 0.3,
});
/** Personalisation margin per rung [E]: the engine default is correct and on-topic but generic; a spec is this child's. */
export const RUNG_VALUE = Object.freeze({ board: 0.35, image: 0.5, engine_default: 0.6, library: 0.7, generated_spec: 1.0, live_codegen: 1.1, steer: 1.0 });

/** Kinds per need (STUDIO-V2 §7 + Study B SC-8 priors). Engine kinds: game, simulation, animation (an RS-4 explainer). */
export const KINDS_FOR_NEED = Object.freeze({
  explain: ["animation", "simulation", "game"],
  introduce: ["animation", "simulation", "image"],
  contrast_misconception: ["game", "animation", "simulation"],
  practice: ["game", "simulation"],
  probe: ["game", "simulation"],
  explore_question: ["simulation", "animation"],
  re_represent: ["animation", "simulation", "game"],
  switch_modality: ["game", "simulation", "animation"],
  verify: ["game", "simulation"],
  celebrate_mastery: ["game"],
});
/** Beat → the need a plan-led piece serves in it, and the kinds the beat admits (seam.js PLAY_BEATS / WATCH_BEATS, extended). */
export const BEAT_NEED = Object.freeze({
  hook: "introduce", explain: "explain", worked_example: "explain", contrast: "contrast_misconception",
  practice_set: "practice", explore_question: "explore_question", probe: "probe", recap: "explain", wrap: "celebrate_mastery",
});
export const BEAT_KINDS = Object.freeze({
  hook: ["animation", "simulation", "game"],
  explain: ["animation", "simulation", "diagram"],
  worked_example: ["game", "simulation", "animation"],
  contrast: ["game", "animation", "simulation"],
  practice_set: ["game", "simulation"],
  explore_question: ["simulation", "animation"],
  probe: ["game", "simulation"],
  recap: ["animation"],
  wrap: ["game"],
});
/** Beats in which nothing may be on stage (a break and a safeguard are never content moments). */
export const NO_STAGE_BEATS = Object.freeze(["break", "safeguard", "arrive"]);

/**
 * Invalidation rules (§3.1 table). `fields` are the ValidityKey fields that trigger the rule; a candidate is FRESH only if
 * its premise equals the current key on every field of every kill/demote rule that applies to it.
 */
export const INVALIDATION_RULES = Object.freeze([
  { reason: "topic_change", fields: ["topicId", "skillId", "lessonId"], effect: "kill" },
  { reason: "item_change", fields: ["itemId"], effect: "kill", itemBound: true },
  { reason: "misconception_resolved", fields: ["misconceptionState"], effect: "kill", contrastOnly: true },
  { reason: "kit_change", fields: ["kitHash"], effect: "kill" },
  { reason: "lang_change", fields: ["lang", "band"], effect: "kill" },
  { reason: "beat_exit", fields: ["beat"], effect: "kill", beatAdmissibility: true },
  { reason: "misconception_revealed", fields: ["misconceptionId"], effect: "demote", demoteFactor: 0.5 },
  { reason: "representation_change", fields: ["hintRung", "representation"], effect: "demote", demoteFactor: 0.3 },
]);
/** The fields a served candidate's premise must match at the reveal point (the freshness check of §4.2 step 6). */
export const FRESH_FIELDS = Object.freeze(["lessonId", "topicId", "skillId", "kitHash", "lang", "band"]);

/** Default scheduler configuration (§3.2) [E]; E-ST3 sweeps it. */
export const DEFAULT_CONFIG = Object.freeze({
  tiers: Object.freeze({
    instant: { concurrent: 99, perFamily: 4, perMinute: 1e9, perLessonHour: 1e9, usdPerLessonHour: 0, minStrength: "weak", minLeadMs: 0 },
    spec: { concurrent: 4, perFamily: 3, perMinute: 12, perLessonHour: 300, usdPerLessonHour: 0.06, minStrength: "weak", minLeadMs: 0, maxLeadMs: 90_000 },
    image: { concurrent: 1, perFamily: 1, perMinute: 1, perLessonHour: 12, usdPerLessonHour: 0.08, minStrength: "stable", minLeadMs: 20_000, maxLeadMs: 180_000 },
    live: { concurrent: 1, perFamily: 1, perMinute: 1e9, perLessonHour: 3, usdPerLessonHour: 0.6, minStrength: "planned", minLeadMs: 90_000, maxLeadMs: 600_000 },
  }),
  preemptRatio: 1.5,
  replyQuietMs: 1500,
  pReveal: 0.7,
  pOffer: 0.4,
  usdPerLesson: 0.6,
  // ── extensions (STAGECRAFT.md §3; the shared type lists them as optional) ──
  lambdaPerUsd: 50,
  halfLifeMs: 20_000,
  readyUnrevealedMs: 4 * 60_000,
  maxFamilies: 6,            // [E] the design said 4; at 4 the plan's next beat was evicted by live request/signal families (E-ST3 sweeps 4 vs 6)
  maxCandidates: 24,
  liveBuildsPerLesson: 3,
  /** A spec may start when P(ready by the deadline) is at least this. A late spec still serves a LATER reveal point at < $0.002. */
  minPReadySpec: 0.15,
  /** Image and live: the strict rule (deadline − now ≥ the rung's p90). */
  strictLeadTiers: ["image", "live"],
  reply429PauseMs: 60_000,
  churnFlips: 3,
  chains: Object.freeze({
    // O-1 pending: taxila-stagecraft does not exist yet. taxila-fast-bg is the reply deployment's BACKGROUND twin (own
    // quota; the spec bench's deployment). taxila-gpt6-luna carries the live whiteboard (w2f-luna-reserved-for-whiteboard),
    // so it is the second link, not the first.
    spec: ["taxila-stagecraft", "taxila-fast-bg", "taxila-gpt6-luna", "taxila-mistral-m35"],
    image: ["taxila-image25-flare", "taxila-image"],
    live: ["race"],
  }),
  /** Per-deployment buckets (requests per minute available to Stagecraft, process-wide). flare is 4 RPM subscription-wide. */
  rpm: Object.freeze({ "taxila-stagecraft": 120, "taxila-fast-bg": 120, "taxila-gpt6-luna": 60, "taxila-mistral-m35": 60, "taxila-image25-flare": 3, "taxila-image": 3, race: 6 }),
  /** Deployments that do not exist yet (owner actions): skipped by the chain until configured. */
  absent: Object.freeze(["taxila-stagecraft"]),
  /** The reply lane: never called by Stagecraft; its 429s pause spec launches. */
  replyLanes: Object.freeze(["taxila-fast"]),
  swapSpacingTurns: 2,
  firstRevealTurn: 3,
});
