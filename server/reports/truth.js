// ONE claim source per child (BUILD-PLAN §4 W2-A #1; flows G7, comprehension G4). Every surface that says something
// about what a child knows or did reads it from here, so they cannot disagree:
//   child home / plan · child Garden-Sky map · parent home · Progress · lesson card · evidence sheet · Notes (reports)
//
// The source is the comprehension engine's graded event log (kt_evidence, closed labels, the grader named) and the
// ledger projection the turn writes from the same fold (skill_state). The lenient Director classifier's legacy
// `evidence` rows are NOT read by any parent or child claim any more: they were the "8/8 unaided" source.
//
//   engineRow(r)            one kt_evidence row → the shape every surface shows (result words, grader, the turn it came from)
//   supersede(rows)         a late correction (`<id>:late`) replaces the row it corrects (never counted twice)
//   foldDelayedKt(rows)     delayed checks from the engine rows (the same 20 h / other-session rule as the ledger)
//   skillTruth(row, rows)   the ONE state word per skill: no scored engine row → "Not started", whatever else exists
//   topicTruth(states, n)   the ONE topic state, derived from its skills' states (never a second fold)
//   countsAsLesson / COUNTED_LESSON_SQL / lessonTally   the ONE "a lesson" and "minutes" definition
//   loadTruth(child)        the child's engine rows by skill + a state() reader (one query each)
//   nextTopicOf(child)      the ONE next-topic function (content/next-topic.js nextTopicFor), for summary and parent home
//   lessonFactsSummary / summaryClaimsHold   a lesson's summary built from facts, and its claim check
import { q as dbq } from "../db.js";
import { ITEM_CLASSES, isDelayedSuccess, outcomeName } from "../learner/kt/outcomes.js";
import { nextTopicFor } from "../content/next-topic.js";
import { DELAY_MS } from "./config.js";

/** A lesson that ran this long (start → end) counts even with nothing graded (V2 §3.13: shorter is an accidental start). */
export const COUNTED_MIN_MS = 5 * 60_000;

/**
 * PURE. Does a lesson row count as "a lesson" on every surface? Not an abandoned zero-turn start; and something in it
 * was graded (state.did) or it ran ≥ 5 minutes start → end. An open lesson counts only once something was graded.
 * @param {{ state?: any, startedAt?: any, endedAt?: any }} l
 */
export function countsAsLesson({ state, startedAt, endedAt }) {
  if (state?.abandoned === true || state?.abandoned === "true") return false;
  if (Array.isArray(state?.did) && state.did.length > 0) return true;
  if (!endedAt || !startedAt) return false;
  return new Date(endedAt).getTime() - new Date(startedAt).getTime() >= COUNTED_MIN_MS;
}

/** The same rule in SQL, over a `lesson` alias (parent lists, the home's week, the reports' lesson read). */
export const COUNTED_LESSON_SQL = (a = "l") => `(coalesce(${a}.state->>'abandoned', 'false') <> 'true' and (
    (jsonb_typeof(${a}.state->'did') = 'array' and jsonb_array_length(${a}.state->'did') > 0)
    or (${a}.ended_at is not null and extract(epoch from (${a}.ended_at - ${a}.started_at)) >= ${COUNTED_MIN_MS / 1000})))`;

/**
 * PURE. Minutes of a lesson for every surface: start → end; an open lesson runs to its last engine row (kt_evidence,
 * session = lesson id), else to `openUntil` (a "so far" view), else 0. Same rule as reports/claims.js lessonEndMs.
 */
export function lessonEndMs(l, events = [], openUntil = null) {
  if (l.endedAt) return Date.parse(l.endedAt);
  const last = events.filter((e) => e.sessionId === l.id || e.lessonId === l.id).map((e) => Date.parse(e.at)).reduce((x, y) => Math.max(x, y), -Infinity);
  if (Number.isFinite(last)) return last;
  return openUntil ? Math.max(Date.parse(l.startedAt), Date.parse(openUntil)) : Date.parse(l.startedAt);
}

/**
 * PURE. The ONE lessons-and-minutes definition: counted lessons that STARTED in [from, to); minutes =
 * round(Σ(end − start)) over those lessons. `lessons` rows: { id, startedAt, endedAt, state }.
 */
export function lessonTally(lessons, { from, to }, events = [], openUntil = null) {
  const inWin = lessons.filter((l) => Date.parse(l.startedAt) >= Date.parse(from) && Date.parse(l.startedAt) < Date.parse(to) && countsAsLesson(l));
  const ms = inWin.reduce((a, l) => a + Math.max(0, lessonEndMs(l, events, openUntil) - Date.parse(l.startedAt)), 0);
  return { lessons: inWin.length, minutes: Math.round(ms / 60_000), ids: inWin.map((l) => String(l.id)) };
}

