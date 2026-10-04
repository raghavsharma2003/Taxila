// The bond fold (RELATIONAL-OS §5, R0; BUILD-PLAN W2-I #1). PURE: no clock, no I/O, no randomness.
//   stageFor(counts, prev)      the stage the academic record has earned; never below prev (stages never regress, §5.2)
//   addressFold(address, ev)    the address after one address event (a child's retraction applies at once, AT-U3)
//   teacherOwnedStance(events)  the open teacher-owned event (a fact about HER act), or null
//   replay(events)              rel_event rows → the rel_bond row, byte-identical to the cache the writers keep (AT-U1)
//   applyLessonEnd(row, end)    the cache update one lesson end performs (mirrors writers.js relBondUpsertStmt's SQL)
// The bond record holds facts about what happened, never estimates about the child: there is no trust, closeness, mood,
// child-affect rupture, timing or gap field anywhere in this module (NM-3; F10: nothing is keyed to usage — sessions and
// distinct days are academic-record counts read ONLY by the stage gates, and never reach a prompt or her affect).

/** S0-S3 in order (shared/relational.ts Stage). */
export const STAGES = Object.freeze(["meeting", "first_sessions", "regular", "long_haul"]);
export const stageRank = (s) => Math.max(0, STAGES.indexOf(s));

/**
 * Stage entry gates, all from the academic record (§5.2; [I] starting values, recalibrated on AT-C2, never a ship gate).
 * S2 and S3 also require no open teacher-owned stance: a slip of hers that she has not owned holds the bond where it is.
 */
export const GATES = Object.freeze({
  first_sessions: { sessions: 1 },
  regular: { sessions: 5, distinctDays: 4, spanDays: 10, retryAfterNotYetLessons: 2 },
  long_haul: { sessions: 20, distinctDays: 4, spanDays: 60, retryAfterNotYetLessons: 2, explainBackPasses: 3, explainBackTopics: 2 },
});

const n = (x) => (Number.isFinite(Number(x)) ? Number(x) : 0);

/**
 * @param {Partial<import("../../shared/relational").StageCounts>} counts
 * @param {string} [prev] the stored stage
 * @returns {"meeting"|"first_sessions"|"regular"|"long_haul"}
 */
export function stageFor(counts = {}, prev = "meeting") {
  const c = counts ?? {};
  const meets = (gate) => Object.entries(gate).every(([k, v]) => n(c[k]) >= v);
  let earned = "meeting";
  if (meets(GATES.first_sessions)) earned = "first_sessions";
  if (earned === "first_sessions" && !c.teacherOpen && meets(GATES.regular)) earned = "regular";
  if (earned === "regular" && meets(GATES.long_haul)) earned = "long_haul";
  return stageRank(earned) > stageRank(prev) ? earned : STAGES[stageRank(prev)];
}

/** The guardian-given name and no conferred address: the start of every bond. */
export const baseAddress = () => ({ teacherCallsChild: null, childCallsTeacher: null });

/** A conferred name must be a plain short name (the shape floor; a word a child should not have typed never lands). */
export const NAME_SHAPE = /^[A-Za-z][A-Za-z]{1,15}(?: [A-Za-z]{2,15})?$/;

/**
 * One address event folded in. Kinds (rel_event body.kind, dim "address"):
 *   call_me {name}          the child asked to be called a short name: adopted at once (their request, §5.1)
 *   call_me_retract         the child takes it back: the guardian name again, at once (AT-U3)
 *   parent_reset            the parent reset the address (the parent corner control)
 * Ruptures, absence and mode changes never touch the address (it never regresses on its own).
 * @param {{ teacherCallsChild: string|null, childCallsTeacher: string|null }} address
 * @param {{ kind: string, name?: string }} body
 */
export function addressFold(address, body) {
  const a = { ...baseAddress(), ...(address ?? {}) };
  const kind = body?.kind;
  if (kind === "call_me" && typeof body.name === "string" && NAME_SHAPE.test(body.name)) return { ...a, teacherCallsChild: body.name };
  if (kind === "call_me_retract" || kind === "parent_reset") return { ...a, teacherCallsChild: null };
  return a;
}

/**
 * The open teacher-owned stance: the newest teacher-owned event not owned in the moment and not repaired since.
 * @param {{ id: string|number, dim: string, body: any }[]} events in id order
 * @returns {{ eventId: string, kind: string, ackedAtOpen: false } | null}
 */
export function teacherOwnedStance(events) {
  let open = null;
  for (const e of events ?? []) {
    if (e.dim === "teacher_owned") open = e.body?.owned ? null : { eventId: String(e.id), kind: String(e.body?.kind ?? "teacher_error"), ackedAtOpen: false };
    else if (e.dim === "repair" && open && String(e.body?.eventId) === open.eventId) open = null;
  }
  return open;
}

/** The empty cache row (before any event). */
export const emptyBond = () => ({
  stage: "meeting", stageSince: null, sessions: 0, distinctDays: 0, firstDay: null, lastDay: null,
  address: null, teacherOpen: null, milestones: [], rituals: {}, eventSeq: 0,
});

