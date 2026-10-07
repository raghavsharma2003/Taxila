// Comprehension engine launch parameters (COMPREHENSION-ENGINE.md §2.3, §2.4, §3.4). Every number is [U]: a
// launch prior set so that false `understood` stays ≤ 2.2% in the matched-model check. They are re-tuned only
// under both STUDENT-SIM truth families and recalibrated on pilot delayed items (CE-M6), never fitted to
// simulator output (SIM6).

export const COMP_PARAMS_VERSION = "comp-r2-2026-10-07";

/** Facet priors and the per-(skill, facet, session) log-evidence cap (±log 20; K keeps ±log 50). */
export const FACET = Object.freeze({ U0: 0.2, T0: 0.2, CAP: Math.log(20), TAU: 0.10, TEACH_CAP: 0.10 });

/** Evidence classes that inform each new facet (§2.2). Every class still informs K through the ledger. */
export const U_CLASSES = Object.freeze(new Set(["probe.why", "probe.teachback", "probe.errorspot", "probe.predict"]));
export const T_CLASSES = Object.freeze(new Set(["probe.transfer.near", "probe.transfer.far"]));
export const facetsOfClass = (cls) => (U_CLASSES.has(cls) ? ["U"] : T_CLASSES.has(cls) ? ["T"] : []);

/** Source weights w_src (§2.3). module = Forge host-graded answer until the 50-session agreement gate. */
export const W_SRC = Object.freeze({ dialogue: 1, callback: 1, weave: 1, late: 1, game: 0.5, module: 0.75 });

/** State-ladder thresholds (§2.4). */
export const TH = Object.freeze({
  K_DO: 0.6, U_FRAGILE: 0.6, U_UNDERSTOOD: 0.75, T_UNDERSTOOD: 0.6,
  M_CONFIRMED: 0.85, M_CHECKING: 0.7, M_CLEAR: 0.3,
  /** Scheduler stop rule: a facet reading high stops being probed; reading low keeps one probe a session. */
  U_STOP: 0.75, T_STOP: 0.7, LOW: 0.1,
  DURABLE_DELAY_DAYS: 7,
});

export const STATES = Object.freeze(["not_yet", "shallow", "fragile", "understood", "durable"]);
export const stateRank = (s) => STATES.indexOf(s);

/** Test-load budget per band (§3.4): session minutes, child turns, session cap, per-10-turn window cap. */
export const BAND_BUDGET = Object.freeze({
  B1: { minutes: 15, childTurns: 30, session: 6.0, window10: 1.5, maxUPerConcept: 1, maxTPerConcept: 1, openers: 2 },
  B2: { minutes: 20, childTurns: 40, session: 8.0, window10: 2.0, maxUPerConcept: 2, maxTPerConcept: 1, openers: 3 },
  B3: { minutes: 25, childTurns: 50, session: 12.5, window10: 2.5, maxUPerConcept: 2, maxTPerConcept: 2, openers: 4 },
  B4: { minutes: 30, childTurns: 60, session: 15.0, window10: 2.5, maxUPerConcept: 2, maxTPerConcept: 2, openers: 4 },
});
export const bandOf = (classLevel) => (classLevel <= 2 ? "B1" : classLevel <= 4 ? "B2" : classLevel <= 7 ? "B3" : "B4");

/** Test weight by a shape's testRisk (§3.4); a learning move that is also evidence costs × 0.5 on top. */
export const RISK_WEIGHT = Object.freeze({ high: 1.0, med: 1.0, low: 0.5, veryLow: 0.25 });
export const PLAIN_ITEM_WEIGHT = 1.0;

/** Words that may never appear in a teacher probe or a parent row (CEI7; EN + Roman HI + Devanagari). */
export const TEST_LEXICON = Object.freeze([
  "samjha", "samjhi", "samjhe", "did you understand", "do you understand", "quiz", "test", "exam", "check you",
  "marks", "score", "grade you", "pariksha", "परीक्षा", "टेस्ट", "समझा", "samajh aaya",
]);
