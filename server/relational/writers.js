// Relational writers (RELATIONAL-OS R0, §5.4; BUILD-PLAN W2-I #1): one named writer per table, each asserting its legal-mode
// layer before it builds a statement (an M0 child has NO relational write path; rel_overlay_window has none below M3).
// Re-exported by server/learner/writer.js, so every learner/relational write has one import point.
//
// One lesson end = the events of that lesson appended to rel_event, then ONE UPSERT of the rel_bond cache that folds
// exactly those events (mirroring server/relational/bond.js applyLessonEnd), then the parent-visible notes. Everything
// runs inside the lesson end's single transaction (lesson.js end(): `tx([...writes, ...relStmts, ...hookStmts])`), so
// `now()` is one instant for the events and the cache, and replay(rel_event) equals rel_bond byte for byte (AT-U1).
// Statements never carry the child's words: event bodies and note slots are closed values (a kind, a stage, a skill id,
// a move id); a conferred short name is the one child-said value, shape-checked (bond.js NAME_SHAPE).
import { assertWritable, legalModeOf } from "../learner/mode.js";
import { NAME_SHAPE, STAGES } from "./bond.js";

/** The relational tables these writers own (018_relational.sql). */
export const RELATIONAL_TABLES = Object.freeze(["rel_bond", "rel_event", "relational_note", "rel_overlay_window"]);
export const REL_EVENT_DIMS = Object.freeze(["teacher_owned", "repair", "address", "stage", "milestone", "ritual", "christen", "session"]);
export const REL_NOTE_KINDS = Object.freeze(["boundary_warmth", "boundary_secret", "boundary_contact", "boundary_romance", "boundary_goodbye",
  "identity_asked", "memory_forgotten", "milestone", "christened", "teacher_slip_owned", "safeguard_handoff"]);
const TEACHER_OWNED = new Set(["unheard", "unfair", "teacher_error", "net_loss"]);
/** The India day an end is counted on (one expression, used by the session event and the cache, so they always agree). */
const DAY = "((now() at time zone 'Asia/Kolkata')::date)";
const STAGE_ARR = `array[${STAGES.map((s) => `'${s}'`).join(",")}]::text[]`;
const AGENT = /^[a-z][a-z0-9_-]{1,31}$/;
const UUID = /^[0-9a-f-]{36}$/i;

const stmt = (layer, text, params, rows = "one") => ({ text, params, layer, rows });

function childOf(child) {
  if (!child || typeof child !== "object" || !child.id) throw new Error("relational writer: the child row ({ id, legal_mode }) is required");
  const mode = child.legal_mode ?? child.legalMode;
  if (mode == null) throw new Error(`relational writer: child ${child.id} has no legal_mode (never assume a mode)`);
  return { ...child, legal_mode: legalModeOf(mode) };
}

/** A closed value: a short token, number or boolean; anything sentence-shaped is refused (never the child's words). */
function closed(v, key) {
  if (v == null || typeof v === "number" || typeof v === "boolean") return v ?? null;
  const s = String(v);
  if (!/^[A-Za-z0-9_.:\- ]{1,64}$/.test(s) || s.split(" ").length > 3) throw new Error(`relational writer: ${key} is not a closed value`);
  return s;
}
const closedObj = (o, what) => Object.fromEntries(Object.entries(o ?? {}).map(([k, v]) => [closed(k, `${what} key`), closed(v, `${what}.${k}`)]));

/**
 * One rel_event row. dim from the closed set; cite {lessonId, turnIdx[≥1]}; body closed-valued.
 * @param {any} child @param {{ agentId: string, lessonId: string, dim: string, body?: object, turnIdx: number[] }} e
 */
