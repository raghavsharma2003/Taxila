// Comprehension engine — the stable surface the Director, Conductor, compiler and parent report call
// (docs/research/comprehension/INTEGRATION.md lists the call sites). Everything here is pure except gradeClosed
// (an Azure call through server/azure.js) and the store (db).
export { newComp, newLearnerState, fuseEvidence, compDigest, stateDigest } from "./fuse.js";
export { beliefFor, beliefView, ladder, topicOf } from "./state.js";
export { nextProbe, noteOutcome, markAsked, openSession, eig, eligible, u01 } from "./schedule.js";
export { newProbeSession, recordTurn, windowWeight, sessionWeight, loadPer10, lexiconHit, fits, deferenceDiscountOn } from "./budget.js";
export { enqueue as weaveEnqueue, onTopicPlanned, markDone as weaveDone, expire as weaveExpire, planChecks, consumeExpired, wovenEvent } from "./weave.js";
export { selectReteach as reteachPlan, reteachTrigger, armsFromKit, armReward, updatePosterior, GENERIC_ARMS } from "./reteach.js";
export { SHAPES, shapeById, familyOf, lintShapes, testWeight } from "./probes/shapes.js";
export { newProtege, protegeStep, protegeReturn, teacherResolves } from "./probes/protege.js";
export { rKey, rOpt, rCatch, optOutcome, whyOutcome, teachbackOutcome, instOutcome } from "./grade/ops.js";
export { numbersIn, matchNumber } from "./grade/numbers.js";
export { spanOk } from "./grade/span.js";
export { gradeClosed, buildRequest, auditRow, GRADER_VERSION } from "./grade/closed.js";
export { conceptCard, parentLexiconHit } from "./report/howweknow.js";
export { COMP_PARAMS_VERSION, TH, FACET, BAND_BUDGET, bandOf } from "./params.js";
export { personaKnobs, personaStep, newPersonaState, vibeRow } from "../persona/adapter.js";
export { turnSignals } from "../persona/signals.js";
