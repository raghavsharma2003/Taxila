// Round 8 Play P1/P2: which game she gets, and how the next level moves, from what the learner model holds. PURE: every
// function here takes its inputs (coverage entries, learner inputs, a level-of function, the kit's belief text) and
// returns a choice plus a `because` record { choice, fact, source } for every choice that departs from the default (the
// first coverage entry, the request's fade, the class band). The default carries NO because. No model, no clock, no DB.
//
//   chooseEntry     P1: one picker over every coverage entry that admits the skill (across families and modes)
//   fadeFromHistory P2: the scaffold fade from her ledger row for the skill (the request's fade is the fallback)
//   adaptAfter      P2: between levels: a mal-rule miss → the next level tests that belief, same band; a clean first-try
//                   win → one band step up from HER pL
//   liftedPL        the pL the picker is asked for after those steps (her pL, else the class default, plus the lift)
//   settleBecause   a pending between-level because is kept only when the level served really does what it claims
import { MIS_PRIOR } from "../learner/kt/misconception.js";
import { BAND, DEFAULT_PL } from "../../src/play/core/pick.ts";

/** A mapped misconception at or above this posterior is an ACTIVE belief: the level that tells it apart is served first. */
export const ACTIVE_MIS = 0.5;
/** An alternative entry must beat the first entry by this much (score units) to be served instead (ties keep today's). */
export const MARGIN = 0.1;
/** Score weights: information about her open mix-ups dominates; band fit and novelty break near-ties. */
export const W = { info: 2, target: 1, fit: 1, recentFamily: 0.3, recentKey: 0.3, recentSig: 0.3 };
/** One step of the between-level lift (added to her pL in the picker's request), and the most steps a session takes. */
export const LIFT_STEP = 0.1, MAX_LIFT = 2, LIFT_CAP = 0.95;

const r2 = (x) => Math.round(x * 100) / 100;
const fm = (e) => `${e.family}/${e.mode}`;
export const mappedIds = (entries) => new Set(entries.flatMap((e) => Object.values(e.misMap ?? {})));

/**
 * The belief to serve first: the lesson's focus (when some entry maps it), else the strongest mapped open mix-up above
 * ACTIVE_MIS, else null. → { id, p, source } | null
 * @param {{ mis?: Record<string, number>, focus?: string|null, focusSource?: string|null }} inputs
 */
export function activeBelief(inputs, entries) {
  const mapped = mappedIds(entries);
  const mis = inputs.mis ?? {};
  if (inputs.focus && mapped.has(inputs.focus)) return { id: inputs.focus, p: mis[inputs.focus] ?? null, source: inputs.focusSource ?? "kt_evidence", lesson: true };
  let best = null;
  for (const id of [...mapped].sort()) {
    const p = mis[id];
    if (typeof p === "number" && p > ACTIVE_MIS && (!best || p > best.p)) best = { id, p, source: "kt_misconception", lesson: false };
  }
  return best;
}

/** Is anything known that could move the choice off the default? (no mis above prior, no focus, no pL = nothing) */
export function knowsAnything(inputs, entries) {
  const mapped = mappedIds(entries);
  if (typeof inputs.pL === "number") return true;
  if (inputs.focus) return true;
  return Object.entries(inputs.mis ?? {}).some(([id, p]) => mapped.has(id) && p > MIS_PRIOR + 1e-3);
}

/** One entry's score parts, from its garam level. */
function scoreOf(entry, key, level, inputs, target, recent) {
  const mis = inputs.mis ?? {};
  const own = new Set(Object.values(entry.misMap ?? {}));
  const disc = (level?.proof?.discriminates ?? []).filter((id) => own.has(id));
  const info = disc.reduce((s, id) => s + Math.max(0, (mis[id] ?? MIS_PRIOR) - MIS_PRIOR) + (target && id === target.id ? W.target : 0), 0);
  const p = level?.proof?.pFirstTry;
  const fit = typeof inputs.pL === "number" && typeof p === "number" ? -Math.abs(p - BAND.garam) : 0;
  const nov = -((recent.families ?? []).includes(fm(entry)) ? W.recentFamily : 0)
    - ((recent.keys ?? []).includes(key) ? W.recentKey : 0)
    - (level?.sig && (recent.sigs ?? []).includes(level.sig) ? W.recentSig : 0);
  return { info, fit, nov, score: W.info * info + W.fit * fit + nov, hits: target ? disc.includes(target.id) : false };
}

