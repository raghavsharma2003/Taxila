// The test-load budget (COMPREHENSION-ENGINE.md §3.4): "never feels like a test". Every child turn has a test
// weight; a per-10-turn window and a per-session cap bound the sum by band. Pure session reducer: the Director
// (or the simulator) calls recordTurn() once per child turn and reads the caps before any optional probe.
import { BAND_BUDGET, PLAIN_ITEM_WEIGHT, TEST_LEXICON } from "./params.js";

/**
 * @param {{ sessionId: string, band?: 'B1'|'B2'|'B3'|'B4', lessonSeed?: string|number, surface?: { visual?: boolean },
 *   yesterday?: Record<string, string[]>, targets?: string[] }} o
 */
export function newProbeSession({ sessionId, band = "B3", lessonSeed = sessionId, surface = { visual: true }, yesterday = {}, targets = [] }) {
  return {
    sessionId, band, seed: String(lessonSeed), surface, yesterday, targets: [...targets],
    childTurns: 0, weights: [], lastTurnWasProbe: false, sinceProbe: 99, opp: 0,
    shapeUses: {}, perSkill: {}, pending: [], engagement: "ok", safetyFired: false, probes: 0, mandatoryProbes: 0,
    charYes: { t: [0, 0], f: [0, 0] },   // E9: [agreed, n] on a character's TRUE (t) and planted FALSE (f) statements
  };
}
export const skillSess = (s, k) => s.perSkill[k] ?? { uFamilies: [], uShapes: [], t: 0, longForm: false, lowDone: { U: false, T: false },
  lastFamily: null, classCounts: {}, firstCorrectHandled: false, practised: false, reteached: false };

/**
 * One child turn. kind: 'item' (a plain known-answer question, weight 1.0 unless a covert skin says otherwise),
 * 'probe', 'teach' | 'chat' | 'play' (weight 0).
 * @param {any} s @param {{ kind: string, weight?: number, shapeId?: string, skillId?: string, facet?: string, family?: string, cls?: string, longForm?: boolean }} t
 */
export function recordTurn(s, t) {
  const w = t.weight ?? (t.kind === "item" ? PLAIN_ITEM_WEIGHT : 0);
  const n = { ...s, childTurns: s.childTurns + 1, weights: [...s.weights, w], lastTurnWasProbe: t.kind === "probe",
    sinceProbe: t.kind === "probe" ? 0 : s.sinceProbe + 1, opp: s.opp + (t.kind === "item" || t.kind === "probe" ? 1 : 0) };
  if (t.skillId) {
    const ps = { ...skillSess(s, t.skillId) };
    if (t.kind === "item") ps.practised = true;
    if (t.kind === "probe") {
      if (t.facet === "U") { ps.uFamilies = [...ps.uFamilies, t.family]; ps.uShapes = [...ps.uShapes, t.shapeId]; }
      if (t.facet === "T") ps.t += 1;
      if (t.longForm) ps.longForm = true;
      ps.lastFamily = t.family ?? ps.lastFamily;
      if (t.cls) ps.classCounts = { ...ps.classCounts, [t.cls]: (ps.classCounts[t.cls] ?? 0) + 1 };
    }
    if (t.kind === "teach" && t.reteach) ps.reteached = true;
    n.perSkill = { ...s.perSkill, [t.skillId]: ps };
  }
  if (t.shapeId) n.shapeUses = { ...s.shapeUses, [t.shapeId]: (s.shapeUses[t.shapeId] ?? 0) + 1 };
  if (t.kind === "probe") { n.probes = s.probes + 1; if (t.mandatory) n.mandatoryProbes = s.mandatoryProbes + 1; }
  if (t.charStatement) {
    const cy = s.charYes ?? { t: [0, 0], f: [0, 0] }, side = t.charStatement.planted ? "f" : "t";
    n.charYes = { ...cy, [side]: [cy[side][0] + (t.charStatement.agreed ? 1 : 0), cy[side][1] + 1] };
  }
  return n;
}

/** E9 minimum observations [U]: one true and two planted character statements this session. */
export const DEFERENCE_MIN = Object.freeze({ t: 1, f: 2, rate: 0.8 });
/**
 * E9 deference discount (COMPREHENSION-ENGINE.md §1.2): the session's yes-rate on a character's true AND planted-false
 * statements both > 0.8. Derived in code from held choice data only (never voice, timing or vibe); the caller stamps
 * the result on the NEXT puppet-shape event as `deferenceDiscount`, so the fold stays replay-safe.
 */
export function deferenceDiscountOn(s) {
  const cy = s.charYes;
  if (!cy || cy.t[1] < DEFERENCE_MIN.t || cy.f[1] < DEFERENCE_MIN.f) return false;
  return cy.t[0] / cy.t[1] > DEFERENCE_MIN.rate && cy.f[0] / cy.f[1] > DEFERENCE_MIN.rate;
}

export const windowWeight = (s, n = 10) => s.weights.slice(-n).reduce((a, b) => a + b, 0);
export const sessionWeight = (s) => s.weights.reduce((a, b) => a + b, 0);
export const capsFor = (band) => BAND_BUDGET[band] ?? BAND_BUDGET.B3;
/** Would a turn of weight w stay inside both caps? */
export function fits(s, w) {
  const c = capsFor(s.band);
  return windowWeight(s, 9) + w <= c.window10 + 1e-9 && sessionWeight(s) + w <= c.session + 1e-9;
}
/** Test load per 10 child turns over the whole session (CE-M5). */
export const loadPer10 = (s) => (s.childTurns ? (10 * sessionWeight(s)) / s.childTurns : 0);

const LEX_RE = new RegExp(`(^|[^\\p{L}])(${TEST_LEXICON.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})(?=$|[^\\p{L}])`, "iu");
/** CEI7: a teacher probe line or parent row containing test/evaluation lexicon. Returns the matched word or null. */
export const lexiconHit = (text) => { const m = LEX_RE.exec(String(text ?? "")); return m ? m[2].toLowerCase() : null; };
