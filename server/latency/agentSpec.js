// Round 5, stream 3 (main + 4A, 2026-10-15): the agent lane's SPECULATED call. On an agent-lane lesson the device's turn
// prefetch (POST /api/lesson/turn-prefetch, ~0.45 s before the turn) already classifies the stable transcript; once that
// classify settles CLEAN, her model call starts on it (server/agent/agent.js agentSpeculate: no tool runs, the deltas are
// held unspoken). The turn that arrives with the SAME words takes it (takeAgentSpec → lessonTurn hooks.agentSpec), and
// agentTurn adopts it only when its own agentCallOf key is identical (every input she would have seen), else aborts it.
// Measured basis (agent-e2e 2026-10-15, n = 12): with the prefetch adopted the turn still waited ~0.6 s before her call.
//
// Never spoken unless adopted: a held draft is aborted, unspoken, on a different transcript, a newer prefetch, a turn that
// does not reach the agent lane (turn.js dropSpec: safeguard, distress, incident, wrap, Director move), or SPEC_TTL_MS.
// Never started (main's conditions): a classify that did not settle, any distress flag (classify, its model read, the
// understanding note), a request, a chip / help / asr / content-filter / predicate source, the safety predicate on the
// words, an open safeguard. TAXILA_AGENT_SPEC=on turns it on (default off: see agentSpecOn).
import { scanSafety } from "../director/safety.js";
import { findItem } from "../director/items.js";
import { applyNote, withAnswerMods } from "../conversation/policy.js";
import { p5Flag } from "../conversation/flags.js";

// OFF by default (agent-spec probe 2026-10-15, n = 10 turns: adopted 7/7 speculable turns with no wrong adoption, but the
// speculation started only 0-81 ms ahead of the turn's own call: the prefetch leads the turn by ~0.3-0.6 s and its classify
// takes about that long, so both reach "classify settled" together; and a turn whose deltas changed started two calls, one
// of them wasted). Worth turning on only where the prefetch leads by more than classify takes. TAXILA_AGENT_SPEC=on.
export const agentSpecOn = (env = process.env) => /^(on|1|true|yes)$/i.test(String(env.TAXILA_AGENT_SPEC ?? ""));
/** A held speculation no turn took is aborted after this long (the turn follows the prefetch by ~0.2-0.9 s). */
export const SPEC_TTL_MS = 12_000;
/** One line per decision, codes only (never the child's words): `[agent-spec] <lesson8> <what>`. */
const log = (lessonId, what) => { if (process.env.TAXILA_AGENT_SPEC_LOG !== "0") console.info(`[agent-spec] ${String(lessonId).slice(0, 8)} ${what}`); };
const NOT_SPECULABLE_SOURCES = new Set(["content_filter", "predicate", "asr", "request", "chip", "help", "empty"]);

/** lessonId → { text, turn, spec, timer } (one held speculation per lesson: a newer prefetch replaces it) */
const held = new Map();
/** lessonId → { text, p } a start in progress (its classify not settled yet) */
const pending = new Map();
/** The longest a turn waits for a pending start of its own words (the classify it adopts is the same one). */
export const TAKE_WAIT_MS = 3000;

const drop = (lessonId, why) => {
  const h = held.get(lessonId);
  if (!h) return;
  held.delete(lessonId);
  clearTimeout(h.timer);
  try { if (!h.spec.aborted) h.spec.abort(why); } catch { /* never throws */ }
};

/**
 * PURE. May her call be speculated on this classified prefetch? → { ok: true } | { none: reason }.
 * @param {{ state: any, text: string, cls: any }} x
 */
export function speculable({ state, text, cls }) {
  if (state?.ctx?.teacher !== "agent") return { none: "lane" };
  if (!cls) return { none: "unclassified" };
  if (state.safeguard) return { none: "safeguard" };
  if (scanSafety(text).distress) return { none: "predicate" };
  const f = cls.flags ?? {};
  if (f.distress || f.wantsToStop) return { none: f.distress ? "distress" : "leaving" };
  if (cls.request || cls.help || NOT_SPECULABLE_SOURCES.has(cls.source)) return { none: "not_plain" };
  return { ok: true };
}

/**
 * The turn's own cls for these words, built as server/brain/turn.js does after classify: the understanding note (waited for
 * only on a non-answer, up to the same budget), then an answer's own words beside the grade. A drift here only costs a miss
 * (the key differs), never a wrong adoption.
 */
async function turnClsOf(P, cls, text, { noteWaitMs, settleWithin }) {
  let out = cls;
  if (P.noteP && out) {
    const nonAnswer = out.outcome === "no_evidence" && !out.request && !out.help && !out.flags?.distress;
    const note = await settleWithin(P.noteP, nonAnswer ? Math.max(0, noteWaitMs - (performance.now() - (P.noteT0 ?? performance.now()))) : 0);
    if (note) out = applyNote(out, note, { mode: P.c2 });
  }
  if (out && text && p5Flag("STEER")) out = withAnswerMods(out, text);
  return out;
}

