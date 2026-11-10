// Round 8 Play: the fold for HOME play (no lesson), live (main 2026-11-10, decision A). When a home level ends, /api/play/act
// signs its rows and trail for the child (homeToken), and the same request folds them into the child's learner state through
// the LEARNER's mapping (server/learner/kt/home.js homePlayEvent: the trail sets the outcome; the game weight; the chance
// weight for a one-decision goal). This module keeps only two things of its own:
//
//   token     only a genuine, unexpired home token of THIS child folds (server/play/evidence.js verifyHomeEvidence); a lesson
//             token is refused; a row whose weight is neither the game's nor the chance weight is dropped.
//   volume    at most HOME_DAILY_CAP home levels per skill per learning day (IST, kt/ledger.js dayOf) are WRITTEN. This is a
//             bound on rows, not a knowledge rule: the ledger's own home rule (kt/ledger.js HOME_DAY_LOG_CAP: ±ln 3 of
//             evidence per skill per day, one learning step a day; never unaided, never the delayed check) is what limits
//             what an afternoon of one game can say. The cap sits far above where that rule saturates (≈2 clean wins, ≈5 chance
//             wins, and a full swing back down after wins takes >12 misses), so a later miss in the day still reaches the ledger
//             and the ledger's running clamp, not this file, decides.
//
// TAXILA_HOME_PLAY_FOLD is ON unless set to off / 0 / false / no. No durable home record and no migration: the levels already
// folded today are read back from kt_evidence (ids "home:<child>:<day>:…", the learner's own id shape).
import { homePlayEvent } from "../learner/kt/home.js";
import { sourceOf } from "../learner/kt/bktr.js";
import { dayOf } from "../learner/kt/ledger.js";
import { CHANCE_WEIGHT, GAME_WEIGHT } from "../../shared/play.ts";
import { verifyHomeEvidence } from "./evidence.js";

export const HOME_FOLD_FLAG = "TAXILA_HOME_PLAY_FOLD";
/** home levels per skill per learning day that are written (a volume bound; the ledger's HOME_DAY_LOG_CAP is the rule) */
export const HOME_DAILY_CAP = 24;
/** at most this many home tokens are read per call */
export const MAX_HOME_TOKENS = 12;

/** On unless the flag says off (off / 0 / false / no, any case). */
export const homeFoldOn = (env = process.env) => !["off", "0", "false", "no"].includes(String(env?.[HOME_FOLD_FLAG] ?? "").trim().toLowerCase());

/** The id prefix of a child's home events on a learning day (kt/home.js homePlayEvent: sessionId "home:<child>:<day>"). */
export const homeDayPrefix = (childId, day) => `home:${childId}:${day}:`;

/**
 * The KT events for verified home tokens, one per level and skill, built by the learner's homePlayEvent.
 * @param {{ tokens: unknown, childId: string, now: number, prior?: { skillId: string, at: string|number, levelId?: string }[],
 *   skillOk?: (skillId: string) => boolean, topicType?: string, env?: Record<string, string|undefined> }} c
 *   `prior`: the home levels already folded (one entry per level and skill, e.g. read back from kt_evidence); only those on
 *   the level's learning day count against the cap, and a level folded that day is never folded again.
 * @returns {{ off: boolean, events: any[], levelIds: string[], rejected: number, capped: number, dropped: number }}
 */
export function homeKtEvents(c, opts) {
  const out = { off: !homeFoldOn(c.env ?? process.env), events: [], levelIds: [], rejected: 0, capped: 0, dropped: 0 };
  if (out.off) return out;
  const prior = Array.isArray(c.prior) ? c.prior : [];
  const used = new Map();   // `${day}|${skill}` → levels counted
  const bump = (k) => used.set(k, (used.get(k) ?? 0) + 1);
  const done = new Set();
  for (const p of prior) {
    if (!p || typeof p.skillId !== "string") continue;
    const day = dayOf(p.at);
    bump(`${day}|${p.skillId}`);
    if (p.levelId) done.add(`${day}|${p.levelId}`);
  }
  const tokens = Array.isArray(c.tokens) ? c.tokens.slice(0, MAX_HOME_TOKENS) : [];
  for (const t of tokens) {
    const v = verifyHomeEvidence(t, { childId: c.childId }, opts);
    if (!v) { out.rejected++; continue; }
    const day = dayOf(v.at);
    if (done.has(`${day}|${v.levelId}`) || out.levelIds.includes(v.levelId)) continue;
    out.levelIds.push(v.levelId);
    done.add(`${day}|${v.levelId}`);
    // one event per skill the level's rows name (a level's rows are its skill's; a row of another weight is dropped)
    const bySkill = new Map();
    for (const r of v.rows) {
      if (c.skillOk && !c.skillOk(r.skillId)) { out.dropped++; continue; }
      if (r.weight !== GAME_WEIGHT && r.weight !== CHANCE_WEIGHT) { out.dropped++; continue; }
      if (!bySkill.has(r.skillId)) bySkill.set(r.skillId, []);
      bySkill.get(r.skillId).push(r);
    }
    let n = 0;
    for (const [skillId, rows] of bySkill) {
      const k = `${day}|${skillId}`;
      if ((used.get(k) ?? 0) >= HOME_DAILY_CAP) { out.capped++; continue; }
      const tr = v.trail && (!v.trail.skillId || v.trail.skillId === skillId) ? v.trail : null;
      const won = tr ? tr.solved : rows.some((r) => r.outcome === "correct");
      const misses = tr ? tr.misses : rows.filter((r) => r.outcome !== "correct").length;
      const malRules = tr ? tr.mal.map((m) => m.mis).filter(Boolean) : rows.map((r) => r.misconceptionId).filter(Boolean);
      // the chance weight is the server's own row's (a correct on a goal one tap can win by chance: CHANCE_WEIGHT)
      const chance = rows.some((r) => r.weight === CHANCE_WEIGHT);
      const e = homePlayEvent({ childId: String(c.childId), day, levelId: v.levelId, skillId, at: v.at, n: n++, won, misses, hints: tr ? tr.hints : 0, malRules, chance,
        ...(c.topicType ? { topicType: c.topicType } : {}) });
      // the ledger reads it as home play (bktr.js isHomePlay: via "game", id "home:…"): never unaided, never the delayed check
      if (sourceOf(e) !== "home") { out.dropped++; continue; }
      bump(k);
      out.events.push(tr ? { ...e, playTrail: tr } : e);
    }
  }
  return out;
}