/** The lesson columns lessonTally needs, with the state cut to what countsAsLesson reads (never the whole state). */
export const TALLY_COLS = (a = "l") => `${a}.id, ${a}.topic_id, ${a}.started_at, ${a}.ended_at,
  jsonb_build_object('abandoned', ${a}.state->'abandoned', 'did', case when jsonb_typeof(${a}.state->'did') = 'array'
    and jsonb_array_length(${a}.state->'did') > 0 then '[1]'::jsonb else '[]'::jsonb end) as tally_state`;
/** A TALLY_COLS row → lessonTally's shape. */
export const tallyLesson = (r) => ({ id: String(r.id), topicId: r.topic_id, startedAt: new Date(r.started_at).toISOString(),
  endedAt: r.ended_at ? new Date(r.ended_at).toISOString() : null, state: r.tally_state ?? r.state ?? null });

/**
 * The child's lessons that started in [from, to), tallied by the ONE rule, with every lesson row (counted or not) and
 * the last engine row of each open lesson. `openUntil`: a "so far" view counts an open lesson up to then.
 */
export async function loadLessonTally(childId, { from, to }, { q = dbq, openUntil = null } = {}) {
  const lessons = (await q(`select ${TALLY_COLS("l")} from lesson l where l.child_id = $1 and l.started_at >= $2 and l.started_at < $3
      order by l.started_at desc`, [childId, from, to])).map(tallyLesson);
  const open = lessons.filter((l) => !l.endedAt).map((l) => l.id);
  const last = open.length ? await q(`select session_id, max(occurred_at) as at from kt_evidence where child_id = $1 and session_id = any($2::text[])
      group by session_id`, [childId, open]).catch(() => []) : [];
  const events = last.map((r) => ({ sessionId: String(r.session_id), at: new Date(r.at).toISOString() }));
  const minutesOf = (l) => Math.max(0, Math.round((lessonEndMs(l, events, openUntil) - Date.parse(l.startedAt)) / 60_000));
  return { ...lessonTally(lessons, { from, to }, events, openUntil), all: lessons.map((l) => ({ ...l, counted: countsAsLesson(l), minutes: minutesOf(l) })) };
}

/** PURE. A late correction `<id>:late` replaces the row it corrects (w1c-late-double-count-reports). */
export function supersede(rows) {
  const late = new Set(rows.map((r) => String(r.id)).filter((id) => id.endsWith(":late")).map((id) => id.slice(0, -5)));
  return rows.filter((r) => !late.has(String(r.id)));
}

/** Who graded it, in the parent's words (V2 §4.6: the verified classifier is "exact answer"). */
export const GRADER_WORDS = { code: "exact answer", llm: "checked against the book's key idea", human: "checked by a person" };

/** kt class → the kind of check (PROBE_KIND words on the client). */
const KIND_OF = { "item.open": "practice", "item.mcq2": "choice", "item.mcq3": "choice", "item.mcq4": "choice", solo: "practice",
  "probe.why": "why", "probe.teachback": "teachback", "probe.transfer.near": "near_transfer", "probe.transfer.far": "far_transfer",
  "probe.errorspot": "error_spot", "probe.predict": "predict" };

/**
 * PURE. The result of one engine row, as the six words every surface uses. Hints are the rungs the closed label
 * records (C2 one, C3 two or three, C4 the bottom of the ladder).
 * right: right first time, no help · right_hint: right after a hint · with_help: worked through with full help or
 * ended without a right answer · partly · not_yet · mixup (an answer that matches a known mix-up) · not_sure ("pata nahi")
 */
export function resultOf(cls, outcome, misconceptionId = null) {
  const n = outcomeName(cls, Number(outcome));
  if (n === undefined || n === "NA") return null;
  if (n === "misconception" || n === "mapped_wrong") return { result: "mixup", hints: 0 };
  switch (n) {
    case "C0": case "first_correct": case "full": case "high": case "pass": case "caught_fixed": case "right": return { result: "right", hints: 0 };
    case "C1": return { result: "right", hints: 0, tries: 2 };
    case "C2": return { result: "right_hint", hints: 1 };
    case "C3": return { result: "right_hint", hints: 2 };
    case "C4": return { result: misconceptionId ? "mixup" : "with_help", hints: 4 };
    case "partial": case "mid": case "caught": case "fluent": case "hesitant": return { result: "partly", hints: 0 };
    case "IDK": return { result: "not_sure", hints: 0 };
    default: return { result: misconceptionId ? "mixup" : "not_yet", hints: 0 };
  }
}

