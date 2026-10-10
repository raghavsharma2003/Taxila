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
import { relLessonEndStmts, memoryForgetStmt } from "./writers.js";
// round 3 (relational-human): the memory she uses (callbacks), its claim check and the truth about what she keeps
import { callbackCandidates, claimProblem, keepsOf } from "./memory.js";
import { getKit, getTopic } from "../content/index.js";

/** @typedef {{ text: string, params?: unknown[] }} Stmt */

const LESSON_TTL_MS = 6 * 3600_000, PENDING_TTL_MS = 30 * 60_000, MAX_LESSONS = 5000;
/** lessonId → { childId, snapshot, session, lastTurn, before, directives: Map<turn, directive>, at } */
const lessons = new Map();
/** childId → { snapshot, at }: the start's snapshot, bound to the lesson on its first turn (start has no lesson id yet). */
const pending = new Map();
/** Do the 018 tables exist? null = not probed yet (probed once at module load when a database is configured, else by snapshot). */
let tablesReady = null;
/** Classifier distress kinds that are harm (a disclosure), not pleading or loneliness. */
const HARM_KINDS = new Set(["self_harm", "abuse", "fear"]);
/** Lesson ends that found no in-memory session (a restart or another replica): counted so the loss is measured. */
let missedEnds = 0;

function sweep(now = Date.now()) {
  for (const [k, v] of lessons) if (now - v.at > LESSON_TTL_MS) lessons.delete(k);
  for (const [k, v] of pending) if (now - v.at > PENDING_TTL_MS) pending.delete(k);
  while (lessons.size > MAX_LESSONS) lessons.delete(lessons.keys().next().value);
}

