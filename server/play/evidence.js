// Play evidence into the lesson (DESIGN.md §8; GRAMMAR.md §7). The play server grades a level by replaying the raw acts
// itself; the lesson must fold THAT grade, never anything the device says. So the act route hands back a SIGNED evidence
// token (HMAC over the server's own rows, bound to the child and the lesson) and the lesson turn folds a token only after
// verifying it: a device can forward it or drop it, never write or change it (rj-ot-frame-claim-as-grade).
//
// One KT event per level: an item episode of its own (`<lesson>:play:<levelId>`), code-graded, via "game" (bktr.js SOURCE_WEIGHT
// game 0.5), misconception hits and discriminating corrects carried as the existing adapter fields. A level is folded once
// per lesson (the turn keeps the folded level ids). Mastery stays outside the game: the ledger patch (02) keeps a game
// event from ever being, or spending, the delayed check, and from setting "unaided".
import { signSession, verifySession } from "./session.js";
import { fromLegacyEvidence } from "../learner/kt/adapter.js";
import { CHANCE_WEIGHT } from "../../shared/play.ts";
import { cleanTrail } from "./trail.js";

export const EV_KIND = "play-ev";
/** at most this many play levels fold into one turn (a backlog after a reconnect) */
export const MAX_TOKENS_PER_TURN = 8;
/** the lesson remembers this many folded level ids (dedupe) */
export const SEEN_MAX = 60;

/**
 * Round 8 P3: the level's trail (server/play/trail.js) rides INSIDE the same signed payload as the rows, so one HMAC covers
 * both. A token without a trail (signed before P3) verifies exactly as before, with `trail: null`.
 * @param {{ childId: string, lessonId: string, levelId: string, rows: any[], trail?: any }} o
 */
export function signEvidence(o, opts) {
  return signSession({ k: EV_KIND, childId: String(o.childId), lessonId: String(o.lessonId), levelId: String(o.levelId), rows: o.rows, ...(o.trail ? { trail: o.trail } : {}) }, opts);
}

const goodRows = (rows) => rows.filter((r) => r && typeof r.skillId === "string" && ["correct", "incorrect", "partial"].includes(r.outcome)).slice(0, 4);

/** → { levelId, rows, trail } when the token is genuine, unexpired, for this child AND this lesson; else null. Never throws. */
export function verifyEvidence(token, { childId, lessonId }, opts) {
  const b = verifySession(token, opts);
  if (!b || b.k !== EV_KIND || b.childId !== String(childId) || b.lessonId !== String(lessonId) || !Array.isArray(b.rows) || typeof b.levelId !== "string") return null;
  return { levelId: b.levelId, rows: goodRows(b.rows), trail: cleanTrail(b.trail) };
}

// ───────────────────────────── home play (round 8 P3): signed for the child, not a lesson ─────────────────────────────
// Play from the home has no lesson to fold into. The /act route signs the SAME rows (each re-marked source "home") and the
// trail for the child alone. A home token is its own kind: verifyEvidence / playKtEvents (the lesson path) never accept
// one, and a lesson token is never a home token. Nothing folds a home token today: server/play/home.js holds the fold,
// behind TAXILA_HOME_PLAY_FOLD (off), until the learner session settles the weight.

export const HOME_KIND = "play-home";
/** The lesson rows as home rows: identical but for `source: "home"`. */
export const homeRows = (rows) => (Array.isArray(rows) ? rows.map((r) => ({ ...r, source: "home" })) : []);

/** @param {{ childId: string, levelId: string, rows: any[], trail?: any }} o @param {{ key?: Buffer, now?: number }} [opts] */
export function signHomeEvidence(o, opts = {}) {
  const at = new Date(opts.now ?? Date.now()).toISOString();
  return signSession({ k: HOME_KIND, childId: String(o.childId), levelId: String(o.levelId), at, rows: homeRows(o.rows), ...(o.trail ? { trail: o.trail } : {}) }, opts);
}

/** → { levelId, at, rows, trail } for a genuine, unexpired home token of this child; else null. Never throws. */
export function verifyHomeEvidence(token, { childId }, opts) {
  const b = verifySession(token, opts);
  if (!b || b.k !== HOME_KIND || b.childId !== String(childId) || "lessonId" in b || !Array.isArray(b.rows) || typeof b.levelId !== "string" || typeof b.at !== "string") return null;
  return { levelId: b.levelId, at: b.at, rows: goodRows(b.rows).filter((r) => r.source === "home"), trail: cleanTrail(b.trail) };
}