/**
 * The home levels already folded on a learning day, read back from kt_evidence (the truth; no home table).
 * → [{ skillId, at, levelId }]. A failed read is [] (the cap is a volume bound; the ledger's rule still holds).
 */
export async function priorHomeLevels(childId, day, q) {
  try {
    // scoped to the home session of that day (kt/home.js: sessionId "home:<child>:<day>"): no placement row can be in it
    const rows = await q("select episode_id, target, skill_ids, occurred_at from kt_evidence where child_id = $1 and session_id = $2", [String(childId), homeDayPrefix(childId, day).slice(0, -1)]);
    const pre = `${homeDayPrefix(childId, day)}`;
    return (rows ?? []).map((r) => ({ skillId: r.target ?? r.skill_ids?.[0], at: new Date(r.occurred_at).toISOString(), levelId: String(r.episode_id ?? "").startsWith(pre) ? String(r.episode_id).slice(pre.length) : undefined }))
      .filter((p) => typeof p.skillId === "string");
  } catch { return []; }
}

/**
 * Write home events to the learner: the same commit contract as the lesson's out-of-turn writers (placement/kt.js,
 * studio/grade.js, comprehension/later.js): fold onto the child's live state with fuseEvidence and commit the kt_evidence
 * rows, the caches and the facet rows in ONE transaction under the child's advisory lock, legal-mode guard and seq guard.
 * Idempotent by event id (the ledger's `seen`). Never throws: a failed write never breaks a game.
 * @returns {Promise<{ written: boolean, n?: number, why?: string }>}
 */
export async function writeHomeEvents(child, events) {
  if (!events?.length) return { written: false, why: "no_event" };
  try {
    const [{ tx, GUARD_FAILED }, { loadLive, commitLive, LIVE_FOLD_CTX, legacySkillState }, { fuseEvidence, beliefFor }, W, { canWrite }, { facetStmts }] = await Promise.all([
      import("../db.js"), import("../learner/live.js"), import("../comprehension/index.js"), import("../learner/writer.js"), import("../learner/mode.js"), import("../comprehension/store.js")]);
    if (!canWrite(child, "kt")) return { written: false, why: "mode" };
    for (let attempt = 1; ; attempt++) {
      const live = await loadLive(child);
      const fresh = events.filter((ev) => live.state.ledger.seen[ev.id] === undefined && !live.state.comp?.seen?.[ev.id]);
      if (!fresh.length) return { written: false, why: "duplicate" };
      const after = fuseEvidence(live.state, fresh, LIVE_FOLD_CTX);
      const now = Date.now();
      const stmts = W.ledgerStmts(child, live.state.ledger, after.ledger, fresh);
      const moved = Object.keys(after.comp.skills).filter((id) => JSON.stringify(live.state.comp.skills[id]) !== JSON.stringify(after.comp.skills[id])).sort();
      const facet = facetStmts(child, moved.map((id) => beliefFor(id, { ...after, now })));
      const all = [W.lockStmt(child.id), W.modeGuardStmt(child.id, child.legal_mode), W.seqGuardStmt(child.id, live.maxSeq), ...stmts,
        ...W.projectionStmts(child, live.state.ledger, after.ledger, now, legacySkillState), ...facet];
      let out;
      try { out = await tx(all.map(({ layer: _l, rows: _r, ...x }) => x)); } catch (e) {
        if (e?.code === GUARD_FAILED && attempt < W.FOLD_RETRIES) continue;
        throw e;
      }
      const seqs = stmts.map((st, i) => (/^with ins as \(insert into kt_evidence/.test(st.text) ? out[i + 3]?.[0]?.seq ?? null : undefined)).filter((x) => x !== undefined);
      commitLive(child, live.maxSeq, after, seqs);
      return { written: seqs.some((s) => s != null), n: seqs.filter((s) => s != null).length };
    }
  } catch (e) {
    console.warn("[play] home evidence write failed:", String(e?.message ?? e).slice(0, 120));
    return { written: false, why: "error" };
  }
}

/**
 * /api/play/act's fold of one home level that just ended: the prior levels of that learning day, the events, the write.
 * `write` and `q` are the route's seams. → { events, folded, capped, off } (never throws).
 */
export async function foldHomeLevel({ child, token, skillOk, now = Date.now(), q, write = writeHomeEvents, env = process.env }) {
  if (!homeFoldOn(env)) return { events: [], folded: 0, capped: 0, off: true };
  try {
    const prior = q ? await priorHomeLevels(child.id, dayOf(now), q) : [];
    const r = homeKtEvents({ tokens: [token], childId: String(child.id), now, prior, skillOk, env });
    if (!r.events.length) return { events: [], folded: 0, capped: r.capped, off: false };
    const w = await write(child, r.events);
    return { events: r.events, folded: w?.written ? (w.n ?? r.events.length) : 0, capped: r.capped, off: false };
  } catch { return { events: [], folded: 0, capped: 0, off: false }; }
}