/**
 * P1. → { entry, key, focus, because, ranked } | null.
 *   entries   every coverage entry admitting the skill, in file order (entries[0] is today's choice)
 *   inputs    { mis, pL, focus, focusSource }
 *   levelOf   (entry, focus|null) → the garam level that entry would serve (pure: the play picker)
 *   recent    { families: ["kon/turn"], keys: [entryKey], sigs: [level sig] } (what she just played)
 *   keyOf     entry → key;  beliefOf  kit misconception id → the kit's belief text
 * Ranking: score = 2·info + fit + novelty, where info = Σ over the mix-ups the garam level discriminates (own misMap) of
 * max(0, P(mis) − prior) (+1 for the active belief), fit = −|pFirstTry − 0.75| when her pL is known, novelty = −0.3 for a
 * family/mode, an entry or a level signature she just played. The best entry is served when it beats the first entry by
 * MARGIN; otherwise the first entry (today's). With an active belief the session focus is that belief (so the garam level,
 * not a door, tests it). The because is set exactly when the served level differs from today's (entry or level).
 */
export function chooseEntry({ entries, inputs = {}, levelOf, recent = {}, keyOf = (e) => `${e.topicId}|${fm(e)}|${e.goal}`, beliefOf = (id) => id }) {
  if (!entries?.length) return null;
  const first = entries[0];
  const def = { entry: first, key: keyOf(first), focus: inputs.focus ?? null, because: null, ranked: [] };
  if (!knowsAnything(inputs, entries)) return def;
  const target = activeBelief(inputs, entries);
  if (entries.length === 1 && !target) return def;
  const ranked = [];
  for (const e of entries) {
    const key = keyOf(e);
    const level = levelOf(e, target?.id ?? inputs.focus ?? null);
    if (!level) continue;
    ranked.push({ entry: e, key, level, ...scoreOf(e, key, level, inputs, target, recent) });
  }
  if (!ranked.length) return { ...def, ranked };
  const firstR = ranked.find((x) => x.entry === first) ?? null;
  let best = ranked[0];
  for (const x of ranked) if (x.score > best.score + 1e-9) best = x;
  const pick = !firstR || best === firstR || best.score - firstR.score >= MARGIN ? best : firstR;
  const focus = target?.id ?? inputs.focus ?? null;
  // today's level: the first entry, with the focus the lesson gave (no injected belief)
  const base = pick === firstR && focus === (inputs.focus ?? null) ? pick.level : levelOf(first, inputs.focus ?? null);
  const departs = pick.entry !== first || !base || base.levelId !== pick.level.levelId;
  const out = { entry: pick.entry, key: pick.key, focus, because: null, ranked: ranked.map(({ key, info, fit, nov, score }) => ({ key, info: r2(info), fit: r2(fit), nov: r2(nov), score: r2(score) })) };
  if (!departs) return out;
  out.because = becauseOfPick(pick, firstR, target, inputs, recent, beliefOf);
  return out;
}

function becauseOfPick(pick, firstR, target, inputs, recent, beliefOf) {
  const name = fm(pick.entry);
  const d = firstR ? { info: pick.info - firstR.info, fit: pick.fit - firstR.fit, nov: pick.nov - firstR.nov } : { info: pick.info, fit: pick.fit, nov: pick.nov };
  if (target && pick.hits && (W.info * d.info >= Math.max(W.fit * d.fit, d.nov) || pick.entry === firstR?.entry)) {
    const belief = beliefOf(target.id) ?? target.id;
    const fact = target.lesson ? `seen in this lesson: ${belief}` : `open mix-up: ${belief}, ${target.p.toFixed(2)}`;
    return { choice: `${name} first`, fact, source: target.source };
  }
  if (d.nov >= W.fit * d.fit && d.nov > 0) {
    const was = (recent.families ?? []).at(-1) ?? (firstR ? fm(firstR.entry) : "");
    return { choice: `${name} first`, fact: `just played ${was}`, source: "lesson_shown" };
  }
  const p = pick.level.proof?.pFirstTry, p0 = firstR?.level.proof?.pFirstTry;
  return { choice: `${name} first`, fact: `P(skill) ${Number(inputs.pL).toFixed(2)}: first try ${typeof p === "number" ? p.toFixed(2) : "?"} here vs ${typeof p0 === "number" ? p0.toFixed(2) : "?"} in ${firstR ? fm(firstR.entry) : "the first game"} (aim ${BAND.garam})`, source: "kt_skill_state" };
}

