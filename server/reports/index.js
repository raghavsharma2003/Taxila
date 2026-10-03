// The parent report generator (PARENT-REPORT.md §10.1): snapshot → candidates → gate → Lane A render (en / hinglish
// / hi) → Lane B spoken order on taxila-brain → gate again → store. Daily notes are pull-only (X11); weekly is the
// letter body (the Notifier that sends it is M1). Integration surface:
//   generateReport(childId, { cadence, period }, deps)   the whole pipeline (the Conductor jobs call it)
//   previewReport(childId, { cadence, period }, deps)    Lane A only, never stored, no model call (the "so far" view)
import { skillById, misconceptionById } from "../content/index.js";
import { CALIBRATION, LANGS, LANG_OF_PREF, RENDER_VERSION } from "./config.js";
import { buildClaims } from "./claims.js";
import { factsDigest, loadFacts } from "./facts.js";
import { gateReport } from "./gate.js";
import { renderLang } from "./render.js";
import { assemble, laneAOrder, orderForVoice, validateOrder } from "./writer.js";
import { findReport, saveReport } from "./store.js";

export { ReportGateError } from "./gate.js";
export { findReport, listReports, reportById } from "./store.js";
export { windowOf } from "./facts.js";

export const kitLookup = {
  skillTitle: async (id) => (await skillById(id))?.title ?? null,
  belief: async (id) => (await misconceptionById(id))?.belief ?? null,
};

/** Facts → the gated report body (pure apart from the injected writer). */
async function compose(facts, { k7, writer, now, preview = false }) {
  const built = buildClaims(facts, { k7, now, preview });
  if (!built) return null;
  const cadence = facts.window.cadence;
  const renders = Object.fromEntries(LANGS.map((lang) => [lang, renderLang({ cadence, ...built }, facts.child, lang)]));
  const lang = LANG_OF_PREF[facts.child.languagePref] ?? "en";
  // Lane A is gated BEFORE the writer is paid: a deterministic gate failure never costs a model call (jobs.js makes it final)
  gateReport({ cadence, claims: built.claims, renders }, { k7, firstName: facts.child.firstName });
  // Lane B orders once, in the child's report language; the same id order is re-validated for every language
  // (word counts differ by language) and a language it does not fit gets the Lane A order.
  const ordered = writer ? await writer(renders[lang].lines, lang, cadence) : { ...laneAOrder(renders[lang].lines, lang, cadence), lane: "A", model: null, attempts: [], spentMicroUsd: 0 };
  const voiceLane = {};
  for (const L of LANGS) {
    const R = renders[L];
    let order = ordered.order;
    if (validateOrder(order, R.lines, L, cadence)) { order = laneAOrder(R.lines, L, cadence).order; voiceLane[L] = "A"; } else voiceLane[L] = ordered.lane;
    R.voice = { order, text: assemble(order, R.lines, L) };
  }
  const body = { cadence, claims: built.claims, renders };
  gateReport(body, { k7, firstName: facts.child.firstName });
  return { body, built, ordered, voiceLane, lang };
}

/**
 * @param {string} childId
 * @param {{ cadence: 'daily'|'weekly', period: string }} p
 * @param {{ db: { q: Function }, llm?: { chat: Function }, k7?: boolean, now?: Date, budgetMicroUsd?: number, beforeCall?: () => Promise<void>,
 *   onSpend?: (microUsd: number) => Promise<void>, lookup?: any, store?: boolean }} deps
 * @returns {Promise<{ skipped?: string, id?: string, created?: boolean, report?: any }>}
 */
export async function generateReport(childId, { cadence, period }, deps) {
  const { db, k7 = CALIBRATION.k7Passed, store = true } = deps;
  if (store) {
    const have = await findReport(db, childId, cadence, period);
    if (have) return { id: String(have.id), created: false, existing: true };
  }
  const t0 = performance.now();
  const facts = await loadFacts(db, childId, { cadence, period }, deps.lookup ?? kitLookup);
  if (!facts) return { skipped: "no_child" };
  if (!facts.consent.core_tutoring) return { skipped: "consent" };
  const writer = deps.llm === null ? null : (lines, lang, cad) => orderForVoice({ lines, lang, cadence: cad },
    { llm: deps.llm, budgetMicroUsd: deps.budgetMicroUsd, beforeCall: deps.beforeCall, onSpend: deps.onSpend, deployments: deps.deployments });
  const out = await compose(facts, { k7, writer, now: (deps.now ?? new Date()).toISOString() });
  if (!out) return { skipped: "no_activity" };
  const report = {
    childId, cadence, period, window: facts.window, renderVersion: RENDER_VERSION, k7, claims: out.body.claims, renders: out.body.renders,
    factsDigest: factsDigest(facts),
    meta: { lang: out.lang, candidates: out.built.candidates, screened: out.built.screened, laneB: { lane: out.ordered.lane, model: out.ordered.model,
      attempts: out.ordered.attempts, reason: out.ordered.reason ?? null, dropped: out.ordered.dropped ?? [], spentMicroUsd: out.ordered.spentMicroUsd },
      voiceLane: out.voiceLane, ms: Math.round(performance.now() - t0) },
  };
  if (!store) return { report };
  const saved = await saveReport(db, report);
  return { ...saved, report };
}

/** Lane A only, never stored and never a model call: what a parent sees for today before the night job runs. */
export async function previewReport(childId, { cadence, period }, { db, k7 = CALIBRATION.k7Passed, lookup, now = new Date() } = {}) {
  const facts = await loadFacts(db, childId, { cadence, period }, lookup ?? kitLookup);
  if (!facts) return { skipped: "no_child" };
  if (!facts.consent.core_tutoring) return { skipped: "consent" };
  const out = await compose(facts, { k7, writer: null, now: now.toISOString(), preview: true });
  if (!out) return { skipped: "no_activity" };
  return { report: { childId, cadence, period, window: facts.window, renderVersion: RENDER_VERSION, k7, claims: out.body.claims, renders: out.body.renders,
    meta: { preview: true, lang: out.lang, screened: out.built.screened } } };
}
