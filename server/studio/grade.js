// The Studio grader in the lesson (LIVE-STUDIO D3, D12, §3.10; BUILD-PLAN W2-H #1, #3). ONE grader for the gate and the
// lesson: a session is server/studio/qa/graders.js `graderFor(archetype, FULL params)` — exactly the function the gate
// plays a build against — held per (lesson, piece) in memory. The frame's (or the skeleton's) answer is only the child's
// claimed value; the host grades it against kit truth and the verdict goes back to the frame. A `correct` field sent by
// a frame is never read (AT-10, AT-11).
//
// Evidence: an item's episode closes on the host's first correct grade, OR, when the piece leaves the tray (beat exit,
// replaced, "Not this one", lesson end) with the item answered wrong and never right, as ONE incorrect event (seam.js
// closeOpenItems; W2-H fixer: the learner model used to see only success from Studio). ONE kt_evidence event per item
// episode (via 'studio', ×0.75 in learner/kt/bktr.js SOURCE_WEIGHT), graded "code", carrying how many wrong tries came
// before (the adapter's open-item outcome: C0 first try … C4 / episode ended without a correct answer). On a contrast
// piece a right answer discriminates the piece's misconception and a wrong answer that matches its signature is a hit
// on it. Ids are deterministic per (lesson, piece, item), so a resend or a remount is a no-op.
import { archetype } from "./archetypes/index.js";
import { graderFor } from "./qa/graders.js";
import { fromLegacyEvidence } from "../learner/kt/adapter.js";

export const GRADER_VERSION = "studio-grade@1";
/** Answers arrive from an untrusted frame: bound the JSON before it reaches a grader. */
export const MAX_ANSWER_BYTES = 512;

/** Answers per item that can still write evidence: a build (or a script) that brute-forces an item is graded, never counted. */
export const MAX_ANSWERS_PER_ITEM = 12;

/** Graders whose answers address a listed item of `params.items` (the item a skeleton names by id). */
const ITEM_GRADERS = new Set(["fraction_items", "value_items", "balance_items"]);
/** Graders with exactly one fixed key (item "q"). */
const KEY_GRADERS = new Set(["extreme_key", "extreme_rows", "extreme_events", "host_key", "ask_key", "next_stage", "law_value"]);

/**
 * A grading session for one piece. GRADED BY ITEM, NOT BY A POINTER (W2-H fixer, blocker): the stage remounts whenever
 * the Director takes the tray, on a reload or a reconnect, and the activity on screen restarts at its first item while a
 * pointer on the host would still sit on the third. So every answer is graded against an item: the item the answer names
 * (`hint.itemId`, sent by the skeletons), else the first item still open, else (an answer that fits an item already
 * closed: a frame restarted at item 1) that closed item, which comes back `correct` with `alreadyClosed` and writes no
 * second evidence row. The verdict itself is still exactly the gate's grader (qa/graders.js graderFor) run on that one
 * item, so the gate and the lesson cannot disagree.
 *
 * `mount(key)`: a new stage mount (the client sends a mount key per StudioStage mount and "Show me again" epoch). The
 * open/closed bookkeeping restarts with the activity, and the items that already wrote evidence stay remembered, so a
 * remount never doubles a row.
 *
 * Never throws on a malformed answer (it is simply wrong).
 * @param {string} archetypeId @param {object} params FULL params (hostOnly truth included; never sent to the client)
 */