export function relEventStmt(child, e) {
  const c = childOf(child);
  assertWritable(c, "rel_bond");
  if (!REL_EVENT_DIMS.includes(e?.dim)) throw new Error(`relational writer: unknown rel_event dim ${e?.dim}`);
  if (!AGENT.test(String(e.agentId ?? ""))) throw new Error("relational writer: agentId required");
  if (!UUID.test(String(e.lessonId ?? ""))) throw new Error("relational writer: a cited lessonId is required");
  const turnIdx = (e.turnIdx ?? []).map(Number).filter((x) => Number.isInteger(x) && x >= 0);
  if (!turnIdx.length) throw new Error("relational writer: cite.turnIdx needs at least one turn");
  let body;
  if (e.dim === "address") {
    const kind = e.body?.kind;
    if (!["call_me", "call_me_retract", "parent_reset"].includes(kind)) throw new Error("relational writer: unknown address kind");
    if (kind === "call_me" && !NAME_SHAPE.test(String(e.body?.name ?? ""))) throw new Error("relational writer: a conferred name must be a plain short name");
    body = kind === "call_me" ? { kind, name: e.body.name } : { kind };
  } else if (e.dim === "teacher_owned") {
    if (!TEACHER_OWNED.has(e.body?.kind)) throw new Error("relational writer: unknown teacher-owned kind");
    body = { kind: e.body.kind, owned: !!e.body.owned };
  } else if (e.dim === "stage") {
    if (!STAGES.includes(e.body?.to) || !STAGES.includes(e.body?.from)) throw new Error("relational writer: unknown stage");
    body = { from: e.body.from, to: e.body.to };
  } else {
    body = closedObj(e.body, e.dim);
  }
  const cite = { lessonId: e.lessonId, turnIdx: [...new Set(turnIdx)].sort((a, b) => a - b) };
  // the session event's day is the DB's India day (the same expression the cache UPSERT uses)
  if (e.dim === "session") {
    return stmt("rel_bond", `insert into rel_event(child_id, agent_id, kind, dim, cite, body, lesson_id)
      values ($1, $2, $3, $3, $4::jsonb, jsonb_build_object('day', ${DAY}::text), $5) returning id`, [c.id, e.agentId, e.dim, JSON.stringify(cite), e.lessonId]);
  }
  return stmt("rel_bond", `insert into rel_event(child_id, agent_id, kind, dim, cite, body, lesson_id)
    values ($1, $2, $3, $3, $4::jsonb, $5::jsonb, $6) returning id`, [c.id, e.agentId, e.dim, JSON.stringify(cite), JSON.stringify(body), e.lessonId]);
}

/**
 * The rel_bond cache refresh for one lesson end: folds THIS lesson's events (already inserted earlier in the same
 * transaction) onto the stored row, exactly as bond.js applyLessonEnd does. An UPSERT, never UPDATE-only
 * (`relstate-zero-rows`): the first lesson end creates the row.
 * @param {any} child @param {{ agentId: string, lessonId: string }} o
 */
