// Facts → candidate claims → admitted claims (PARENT-REPORT.md §4.2 G-a…G-i, simplified to the v1 L0/L1 menu:
// counts and ledger facts only; no L2 pattern or L3 change line exists in v1, so the false-claim budget has nothing
// to admit). Every claim carries the ledger rows behind it (factIds). Pure: (facts, options) → claims.
// Priority inside each section is FIXED and declared here, before any wording, never "what reads best".
import { createHash } from "crypto";
import { learningDay } from "../conductor/clock.js";
import { subjectOfSkill } from "../learner/kt/ability.js";
import { CAPS, CALIBRATION, LANGS, MIXUP_MIN_K, MIXUP_MIN_N, TRICKY_MIN_N } from "./config.js";
import { bySkill, delayedSuccesses, inWindow, isAttempt, isErrorspotFixed, isExplained, isFirstTryUnaided, isTransferPass } from "./derive.js";
import { dateParts } from "./facts.js";
import { lineViolations } from "./gate.js";
import { HOME_OBJECT, renderShape } from "./templates.js";

export const F = { ev: (id) => `kt_evidence:${id}`, lesson: (id) => `lesson:${id}`, skill: (id) => `kt_skill_state:${id}` };
const cid = (section, shapeId, slots, factIds) => `${section}:${shapeId}:${createHash("sha1").update(JSON.stringify([slots, [...factIds].sort()])).digest("hex").slice(0, 10)}`;
/** `skillId` / `ref` are not rendered: the checker and the evidence drawer read them. */
const claim = (section, shapeId, slots, factIds, rule, skillId = null, ref = undefined) =>
  ({ id: cid(section, shapeId, slots, factIds), section, shapeId, slots, factIds: [...new Set(factIds)], rule, skillId, ...(ref ? { ref } : {}) });
/**
 * Minutes of the window's lessons. An open lesson (ended_at null: crashed, or still running) counts up to its last
 * evidence row in the window (kt_evidence.session_id = lesson id), else up to `openUntil` (the preview's "now"),
 * else 0. The independent checker (check.js) re-derives the same written rule from rows.
 */
export const lessonEndMs = (l, events, openUntil) => {
  if (l.endedAt) return Date.parse(l.endedAt);
  const last = events.filter((e) => e.sessionId === l.id).map((e) => Date.parse(e.at)).reduce((a, b) => Math.max(a, b), -Infinity);
  if (Number.isFinite(last)) return last;
  return openUntil ? Math.max(Date.parse(l.startedAt), Date.parse(openUntil)) : Date.parse(l.startedAt);
};
const minutesOf = (lessons, events, openUntil) => Math.round(lessons.reduce((a, l) => a + (lessonEndMs(l, events, openUntil) - Date.parse(l.startedAt)), 0) / 60_000);
/** Ledger displays under learned_today: next-topic.js treats such a topic as not done and teaches it (or its prerequisite) again. */
const NOT_LEARNED = new Set(["unseen", "introduced", "practising"]);
const sortSkills = (a, b) => b[1].length - a[1].length || (a[0] < b[0] ? -1 : 1);

/**
 * @param {any} facts loadFacts() output
 * @param {{ k7?: boolean, now?: string, preview?: boolean }} [o] `now` = when the report is made (default: the window end);
 *   a re-check date is stated only when it is still ahead of max(window end, now). `preview` counts an open lesson up to now.
 * @returns {null | { claims: any[], screened: { shapeId: string, reason: string }[], candidates: number, fixedHome: boolean }}
 *   null = nothing to report (a daily window with no lesson and no evidence)
 */
