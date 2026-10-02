// Cross-topic delayed checks (COMPREHENSION-ENGINE.md §3.5, CE7): a learned skill enters a queue; when a topic 2-3
// topics later can host it as a NECESSARY sub-step (and ≥ 20 h have passed), the sub-step is graded as ONE event on
// the earlier skill (E7). Unhosted entries fall back to a C31 callback at the next session open; skills with an
// open U facet get a protégé return (C34) at 3-10 days. Pure queue reducers; persistence is the weave_queue table.
import { DELAY_MS } from "../learner/kt/ledger.js";

const DAY = 86_400_000;
const iso = (t) => new Date(t).toISOString();
export const WEAVE = Object.freeze({ MIN_TOPICS: 2, MAX_TOPICS: 3, EXPIRE_TOPICS: 5, EXPIRE_GRACE_MS: 2 * DAY, PROTEGE_MIN_D: 3, PROTEGE_MAX_D: 10 });

/**
 * Enqueue a skill that just reached learned_today (or fragile). Idempotent per (childId, skillId, kind) while open.
 * @param {any[]} q @param {{ childId: string, skillId: string, anchorAt: string, dueAt?: string|null, hostCandidates?: string[], kind?: string }} e
 */
export function enqueue(q, { childId, skillId, anchorAt, dueAt = null, hostCandidates = [], kind = "woven" }) {
  if (q.some((x) => x.childId === childId && x.skillId === skillId && x.kind === kind && (x.status === "queued" || x.status === "hosted"))) return q;
  const earliestAt = iso(new Date(anchorAt).getTime() + DELAY_MS);
  return [...q, { childId, skillId, kind, anchorAt: iso(anchorAt), earliestAt, dueAt: dueAt ?? iso(new Date(anchorAt).getTime() + 3 * DAY),
    topicsSince: 0, hostCandidates: [...new Set(hostCandidates)].sort(), status: "queued" }];
}

/**
 * The Conductor planned topic `topicSkillIds` at `now`: count topicsSince for every queued entry, and host each
 * entry with 2 ≤ topicsSince ≤ 3, now ≥ earliestAt and a host skill among its candidates. At most one woven
 * sub-step per planned topic (one host item cannot carry two earlier skills without blurring blame).
 * @returns {{ q: any[], hosted: { skillId: string, host: string }[] }}
 */
export function onTopicPlanned(q, topicSkillIds, now) {
  const t = new Date(now).getTime();
  const hostSet = new Set(topicSkillIds);
  let used = false;
  const hosted = [];
  const out = q.map((e) => {
    if (e.status !== "queued" || topicSkillIds.includes(e.skillId)) return e;
    const n = { ...e, topicsSince: e.topicsSince + 1 };
    const host = n.hostCandidates.find((h) => hostSet.has(h));
    if (!used && host && n.topicsSince >= WEAVE.MIN_TOPICS && n.topicsSince <= WEAVE.MAX_TOPICS && t >= new Date(n.earliestAt).getTime()) {
      used = true;
      hosted.push({ skillId: n.skillId, host });
      return { ...n, status: "hosted", host };
    }
    return n;
  });
  return { q: out, hosted };
}

/** A hosted sub-step was graded (any outcome): the entry is done. */
export const markDone = (q, skillId, kind = "woven") => q.map((e) => (e.skillId === skillId && e.kind === kind && e.status !== "expired" ? { ...e, status: "done" } : e));

/** Entries with no host in time become callbacks (C31) at the next session open (§3.5.4). */
export function expire(q, now) {
  const t = new Date(now).getTime();
  return q.map((e) => (e.status === "queued" && (e.topicsSince > WEAVE.EXPIRE_TOPICS || t > new Date(e.dueAt).getTime() + WEAVE.EXPIRE_GRACE_MS)
    ? { ...e, status: "expired" } : e));
}

/**
 * Session-open plan (§3.5.7; the Conductor hook planChecks): 2-4 openers from due skills and expired weave entries,
 * lowest retention first, plus protégé returns for skills whose U is open (3-10 days after the anchor).
 * @param {{ q: any[], due: { skillId: string, retention: number }[], beliefs?: Record<string, any>, now: string, openers?: number }} o
 */
export function planChecks({ q, due, beliefs = {}, now, openers = 3 }) {
  const t = new Date(now).getTime();
  const expired = q.filter((e) => e.status === "expired").map((e) => e.skillId);
  const pool = new Map();
  for (const d of due) pool.set(d.skillId, d.retention);
  for (const s of expired) if (!pool.has(s)) pool.set(s, beliefs[s]?.retention ?? 0.5);
  const callbacks = [...pool.entries()].sort((a, b) => a[1] - b[1] || (a[0] < b[0] ? -1 : 1)).slice(0, openers).map(([skillId]) => skillId);
  const protege = Object.values(beliefs).filter((b) => b && b.open?.includes("U") && b.U >= 0.3 && ["learned_today", "mastered"].includes(b.display))
    .filter((b) => { const a = q.find((e) => e.skillId === b.skillId)?.anchorAt; const d = a ? (t - new Date(a).getTime()) / DAY : 0;
      return d >= WEAVE.PROTEGE_MIN_D && d <= WEAVE.PROTEGE_MAX_D; })
    .map((b) => b.skillId).filter((s) => !callbacks.includes(s)).slice(0, 1);
  return { openers: callbacks, protege, consumed: expired.filter((s) => callbacks.includes(s)) };
}

/**
 * The ONE event a woven sub-step emits on the earlier skill (E7 / CEI5): item.open, or probe.transfer.near when the
 * kit marks the host structure as novel — never both. `correct` is the R-KEY verdict on the sub-step alone.
 * @param {any} base id, seq, sessionId, sessionStartAt, at, episodeId, itemKey, graderVersion
 */
export function wovenEvent(base, { skillId, host, hostNovel = false, correct, rung = 0 }) {
  const cls = hostNovel ? "probe.transfer.near" : "item.open";
  const outcome = hostNovel ? (correct ? 0 : 1) : correct ? Math.min(rung, 4) : 4;
  return { ...base, skillIds: [skillId], target: skillId, cls, outcome, grader: "code", via: "weave", weaveHost: host, shapeId: "C32", form: "produce" };
}

/** After planChecks consumed expired entries as callbacks, close them. */
export const consumeExpired = (q, skillIds) => q.map((e) => (e.status === "expired" && skillIds.includes(e.skillId) ? { ...e, status: "done" } : e));