/** Stable key order for a jsonb-shaped value, so a replayed row compares byte for byte with a stored one. */
export function canon(v) {
  if (Array.isArray(v)) return v.map(canon);
  if (v && typeof v === "object") return Object.fromEntries(Object.keys(v).sort().map((k) => [k, canon(v[k])]));
  return v;
}

/**
 * rel_event rows → the rel_bond cache row. Pure; order = id order (the caller sorts by id; this sorts again to be safe).
 * @param {{ id: string|number, dim: string, body: any, at: string }[]} rows
 */
export function replay(rows) {
  const events = [...(rows ?? [])].filter((e) => e && e.dim).sort((a, b) => Number(a.id) - Number(b.id));
  const s = emptyBond();
  for (const e of events) {
    const b = e.body ?? {};
    switch (e.dim) {
      case "session":
        s.sessions += 1;
        if (b.day !== s.lastDay) s.distinctDays += 1;
        if (s.firstDay == null) s.firstDay = b.day ?? null;
        s.lastDay = b.day ?? s.lastDay;
        break;
      case "stage":
        if (stageRank(b.to) > stageRank(s.stage)) { s.stage = b.to; s.stageSince = e.at ?? null; }
        break;
      case "address": {
        const a = addressFold(s.address, b);
        s.address = a.teacherCallsChild || a.childCallsTeacher ? a : null;
        break;
      }
      case "milestone":
        if (typeof b.id === "string" && !s.milestones.includes(b.id)) s.milestones.push(b.id);
        break;
      case "ritual":
        if (typeof b.ritual === "string") s.rituals = { ...s.rituals, [b.ritual]: b.day ?? null };
        break;
      default:
        break;
    }
    s.eventSeq = Math.max(s.eventSeq, Number(e.id) || 0);
  }
  s.teacherOpen = teacherOwnedStance(events);
  s.address = s.address ? canon(s.address) : null;
  s.rituals = canon(s.rituals);
  return s;
}

/**
 * The cache update one lesson end performs, in JS (the SQL in writers.js relBondUpsertStmt does exactly this). The events
 * of the end are applied by replaying them onto the row: a lesson end appends events and refreshes the cache in one
 * transaction, so cache = replay(all events) holds after every end.
 * @param {ReturnType<typeof emptyBond>} row
 * @param {{ id: string|number, dim: string, body: any, at: string }[]} newEvents
 */
export function applyLessonEnd(row, newEvents) {
  // Folding is associative over the event log: replaying the new events on top of the cached state gives the same row
  // as replaying everything (the fold reads only the running state), which is what makes the cache trustworthy.
  const s = { ...emptyBond(), ...row, milestones: [...(row?.milestones ?? [])], rituals: { ...(row?.rituals ?? {}) } };
  const open = s.teacherOpen ? [{ id: s.teacherOpen.eventId, dim: "teacher_owned", body: { kind: s.teacherOpen.kind } }] : [];
  for (const e of [...newEvents].sort((a, b) => Number(a.id) - Number(b.id))) {
    const b = e.body ?? {};
    if (e.dim === "session") { s.sessions += 1; if (b.day !== s.lastDay) s.distinctDays += 1; if (s.firstDay == null) s.firstDay = b.day ?? null; s.lastDay = b.day ?? s.lastDay; }
    else if (e.dim === "stage") { if (stageRank(b.to) > stageRank(s.stage)) { s.stage = b.to; s.stageSince = e.at ?? null; } }
    else if (e.dim === "address") { const a = addressFold(s.address, b); s.address = a.teacherCallsChild || a.childCallsTeacher ? canon(a) : null; }
    else if (e.dim === "milestone") { if (typeof b.id === "string" && !s.milestones.includes(b.id)) s.milestones.push(b.id); }
    else if (e.dim === "ritual") { if (typeof b.ritual === "string") s.rituals = canon({ ...s.rituals, [b.ritual]: b.day ?? null }); }
    if (e.dim === "teacher_owned" || e.dim === "repair") open.push(e);
    s.eventSeq = Math.max(s.eventSeq, Number(e.id) || 0);
  }
  s.teacherOpen = teacherOwnedStance(open);
  return s;
}

/** A rel_bond row as the DB returns it → the cache shape replay produces (for the AT-U1 comparison). */
export function rowToBond(r) {
  if (!r) return emptyBond();
  const day = (d) => (d == null ? null : typeof d === "string" ? d.slice(0, 10) : new Date(d).toISOString().slice(0, 10));
  const at = (t) => (t == null ? null : new Date(t).toISOString());
  return {
    stage: r.stage, stageSince: at(r.stage_since), sessions: Number(r.sessions), distinctDays: Number(r.distinct_days),
    firstDay: day(r.first_day), lastDay: day(r.last_day), address: r.address ? canon(r.address) : null,
    teacherOpen: r.teacher_open ? { eventId: String(r.teacher_open.eventId), kind: String(r.teacher_open.kind), ackedAtOpen: false } : null,
    milestones: [...(r.milestones ?? [])], rituals: canon(r.rituals ?? {}), eventSeq: Number(r.event_seq ?? 0),
  };
}

/** A rel_event row as the DB returns it → the replay input (at as ISO, body parsed). */
export const eventRow = (r) => ({ id: Number(r.id), dim: r.dim, body: r.body ?? {}, at: r.at == null ? null : new Date(r.at).toISOString() });