export function buildClaims(facts, { k7 = CALIBRATION.k7Passed, now, preview = false } = {}) {
  const w = facts.window, cadence = w.cadence, caps = CAPS[cadence], tz = facts.child.tz;
  const asOf = now && now > w.to ? now : w.to;
  const name = facts.child.firstName;
  const evIn = facts.events.filter((e) => inWindow(e, w));
  if (cadence === "daily" && !facts.lessons.length && !evIn.length) return null;
  const titled = (s) => !!facts.titles[s];
  const screened = [];
  let candidates = 0;
  /** G-a…G-i for one candidate: renders in every language with zero predicate violations, else screened (logged). */
  const admit = (c) => {
    if (!c) return null;
    candidates++;
    for (const lang of LANGS) {
      let text;
      try { text = renderShape(c.shapeId, lang, c.slots); } catch (e) { screened.push({ shapeId: c.shapeId, reason: `render:${e.message}` }); return null; }
      const v = lineViolations(text, { shapeId: c.shapeId, slots: c.slots, lang, k7, firstName: name });
      if (v.length) { screened.push({ shapeId: c.shapeId, reason: `${lang}:${v[0].rule}${v[0].detail ? `:${v[0].detail}` : ""}` }); return null; }
    }
    return c;
  };
  const firstAdmitted = (list) => { for (const c of list) { const a = admit(c); if (a) return a; } return null; };

  // S1 header (L0): the lessons that started in the window
  // An open lesson's minutes run to its last evidence row, so those rows are cited too (the checker re-reads them).
  const openUntil = preview ? new Date(Math.min(Date.parse(w.to), Date.parse(now ?? new Date().toISOString()))).toISOString() : null;
  const min = minutesOf(facts.lessons, evIn, openUntil);
  const lessonIds = [...facts.lessons.map((l) => F.lesson(l.id)),
    ...facts.lessons.filter((l) => !l.endedAt).flatMap((l) => { const es = evIn.filter((e) => e.sessionId === l.id); return es.length ? [F.ev(es.at(-1).id)] : []; })];
  const header = !facts.lessons.length
    ? (cadence === "daily" ? claim("header", "header.nolesson", {}, evIn.map((e) => F.ev(e.id)), "no lesson started in window; evidence rows exist in it")
      : claim("header", "header.zero", {}, [], "no lesson started in window"))
    : cadence === "daily"
      ? claim("header", "header.daily", { lessons: facts.lessons.length, min }, lessonIds, "lessons started in window; min = round(Σ(end−started)), open lesson ends at its last evidence row")
      : claim("header", "header.weekly", { lessons: facts.lessons.length, days: new Set(facts.lessons.map((l) => learningDay(new Date(l.startedAt), tz))).size, min }, lessonIds,
        "lessons started in window; days = distinct learning days; min = round(Σ(end−started)), open lesson ends at its last evidence row");
  const claims = [admit(header)];
  if (!claims[0]) throw new Error("reports: the header failed its own predicates");

  const attempts = new Map([...bySkill(evIn.filter(isAttempt))].filter(([s]) => titled(s)));
  const delayed = delayedSuccesses(facts.events);
  const delayedIn = delayed.filter((d) => inWindow(d.ev, w) && titled(d.skillId));

  // S11 growth edge first, so rows and the home activity can leave its skill out (PLI18: home draws on can-do skills only)
  const trickyCands = [];
  for (const [s, list] of [...attempts].sort(sortSkills)) {
    const k = list.filter(isFirstTryUnaided).length, n = list.length;
    const next = facts.skills[s]?.nextReviewAt;
    if (n < TRICKY_MIN_N || 2 * k >= n) continue;
    // the action part: a scheduled re-check date, or (not learned yet, no date) the placement rule that brings it back
    // a date is stated only while it is still ahead when the parent reads it: the job runs after the window closes
    // (and a preview later still), so a re-check inside the window, or already past at generation, is never a promise
    const dated = !!next && next >= asOf;
    if (!dated && !NOT_LEARNED.has(facts.skills[s]?.display)) continue;
    const date = dated ? dateParts(next, tz) : null;
    const sfx = dated ? "" : "_next";
    const withDate = (slots) => (dated ? { ...slots, date } : slots);
    // hedged misconception only past the diagnostic gate (§4.5): discriminating answers on this skill to date
    const hist = facts.events.filter((e) => e.skillIds.includes(s) && e.at < w.to);
    const mixes = [...new Set(hist.map((e) => e.misconceptionId).filter(Boolean))].map((m) => {
      const D = hist.filter((e) => (e.discriminates === m || e.misconceptionId === m) && !e.teach && !e.contaminated && !e.assisted);
      const K = D.filter((e) => e.misconceptionId === m);
      return { m, D, K, hitInWindow: K.some((e) => inWindow(e, w)) };
    }).filter((x) => x.D.length >= MIXUP_MIN_N && x.K.length >= MIXUP_MIN_K && x.hitInWindow && !facts.misconceptions[x.m]?.resolvedAt && facts.beliefs[x.m])
      .sort((a, b) => b.K.length - a.K.length || (a.m < b.m ? -1 : 1));
    if (mixes[0]) {
      const x = mixes[0];
      trickyCands.push(claim("tricky", `tricky.mixup${sfx}`, withDate({ skill: facts.titles[s], belief: facts.beliefs[x.m], n: x.D.length, k: x.K.length }),
        [...x.D.map((e) => F.ev(e.id)), F.skill(s)], `diagnostic set for ${x.m}: n = answers discriminating it, k = answers matching it; ${dated ? "date = kt_skill_state.next_review_at" : "not learned (kt_skill_state.display), so placement (next-topic.js) brings it back"}`, s, { misconceptionId: x.m }));
    }
    trickyCands.push(claim("tricky", `tricky.work${sfx}`, withDate({ skill: facts.titles[s], n, k }), [...list.map((e) => F.ev(e.id)), F.skill(s)],
      dated ? "n = scored attempts in window; k = first-try unaided; 2k < n; date = kt_skill_state.next_review_at"
        : "n = scored attempts in window; k = first-try unaided; 2k < n; not learned (kt_skill_state.display), so placement (next-topic.js) brings it back", s));
  }
  const tricky = caps.tricky ? firstAdmitted(trickyCands) : null;
  const trickySkill = tricky?.skillId ?? null;

  // S2 strength (required, first): fixed priority — pakka (K7 only) > delayed success > explained > transfer > error-spot > earlier delayed (weekly)
  const strengthCands = [];
  if (k7) {
    const bySk = new Map();
    for (const d of delayed.filter((x) => x.ev.at < w.to && titled(x.skillId))) { if (!bySk.has(d.skillId)) bySk.set(d.skillId, []); bySk.get(d.skillId).push(d); }
    for (const [s, ds] of bySk) {
      const distinct = [...new Map(ds.map((d) => [d.ev.itemKey, d])).values()];
      const spaced = distinct.filter((d, i) => i === 0 || Date.parse(d.ev.at) - Date.parse(distinct[i - 1].ev.at) >= 86_400_000);
      const last = ds.at(-1);
      if (spaced.length >= 2 && inWindow(last.ev, w)) strengthCands.push(claim("strength", "st.pakka", { skill: facts.titles[s], d: last.d, k: spaced.length },
        spaced.flatMap((d) => [F.ev(d.ev.id), F.ev(d.prev.id)]), "≥ 2 delayed successes on distinct items ≥ 1 day apart; calibration gate passed", s));
    }
  }
  for (const d of [...delayedIn].reverse()) strengthCands.push(claim("strength", "st.delayed", { skill: facts.titles[d.skillId], d: d.d }, [F.ev(d.ev.id), F.ev(d.prev.id)],
    "delayed success: first-try unaided; previous contact on the skill in another session ≥ 20 h earlier; d = max(1, round(Δ/day))", d.skillId));
  const countShape = (pred, shapeId, rule) => [...bySkill(evIn.filter(pred))].filter(([s]) => titled(s)).sort(sortSkills)
    .map(([s, list]) => claim("strength", shapeId, { name, skill: facts.titles[s], k: list.length }, list.map((e) => F.ev(e.id)), rule, s));
  strengthCands.push(...countShape(isExplained, "st.explained", "k = probe.why full + probe.teachback high|mid in window, not via game"));
  strengthCands.push(...countShape(isTransferPass, "st.transfer", "k = transfer near|far pass in window"));
  strengthCands.push(...countShape(isErrorspotFixed, "st.errorspot", "k = error-spot caught_fixed in window"));
  if (cadence === "weekly" && !evIn.length) {
    const before = delayed.filter((d) => d.ev.at < w.from && titled(d.skillId)).at(-1);
    if (before) strengthCands.push(claim("strength", "st.delayed_before", { skill: facts.titles[before.skillId], d: before.d, date: dateParts(before.ev.at, tz) },
      [F.ev(before.ev.id), F.ev(before.prev.id)], "latest delayed success before the window (zero-lesson week: PARENT-REPORT S1)", before.skillId));
  }
  const strength = firstAdmitted(strengthCands);
  if (strength) claims.push(strength);

  // S3 rows: most-practised skills first, then skills only started
  const rows = [];
  for (const [s, list] of [...attempts].sort(sortSkills)) {
    if (rows.length >= caps.row) break;
    if (s === trickySkill) continue;
    const r = admit(claim("row", "row.work", { skill: facts.titles[s], n: list.length, k: list.filter(isFirstTryUnaided).length }, list.map((e) => F.ev(e.id)),
      "n = scored attempts in window on the skill (all of them); k = first-try unaided", s));
    if (r) rows.push(r);
  }
  const taught = [...bySkill(evIn.filter((e) => e.teach && !e.contaminated))].filter(([s]) => titled(s) && !attempts.has(s)).sort(sortSkills);
  for (const [s, list] of taught) {
    if (rows.length >= caps.row) break;
    const r = admit(claim("row", "row.started", { skill: facts.titles[s] }, list.map((e) => F.ev(e.id)), "a teach event on the skill in window, no scored attempt", s));
    if (r) rows.push(r);
  }
  claims.push(...rows);
  if (tricky) claims.push(tricky);

  // S7 interest: retired (config.js). memory.text is model paraphrase, not a typed value a reviewed template can carry.

  // S12 home activity (weekly, exactly one): from a skill with first-try successes, never the growth-edge skill
  let fixedHome = false;
  if (caps.home) {
    const cands = [...bySkill(evIn.filter(isFirstTryUnaided))].filter(([s]) => titled(s) && s !== trickySkill).sort(sortSkills)
      .map(([s, list]) => claim("home", "home.skill", { name, skill: facts.titles[s], object: HOME_OBJECT[subjectOfSkill(s)] ? subjectOfSkill(s) : "science" },
        list.map((e) => F.ev(e.id)), "first-try unaided successes on the skill in window (a can-do skill, PLI18)", s));
    const h = firstAdmitted(cands);
    if (h) claims.push(h); else fixedHome = true;
  }
  return { claims, screened, candidates, fixedHome };
}