/** Result → the legacy outcome word the client's glyphs and the claim rows read (correct | partial | incorrect | misconception). */
const LEGACY = { right: "correct", right_hint: "correct", with_help: "incorrect", partly: "partial", not_yet: "incorrect", not_sure: "incorrect", mixup: "misconception" };

const clean = (r) => !r.teach && !r.contaminated && !r.assisted;

/**
 * PURE. One kt_evidence row (db shape or reports/facts.js shape) → the row every surface shows. null for a teach row
 * or an outcome that is not one (NA). `turnSeq` is the child turn it came from (the event id is `<lesson>:<seq>:<k>`).
 */
export function engineRow(r) {
  const id = String(r.id);
  const cls = r.cls;
  const teach = !!r.teach;
  const at = new Date(r.occurred_at ?? r.at).toISOString();
  const lessonId = String(r.session_id ?? r.sessionId ?? "");
  const skillIds = r.skill_ids ?? r.skillIds ?? [];
  const parts = id.split(":");
  const turnSeq = parts.length >= 3 && /^\d+$/.test(parts[1]) ? Number(parts[1]) : null;
  const misconceptionId = r.misconception_id ?? r.misconceptionId ?? null;
  const base = { id, seq: Number(r.seq ?? 0), lessonId, turnSeq, at, skillIds, cls, teach, grader: r.grader, itemKey: r.item_key ?? r.itemKey ?? null,
    via: r.via ?? null, misconceptionId, contaminated: !!r.contaminated, assisted: r.assisted ?? null,
    preAttemptHelp: !!(r.pre_attempt_help ?? r.preAttemptHelp), entryRung: Number(r.entry_rung ?? r.entryRung ?? 0) || 0, outcomeIndex: Number(r.outcome) };
  if (teach) return { ...base, scored: false, result: null };
  const res = resultOf(cls, r.outcome, misconceptionId);
  if (!res) return { ...base, scored: false, result: null };
  const item = ITEM_CLASSES.has(cls);
  const firstTry = item && res.result === "right" && !res.tries && !base.preAttemptHelp && base.entryRung === 0;
  return {
    ...base, kind: KIND_OF[cls] ?? "practice", result: res.result, hintsUsed: res.hints + (base.preAttemptHelp && res.hints === 0 ? 1 : 0),
    outcome: LEGACY[res.result], scored: clean(base), firstTryUnaided: clean(base) && firstTry,
    graderWords: GRADER_WORDS[r.grader] ?? GRADER_WORDS.llm,
  };
}

/**
 * PURE. Delayed checks of one skill from its engine rows (ascending, teach rows included as contact). A scored row
 * is a delayed check when the previous contact with the skill was another lesson ≥ 20 h earlier (ledger DELAY_MS).
 * @returns {{ passed: boolean, misses: number }}  misses = delayed checks missed in a row since the latest pass
 */
export function foldDelayedKt(rows) {
  let passed = false, misses = 0, prev = null;
  for (const r of [...rows].sort((a, b) => a.seq - b.seq || Date.parse(a.at) - Date.parse(b.at))) {
    if (r.scored && prev && prev.lessonId !== r.lessonId && Date.parse(r.at) - Date.parse(prev.at) >= DELAY_MS) {
      const ok = isDelayedSuccess(r.cls, r.outcomeIndex) && !r.preAttemptHelp && r.entryRung === 0;
      if (ok) { passed = true; misses = 0; } else if (passed) misses += 1;
    }
    prev = r;
  }
  return { passed, misses };
}

const LEARNED = new Set(["learned_today", "mastered", "due"]);
/**
 * PURE. The ONE state word per skill (V2 §6.4 table; R11): the ledger projection (skill_state row) read with the
 * engine's delayed checks — and "Not started" whenever the engine has no scored row on the skill. An `introduced`
 * skill (taught, never tried) is therefore never a sprout (flows G7: "Practising" with no answers).
 * @param {any} row skill_state row or null  @param {any[]} rows engineRow()s on this skill
 * @returns {{ level: 0|1|2|3, key: "unseen"|"practising"|"learned_today"|"mastered", recheck: boolean, counted: number }}
 */