/**
 * The KT events for the verified play tokens a turn carried (pure apart from the HMAC check).
 * @param {{ tokens: unknown, childId: string, lessonId: string, startedAt: any, now: number, childSeq: number,
 *   seen?: string[], topicType?: string, kitVerified?: boolean, skillOk?: (skillId: string) => boolean }} c
 * @returns {{ events: any[], levelIds: string[], rejected: number }}
 */
export function playKtEvents(c, opts) {
  const tokens = Array.isArray(c.tokens) ? c.tokens.slice(0, MAX_TOKENS_PER_TURN) : [];
  const seen = new Set(c.seen ?? []), events = [], levelIds = [];
  let rejected = 0, k = 0;
  const at = new Date(c.now).toISOString(), sessionStartAt = new Date(c.startedAt ?? c.now).toISOString();
  for (const t of tokens) {
    const v = verifyEvidence(t, { childId: c.childId, lessonId: c.lessonId }, opts);
    if (!v) { rejected++; continue; }
    if (seen.has(v.levelId) || levelIds.includes(v.levelId)) continue;
    levelIds.push(v.levelId);
    for (const r of v.rows) {
      if (c.skillOk && !c.skillOk(r.skillId)) continue;
      // a lucky-tap-guessable correct (the server's own row says CHANCE_WEIGHT: FamilyLogic.oneDecision, games audit
      // GAMES-03) is tempered exactly as the arena is: controllerEasy, so kt/bktr.js gives game 0.5 × 0.5 = 0.25
      const chance = r.weight === CHANCE_WEIGHT;
      const ev = fromLegacyEvidence(
        { skillId: r.skillId, outcome: r.outcome === "partial" ? "incorrect" : r.outcome, itemId: `play:${v.levelId}`, probe: "P10", hintsUsed: 0, ...(r.misconceptionId ? { misconceptionId: r.misconceptionId } : {}) },
        { id: `${c.lessonId}:${c.childSeq}:play:${k++}`, sessionId: c.lessonId, sessionStartAt, at, episodeId: `${c.lessonId}:play:${v.levelId}`, grader: "code",
          ...(c.topicType ? { topicType: c.topicType } : {}), ...(c.kitVerified === false ? { kitVerified: false } : {}),
          ...(r.discriminates ? { discriminates: r.discriminates } : {}), triesBefore: 0, episodeEnded: true,
          // ITEM-ARENA: a recognition among a few targets, tempered like an easy controller (kt/bktr.js), never a production
          ...(String(v.levelId).startsWith("arena-") ? { form: "recognise", controllerEasy: true } : chance ? { controllerEasy: true } : {}) });
      // round 8 P3: the level's signed trail rides along as metadata only (the fold never reads it; it is no column)
      if (ev) events.push({ ...ev, target: r.skillId, via: "game", ...(v.trail ? { playTrail: v.trail } : {}) });
    }
  }
  return { events, levelIds, rejected };
}

/** The lesson's folded-level memory after this turn (bounded, oldest out). */
export const nextSeen = (seen, levelIds) => [...(seen ?? []), ...levelIds].slice(-SEEN_MAX);

// ───────────────────────────── seams: the Director's PLAY facts row ─────────────────────────────

export const SEAM_KIND = "play-seam";
const SEAM_KINDS = new Set(["level_end", "impasse", "prediction", "misconception", "segment_end"]);
/** The seam's telegraphic row (shared/play.ts playFactsRow: `key=value …`, ≤ 12 pairs), signed for this child and lesson. */
export function signSeam(o, opts) {
  return signSession({ k: SEAM_KIND, childId: String(o.childId), lessonId: String(o.lessonId), kind: String(o.kind), row: String(o.row).slice(0, 240) }, opts);
}
/** → { kind, row } for a genuine seam token of this child and lesson, else null. The row is re-checked as telegraphic. */
export function verifySeam(token, { childId, lessonId }, opts) {
  const b = verifySession(token, opts);
  if (!b || b.k !== SEAM_KIND || b.childId !== String(childId) || b.lessonId !== String(lessonId) || !SEAM_KINDS.has(b.kind)) return null;
  const row = String(b.row ?? "");
  // only key=value pairs survive (no sentence, no instruction can ride in a facts row: the recitation law)
  const pairs = row.split(" ").filter((p) => /^[a-z][a-z0-9_]{0,23}=[^\s=]{1,32}$/i.test(p)).slice(0, 12);
  return { kind: b.kind, row: pairs.join(" ") };
}
