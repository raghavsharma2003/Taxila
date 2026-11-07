// Facts → candidate claims → admitted claims (PARENT-REPORT.md §4.2 G-a…G-i, simplified to the v1 L0/L1 menu:
// counts and ledger facts only; no L2 pattern or L3 change line exists in v1, so the false-claim budget has nothing
// to admit). Every claim carries the ledger rows behind it (factIds). Pure: (facts, options) → claims.
// Priority inside each section is FIXED and declared here, before any wording, never "what reads best".
import { createHash } from "crypto";
import { learningDay } from "../conductor/clock.js";
import { subjectOfSkill } from "../learner/kt/ability.js";
import { CAPS, CALIBRATION, CHANGE_MIN_DELTA, CHANGE_MIN_MONTHS, CHANGE_MIN_N, CHANGE_P, CHANGE_P_MANY, HARD_MIN_N, HOLD_GAP_DAYS, HOLD_MIN_N, LANGS, MIXUP_MIN_K, MIXUP_MIN_N, ROUTINE_MIN_LESSONS, TRICKY_MIN_N, WAYS_MIN_N } from "./config.js";
import { bySkill, delayedSuccesses, inWindow, isAttempt, isErrorspotFixed, isExplained, isFirstTryUnaided, isTransferPass } from "./derive.js";
import { dateParts } from "./facts.js";
import { lineViolations } from "./gate.js";
import { monthsApart, pRose } from "./stats.js";
import { HOME_OBJECT, WAY_LABEL, renderShape } from "./templates.js";

export const F = { ev: (id) => `kt_evidence:${id}`, lesson: (id) => `lesson:${id}`, skill: (id) => `kt_skill_state:${id}`,
  jar: (id) => `question_jar:${id}`, test: (t) => `test_window:${t.subject}:${t.from}:${t.to}`, way: (id) => `decision_record:${id}` };
