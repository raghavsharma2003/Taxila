// Round 8 Play P3: the fold for HOME play (no lesson), written and tested, switched OFF. Nothing calls it in production:
// the learner session is deciding what home play is worth. It is one switch away (TAXILA_HOME_PLAY_FOLD=on plus a caller),
// and these four rules hold in code whatever the caller passes:
//
//   1. weight      a home level counts at the GAME weight (via "game": kt/bktr.js SOURCE_WEIGHT 0.5), and a correct on a
//                  one-decision goal at the CHANCE weight (the server's signed row says CHANCE_WEIGHT → controllerEasy,
//                  0.25), exactly as in a lesson. A row with any other weight is dropped, never folded at full weight.
//   2. unaided     never: every event is via "game", and the ledger (kt/ledger.js advanceDisplay) never sets "unaided" from
//                  a game event; the fold also refuses to emit an event whose source is anything else.
//   3. delayed     never the delayed check and never spends it (the same ledger guard on source "game").
//   4. cap         at most HOME_DAILY_CAP home levels per skill per learning day (IST, kt/ledger.js dayOf), counted over
//                  the levels already folded (`prior`) plus this call's.
//
// Pure apart from the HMAC check. Home tokens only (server/play/evidence.js signHomeEvidence): a lesson token is refused.
import { fromLegacyEvidence } from "../learner/kt/adapter.js";
import { sourceOf } from "../learner/kt/bktr.js";
import { dayOf } from "../learner/kt/ledger.js";
import { CHANCE_WEIGHT, GAME_WEIGHT } from "../../shared/play.ts";
import { verifyHomeEvidence } from "./evidence.js";

export const HOME_FOLD_FLAG = "TAXILA_HOME_PLAY_FOLD";
/** home levels per skill per learning day that may fold (rule 4) */
export const HOME_DAILY_CAP = 3;
/** at most this many home tokens are read per call */
export const MAX_HOME_TOKENS = 12;

/** Off unless the flag says on (on / 1 / true / yes, any case). */
export const homeFoldOn = (env = process.env) => ["on", "1", "true", "yes"].includes(String(env?.[HOME_FOLD_FLAG] ?? "").trim().toLowerCase());

/**
 * The KT events for verified home tokens.
 * @param {{ tokens: unknown, childId: string, now: number, prior?: { skillId: string, at: string|number, levelId?: string }[],
 *   skillOk?: (skillId: string) => boolean, env?: Record<string, string|undefined> }} c
 *   `prior`: the home levels already folded (one entry per level and skill; e.g. kt_evidence rows whose episode_id starts
 *   "home:"); only those on today's learning day count against the cap, and their levelIds are never folded again.
 * @returns {{ off: boolean, events: any[], levelIds: string[], rejected: number, capped: number, dropped: number }}
 */
export function homeKtEvents(c, opts) {
  const out = { off: !homeFoldOn(c.env ?? process.env), events: [], levelIds: [], rejected: 0, capped: 0, dropped: 0 };
  if (out.off) return out;
  const now = Number(c.now);
  const today = dayOf(now);
  const prior = Array.isArray(c.prior) ? c.prior : [];
  const used = new Map();
  for (const p of prior) if (p && typeof p.skillId === "string" && dayOf(p.at) === today) used.set(p.skillId, (used.get(p.skillId) ?? 0) + 1);
  const done = new Set(prior.map((p) => p?.levelId).filter(Boolean));
  const tokens = Array.isArray(c.tokens) ? c.tokens.slice(0, MAX_HOME_TOKENS) : [];
  const at = new Date(now).toISOString();
  let k = 0;
  for (const t of tokens) {
    const v = verifyHomeEvidence(t, { childId: c.childId }, opts);
    if (!v) { out.rejected++; continue; }
    if (done.has(v.levelId) || out.levelIds.includes(v.levelId)) continue;
    out.levelIds.push(v.levelId);
    const skills = new Set();
    for (const r of v.rows) {
      if (c.skillOk && !c.skillOk(r.skillId)) { out.dropped++; continue; }
      // rule 1: only the two weights a level can carry; anything else would be folded at the wrong weight
      if (r.weight !== GAME_WEIGHT && r.weight !== CHANCE_WEIGHT) { out.dropped++; continue; }
      // rule 4: the per-skill per-day cap (a level counts once per skill)
      if (!skills.has(r.skillId) && (used.get(r.skillId) ?? 0) >= HOME_DAILY_CAP) { out.capped++; continue; }
      if (!skills.has(r.skillId)) { skills.add(r.skillId); used.set(r.skillId, (used.get(r.skillId) ?? 0) + 1); }
      const chance = r.weight === CHANCE_WEIGHT;   // as in a lesson (evidence.js playKtEvents): the server's own row says so
      const ev = fromLegacyEvidence(
        { skillId: r.skillId, outcome: r.outcome === "partial" ? "incorrect" : r.outcome, itemId: `home:${v.levelId}`, probe: "P10", hintsUsed: 0, ...(r.misconceptionId ? { misconceptionId: r.misconceptionId } : {}) },
        { id: `home:${c.childId}:${v.levelId}:${k++}`, sessionId: `home:${c.childId}:${today}`, sessionStartAt: v.at, at, episodeId: `home:${v.levelId}`, grader: "code",
          ...(r.discriminates ? { discriminates: r.discriminates } : {}), triesBefore: 0, episodeEnded: true,
          ...(String(v.levelId).startsWith("arena-") ? { form: "recognise", controllerEasy: true } : chance ? { controllerEasy: true } : {}) });
      if (!ev) continue;
      // rules 2 and 3: the event is a home play to the ledger (bktr.js isHomePlay: via "game", id "home:…", source "home"),
      // which the ledger never counts as unaided and never lets be or spend the delayed check; nothing else is emitted
      const e = { ...ev, target: r.skillId, via: "game", home: true, ...(v.trail ? { playTrail: v.trail } : {}) };
      if (sourceOf(e) !== "home") { out.dropped++; continue; }
      out.events.push(e);
    }
  }
  return out;
}