export function createGradeSession(archetypeId, params) {
  const a = archetype(archetypeId);
  const kind = ITEM_GRADERS.has(a.grader) ? "items" : KEY_GRADERS.has(a.grader) ? "key" : a.grader === "card_bins" ? "cards" : a.grader === "sequence" ? "sequence" : "stateful";
  const items = kind === "items" ? (params.items ?? []).map((it) => String(it.id)) : kind === "cards" ? (params.cards ?? []).map(String)
    : kind === "sequence" ? (params.order ?? []).map((k, i) => `pos${i}`) : ["q"];
  let g = kind === "stateful" ? graderFor(a, params) : null;
  const wrongs = new Map(), tries = new Map(), closed = new Set(), evidenced = new Set();
  let complete = false, answers = 0, mountKey = null, lastVerdict = null, wrongsTotal = 0;
  /** One item's verdict by the gate's own grader (a fresh single-item session). */
  const test = (itemId, v) => {
    if (kind === "items") { const it = params.items.find((x) => String(x.id) === itemId); return !!it && !!graderFor(a, { ...params, items: [it] })(v).correct; }
    if (kind === "key") return !!graderFor(a, params)(v).correct;
    if (kind === "cards") return typeof v?.card === "string" && String(v.card) === itemId && !!graderFor(a, params)(v).correct;
    if (kind === "sequence") { const i = Number(itemId.slice(3)); return v?.key === params.order[i]; }
    return false;
  };
  const pick = (v, hint) => {
    if (kind === "cards") return typeof v?.card === "string" ? String(v.card).slice(0, 24) : "?";
    if (kind === "sequence") {
      const i = (params.order ?? []).indexOf(v?.key);
      if (i >= 0 && closed.has(`pos${i}`)) return `pos${i}`;
      return items.find((id) => !closed.has(id)) ?? "?";
    }
    const named = typeof hint?.itemId === "string" && items.includes(hint.itemId) ? hint.itemId : null;
    if (named) return named;
    const open = items.find((id) => !closed.has(id));
    // no item named (a frame): the first open item, unless the answer fits an item already closed and not the open one
    if (open && !test(open, v)) { const done = items.find((id) => closed.has(id) && test(id, v)); if (done) return done; }
    return open ?? items.find((id) => test(id, v)) ?? items[0] ?? "q";
  };
  return {
    archetype: a.id,
    /**
     * @param {unknown} value the child's claimed value @param {{ itemId?: string }} [hint]
     * @returns {{ correct: boolean, itemId: string, complete: boolean, triesBefore: number, closedItem: boolean, alreadyClosed?: boolean, capped?: boolean }}
     */
    grade(value, hint = {}) {
      answers++;
      let v = value;
      try {
        const s = JSON.stringify(v === undefined ? null : v);
        v = s && s.length <= MAX_ANSWER_BYTES ? JSON.parse(s) : null;
      } catch { v = null; }
      if (kind === "stateful") {
        let r;
        try { r = g(v); } catch { r = { correct: false, itemId: "?", complete }; }
        const itemId = String(r.itemId ?? "q").slice(0, 24);
        const before = wrongs.get(itemId) ?? 0;
        if (!r.correct) { wrongs.set(itemId, before + 1); wrongsTotal++; }
        complete = !!r.complete;
        lastVerdict = r.correct ? "right" : "wrong";
        return { correct: !!r.correct, itemId, complete, triesBefore: before, closedItem: !!r.correct && !evidenced.has(itemId) };
      }
      let itemId = "?", correct = false;
      try { itemId = pick(v, hint); correct = items.includes(itemId) && test(itemId, v); } catch { correct = false; }
      const n = (tries.get(itemId) ?? 0) + 1;
      tries.set(itemId, n);
      const before = wrongs.get(itemId) ?? 0;
      const wasClosed = closed.has(itemId) || evidenced.has(itemId);
      if (!correct && !closed.has(itemId)) { wrongs.set(itemId, before + 1); wrongsTotal++; }
      if (correct) closed.add(itemId);
      complete = items.length > 0 && items.every((id) => closed.has(id));
      lastVerdict = correct ? "right" : "wrong";
      const capped = n > MAX_ANSWERS_PER_ITEM;
      return { correct, itemId, complete, triesBefore: before, closedItem: correct && !wasClosed && !capped,
        ...(wasClosed ? { alreadyClosed: true } : {}), ...(capped ? { capped: true } : {}) };
    },
    /** The item's evidence row was written (a remount never writes it again). */
    noteEvidence(itemId) { evidenced.add(itemId); },
    /** A new stage mount: the activity restarted on the child's screen, so the host's bookkeeping restarts with it. */
    mount(key) {
      if (typeof key !== "string" || !key || key === mountKey) return false;
      const first = mountKey === null;
      mountKey = key;
      if (!first) { closed.clear(); complete = false; if (g) g = graderFor(a, params); }
      return !first;
    },
    /** "Show me again": the activity restarts; wrong counts restart too. */
    reset() { if (g) g = graderFor(a, params); wrongs.clear(); tries.clear(); closed.clear(); complete = false; lastVerdict = null; wrongsTotal = 0; },
    /** Open items with ≥ 1 wrong answer and no correct one (the retire-time incorrect events). */
    openWrong() { return [...wrongs].filter(([id, k]) => k > 0 && !closed.has(id) && !evidenced.has(id)).map(([id, k]) => ({ itemId: id, wrongs: k })); },
    get complete() { return complete; },
    get answers() { return answers; },
    get lastVerdict() { return lastVerdict; },
    get wrongCount() { return wrongsTotal; },
  };
}

