// STAGECRAFT: the speculative content conductor (docs/design/stagecraft/STAGECRAFT.md). Public surface.
export { VERSION, DEFAULT_CONFIG, RUNG_TIER, RUNG_RANK, BUILD_MS, SPEC_USABLE, COST_USD, INVALIDATION_RULES } from "./config.js";
export { step, stagecraft, initPortfolio, config, preferredRung, isFresh, DEFAULT_INSTANT } from "./conductor.js";
export { buildCatalog, admissible, liveArchetypes } from "./catalog.js";
export { wantAt } from "./policy.js";
export { familyKey, parseFamily, requestFromText, fromPlan, fromCandidateIntents, fromBuildIntent, fromRequest, fromSignal, fromBoard } from "./sources.js";
export { scoreCandidate, pReadyBy, sampleBuild, buildDist } from "./score.js";
export { pickDeployment, onQuota } from "./quota.js";
export { foldLesson, foldArm } from "./telemetry.js";
export { StagecraftHost } from "./host.js";
export * as adapters from "./adapters.js";