/**
 * Start (or not) the speculated call for a prefetch. Never throws; resolves { started: true } | { none: reason }.
 * @param {{ agentSpeculate: Function, eventOf: Function, settleWithin: Function, noteWaitMs: number }} d
 * @param {{ lesson: any, state: any, kit: any, text: string, P: any }} x  state: the prefetch's staged state (prefetchInputs)
 */
export function startAgentSpec(d, x) {
  const id = x?.lesson?.id, text = x?.text;
  const p = startInner(d, x);
  // the turn often arrives while THIS prefetch's classify is still settling (it adopts that same classify and waits for it
  // anyway): takeAgentSpec waits for a pending start of exactly its words instead of missing (agent-spec probe 2026-10-15:
  // 7 of 8 turns missed on it)
  if (id && agentSpecOn() && x?.state?.ctx?.teacher === "agent") {
    pending.set(id, { text, p });
    p.finally(() => { if (pending.get(id)?.p === p) pending.delete(id); }).catch(() => {});
  }
  return p;
}

async function startInner(d, x) {
  try {
    if (!agentSpecOn()) return { none: "off" };
    const { lesson, state, kit, text, P } = x;
    if (state?.ctx?.teacher !== "agent") return { none: "lane" };
    const turn = (lesson.state?.turn ?? 0) + 1;
    let cls = await Promise.resolve(P.clsP).catch(() => null);
    const pre = speculable({ state, text, cls });
    if (pre.none) { drop(lesson.id, `prefetch not speculable: ${pre.none}`); log(lesson.id, `none ${pre.none}`); return pre; }
    cls = await turnClsOf(P, cls, text, d);
    const post = speculable({ state, text, cls });
    if (post.none) { drop(lesson.id, `prefetch not speculable: ${post.none}`); log(lesson.id, `none ${post.none}`); return post; }
    // a newer prefetch of this lesson may have started meanwhile: only the latest words are held
    const cur = held.get(lesson.id);
    if (cur && cur.text === text && cur.turn === turn && !cur.spec.aborted) return { none: "held" };
    const card = state.activeItemId ? findItem(state, kit, state.activeItemId) : null;
    // the turn's event for a plain spoken turn (turn.js: no chip, not typed); the prefetch has no ASR confidence of its own
    const event = d.eventOf({ kind: "turn", childText: text, asrConfidence: undefined, chipId: undefined, chipLabel: null, typed: false, cls, card, kit, lang: state.ctx?.lang });
    const spec = d.agentSpeculate({ state, kit, event, silent: false, lessonId: lesson.id, lane: state.mode });
    if (!spec) { log(lesson.id, "none agent_declined"); return { none: "not_speculable" }; }
    drop(lesson.id, "a newer prefetch");
    const timer = setTimeout(() => drop(lesson.id, "no turn took it"), SPEC_TTL_MS);
    timer.unref?.();
    held.set(lesson.id, { text, turn, spec, timer });
    if (held.size > 2000) drop(held.keys().next().value, "evicted");
    log(lesson.id, `started key=${spec.key} turn=${turn}`);
    return { started: true, key: spec.key };
  } catch (e) {
    return { none: `error: ${String(e?.message ?? e).slice(0, 60)}` };
  }
}

/**
 * The held speculation for a turn of `lessonId` with exactly these words, handed over once (the map forgets it). Any other
 * words abort the held one, unspoken. The turn's agentTurn still checks the key before it adopts anything.
 * @returns {Promise<any | null>}
 */
export async function takeAgentSpec(lessonId, childText) {
  const id = String(lessonId ?? "");
  const text = String(childText ?? "").slice(0, 2000).trim();
  const pend = pending.get(id);
  if (pend && pend.text === text) {
    let t; await Promise.race([pend.p.catch(() => null), new Promise((r) => { t = setTimeout(r, TAKE_WAIT_MS); t.unref?.(); })]);
    clearTimeout(t);
  }
  const h = held.get(id);
  if (!h) return null;
  if (h.text !== text || h.spec.aborted) { log(lessonId, `miss ${h.spec.aborted ? "aborted" : "words_differ"}`); drop(String(lessonId), h.spec.aborted ? h.spec.aborted : "the turn's words differ"); return null; }
  held.delete(String(lessonId));
  clearTimeout(h.timer);
  log(lessonId, `taken key=${h.spec.key} ahead=${Math.round(Date.now() - (h.spec.startedAt ?? Date.now()))}ms`);
  return h.spec;
}

/**
 * The turn is done with a handed-over speculation: log whether agentTurn adopted it (it is still un-aborted) or dropped it
 * (it aborted it with its reason), then abort it (a no-op on a finished, adopted call). Never throws.
 */
export function settleAgentSpec(lessonId, spec, why = "turn done") {
  if (!spec) return;
  try { log(lessonId, spec.aborted ? `dropped ${String(spec.aborted).slice(0, 40)}` : "adopted"); spec.abort?.(why); } catch { /* never */ }
}

/** Tests only. */
export const __agentSpec = { held, pending, clear: () => { pending.clear(); for (const k of [...held.keys()]) drop(k, "cleared"); } };