/**
 * The kt_evidence event for an item whose episode the host just closed (a correct grade), or null.
 * @param {{ lessonId: string, startedAt: any, now: number, intentId: string, archetypeId: string, skillId: string,
 *   itemId: string, triesBefore: number, topicType?: string, kitVerified?: boolean, misconceptionId?: string|null }} c
 */
export function studioEvidenceEvent(c) {
  if (!c.skillId) return null;
  const incorrect = c.outcome === "incorrect";
  // one event per item episode: the correct close OR the retire-time incorrect close, never both (same id)
  const id = `${c.lessonId}:studio:${c.intentId}:${c.itemId}`.slice(0, 200);
  const at = new Date(c.now).toISOString();
  // a contrast piece: a wrong answer that matches the misconception's signature is a hit on it (misconceptionId); a right
  // answer discriminates it (lowers it); a plain wrong answer says nothing about the belief
  const ev = fromLegacyEvidence(
    { skillId: c.skillId, itemId: `studio:${c.archetypeId}:${c.itemId}`, probe: "studio", outcome: incorrect ? "incorrect" : "correct", hintsUsed: 0,
      ...(incorrect && c.signatureHit && c.misconceptionId ? { misconceptionId: c.misconceptionId } : {}) },
    { id, sessionId: c.lessonId, sessionStartAt: new Date(c.startedAt ?? c.now).toISOString(), at, episodeId: `${c.lessonId}:studio:${c.intentId}:${c.itemId}`,
      grader: "code", graderVersion: GRADER_VERSION, triesBefore: c.triesBefore, ...(incorrect ? { episodeEnded: true } : {}),
      ...(!incorrect && c.misconceptionId ? { discriminates: c.misconceptionId } : {}),
      ...(c.topicType ? { topicType: c.topicType } : {}), ...(c.kitVerified === false ? { kitVerified: false } : {}) });
  return ev ? { ...ev, target: c.skillId, via: "studio" } : null;
}

/**
 * Write one host-graded Studio event: fold it onto the child's current learner state and commit the kt_evidence row and
 * the caches in ONE transaction under the child's advisory lock and legal-mode guard (the same contract as the turn's
 * writer and comprehension/later.js writeCorrection). Idempotent by event id. Never throws (a failed write is logged and
 * reported false: evidence is never worth a broken activity).
 * @returns {Promise<{ written: boolean, why?: string }>}
 */
export async function writeStudioEvidence(child, ev) {
  if (!ev) return { written: false, why: "no_event" };
  try {
    const [{ tx }, { loadLive, commitLive, LIVE_FOLD_CTX }, { fuseEvidence, beliefFor }, W, { canWrite }, { facetStmts }] = await Promise.all([
      import("../db.js"), import("../learner/live.js"), import("../comprehension/index.js"), import("../learner/writer.js"), import("../learner/mode.js"), import("../comprehension/store.js")]);
    if (!canWrite(child, "kt")) return { written: false, why: "mode" };
    const live = await loadLive(child);
    if (live.state.ledger.seen[ev.id] !== undefined || live.state.comp?.seen?.[ev.id]) return { written: false, why: "duplicate" };
    const after = fuseEvidence(live.state, [ev], LIVE_FOLD_CTX);
    const stmts = W.ledgerStmts(child, live.state.ledger, after.ledger, [ev]);
    const moved = Object.keys(after.comp.skills).filter((id) => JSON.stringify(live.state.comp.skills[id]) !== JSON.stringify(after.comp.skills[id])).sort();
    const facet = facetStmts(child, moved.map((id) => beliefFor(id, { ...after, now: Date.now() })));
    const all = [W.lockStmt(child.id), W.modeGuardStmt(child.id, child.legal_mode), ...stmts, ...facet];
    const out = await tx(all.map(({ layer: _l, rows: _r, ...x }) => x));
    const seqs = stmts.map((st, i) => (/^with ins as \(insert into kt_evidence/.test(st.text) ? out[i + 2]?.[0]?.seq ?? null : undefined)).filter((x) => x !== undefined);
    commitLive(child, live.maxSeq, after, seqs);
    return { written: seqs.some((s) => s != null) };
  } catch (e) {
    console.warn("[studio] evidence write failed:", String(e?.message ?? e).slice(0, 120));
    return { written: false, why: "error" };
  }
}