export function skillTruth(row, rows = []) {
  const counted = rows.filter((r) => r.scored).length;
  if (!counted) return { level: 0, key: "unseen", recheck: false, counted: 0 };
  const dc = foldDelayedKt(rows);
  const s = row?.status ?? "practising";
  const out = (level, key, recheck = false) => ({ level, key, recheck, counted });
  if (LEARNED.has(s) && dc.passed && dc.misses === 1) return out(3, "mastered", true);
  if (LEARNED.has(s) && dc.passed && dc.misses >= 2) return out(2, "learned_today");
  if (s === "mastered") return out(3, "mastered");
  if (s === "learned_today") return out(2, "learned_today");
  if (s === "due") return row.delayed_pass ? out(3, "mastered") : out(2, "learned_today");
  return out(1, "practising");
}

/**
 * PURE. A topic's state from its skills' skillTruth states (Progress row, map chapter): Secure when every kit skill
 * is Secure; Got it when every kit skill is Got it or Secure; Practising when any skill has a scored row; else Not
 * started. `skillCount` = the kit's skills (a topic whose untried skills have no row is not "Got it").
 */
export function topicTruth(states, skillCount = 0) {
  const n = Math.max(skillCount, states.length);
  const tried = states.filter((s) => s.level > 0);
  if (!tried.length) return { level: 0, key: "unseen" };
  if (tried.length >= n && tried.every((s) => s.level === 3)) return { level: 3, key: "mastered" };
  if (tried.length >= n && tried.every((s) => s.level >= 2)) return { level: 2, key: "learned_today" };
  return { level: 1, key: "practising" };
}

/** The map's four shapes from the one state key (§4.8). */
export const MAP_SHAPE = { unseen: "not_started", practising: "practising", learned_today: "got_it", mastered: "secure" };

const KT_COLS = "id, seq, session_id, occurred_at, skill_ids, cls, outcome, grader, item_key, teach, pre_attempt_help, entry_rung, misconception_id, via, contaminated, assisted";

/**
 * The child's engine rows, superseded corrections removed, grouped by skill; and a state reader over the projection.
 * @param {{ id: string }} child  @param {{ skillIds?: string[]|null, q?: Function }} [o]
 */
export async function loadTruth(child, { skillIds = null, q = dbq } = {}) {
  const [kt, proj] = await Promise.all([
    q(`select ${KT_COLS} from kt_evidence where child_id = $1 and ($2::text[] is null or skill_ids && $2::text[]) order by seq`, [child.id, skillIds]).catch((e) => {
      if (e?.code === "42P01") return [];
      throw e;
    }),
    q("select * from skill_state where child_id = $1 and ($2::text[] is null or skill_id = any($2::text[]))", [child.id, skillIds]),
  ]);
  const rows = supersede(kt).map(engineRow);
  const bySkill = new Map();
  for (const r of rows) for (const s of r.skillIds) { if (!bySkill.has(s)) bySkill.set(s, []); bySkill.get(s).push(r); }
  const projBy = new Map(proj.map((r) => [r.skill_id, r]));
  return {
    rows, bySkill, projection: projBy,
    rowsOf: (id) => bySkill.get(id) ?? [],
    state: (id) => skillTruth(projBy.get(id) ?? null, bySkill.get(id) ?? []),
    /** skill ids the child has a scored engine row on (the only skills a surface may name with a state) */
    triedSkills: () => [...bySkill].filter(([, v]) => v.some((r) => r.scored)).map(([k]) => k),
  };
}

/** Claim rows (src/parent/claims.ts ClaimRow: at, outcome, hintsUsed) from engine rows, newest first; scored only. */
export const claimRows = (rows) => rows.filter((r) => r.scored).sort((a, b) => Date.parse(b.at) - Date.parse(a.at))
  .map((r) => ({ at: r.at, outcome: r.firstTryUnaided ? "correct" : r.outcome === "correct" && r.hintsUsed === 0 ? "partial" : r.outcome, hintsUsed: r.hintsUsed }));

/** The ONE next-topic function (child home, parent "Next lesson", the child's and the parent's "Next time"). */
export const nextTopicOf = (child) => nextTopicFor(child).catch(() => null);

// ───────────────────────────── lesson summary from facts, and its claim check ─────────────────────────────

/**
 * PURE. A lesson's summary lines, built ONLY from its engine rows (no model prose): how many questions were tried,
 * how many right first time with no help, how many right after a hint, how many explained in own words. Counts are
 * over EPISODES (one item attempt chain, the engine's own unit), so a repaired non-answer is never an extra "right".
 * @param {{ topicTitle: string|null, rows: any[] }} f  rows: engineRow()s of THIS lesson (any skill)
 * @returns {{ lines: { key: string, n?: number, k?: number }[], counts: { tried: number, firstTry: number, withHint: number, explained: number } }}
 */
