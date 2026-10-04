// The Relational OS seam into the live lesson (BUILD-PLAN §4, W2 seam commit; FILLED BY W2-I, 2026-10-04). Call sites are
// owned by W2-E (server/routes/lesson.js start/end; server/brain/turn.js after the plan; BR5's relational-adapter.js splits
// the directive into the kernel's authority ranks). Contract, binding on this module:
//   - snapshot(childId) is called ONCE per lesson at start, beside the other start reads; it may read the DB, it never
//     throws into the start (the call site guards it) and it returns null when the 018 tables are not there yet (a
//     revision deployed before its migration behaves exactly like the pre-seam lesson);
//   - decide(input) is PURE CODE and SYNCHRONOUS (≤ 3 ms p99, 0 network; RELATIONAL-OS R1): one RelationalDirective per
//     turn, or null for "no relational move" (the turn is then byte-identical to the pre-seam turn). The per-lesson
//     session state it folds lives in memory here and dies with the lesson (NM-3: never persisted, every mode);
//   - onLessonEnd returns statements ({ text, params }) appended to the end transaction AFTER the caller's own rows,
//     exactly like server/conductor/hooks.js: no network, no await, never throws, [] when there is nothing to write;
//   - the relational floor (F1-F6, F8-F9) ranks first in the kernel's order; nothing here weakens the child-safety floor
//     (never deny being an AI, Childline 1098 / Tele-MANAS 14416, no romance or companion register, safeguarding
//     hand-off); teacher affect is never keyed to a correct verdict (TA7).
//
// Replicas: the session map is per process. A turn that lands on a replica that did not see the lesson start folds from
// an empty session with no snapshot (it still honours a goodbye, every boundary and the safety floor: those read only the
// child's words); a lesson end on such a replica writes no bond rows for that lesson (the next lesson's snapshot is still
// exact: the cache is only ever moved by complete end transactions).
import { q, one } from "../db.js";
import { legalModeOf } from "../learner/mode.js";
import { BANDS } from "../learner/bands.js";
import { STAGES, stageFor, stageRank } from "./bond.js";
import { decide as policyDecide } from "./policy.js";
import { initRelSession } from "./session.js";
import { signalsOf, wordCount } from "./signals.js";
import { relLessonEndStmts } from "./writers.js";

/** @typedef {{ text: string, params?: unknown[] }} Stmt */

const LESSON_TTL_MS = 6 * 3600_000, PENDING_TTL_MS = 30 * 60_000, MAX_LESSONS = 5000;
/** lessonId → { childId, snapshot, session, lastTurn, before, directives: Map<turn, directive>, at } */
const lessons = new Map();
/** childId → { snapshot, at }: the start's snapshot, bound to the lesson on its first turn (start has no lesson id yet). */
const pending = new Map();
/** Do the 018 tables exist? null = not probed yet (probed once per process by snapshot). */
let tablesReady = null;

function sweep(now = Date.now()) {
  for (const [k, v] of lessons) if (now - v.at > LESSON_TTL_MS) lessons.delete(k);
  for (const [k, v] of pending) if (now - v.at > PENDING_TTL_MS) pending.delete(k);
  while (lessons.size > MAX_LESSONS) lessons.delete(lessons.keys().next().value);
}

async function probeTables() {
  if (tablesReady != null) return tablesReady;
  try {
    const r = await one("select to_regclass('public.rel_bond') is not null as b, to_regclass('public.relational_note') is not null as n");
    tablesReady = !!(r?.b && r?.n);
  } catch {
    tablesReady = null;               // no database reachable: probe again next start, write nothing meanwhile
    return false;
  }
  return tablesReady;
}

const bandOf = (classLevel) => BANDS[Number(classLevel)]?.b4 ?? "B3";
const langOf = (lang) => (lang === "english" || lang === "hindi" ? lang : "hinglish");

/**
 * The academic-record counts the stage gates read (§5.2), from kt_evidence: lessons with an unaided correct attempt after
 * a not-yet on the same item, explain-back passes (probe.teachback "high" = outcome 0) and the skills they cover.
 * item.open C0 = outcome 0; mcq first_correct = 0; a not-yet is any other graded outcome except NA (item.open 6).
 */
