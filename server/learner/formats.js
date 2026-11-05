// How this child learns, the population part (round 7 F, learning-how-this-child-learns; TEACHER-BRAIN §8, gap-audit
// personalisation §4). Which format family she explains a skill in is chosen by a POPULATION allocator: Thompson sampling
// over the kit's eligible formats, per topic type × band, with a 0.2 exploration floor, so every format keeps being tried
// and the choice is logged with its propensity (decision_record, point "explain_format"). The posterior is population
// only: format_posterior has no child id, ever (016, NM-3).
//
//   eligibleFormats(kit)                         the kit's primary + secondary (F5 only for T1/T2)
//   allocateFormat(eligible, posteriors, { seed, floor })   PURE + seeded: { format, propensity, explored }
//   formatOutcome(decision, rows)                PURE: the first scored answer on the skill after the explain → 1 / 0 / null
//   posteriorsFor(topicType, band, { q })        the population rows for one topic type × band
//   joinFormatOutcomes(childId, day, { q })      the night job: this child's day of decisions → population increments
//
// What it never does: say anything about the child ("learns best by", a style). Per-child lines are counts of what Taxila
// did and what followed (teaching.js, the S5 report line), hedged until real data exists (main 2026-11-04).

/** Plain words for parents (PRODUCT-DESIGN "Format families in plain words"; F-codes never render). */
export const FORMAT_WORDS = Object.freeze({
  F1: "a short explanation with the key thing on screen",
  F2: "one solved example, then together, then on their own",
  F3: "a picture or number line first, then words",
  F4: "a story or example from what they like",
  F5: "said in a rhythm, like a chant",
  F6: "as a game, with no points",
  F7: "their turn to explain",
  F8: "trying first, then the explanation",
});
export const FORMATS = Object.freeze(Object.keys(FORMAT_WORDS));
export const FLOOR = 0.2;
export const POINT_ID = "explain_format";

/** PURE. The kit's eligible formats: primary first, then secondary; F5 (chant) only for T1 verbatim / T2 vocabulary. */
export function eligibleFormats(kit) {
  const f = kit?.formats ?? {};
  const all = [f.primary, ...(Array.isArray(f.secondary) ? f.secondary : [])].filter((x) => FORMATS.includes(x));
  return [...new Set(all)].filter((x) => x !== "F5" || ["T1", "T2"].includes(kit?.topicType));
}