export function lessonFactsSummary({ topicTitle, rows }) {
  const scored = rows.filter((r) => r.scored);
  const items = scored.filter((r) => ITEM_CLASSES.has(r.cls));
  const firstTry = items.filter((r) => r.firstTryUnaided).length;
  const withHint = items.filter((r) => r.result === "right_hint" || (r.result === "right" && !r.firstTryUnaided)).length;
  const explained = scored.filter((r) => (r.cls === "probe.why" || r.cls === "probe.teachback") && r.result === "right" && r.via !== "game").length;
  const counts = { tried: items.length, firstTry, withHint, explained };
  const lines = [];
  if (topicTitle) lines.push({ key: "topic" });
  if (!items.length) lines.push({ key: "none_checked" });
  else {
    lines.push({ key: "tried", n: items.length });
    if (firstTry) lines.push({ key: "first_try", k: firstTry, n: items.length });
    if (withHint) lines.push({ key: "with_hint", k: withHint, n: items.length });
  }
  if (explained) lines.push({ key: "explained", k: explained });
  return { lines, counts };
}

/** English renders of the summary lines (the parent card; Hinglish/Hindi ride the reports' renderers later). */
export function renderSummaryLine(l, { name, topicTitle }) {
  const qs = (n) => `${n} ${n === 1 ? "question" : "questions"}`;
  switch (l.key) {
    case "topic": return `${name} practised ${topicTitle}.`;
    case "none_checked": return "No answers were checked in this lesson.";
    case "tried": return `Tried ${qs(l.n)}.`;
    case "first_try": return `Right on the first try, with no help: ${l.k} of ${l.n}.`;
    case "with_hint": return `Right after a hint or a second try: ${l.k} of ${l.n}.`;
    case "explained": return `Explained the idea in ${name}'s own words ${l.k === 1 ? "once" : `${l.k} times`}.`;
    default: throw new Error(`unknown summary line ${l.key}`);
  }
}

/**
 * INDEPENDENT claim check of a summary against the RAW kt_evidence rows of the lesson (db shape). It re-derives every
 * count with its own reading of the closed labels (written out here, not imported from engineRow), so a bug in the
 * builder cannot confirm itself. Returns the reasons it fails ([] = every line holds).
 */
export function summaryClaimsHold(summary, rawRows) {
  const NAMES = { "item.open": ["C0", "C1", "C2", "C3", "C4", "IDK", "NA"], "item.mcq2": ["first_correct", "wrong"], "item.mcq3": ["first_correct", "wrong"],
    "item.mcq4": ["first_correct", "wrong"], solo: ["C0", "C1", "fail"] };
  const late = new Set(rawRows.map((r) => String(r.id)).filter((id) => id.endsWith(":late")).map((id) => id.slice(0, -5)));
  const live = rawRows.filter((r) => !late.has(String(r.id)) && !r.teach && !r.contaminated && !r.assisted);
  const nm = (r) => NAMES[r.cls]?.[Number(r.outcome)];
  const items = live.filter((r) => NAMES[r.cls] && nm(r) !== undefined && nm(r) !== "NA");
  const first = items.filter((r) => ["C0", "first_correct"].includes(nm(r)) && !r.pre_attempt_help && !(Number(r.entry_rung) > 0)).length;
  const hint = items.filter((r) => ["C1", "C2", "C3"].includes(nm(r)) || (["C0", "first_correct"].includes(nm(r)) && (r.pre_attempt_help || Number(r.entry_rung) > 0))).length;
  const why = [];
  for (const l of summary.lines) {
    if (l.key === "tried" && l.n !== items.length) why.push(`tried ${l.n} ≠ ${items.length}`);
    if (l.key === "first_try" && (l.k !== first || l.n !== items.length)) why.push(`first_try ${l.k}/${l.n} ≠ ${first}/${items.length}`);
    if (l.key === "with_hint" && (l.k !== hint || l.n !== items.length)) why.push(`with_hint ${l.k}/${l.n} ≠ ${hint}/${items.length}`);
    if (l.key === "none_checked" && items.length) why.push("none_checked but items were scored");
    if ((l.k ?? 0) > (l.n ?? Infinity)) why.push(`${l.key}: k > n`);
  }
  if (items.length && !summary.lines.some((l) => l.key === "tried")) why.push("items scored but no tried line");
  if (first && !summary.lines.some((l) => l.key === "first_try")) why.push("first-try successes not stated");
  return why;
}