/** S6: item answers that needed one or more hints (item.open C1-C4, solo C1), and of those the ones then solved (C1, C2, solo C1). */
const HINTED = { "item.open": new Set([1, 2, 3, 4]), solo: new Set([1]) };
const SOLVED_AFTER_HINT = { "item.open": new Set([1, 2]), solo: new Set([1]) };
export const isHinted = (e) => isAttempt(e) && !!HINTED[e.cls]?.has(e.outcome);
export const isSolvedAfterHint = (e) => isAttempt(e) && !!SOLVED_AFTER_HINT[e.cls]?.has(e.outcome);
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
  /** Up to `cap` admitted claims, one per skill, in the list's fixed priority (monthly takes ≤ 3 strengths / growth edges). */
  const admittedUpTo = (list, cap) => {
    const out = [], skills = new Set();
    for (const c of list) {
      if (out.length >= cap) break;
      if (c.skillId && skills.has(c.skillId)) continue;
      const a = admit(c);
      if (a) { out.push(a); if (a.skillId) skills.add(a.skillId); }
    }
    return out;
  };

  // S1 header (L0): the lessons that started in the window
  // An open lesson's minutes run to its last evidence row, so those rows are cited too (the checker re-reads them).
  const openUntil = preview ? new Date(Math.min(Date.parse(w.to), Date.parse(now ?? new Date().toISOString()))).toISOString() : null;
  const min = minutesOf(facts.lessons, evIn, openUntil);
  const lessonIds = [...facts.lessons.map((l) => F.lesson(l.id)),
    ...facts.lessons.filter((l) => !l.endedAt).flatMap((l) => { const es = evIn.filter((e) => e.sessionId === l.id); return es.length ? [F.ev(es.at(-1).id)] : []; })];
  const header = !facts.lessons.length
    ? (cadence === "daily" ? claim("header", "header.nolesson", {}, evIn.map((e) => F.ev(e.id)), "no lesson started in window; evidence rows exist in it")
      : claim("header", cadence === "monthly" ? "header.zero_month" : cadence === "term" ? "header.zero_term" : "header.zero", {}, [], "no lesson started in window"))
    : cadence === "daily"
      ? claim("header", "header.daily", { lessons: facts.lessons.length, min }, lessonIds, "lessons started in window; min = round(Σ(end−started)), open lesson ends at its last evidence row")
      : claim("header", `header.${cadence}`, { lessons: facts.lessons.length, days: new Set(facts.lessons.map((l) => learningDay(new Date(l.startedAt), tz))).size, min }, lessonIds,
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
  const trickies = caps.tricky ? admittedUpTo(trickyCands, caps.tricky) : [];
  const trickySkills = new Set(trickies.map((t) => t.skillId).filter(Boolean));

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
  claims.push(...admittedUpTo(strengthCands, caps.strength));

  // S17 exam shape (weekly, inside a test window the parent entered): one line, and it takes a row's place (body ≤ 5)
  let exam = null;
  if (caps.exam && facts.testWindows?.length) {
    const t = facts.testWindows[0];
    exam = admit(claim("exam", "exam.review", { subject: t.subject }, [F.test(t)], "a parent-entered test window overlaps the week (conductor_state.school.testWindows)"));
  }
  const rowCap = Math.max(0, caps.row - (exam ? 1 : 0));

  // S3 rows: most-practised skills first, then skills only started
  const rows = [];
  for (const [s, list] of [...attempts].sort(sortSkills)) {
    if (rows.length >= rowCap) break;
    if (trickySkills.has(s)) continue;
    const r = admit(claim("row", "row.work", { skill: facts.titles[s], n: list.length, k: list.filter(isFirstTryUnaided).length }, list.map((e) => F.ev(e.id)),
      "n = scored attempts in window on the skill (all of them); k = first-try unaided", s));
    if (r) rows.push(r);
  }
  const taught = [...bySkill(evIn.filter((e) => e.teach && !e.contaminated))].filter(([s]) => titled(s) && !attempts.has(s)).sort(sortSkills);
  for (const [s, list] of taught) {
    if (rows.length >= rowCap) break;
    const r = admit(claim("row", "row.started", { skill: facts.titles[s] }, list.map((e) => F.ev(e.id)), "a teach event on the skill in window, no scored attempt", s));
    if (r) rows.push(r);
  }
  if (exam) claims.push(exam);
  claims.push(...rows);
  claims.push(...trickies);

  // ───────────── monthly sections (round 7 F; PARENT-REPORT §5) ─────────────
  if (caps.hold) {
    // S4 (L0): attempts whose previous contact with the skill (any row) was ≥ HOLD_GAP_DAYS earlier
    const lastAt = new Map(), checks = [];
    for (const e of facts.events) {
      const gap = e.skillIds.map((sk) => lastAt.get(sk)).filter(Boolean).map((p) => Date.parse(e.at) - Date.parse(p));
      if (inWindow(e, w) && isAttempt(e) && gap.length && Math.min(...gap) >= HOLD_GAP_DAYS * 86_400_000) checks.push(e);
      for (const sk of e.skillIds) lastAt.set(sk, e.at);
    }
    const ids = checks.map((e) => F.ev(e.id));
    const h = checks.length >= HOLD_MIN_N
      ? admit(claim("hold", "hold.week", { n: checks.length, k: checks.filter(isFirstTryUnaided).length }, ids, `attempts in window whose previous contact on every one of its skills was ≥ ${HOLD_GAP_DAYS} days earlier; k = first-try unaided`))
      : checks.length ? admit(claim("hold", "hold.few", { name, n: checks.length }, ids, `fewer than ${HOLD_MIN_N} such attempts`)) : null;
    if (h) claims.push(h);
  }
  if (caps.hard) {
    // S6: what Taxila did when a question was hard (hints before any answer) and what followed
    const scoredIn = evIn.filter(isAttempt), hinted = scoredIn.filter(isHinted);
    if (scoredIn.length >= HARD_MIN_N && hinted.length) {
      const h = admit(claim("hard", "hard.hint", { h: hinted.length, k: hinted.filter(isSolvedAfterHint).length }, hinted.map((e) => F.ev(e.id)),
        "h = scored item answers in window that needed ≥ 1 hint (item.open C1-C4, solo C1); k = of those, solved with the hints (C1, C2, solo C1)"));
      if (h) claims.push(h);
    }
  }
  if (caps.curious) {
    // S7: the child's own questions kept for later (question_jar, learning ones), and how many Taxila came back to
    const asked = (facts.jar ?? []).filter((j) => j.learning);
    if (asked.length) {
      const back = asked.filter((j) => j.answeredAt);
      const c = back.length
        ? admit(claim("curious", "curious.asked", { name, q: asked.length, k: back.length }, asked.map((j) => F.jar(j.id)), "q = learning questions kept in the window; k = of those answered in a later lesson"))
        : admit(claim("curious", "curious.asked_open", { name, q: asked.length }, asked.map((j) => F.jar(j.id)), "q = learning questions kept in the window; none answered yet"));
      if (c) claims.push(c);
    }
  }
  if (caps.routine && facts.lessons.length >= ROUTINE_MIN_LESSONS) {
    // S9: lesson days of the month and the median lesson length (counts only)
    const mins = facts.lessons.map((l) => Math.round((lessonEndMs(l, evIn, openUntil) - Date.parse(l.startedAt)) / 60_000)).sort((a, b) => a - b);
    const med = mins.length % 2 ? mins[(mins.length - 1) / 2] : Math.round((mins[mins.length / 2 - 1] + mins[mins.length / 2]) / 2);
    const days = Math.round((Date.parse(w.to) - Date.parse(w.from)) / 86_400_000);
    const r = admit(claim("routine", cadence === "term" ? "routine.days_term" : "routine.days", { n: new Set(facts.lessons.map((l) => learningDay(new Date(l.startedAt), tz))).size, d: days, m: med },
      facts.lessons.map((l) => F.lesson(l.id)), "n = distinct learning days with a lesson; d = days in the month; m = median lesson minutes (the header's rule)"));
    if (r) claims.push(r);
  }
  if (caps.ways) {
    // S5: how Taxila explained new ideas this month: counts of its own explain_format choices (WAY_LABEL), never a claim
    // about the child. Held back until the month has WAYS_MIN_N explains, so one lesson never reads as a pattern.
    const lessonIds = new Set(facts.lessons.map((l) => l.id));
    const ways = (facts.ways ?? []).filter((d) => lessonIds.has(d.lessonId) && WAY_LABEL[d.format]);
    if (ways.length >= WAYS_MIN_N) {
      const per = new Map();
      for (const d of ways) per.set(d.format, (per.get(d.format) ?? 0) + 1);
      const [top, t] = [...per].sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1))[0];
      const c = admit(claim("ways", cadence === "term" ? "ways.used_term" : "ways.used", { n: ways.length, k: per.size, way: top, t }, ways.map((d) => F.way(d.id)),
        "n = explain_format decisions in the month's lessons; k = distinct formats; way = the most used (ties: lowest F-code); t = its count"));
      if (c) claims.push(c);
    }
  }
  if (caps.change) {
    // S14 Then → now (term; RP-D6): per skill, the first-try rate in the term's FIRST learning month with ≥ CHANGE_MIN_N
    // scored answers vs its LAST such month, ≥ CHANGE_MIN_MONTHS apart. A row only when the rate ROSE (the pre-declared
    // direction) by ≥ CHANGE_MIN_DELTA and P(now > then) ≥ CHANGE_P (CHANGE_P_MANY when more than 4 skills were
    // compared). A fall or a small rise is never a line; those skills are counted in the still-learning line instead.
    const comps = [];
    for (const [s, list] of [...attempts].sort(sortSkills)) {
      const byMonth = new Map();
      for (const e of list) { const mo = learningDay(new Date(e.at), tz).slice(0, 7); if (!byMonth.has(mo)) byMonth.set(mo, []); byMonth.get(mo).push(e); }
      const full = [...byMonth].filter(([, l]) => l.length >= CHANGE_MIN_N).sort((a, b) => (a[0] < b[0] ? -1 : 1));
      if (full.length < 2) continue;
      const [m1, l1] = full[0], [m2, l2] = full.at(-1);
      if (monthsApart(m1, m2) < CHANGE_MIN_MONTHS) continue;
      const n1 = l1.length, k1 = l1.filter(isFirstTryUnaided).length, n2 = l2.length, k2 = l2.filter(isFirstTryUnaided).length;
      comps.push({ s, m1, m2, l1, l2, n1, k1, n2, k2, delta: k2 / n2 - k1 / n1, p: pRose(k1, n1, k2, n2) });
    }
    const pMin = comps.length > 4 ? CHANGE_P_MANY : CHANGE_P;
    const mo = (m) => ({ y: Number(m.slice(0, 4)), m: Number(m.slice(5, 7)) });
    const rose = comps.filter((x) => x.delta >= CHANGE_MIN_DELTA - 1e-9 && x.p >= pMin).sort((a, b) => b.delta - a.delta || (a.s < b.s ? -1 : 1));
    const changes = admittedUpTo(rose.map((x) => claim("change", "change.row", { skill: facts.titles[x.s], m1: mo(x.m1), n1: x.n1, k1: x.k1, m2: mo(x.m2), n2: x.n2, k2: x.k2 },
      [...x.l1, ...x.l2].map((e) => F.ev(e.id)),
      `first and last learning month in the term with ≥ ${CHANGE_MIN_N} scored answers on the skill, ≥ ${CHANGE_MIN_MONTHS} months apart; k = first-try unaided; rise ≥ ${CHANGE_MIN_DELTA} and P(now > then) ≥ ${pMin} (Beta(1+k, 1+n−k) each; ${comps.length} skills compared)`,
      x.s, { compared: comps.length })), caps.change);
    claims.push(...changes);
    if (caps.still) {
      // the still-learning line: every other titled skill with scored answers in the term (counts only; no rate, no direction)
      const rowSkills = new Set(changes.map((c) => c.skillId));
      const rest = [...attempts].filter(([s]) => !rowSkills.has(s)).sort((a, b) => (a[0] < b[0] ? -1 : 1));
      if (rest.length) {
        const c = admit(claim("still", "still.count", { n: rest.length }, rest.flatMap(([, l]) => l.map((e) => F.ev(e.id))),
          "n = titled skills with scored answers in the term that have no Then → now row", null, { skills: rest.map(([s]) => s) }));
        if (c) claims.push(c);
      }
    }
  }
  let fixedNext = false;
  if (caps.next) {
    // S13 (required monthly): the next scheduled re-check after the window, still ahead when the report is made
    const nx = Object.entries(facts.skills).filter(([sk, x]) => x.nextReviewAt && x.nextReviewAt >= asOf && titled(sk))
      .sort((a, b) => (a[1].nextReviewAt < b[1].nextReviewAt ? -1 : a[1].nextReviewAt > b[1].nextReviewAt ? 1 : a[0] < b[0] ? -1 : 1));
    const c = firstAdmitted(nx.map(([sk, x]) => claim("next", "next.recheck", { skill: facts.titles[sk], date: dateParts(x.nextReviewAt, tz) }, [F.skill(sk)],
      "the earliest kt_skill_state.next_review_at still ahead when the report is made", sk)));
    if (c) claims.push(c); else fixedNext = true;
  }

  // S7 interest: retired (config.js). memory.text is model paraphrase, not a typed value a reviewed template can carry.

  // S12 home activity (weekly, exactly one): from a skill with first-try successes, never the growth-edge skill
  let fixedHome = false;
  if (caps.home) {
    const cands = [...bySkill(evIn.filter(isFirstTryUnaided))].filter(([s]) => titled(s) && !trickySkills.has(s)).sort(sortSkills)
      .map(([s, list]) => claim("home", "home.skill", { name, skill: facts.titles[s], object: HOME_OBJECT[subjectOfSkill(s)] ? subjectOfSkill(s) : "science" },
        list.map((e) => F.ev(e.id)), "first-try unaided successes on the skill in window (a can-do skill, PLI18)", s));
    const h = firstAdmitted(cands);
    if (h) claims.push(h); else fixedHome = true;
  }
  return { claims, screened, candidates, fixedHome, fixedNext };
}
