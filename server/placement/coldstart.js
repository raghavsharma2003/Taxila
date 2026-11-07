// Cold-start placement (round 7 F, main 2026-11-07 item (c)): a new child's starting point per subject from onboarding
// answers alone, with no quiz. The answers are the parent's view ("how does maths feel for her?") and the child's own
// quick pick ("maths feels easy / okay / tricky"), plus the school's chapter and the class. They become ONE wide Gaussian
// site on the KT ability scale (GE, kt/ability.js), the same shape a placement round's own evidence has. So everything
// downstream already reads it: topic choice (next-topic.js startGE), the conductor's foundation share (R9, placementGap)
// and the θ prior (kt/placement.js; a site's sd is floored at 1.0 there, so answers never weigh like evidence).
// Refinement is covert: once lessons have put enough first-try evidence on the strand (kt_ability.n_obs), the live θ
// posterior replaces the onboarding estimate (refinedStart). Never a test-like round.
//
// PURE throughout. The site offsets and widths are [U] values tuned by evals/placement-coldstart/sim.mjs (the sim reports
// lessons-to-settle with and without the answers, over children with known true levels; context/measurements.md).
import { classPriorComponents } from "../learner/kt/ability.js";
import { schoolYearFraction } from "./cat.js";

/** The parent's view of a subject (onboarding) and the child's own pick (Hello). */
export const PARENT_VIEWS = Object.freeze(["hard", "fine", "easy", "unsure"]);
export const CHILD_PICKS = Object.freeze(["tricky", "okay", "easy"]);

/**
 * Each answer as a site on GE relative to the class's expected level today: [offset, sd]. A parent who says "hard" is
 * evidence the child sits about a class below; the child's own pick is weaker (sd wider), and weaker still for classes
 * 1-2 (CHILD_YOUNG_SD_X). "unsure" is no site. [U] (sim-tuned).
 */
export const PARENT_SITE = Object.freeze({ hard: [-1.2, 1.3], fine: [0, 1.5], easy: [0.5, 1.5] });
export const CHILD_SITE = Object.freeze({ tricky: [-0.8, 1.8], okay: [0, 2.0], easy: [0.4, 2.0] });
export const CHILD_YOUNG_SD_X = 1.5;

/** The ledger floors a placement site's sd at 1.0 (kt/placement.js PLACEMENT_SITE_SD_MIN); the estimate does the same. */
export const SITE_SD_MIN = 1.0;
/** The start sits Z_START posterior sds below the posterior mean (success-first: begin a little under the estimate). [U] */
export const Z_START = 0.25;
/** The live θ replaces the onboarding estimate once the strand's posterior sd is this small. [U] (sim-tuned) Not an
 *  observation count: kt_ability.n_obs is the CURRENT epoch's count (openEpoch folds earlier sessions into the base),
 *  while the sd carries every session's evidence. The prior alone never gets here (class prior ⊗ a site floored at 1.0
 *  has sd > 0.8). */
export const SETTLE_SD = 0.7;
/** A first-week plan's length in lessons per subject, and how many of them stay success-first. */
export const FIRST_WEEK_LESSONS = 5, WARM_LESSONS = 2;

const r2 = (x) => Math.round(x * 100) / 100;
const strandOf = (subject) => `${subject}:core`;

/** PURE. Product of Gaussian sites [{mu, sd}] → {mu, sd} or null when there is none. */
export function productOf(sites) {
  const ok = sites.filter((s) => s && Number.isFinite(s.mu) && s.sd > 0);
  if (!ok.length) return null;
  const P = ok.reduce((a, s) => a + 1 / s.sd ** 2, 0);
  const h = ok.reduce((a, s) => a + s.mu / s.sd ** 2, 0);
  return { mu: h / P, sd: Math.sqrt(1 / P) };
}

/**
 * PURE. The onboarding answers for one subject → the site they make, and the ids of what was used (the parent note's
 * "what we used" list, in order). expected = the class's expected GE today (C − 1 + school-year fraction).
 * @param {{ classLevel: number, parentView?: string, childPick?: string, date?: Date|string }} a
 * @returns {{ site: { mu: number, sd: number } | null, used: ("parent_view"|"child_pick"|"class")[], expected: number }}
 */
export function siteOf({ classLevel: C, parentView, childPick, date = new Date() }) {
  const expected = C - 1 + schoolYearFraction(new Date(date));
  const sites = [], used = [];
  const p = PARENT_SITE[parentView];
  if (p) { sites.push({ mu: expected + p[0], sd: p[1] }); used.push("parent_view"); }
  const c = CHILD_SITE[childPick];
  if (c) { sites.push({ mu: expected + c[0], sd: c[1] * (C <= 2 ? CHILD_YOUNG_SD_X : 1) }); used.push("child_pick"); }
  const site = productOf(sites);
  used.push("class");
  return { site: site ? { mu: r2(site.mu), sd: r2(Math.max(SITE_SD_MIN, site.sd)) } : null, used, expected: r2(expected) };
}

/**
 * PURE. Posterior on θ from the class MIXTURE prior (classPriorComponents: an on-track and a far-below component, each
 * N(m, sd0)) and the site: each component's Gaussian posterior, reweighted by how well it predicts the site, then
 * moment-matched. (The prior's single Normal fit would drag a "fine" answer a class low; the mixture lets the answer pick
 * its component.) The start GE sits Z_START sds under the posterior mean, never above the class's expected level (an
 * onboarding answer alone never starts a child ahead of her class book; lesson evidence can, through refinedStart),
 * never below GE 0.
 */
