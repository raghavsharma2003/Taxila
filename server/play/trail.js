// Round 8 Play P3: the level's trail — HOW she got there, not only whether. Built by the SERVER from its own replay of the
// raw acts (server/play/grade.js), never from anything the device claims (rj-ot-frame-claim-as-grade): the device's
// `impasse` flag, its clock and its verdict are not read. Child-free (no id, no name: the levelId is the unfilled one, the
// same for every child) and small: a fixed shape with bounded counts and at most TRAIL_MAX_MAL mal-rule pairs.
//
// The trail is a REPORT. It never changes a level, a grade, an evidence row or a weight: gradeActs computes it after the
// grade, from the same replay, and nothing that grades reads it.
//
//   v          TRAIL_V
//   levelId, skillId, game ("family/mode"), fade
//   solved     the goal is met at the end (grade.verdict === "solved")
//   firstTry   a clean first-try win: solved, no mal-rule signature, first decisive moment a solve (P2 adaptAfter's rule)
//   misses     mal-rule signatures + near misses before the win (all of them when unsolved)
//   refused    acts the law refused before the win
//   mal        [{ rule, mis }] the mal-rules her misses matched, first seen first (rule = family id, mis = kit id or null)
//   undos      undo acts before the win
//   hints      0: no family's law has a hint act (the device's impasse flag is a claim and is not counted)
//   acts       acts used up to the win (all acts when unsolved)
//   minActs    the solver's minimum (level.proof.minActs, else logic.solve(level).length), or null
//   extra      acts − minActs (≥ 0) when solved and minActs is known, else null
export const TRAIL_V = 1;
export const TRAIL_MAX_MAL = 4;
const CAP = 999;
const MISS = new Set(["misconception_consequence", "near_miss"]);
const n = (x) => Math.max(0, Math.min(CAP, Math.trunc(Number(x) || 0)));
const id = (x, max = 64) => (typeof x === "string" && x.length > 0 ? x.slice(0, max) : null);

/**
 * PURE. (level, sanitised acts, replay { moments }, { grade, minActs }) → the trail. `acts` are the envelopes the grade
 * replayed (sanitizeActs + MAX_ACTS already applied), `moments` the replay's own moments.
 * @param {any} level @param {{ seq: number, act: { kind: string } }[]} acts @param {{ moments: any[] }} replay
 * @param {{ grade: any, minActs?: number | null }} o
 */
export function buildTrail(level, acts, replay, { grade, minActs = null } = {}) {
  const moments = Array.isArray(replay?.moments) ? replay.moments : [];
  const list = Array.isArray(acts) ? acts : [];
  const solved = grade?.verdict === "solved";
  const win = solved ? moments.find((m) => m.kind === "solved")?.seq ?? Infinity : Infinity;
  const before = (seq) => Number(seq) <= win;
  const pre = moments.filter((m) => before(m.seq) && m.seq !== undefined);
  const mal = [];
  for (const m of pre) {
    if (m.kind !== "misconception_consequence" || !m.misconceptionId || mal.some((x) => x.rule === m.misconceptionId)) continue;
    if (mal.length >= TRAIL_MAX_MAL) break;
    mal.push({ rule: id(m.misconceptionId), mis: id(level?.mal?.[m.misconceptionId]) });
  }
  const used = list.filter((e) => before(e.seq));
  const min = Number.isFinite(minActs) && minActs > 0 ? n(minActs) : null;
  const ev0 = grade?.evidence?.[0];
  return {
    v: TRAIL_V,
    levelId: id(level?.levelId, 120), skillId: id(level?.skillId, 80), game: id(`${level?.family}/${level?.mode}`), fade: [1, 2, 3].includes(level?.fade) ? level.fade : 1,
    solved, firstTry: !!(solved && grade?.clean && ev0?.outcome === "correct"),
    misses: n(pre.filter((m) => MISS.has(m.kind)).length), refused: n(pre.filter((m) => m.kind === "law_refused").length),
    mal, undos: n(used.filter((e) => e?.act?.kind === "undo").length), hints: 0,
    acts: n(used.length), minActs: min, extra: solved && min !== null ? Math.max(0, n(used.length) - min) : null,
  };
}

/** The trail's keys, in order (the shape every check below holds a trail to). */
export const TRAIL_KEYS = Object.freeze(["v", "levelId", "skillId", "game", "fade", "solved", "firstTry", "misses", "refused", "mal", "undos", "hints", "acts", "minActs", "extra"]);

/**
 * → a trail re-checked field by field (what a verifier hands on), or null. A signed trail is the server's own, but the
 * reader still bounds it: nothing longer, deeper or other-typed than buildTrail makes survives.
 */
export function cleanTrail(t) {
  if (!t || typeof t !== "object" || t.v !== TRAIL_V) return null;
  const mal = Array.isArray(t.mal) ? t.mal.slice(0, TRAIL_MAX_MAL).filter((m) => m && id(m.rule)).map((m) => ({ rule: id(m.rule), mis: id(m.mis) })) : [];
  const nn = (x) => (x === null || x === undefined ? null : n(x));
  return {
    v: TRAIL_V, levelId: id(t.levelId, 120), skillId: id(t.skillId, 80), game: id(t.game), fade: [1, 2, 3].includes(t.fade) ? t.fade : 1,
    solved: t.solved === true, firstTry: t.firstTry === true, misses: n(t.misses), refused: n(t.refused), mal, undos: n(t.undos), hints: n(t.hints),
    acts: n(t.acts), minActs: nn(t.minActs), extra: nn(t.extra),
  };
}