const COUNTS_SQL = `with ev as (
    select seq, session_id, item_key, cls, outcome, skill_ids, pre_attempt_help, entry_rung, contaminated
    from kt_evidence where child_id = $1 and not contaminated)
  select
    (select count(distinct e.session_id)::int from ev e
       where (e.cls = 'item.open' or e.cls like 'item.mcq%') and e.outcome = 0 and not e.pre_attempt_help and e.entry_rung = 0
         and exists (select 1 from ev p where p.item_key = e.item_key and p.seq < e.seq and (p.cls = 'item.open' or p.cls like 'item.mcq%')
                     and p.outcome <> 0 and not (p.cls = 'item.open' and p.outcome = 6))) as retry,
    (select count(*)::int from ev where cls = 'probe.teachback' and outcome = 0) as eb,
    (select count(distinct skill_ids[1])::int from ev where cls = 'probe.teachback' and outcome = 0) as ebt`;

export const relationalSeam = {
  /**
   * @param {string} childId
   * @param {{ classLevel: number, lang?: string }} [opts]
   * @returns {Promise<import("../../shared/relational").BondSnapshot | null>}
   */
  async snapshot(childId, opts = {}) {
    sweep();
    if (!/^[0-9a-f-]{36}$/i.test(String(childId ?? ""))) return null;
    const classLevel = Number(opts.classLevel) || 5;
    const lang = langOf(opts.lang);
    if (!(await probeTables())) {
      // No bond record yet (pre-migration revision, or no DB): the session still runs (boundaries, goodbye, safety).
      pending.set(String(childId), { snapshot: null, classLevel, lang, at: Date.now() });
      return null;
    }
    const child = await one("select c.id, c.legal_mode, c.teacher_id, c.teacher_name, c.first_name, cc.address from child c left join child_controls cc on cc.child_id = c.id where c.id = $1", [childId]);
    if (!child) return null;
    const legalMode = legalModeOf(child.legal_mode);
    const agentId = String(child.teacher_id ?? "asha");
    const [row, counts, last] = legalMode === "M0" ? [null, null, null] : await Promise.all([
      one("select * from rel_bond where child_id = $1 and agent_id = $2", [childId, agentId]),
      one(COUNTS_SQL, [childId]).catch(() => null),
      one(`select l.state->>'endedBy' as ended_by, l.state->'lastMove'->>'kind' as last_move,
             exists (select 1 from incident i where i.lesson_id = l.id and i.kind = 'safeguarding') as safeguard
           from lesson l where l.child_id = $1 and l.ended_at is not null order by l.ended_at desc limit 1`, [childId]).catch(() => null),
    ]);
    const stage = STAGES.includes(row?.stage) ? row.stage : "meeting";
    const span = row?.first_day ? Math.floor((Date.now() - new Date(row.first_day).getTime()) / 86_400_000) : 0;
    const earned = stageFor({ sessions: Number(row?.sessions ?? 0), distinctDays: Number(row?.distinct_days ?? 0), spanDays: span,
      retryAfterNotYetLessons: Number(counts?.retry ?? 0), explainBackPasses: Number(counts?.eb ?? 0), explainBackTopics: Number(counts?.ebt ?? 0),
      teacherOpen: !!row?.teacher_open }, stage);
    /** @type {import("../../shared/relational").BondSnapshot} */
    const snap = {
      agentId, childId: String(childId), legalMode, stage, stageSince: row?.stage_since ? new Date(row.stage_since).toISOString() : new Date(0).toISOString(),
      sessions: Number(row?.sessions ?? 0), distinctDays: Number(row?.distinct_days ?? 0),
      address: { teacherCallsChild: { name: row?.address?.teacherCallsChild ?? String(child.first_name ?? ""), source: row?.address?.teacherCallsChild ? "child_said" : "guardian" },
        childCallsTeacher: child.teacher_name ?? null, pronoun: child.address === "aap" ? "aap" : "tum" },
      teacherOpen: row?.teacher_open ? { eventId: String(row.teacher_open.eventId), kind: row.teacher_open.kind, ackedAtOpen: false } : null,
      christened: [], milestonesFired: [...(row?.milestones ?? [])], rituals: { ...(row?.rituals ?? {}) }, callbacks: [],
      lastEnd: !last ? null : last.safeguard ? "safeguard" : last.ended_by === "pagehide" ? "disconnect" : last.last_move === "wrap" ? "completed" : "child_exit",
      overlayOn: false, stageUp: stageRank(earned) > stageRank(stage) ? { from: stage, to: earned } : null, classLevel, lang,
    };
    pending.set(String(childId), { snapshot: snap, classLevel, lang, at: Date.now() });
    return snap;
  },

  /**
   * @param {import("../../shared/relational").RelDecideInput} input
   * @returns {import("../../shared/relational").RelationalDirective | null}
   */
  decide(input) {
    if (!input || !input.lessonId) return null;
    const turn = Number(input.turn) || 0;
    let entry = lessons.get(input.lessonId);
    if (!entry) {
      const p = pending.get(String(input.childId));
      pending.delete(String(input.childId));
      entry = { childId: String(input.childId), snapshot: p?.snapshot ?? null, classLevel: p?.snapshot?.classLevel ?? p?.classLevel ?? 5,
        session: initRelSession(), lastTurn: -1, before: null, directives: new Map(), at: Date.now() };
      lessons.set(input.lessonId, entry);
    }
    // The same turn again (a retry, a replay): the same directive, folded from the same session.
    if (turn === entry.lastTurn && entry.directives.has(turn)) return entry.directives.get(turn);
    if (turn < entry.lastTurn) return entry.directives.get(turn) ?? null;
    const childText = String(input.childText ?? "");
    // harm: false — the turn already ran the safety gate on these words; its verdict arrives as input.safety
    const signals = signalsOf(childText, { turn, lane: input.lane === "voice" ? "L" : "typed", harm: false });
    const flags = input.cls?.flags ?? {};
    if (flags.humour && !signals.some((s) => s.kind === "joke")) signals.push({ kind: "joke", turn, lane: "typed", confidence: "lexical" });
    if (flags.personalShare && !signals.some((s) => s.kind === "share" || s.kind === "share_sad")) signals.push({ kind: "share", turn, lane: "typed", confidence: "lexical" });
    const outcome = flags.dontKnow ? "dont_know" : input.cls?.outcome ?? null;
    const { directive, session } = policyDecide(entry.snapshot, entry.session, signals, {
      turn, move: input.move, safety: !!input.safety, lane: input.lane, outcome, words: wordCount(childText),
      verdictReversed: !!input.verdictReversed, band: bandOf(entry.classLevel), classLevel: entry.classLevel,
    });
    entry.before = entry.session;
    entry.session = session;
    entry.lastTurn = turn;
    entry.at = Date.now();
    entry.directives.set(turn, directive);
    if (entry.directives.size > 4) entry.directives.delete(entry.directives.keys().next().value);
    return directive;
  },

  /**
   * @param {{ id: string, class_level?: number, legal_mode?: string, teacher_id?: string }} child
   * @param {import("../../shared/relational").RelLessonEnd} end
   * @returns {Stmt[]}
   */
  onLessonEnd(child, end) {
    const entry = lessons.get(end?.lessonId);
    lessons.delete(end?.lessonId);                 // the session dies with the lesson, whatever is written
    if (!child?.id || child.legal_mode == null || tablesReady !== true) return [];
    if (legalModeOf(child.legal_mode) === "M0") return [];
    if (!(Number(end?.turns) >= 1)) return [];     // nothing happened in this lesson: no session is counted
    const snap = entry?.snapshot ?? null;
    const s = entry?.session ?? initRelSession();
    const agentId = String(child.teacher_id ?? snap?.agentId ?? "asha");
    const stageTo = snap ? (snap.stageUp?.to ?? snap.stage) : "first_sessions";
    const overlay = legalModeOf(child.legal_mode) === "M3" ? {
      warmth: s.climate.warmthOffers, permanence: s.climate.permanenceAsks, secret: s.climate.secretAsks, night: s.climate.nightAsks,
      goodbyeDistress: s.notes.filter((n) => n.kind === "boundary_goodbye").length, loneliness: s.climate.lonelySays,
    } : null;
    return relLessonEndStmts(child, {
      agentId, lessonId: end.lessonId, lastTurn: Number(end.turns) || 0,
      stageFrom: snap?.stage ?? "meeting", stageTo: stageRank(stageTo) < 1 ? "first_sessions" : stageTo,
      teacherEvents: s.teacherEvents.map((e) => ({ kind: e.kind, owned: e.owned, turn: e.turn })),
      notes: s.notes.map((n) => ({ kind: n.kind, slots: n.slots, turn: n.turn })),
      overlay: overlay && Object.values(overlay).some((v) => v > 0) ? overlay : null,
    });
  },
};

/** Test hooks: the in-memory state (never used by the lesson). */
export const __relTest = {
  reset() { lessons.clear(); pending.clear(); tablesReady = null; },
  setTablesReady(v) { tablesReady = v; },
  session(lessonId) { return lessons.get(lessonId)?.session ?? null; },
  stash(childId, snapshot) { pending.set(String(childId), { snapshot, classLevel: snapshot?.classLevel ?? 5, lang: snapshot?.lang ?? "hinglish", at: Date.now() }); },
};