export function posteriorStart(subject, classLevel, site, expected, { zStart = Z_START } = {}) {
  const { sd0, comps } = classPriorComponents(strandOf(subject), classLevel);
  const parts = comps.map(([w, m]) => {
    const p = productOf([{ mu: m, sd: sd0 }, site]);
    const v = sd0 ** 2 + site.sd ** 2;
    return { w: w * Math.exp(-0.5 * (site.mu - m) ** 2 / v) / Math.sqrt(v), mu: p.mu, v: p.sd ** 2 };
  });
  const Z = parts.reduce((a, p) => a + p.w, 0);
  const mu = parts.reduce((a, p) => a + p.w * p.mu, 0) / Z;
  const v = parts.reduce((a, p) => a + p.w * (p.v + (p.mu - mu) ** 2), 0) / Z;
  const sd = Math.sqrt(v);
  const startGE = Math.max(0, Math.min(expected, mu - zStart * sd));
  return { mu: r2(mu), sd: r2(sd), startGE: r2(startGE) };
}

/**
 * PURE. The cold-start result for one subject, in the placement table's result shape (store.js summaryOf, startGEOf and
 * placementGapOf read it; kt/placement.js placementEvents writes its `placement` site). null when the answers carry no
 * site (only the class is known): topic choice then keeps today's rule (school chapter, then the calendar).
 * @param {{ subject: string, classLevel: number, parentView?: string, childPick?: string, date?: Date|string }} a
 */
export function coldStartResult({ subject, classLevel, parentView, childPick, date = new Date() }, tune = {}) {
  const { site, used, expected } = siteOf({ classLevel, parentView, childPick, date });
  if (!site) return null;
  const post = posteriorStart(subject, classLevel, site, expected, tune);
  return {
    source: "onboarding", at: new Date(date).toISOString(), strand: strandOf(subject), classLevel, n: 0, expected,
    mean: post.mu, sd: post.sd, startGE: post.startGE, startRule: "coldstart",
    answers: { ...(PARENT_SITE[parentView] ? { parentView } : {}), ...(CHILD_SITE[childPick] ? { childPick } : {}) }, used,
    placement: { [strandOf(subject)]: site },
  };
}

/**
 * PURE. Covert refinement: the start GE topic choice should use now. When the strand's live θ (kt_ability) has settled
 * (sd ≤ SETTLE_SD) it decides, and may sit above the class's expected level; before that
 * the placement result's startGE stands. The θ posterior already contains the onboarding site and every first-try
 * answer since, so this never re-counts the answers.
 * @param {{ startGE?: number } | null | undefined} result @param {{ mu: number, sd: number } | null | undefined} theta
 * @returns {{ startGE: number, from: "theta"|"placement" } | null}
 */
export function refinedStart(result, theta, { zStart = Z_START, settleSd = SETTLE_SD } = {}) {
  if (settled(theta, { settleSd }))
    return { startGE: r2(Math.max(0, Number(theta.mu) - zStart * Number(theta.sd))), from: "theta" };
  if (Number.isFinite(Number(result?.startGE))) return { startGE: Number(result.startGE), from: "placement" };
  return null;
}

/** PURE. Has a subject's estimate settled (the conductor's first-week rule ends when it has)? */
export function settled(theta, { settleSd = SETTLE_SD } = {}) {
  return !!theta && Number.isFinite(Number(theta.mu)) && Number(theta.sd) > 0 && Number(theta.sd) <= settleSd;
}

/**
 * PURE. The conductor's first-week view (R15): for each subject whose placement came from onboarding, the live lessons
 * taught in it so far (from lesson topic ids, "c<k>-<subject>-…") and whether its θ has settled. A subject settled AND
 * past the first week is left out (nothing left for R15 to do).
 * @param {Record<string, any>} results placement results by subject @param {Record<string, any>} thetas abilityOf
 * @param {string[]} lessonTopicIds
 * @returns {Record<string, { lessons: number, settled: boolean }>}
 */
export function firstWeekView(results, thetas, lessonTopicIds = []) {
  const count = {};
  for (const id of lessonTopicIds) { const m = /^c\d+-([a-z]+)-/.exec(String(id)); if (m) count[m[1]] = (count[m[1]] ?? 0) + 1; }
  const out = {};
  for (const [s, r] of Object.entries(results ?? {}).sort(([a], [b]) => (a < b ? -1 : 1))) {
    if (r?.source !== "onboarding") continue;
    const lessons = count[s] ?? 0, isSettled = settled(thetas?.[s]);
    if (isSettled && lessons >= FIRST_WEEK_LESSONS) continue;
    out[s] = { lessons, settled: isSettled };
  }
  return out;
}

/**
 * PURE. R15 for a slot's subject: { successFirst, newSkillBudget } while the subject is in its first week, else null.
 * The first WARM_LESSONS lessons are success-first with no new skill; after that, success-first holds until θ settles
 * (newSkillBudget left to the planner's own rule).
 */
export function firstWeekRule(entry) {
  if (!entry || !Number.isFinite(Number(entry.lessons))) return null;
  if (entry.lessons < WARM_LESSONS) return { successFirst: true, newSkillBudget: 0 };
  if (!entry.settled) return { successFirst: true };
  return null;
}
