// SEGMENTS (TUTOR-MODEL §2.1; the brief's (d)): one session holds several segments, each pinning ONE verified kit. A topic
// switch opens a new segment in the SAME session, never a new lesson. The session object is plain data (serialisable into
// the lesson state's JSON; the segments table itself is a migration the main session numbers: patch request 01). PURE.

export const SEGMENTS_MAX = 8;

/** A new session (no topic yet: the intake decides). */
export function newSession({ id, now = Date.now(), classLevel, prior = null } = {}) {
  return { v: 1, id: id ?? null, startedAt: new Date(now).toISOString(), classLevel: classLevel ?? null, prior, segments: [], intake: null };
}

/** The open segment, or null. */
export const currentSegment = (session) => session?.segments?.findLast?.((s) => !s.closedAt) ?? null;

/**
 * PURE. Open a segment for a decision, pinning its kit (topicId + the kit's content hash). A foundation-first decision opens
 * the foundation segment and queues the school topic as the next one (never dropped). Closes the open segment first.
 * @param {object} session
 * @param {{ purpose: string, topicId: string|null, mode: string, foundation?: string|null, why?: object[] }} decision
 * @param {{ kitHash?: string|null, now?: number }} [o]
 */
export function openSegment(session, decision, { kitHash = null, now = Date.now() } = {}) {
  const s = structuredClone(session);
  const at = new Date(now).toISOString();
  const cur = currentSegment(s);
  if (cur) cur.closedAt = at;
  if (s.segments.length >= SEGMENTS_MAX) throw new Error(`session holds at most ${SEGMENTS_MAX} segments`);
  const first = decision.mode === "foundation_first" && decision.foundation
    ? { topicId: decision.foundation, purpose: "foundation", mode: "teach", then: { topicId: decision.topicId, purpose: decision.purpose } }
    : { topicId: decision.topicId, purpose: decision.purpose, mode: decision.mode };
  s.segments.push({ n: s.segments.length + 1, ...first, kitHash, openedAt: at, closedAt: null, why: decision.why ?? [] });
  return s;
}

/**
 * PURE. The child (or the Director) switches topic: the open segment closes and a new one opens in the same session. A
 * switch to the topic already open is a no-op. A foundation segment's queued school topic is offered back by nextQueued().
 */
export function switchSegment(session, { topicId, purpose = "child_request", kitHash = null, now = Date.now(), why = [] }) {
  const cur = currentSegment(session);
  if (cur && cur.topicId === topicId) return session;
  return openSegment(session, { purpose, topicId, mode: "teach", why: [{ code: "switch", ref: topicId }, ...why] }, { kitHash, now });
}

/** The school topic a closed foundation segment queued (back to it, with the foundation named), or null. */
export function nextQueued(session) {
  const last = session?.segments?.at(-1);
  if (!last?.then || !last.closedAt) return null;
  return session.segments.some((s, i) => i > last.n - 1 && s.topicId === last.then.topicId) ? null : last.then;
}

/** The topics a session taught, in order (for the parent summary per session). */
export const sessionTopics = (session) => [...new Set((session?.segments ?? []).map((s) => s.topicId).filter(Boolean))];