async function probeTables() {
  if (tablesReady != null) return tablesReady;
  try {
    const r = await one("select to_regclass('public.rel_bond') is not null as b, to_regclass('public.relational_note') is not null as n");
    const v = !!(r?.b && r?.n);
    if (tablesReady == null) tablesReady = v;       // a test hook or a newer probe that already set it wins
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

// Probe the 018 tables once at server start (not only on the first lesson start in this process), so a lesson end on a
// replica or after a restart still writes its bond rows. Never awaited, never throws; no database configured = no probe.
if ((process.env.DATABASE_URL || process.env.TAXILA_DB) && !process.env.NODE_TEST_CONTEXT) probeTables().catch(() => {});

/**
 * Round 3: the record the callbacks are built from (memory.js callbackCandidates), read at lesson start under the parent's
 * choices: the LEARNING record of the last lesson (the learning_profile consent: what took a few tries and came good, what
 * they explained, what is still being learnt) and, under the memory consent, the child's cited memory rows and the
 * interests the parent chose. Never the transcript, never a third party, never time since the last lesson.
 */
async function memoryRecord(child, last) {
  const consent = await q(`select distinct on (purpose) purpose, granted from consent where guardian_id = $1 and (child_id = $2 or child_id is null)
      and purpose in ('learning_profile', 'memory') order by purpose, created_at desc`, [child.guardian_id, child.id]).catch(() => []);
  const granted = (p) => !!consent.find((r) => r.purpose === p)?.granted;
  const allow = { learning: granted("learning_profile"), memory: granted("memory") };
  let lastLesson = null;
  if (allow.learning && last?.id) {
    const rows = await q(`with ev as (select seq, skill_ids[1] as skill, cls, outcome, pre_attempt_help, entry_rung from kt_evidence
        where child_id = $1 and session_id = $2 and not contaminated),
      g as (select skill,
        count(*) filter (where (cls = 'item.open' or cls like 'item.mcq%') and outcome <> 0 and not (cls = 'item.open' and outcome = 6))::int as wrong,
        count(*) filter (where (cls = 'item.open' or cls like 'item.mcq%') and outcome = 0 and not pre_attempt_help and entry_rung = 0)::int as unaided,
        min(seq) filter (where (cls = 'item.open' or cls like 'item.mcq%') and outcome <> 0 and not (cls = 'item.open' and outcome = 6)) as first_wrong,
        max(seq) filter (where (cls = 'item.open' or cls like 'item.mcq%') and outcome = 0 and not pre_attempt_help and entry_rung = 0) as last_unaided,
        bool_or(cls = 'probe.teachback' and outcome = 0) as explained
        from ev group by skill)
      select * from g order by skill`, [child.id, String(last.id)]);
    const kit = last.topic_id ? await getKit(last.topic_id, { generate: false }).catch(() => null) : null;
    const titleOf = (id) => kit?.skills?.find((k) => k.id === id)?.title ?? null;
    lastLesson = {
      lessonId: String(last.id), topicId: String(last.topic_id ?? ""), topicTitle: getTopic(last.topic_id)?.title ?? kit?.title ?? "",
      skills: rows.map((r) => ({ skillId: r.skill, title: titleOf(r.skill), wrong: r.wrong, unaided: r.unaided, explained: !!r.explained,
        unaidedAfterWrong: r.wrong > 0 && r.last_unaided != null && Number(r.last_unaided) > Number(r.first_wrong) })).filter((x) => x.title),
    };
  }
  const memories = allow.memory
    ? await q(`select m.id, m.kind, m.text, t.lesson_id from memory m left join turn t on t.id = m.source_turn
        where m.child_id = $1 and m.superseded_by is null order by m.created_at desc limit 3`, [child.id]).catch(() => [])
    : [];
  const interests = allow.memory && Array.isArray(child.interests) ? child.interests.map(String) : [];
  return { allow, callbacks: callbackCandidates({ last: lastLesson, memories: memories.map((m) => ({ id: m.id, kind: m.kind, text: m.text, lessonId: m.lesson_id })), interests, allow }) };
}

/** A question about her memory ("yaad hai maine … bataya tha?", "do you remember …?"): it presupposes, it is not a fact. */
const memoryQuestion = (t) => /(?<![\p{L}\p{M}])(?:yaad|remember|याद)(?![\p{L}\p{M}])/iu.test(t) && /[?？]\s*$|^(?:kya|do you|did you|yaad hai|क्या|याद है)/iu.test(String(t).trim());

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
    const child = await one("select c.id, c.guardian_id, c.legal_mode, c.teacher_id, c.teacher_name, c.first_name, c.interests, cc.address from child c left join child_controls cc on cc.child_id = c.id where c.id = $1", [childId]);
    if (!child) return null;
    const legalMode = legalModeOf(child.legal_mode);
    const agentId = String(child.teacher_id ?? "asha");
    const [row, counts, last] = legalMode === "M0" ? [null, null, null] : await Promise.all([
      one("select * from rel_bond where child_id = $1 and agent_id = $2", [childId, agentId]),
      one(COUNTS_SQL, [childId]).catch(() => null),
      one(`select l.id, l.topic_id, l.state->>'endedBy' as ended_by, l.state->'lastMove'->>'kind' as last_move,
             exists (select 1 from incident i where i.lesson_id = l.id and i.kind = 'safeguarding') as safeguard
           from lesson l where l.child_id = $1 and l.ended_at is not null order by l.ended_at desc limit 1`, [childId]).catch(() => null),
    ]);
    // round 3: the record she may call back to (memory.js), read under the parent's choices; nothing in M0
    const mem = legalMode === "M0" ? null : await memoryRecord(child, last).catch((e) => { console.warn("[relational] memory record unavailable:", e?.message); return null; });
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
      christened: [], milestonesFired: [...(row?.milestones ?? [])], rituals: { ...(row?.rituals ?? {}) }, callbacks: mem?.callbacks ?? [],
      keeps: keepsOf(mem?.allow ?? { learning: legalMode !== "M0", memory: false }), allow: mem?.allow ?? null,
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
        session: initRelSession(), lastTurn: -1, before: null, directives: new Map(), at: Date.now(), childTexts: [] };
      lessons.set(input.lessonId, entry);
    }
    // The same turn again (a retry, a replay): the same directive, folded from the same session.
    if (turn === entry.lastTurn && entry.directives.has(turn)) return entry.directives.get(turn);
    if (turn < entry.lastTurn) return entry.directives.get(turn) ?? null;
    const childText = String(input.childText ?? "");
    // round 3: this lesson's own child words (in memory only, die with the lesson): the claim check's in-session facts
    // (a memory QUESTION is not a fact: "yaad hai maine apne kutte ke baare mein bataya tha?" never backs "haan, tumne
    // kutte ke baare mein bataya tha" — memory-2day 2026-10-09, before arm, P4)
    if (childText && !memoryQuestion(childText)) entry.childTexts = [...(entry.childTexts ?? []), childText.slice(0, 400)].slice(-40);
    // harm: false — the turn already ran the safety gate on these words; its verdict arrives as input.safety
    // harm: on a safeguarding turn the predicate runs here too (and a classifier-only disclosure counts), so a disclosure
    // said with pleading ("mat jao didi, papa mujhe roz maarte hain") is new distress whose goodbye still gets its own
    // check-in (I-7; fixer review 2026-10-05). On every other turn the gate's verdict already said no harm.
    const signals = signalsOf(childText, { turn, lane: input.lane === "voice" ? "L" : "typed", harm: input.safety ? undefined : false });
    if (input.safety && HARM_KINDS.has(input.cls?.flags?.distressKind) && !signals.some((s) => s.kind === "harm")) signals.push({ kind: "harm", turn, lane: "typed", confidence: "lexical" });
    const flags = input.cls?.flags ?? {};
    if (flags.humour && !signals.some((s) => s.kind === "joke")) signals.push({ kind: "joke", turn, lane: "typed", confidence: "lexical" });
    if (flags.personalShare && !signals.some((s) => s.kind === "share" || s.kind === "share_sad")) signals.push({ kind: "share", turn, lane: "typed", confidence: "lexical" });
    const outcome = flags.dontKnow ? "dont_know" : input.cls?.outcome ?? null;
    const { directive, session } = policyDecide(entry.snapshot, entry.session, signals, {
      turn, move: input.move, safety: !!input.safety, lane: input.lane, outcome, words: wordCount(childText),
      verdictReversed: !!input.verdictReversed, band: bandOf(entry.classLevel), classLevel: entry.classLevel, skillId: input.skillId ?? null,
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
   * Round 3: the callback the kernel accepted, as the compile needs it ({ id, kind, fragment }: a closed note), or null.
   * @param {string} lessonId @param {string} id
   */
  callbackOf(lessonId, id) {
    const c = (lessons.get(lessonId)?.snapshot?.callbacks ?? []).find((x) => x.id === id);
    // lead: a memory about the CHILD (their learning, a win) is said first, in a few words (the compile puts it in the last
    // section: position is mechanism — mid-brief it was voiced 0/3 in the opener, memory-2day 2026-10-09); an interest the
    // parent chose (P) is the setting of an example, not something to announce
    return c ? { id: c.id, kind: c.kind, fragment: c.fragment, lead: c.kind !== "P" } : null;
  },

  /**
   * Round 3, the post-hoc claim check (F9, RELATIONAL-OS §8.5): a sentence of her reply that refers to the child's past
   * with nothing in the record behind it (not the callback this turn carried, not this lesson's own words; in a first
   * meeting any "last time"). Pure over in-memory state; null = clean. The turn turns a hit into next turn's correction.
   * @param {string} lessonId @param {string} reply @param {{ turn?: number }} [o]
   */
  claimCheck(lessonId, reply, o = {}) {
    const entry = lessons.get(lessonId);
    const turn = Number(o.turn ?? entry?.lastTurn);
    const cbId = entry?.directives.get(turn)?.callbackId ?? null;
    const callback = cbId ? (entry?.snapshot?.callbacks ?? []).find((x) => x.id === cbId) ?? null : null;
    const sessions = entry?.snapshot?.sessions;
    return claimProblem(reply, { callback, sessionText: (entry?.childTexts ?? []).join(" "), ...(sessions != null ? { hasPast: Number(sessions) >= 1 } : {}) });
  },

  /**
   * @param {{ id: string, class_level?: number, legal_mode?: string, teacher_id?: string }} child
   * @param {import("../../shared/relational").RelLessonEnd} end
   * @returns {Stmt[]}
   */
  onLessonEnd(child, end) {
    const entry = lessons.get(end?.lessonId);
    lessons.delete(end?.lessonId);                 // the session dies with the lesson, whatever is written
    if (!entry && Number(end?.turns) >= 1) {
      missedEnds += 1;
      console.warn(`[relational] lesson end with no session in this process (${missedEnds} so far): restart or another replica; session-only notes for ${end?.lessonId} are lost`);
    }
    // round 3: the child asked her not to keep what they said: this lesson's memories go (after the end's own inserts, in
    // the same transaction). Independent of the relational tables' probe and the mode: deleting is always allowed.
    let forget = [];
    if (entry?.session?.forgetAsked && child?.id && child.legal_mode != null) {
      // round 3 fix (adversarial B3): every memory row she had in hand this lesson (snapshot callbacks W:mem:<id>)
      const held = (entry.snapshot?.callbacks ?? []).filter((c) => String(c.id).startsWith("W:mem:")).map((c) => String(c.id).slice("W:mem:".length));
      try { forget = [memoryForgetStmt(child, end.lessonId, held)]; } catch (e) { console.warn("[relational] forget request not applied:", e?.message); }
    }
    if (!child?.id || child.legal_mode == null || tablesReady !== true) return forget;
    if (legalModeOf(child.legal_mode) === "M0") return forget;
    if (!(Number(end?.turns) >= 1)) return forget;     // nothing happened in this lesson: no session is counted
    const snap = entry?.snapshot ?? null;
    const s = entry?.session ?? initRelSession();
    const agentId = String(child.teacher_id ?? snap?.agentId ?? "asha");
    const stageTo = snap ? (snap.stageUp?.to ?? snap.stage) : "first_sessions";
    const overlay = legalModeOf(child.legal_mode) === "M3" ? {
      warmth: s.climate.warmthOffers, permanence: s.climate.permanenceAsks, secret: s.climate.secretAsks, night: s.climate.nightAsks,
      goodbyeDistress: s.notes.filter((n) => n.kind === "boundary_goodbye").length, loneliness: s.climate.lonelySays,
    } : null;
    // the parent's note (memory_forgotten) is written with the other notes; the forget delete goes last
    return [...relLessonEndStmts(child, {
      agentId, lessonId: end.lessonId, lastTurn: Number(end.turns) || 0,
      stageFrom: snap?.stage ?? "meeting", stageTo: stageRank(stageTo) < 1 ? "first_sessions" : stageTo,
      teacherEvents: s.teacherEvents.map((e) => ({ kind: e.kind, owned: e.owned, turn: e.turn })),
      notes: s.notes.map((n) => ({ kind: n.kind, slots: n.slots, turn: n.turn })),
      overlay: overlay && Object.values(overlay).some((v) => v > 0) ? overlay : null,
    }), ...forget];
  },
};

/** Test hooks: the in-memory state (never used by the lesson). */
export const __relTest = {
  reset() { lessons.clear(); pending.clear(); tablesReady = null; missedEnds = 0; },
  missedEnds() { return missedEnds; },
  setTablesReady(v) { tablesReady = v; },
  session(lessonId) { return lessons.get(lessonId)?.session ?? null; },
  stash(childId, snapshot) { pending.set(String(childId), { snapshot, classLevel: snapshot?.classLevel ?? 5, lang: snapshot?.lang ?? "hinglish", at: Date.now() }); },
};