// ───────────── seeded randomness (replay = the same choice) ─────────────
const hash32 = (s) => { let h = 2166136261; for (const ch of String(s)) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };
export function rngOf(seed) {
  let a = hash32(seed);
  return () => { a = (a + 0x6d2b79f5) >>> 0; let t = Math.imul(a ^ (a >>> 15), a | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const normal = (rng) => { const u = Math.max(rng(), 1e-12), v = rng(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };
/** Gamma(k, 1) by Marsaglia-Tsang (k < 1 boosted). */
function gamma(k, rng) {
  if (k < 1) return gamma(k + 1, rng) * Math.pow(Math.max(rng(), 1e-12), 1 / k);
  const d = k - 1 / 3, c = 1 / Math.sqrt(9 * d);
  for (;;) {
    let x, v;
    do { x = normal(rng); v = 1 + c * x; } while (v <= 0);
    v = v * v * v;
    const u = rng();
    if (u < 1 - 0.0331 * x ** 4 || Math.log(Math.max(u, 1e-300)) < 0.5 * x * x + d * (1 - v + Math.log(v))) return d * v;
  }
}
export const betaSample = (a, b, rng) => { const x = gamma(a, rng), y = gamma(b, rng); return x / (x + y); };

/**
 * PURE (seeded). Thompson sampling with an exploration floor: with probability `floor` a uniform pick among the eligible,
 * else the format whose Beta(alpha, beta) draw is highest. `propensity` is the probability this policy picks the chosen
 * format (the floor's share plus a Monte Carlo estimate of the Thompson share, from the same seed: replay-exact).
 * @param {string[]} eligible  @param {Record<string, { alpha: number, beta: number }>} posteriors
 * @returns {{ format: string, propensity: number, explored: boolean } | null}
 */
export function allocateFormat(eligible, posteriors = {}, { seed = "0", floor = FLOOR, mc = 400 } = {}) {
  const fs = [...new Set(eligible)].filter((f) => FORMATS.includes(f));
  if (!fs.length) return null;
  if (fs.length === 1) return { format: fs[0], propensity: 1, explored: false };
  const ab = (f) => ({ a: Math.max(1e-3, Number(posteriors[f]?.alpha ?? 1)), b: Math.max(1e-3, Number(posteriors[f]?.beta ?? 1)) });
  const rng = rngOf(seed);
  const draw = () => fs.map((f) => { const { a, b } = ab(f); return betaSample(a, b, rng); });
  const argmax = (xs) => xs.reduce((bi, x, i) => (x > xs[bi] ? i : bi), 0);
  const explored = rng() < floor;
  const format = explored ? fs[Math.floor(rng() * fs.length)] : fs[argmax(draw())];
  // the Thompson share of `format`, estimated on a separate seeded stream
  const est = rngOf(`${seed}:p`);
  let wins = 0;
  for (let i = 0; i < mc; i++) {
    const xs = fs.map((f) => { const { a, b } = ab(f); return betaSample(a, b, est); });
    if (fs[argmax(xs)] === format) wins++;
  }
  const propensity = floor / fs.length + (1 - floor) * (wins / mc);
  return { format, propensity: Math.round(propensity * 1000) / 1000, explored };
}

/**
 * PURE. The outcome of one explain decision: the first scored item answer on its skill AFTER it, in the same lesson,
 * first-try unaided = 1, else 0; null when the lesson had none (no outcome, never a guessed one).
 * @param {{ at: string, skillId: string }} decision
 * @param {Array<{ occurred_at: string, skill_ids: string[], cls: string, outcome: number, teach?: boolean, pre_attempt_help?: boolean, entry_rung?: number, contaminated?: boolean, assisted?: string|null }>} rows  the lesson's kt_evidence, seq order
 */
export function formatOutcome(decision, rows) {
  const ITEM = { "item.open": 7, "item.mcq2": 2, "item.mcq3": 2, "item.mcq4": 2, solo: 3 };
  const r = rows.find((x) => x.occurred_at > decision.at && (x.skill_ids ?? []).includes(decision.skillId) && !x.teach && !x.contaminated && !x.assisted
    && ITEM[x.cls] !== undefined && !(x.cls === "item.open" && Number(x.outcome) === 6));       // NA is no attempt
  if (!r) return null;
  return Number(r.outcome) === 0 && !r.pre_attempt_help && !(Number(r.entry_rung) > 0) ? 1 : 0;
}

/** The population rows for one topic type × band: { [format]: { alpha, beta, n } }. Defensive: {} on any error. */
export async function posteriorsFor(topicType, band, { q } = {}) {
  try {
    const query = q ?? (await import("../db.js")).q;
    const rows = await query("select format, alpha, beta, n from format_posterior where topic_type = $1 and band = $2", [topicType, band]);
    return Object.fromEntries(rows.map((r) => [r.format, { alpha: Number(r.alpha), beta: Number(r.beta), n: Number(r.n) }]));
  } catch { return {}; }
}

/**
 * The night job's work for one child and learning day: every explain_format decision in that day's lessons, scored by
 * formatOutcome, summed into POPULATION increments per (format, topic type, band) and upserted. No child id is written.
 * Idempotent through the job's own key (format.join:{child}:{day}): it runs once per child and day.
 * @returns {Promise<{ decisions: number, scored: number, cells: number }>}
 */
export async function joinFormatOutcomes(childId, day, { q, tz = "Asia/Kolkata" } = {}) {
  const query = q ?? (await import("../db.js")).q;
  const { zonedToUtc, addDays } = await import("../conductor/clock.js");
  const from = zonedToUtc(day, "04:00", tz).toISOString(), to = zonedToUtc(addDays(day, 1), "04:00", tz).toISOString();
  const decs = await query(`select d.lesson_id, d.at, d.chosen, d.options from decision_record d join lesson l on l.id = d.lesson_id
      where l.child_id = $1 and d.point_id = $2 and d.at >= $3 and d.at < $4 order by d.at`, [childId, POINT_ID, from, to]).catch(() => []);
  if (!decs.length) return { decisions: 0, scored: 0, cells: 0 };
  const lessonIds = [...new Set(decs.map((d) => String(d.lesson_id)))];
  const rows = await query(`select session_id, occurred_at, skill_ids, cls, outcome, teach, pre_attempt_help, entry_rung, contaminated, assisted
      from kt_evidence where child_id = $1 and session_id = any($2::text[]) order by seq`, [childId, lessonIds]).catch(() => []);
  const cells = new Map();
  let scored = 0;
  for (const d of decs) {
    const o = d.options ?? {};
    if (!o.skillId || !o.topicType || !o.band || !FORMATS.includes(d.chosen)) continue;
    const y = formatOutcome({ at: new Date(d.at).toISOString(), skillId: o.skillId },
      rows.filter((r) => r.session_id === String(d.lesson_id)).map((r) => ({ ...r, occurred_at: new Date(r.occurred_at).toISOString() })));
    if (y === null) continue;
    scored++;
    const k = `${d.chosen}|${o.topicType}|${o.band}`;
    const c = cells.get(k) ?? { a: 0, b: 0, n: 0 };
    c.a += y; c.b += 1 - y; c.n += 1;
    cells.set(k, c);
  }
  for (const [k, c] of cells) {
    const [format, topicType, band] = k.split("|");
    await query(`insert into format_posterior (format, topic_type, band, alpha, beta, n) values ($1, $2, $3, 1 + $4, 1 + $5, $6)
        on conflict (format, topic_type, band) do update set alpha = format_posterior.alpha + $4, beta = format_posterior.beta + $5,
          n = format_posterior.n + $6, updated_at = now()`, [format, topicType, band, c.a, c.b, c.n]);
  }
  return { decisions: decs.length, scored, cells: cells.size };
}
