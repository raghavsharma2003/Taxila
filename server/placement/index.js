// Adaptive placement (RS-6 / CONTENT-LEVEL F2). Library surface for the onboarding round, the Director and the parent
// summary. Wiring (route, migration, onboarding screen, initialBase call) is in docs/design/reset/prework/rs6/patches/.
export { startPlacement, answerPlacement, publicItem, isIdk } from "./session.js";
export { nextItem, shouldStop, result, posterior, ownEvidence, itemParams, pCorrect, information, priorFor, schoolYearFraction, startChapter, LIMITS } from "./cat.js";
export { loadBank, poolFor, strandFor, usable } from "./bank.js";
export { gradePlacement, parseNumber } from "./grade.js";