export function relBondUpsertStmt(child, { agentId, lessonId }) {
  const c = childOf(child);
  assertWritable(c, "rel_bond");
  if (!AGENT.test(String(agentId ?? ""))) throw new Error("relational writer: agentId required");
  if (!UUID.test(String(lessonId ?? ""))) throw new Error("relational writer: lessonId required");
  const ev = (dim, extra = "") => `select id, body from rel_event where child_id = $1 and agent_id = $2 and lesson_id = $3 and dim = '${dim}' ${extra}`;
  // this lesson's stage target (highest), address outcome (last), teacher-owned stance, milestones (in order), rituals
  const stageNew = `(select coalesce((select body->>'to' from rel_event where child_id = $1 and agent_id = $2 and lesson_id = $3 and dim = 'stage'
      order by array_position(${STAGE_ARR}, body->>'to') desc, id limit 1), 'meeting'))`;
  const addrLast = `(${ev("address", "order by id desc limit 1")})`;
  const addrVal = `(select case when a.body->>'kind' = 'call_me' then jsonb_build_object('childCallsTeacher', null, 'teacherCallsChild', a.body->>'name') else null end from ${addrLast} a)`;
  const lastTo = `(${ev("teacher_owned", "order by id desc limit 1")})`;
  const openFrom = (prev) => `(select case when o is not null and exists (select 1 from rel_event r where r.child_id = $1 and r.agent_id = $2 and r.lesson_id = $3
        and r.dim = 'repair' and r.body->>'eventId' = o->>'eventId' and r.id > coalesce((select t.id from ${lastTo} t), 0)) then null else o end
      from (select case when exists (select 1 from ${lastTo} t0) then (select case when coalesce((t.body->>'owned')::boolean, false) then null
        else jsonb_build_object('ackedAtOpen', false, 'eventId', t.id::text, 'kind', t.body->>'kind') end from ${lastTo} t) else ${prev} end as o) x)`;
  const miles = `array(select m.body->>'id' from rel_event m where m.child_id = $1 and m.agent_id = $2 and m.lesson_id = $3 and m.dim = 'milestone' order by m.id)`;
  const rits = `(select coalesce(jsonb_object_agg(r.body->>'ritual', r.body->'day' order by r.id), '{}'::jsonb) from rel_event r where r.child_id = $1 and r.agent_id = $2 and r.lesson_id = $3 and r.dim = 'ritual')`;
  const seq = "(select coalesce(max(id), 0) from rel_event where child_id = $1 and agent_id = $2)";
  const sessions = `(select count(*)::int from rel_event where child_id = $1 and agent_id = $2 and lesson_id = $3 and dim = 'session')`;
  const higher = `array_position(${STAGE_ARR}, excluded.stage) > array_position(${STAGE_ARR}, b.stage)`;
  const hasAddr = `exists (${ev("address")})`;
  const text = `insert into rel_bond as b (child_id, agent_id, stage, stage_since, sessions, distinct_days, first_day, last_day, address, teacher_open,
      milestones, rituals, event_seq, legal_mode_at_write)
    values ($1, $2, ${stageNew}, now(), ${sessions}, case when ${sessions} > 0 then 1 else 0 end, case when ${sessions} > 0 then ${DAY} end,
      case when ${sessions} > 0 then ${DAY} end, ${addrVal}, ${openFrom("null::jsonb")},
      array(select x from (select x, min(o) as o from unnest(${miles}) with ordinality u(x, o) group by x) d order by o), ${rits}, ${seq}, $4)
    on conflict (child_id, agent_id) do update set
      sessions = b.sessions + excluded.sessions,
      distinct_days = b.distinct_days + case when excluded.sessions > 0 and b.last_day is distinct from excluded.last_day then 1 else 0 end,
      first_day = coalesce(b.first_day, excluded.first_day),
      last_day = coalesce(excluded.last_day, b.last_day),
      stage = case when ${higher} then excluded.stage else b.stage end,
      stage_since = case when ${higher} then now() else b.stage_since end,
      address = case when ${hasAddr} then excluded.address else b.address end,
      teacher_open = ${openFrom("b.teacher_open")},
      milestones = b.milestones || array(select x from unnest(${miles}) with ordinality u(x, o) where not (x = any(b.milestones)) order by o),
      rituals = b.rituals || excluded.rituals,
      event_seq = excluded.event_seq,
      legal_mode_at_write = excluded.legal_mode_at_write,
      updated_at = now()
    returning stage`;
  return stmt("rel_bond", text, [c.id, agentId, lessonId, c.legal_mode]);
}

/**
 * One parent-visible relational note (typed template over closed slots; rendered at read time in the parent's language).
 * relational_note is M0 history: every mode above M0 writes it.
 * @param {any} child @param {{ agentId: string, lessonId: string, kind: string, slots?: object }} n
 */
export function relNoteStmt(child, n) {
  const c = childOf(child);
  if (c.legal_mode === "M0") throw new Error("legal_mode M0 forbids relational_note");
  if (!REL_NOTE_KINDS.includes(n?.kind)) throw new Error(`relational writer: unknown note kind ${n?.kind}`);
  if (!AGENT.test(String(n.agentId ?? ""))) throw new Error("relational writer: agentId required");
  const slots = closedObj(n.slots, "slots");
  return stmt("rel_bond", "insert into relational_note(child_id, agent_id, lesson_id, kind, slots) values ($1, $2, $3, $4, $5::jsonb) returning id",
    [c.id, n.agentId, UUID.test(String(n.lessonId ?? "")) ? n.lessonId : null, n.kind, JSON.stringify(slots)]);
}

const OVERLAY_KEYS = ["warmth", "permanence", "secret", "night", "goodbyeDistress", "loneliness"];
/**
 * The M3-only cross-session overlay counters for the week (integers only). Throws below M3 (AT-U4): no M1/M2 write path.
 * @param {any} child @param {{ agentId: string, counts: Record<string, number> }} o
 */
export function overlayStmt(child, { agentId, counts }) {
  const c = childOf(child);
  assertWritable(c, "rel_overlay");
  const clean = Object.fromEntries(OVERLAY_KEYS.map((k) => [k, Math.max(0, Math.trunc(Number(counts?.[k]) || 0))]));
  return stmt("rel_overlay", `insert into rel_overlay_window(child_id, agent_id, week, counts)
    values ($1, $2, date_trunc('week', now() at time zone 'Asia/Kolkata')::date, $3::jsonb)
    on conflict (child_id, agent_id, week) do update set counts = (select jsonb_object_agg(k, coalesce((rel_overlay_window.counts->>k)::int, 0) + coalesce((excluded.counts->>k)::int, 0))
      from jsonb_object_keys(excluded.counts) k) returning week`, [c.id, agentId, JSON.stringify(clean)]);
}

/**
 * Every statement one lesson end writes, in order: the session event, a stage event (always: a non-increasing one is a
 * no-op in both the fold and the SQL, so a replica without the snapshot still writes a consistent pair), teacher-owned
 * events, repairs, address events, milestones, the cache UPSERT, then the notes. [] for M0.
 * @param {any} child
 * @param {{ agentId: string, lessonId: string, lastTurn: number, stageTo?: string, stageFrom?: string,
 *   teacherEvents?: { kind: string, owned: boolean, turn: number }[], repairs?: { eventId: string, turn: number }[],
 *   address?: { kind: string, name?: string, turn: number }[], milestones?: { id: string, turn: number }[],
 *   notes?: { kind: string, slots?: object, turn: number }[], overlay?: Record<string, number> | null }} end
 */
export function relLessonEndStmts(child, end) {
  const c = childOf(child);
  if (c.legal_mode === "M0") return [];
  const turn = (t) => [Math.max(0, Math.trunc(Number(t) || 0))];
  const base = { agentId: end.agentId, lessonId: end.lessonId };
  const last = turn(end.lastTurn);
  const to = STAGES.includes(end.stageTo) ? end.stageTo : "first_sessions";
  const out = [
    relEventStmt(c, { ...base, dim: "session", turnIdx: last }),
    relEventStmt(c, { ...base, dim: "stage", body: { from: STAGES.includes(end.stageFrom) ? end.stageFrom : "meeting", to: to === "meeting" ? "first_sessions" : to }, turnIdx: last }),
    ...(end.teacherEvents ?? []).map((e) => relEventStmt(c, { ...base, dim: "teacher_owned", body: { kind: e.kind, owned: !!e.owned }, turnIdx: turn(e.turn) })),
    ...(end.repairs ?? []).map((r) => relEventStmt(c, { ...base, dim: "repair", body: { eventId: String(r.eventId) }, turnIdx: turn(r.turn) })),
    ...(end.address ?? []).map((a) => relEventStmt(c, { ...base, dim: "address", body: a, turnIdx: turn(a.turn) })),
    ...(end.milestones ?? []).map((m) => relEventStmt(c, { ...base, dim: "milestone", body: { id: m.id }, turnIdx: turn(m.turn) })),
    relBondUpsertStmt(c, base),
    ...(end.notes ?? []).map((n) => relNoteStmt(c, { ...base, kind: n.kind, slots: { ...(n.slots ?? {}), turn: turn(n.turn)[0] } })),
  ];
  if (end.overlay && c.legal_mode === "M3") out.push(overlayStmt(c, { agentId: end.agentId, counts: end.overlay }));
  return out;
}
