// The turn's proposers, gathered for the kernel (TEACHER-BRAIN §5.1 stage 3, §10; BUILD-PLAN W2-E #2 "kernel arbitration
// live with today's proposers"). Every component reaches the turn ONLY as typed proposals; nothing here decides. Pure.
//   director       the Director's move (director/proposal.js, W2-C #8): exactly one move per turn, so it is mandatory
//                  within its rank; a safeguard move is the safety floor and freezes everything below it
//   comprehension  a probe rides inside the Director's move today (source "comprehension" when the move is a probe)
//   relational     W2-I's directive, split by relational-adapter.js (BR5)
//   studio         W2-H's statusFacts().propose (reveal / highlight / retire / setParam), and the whiteboard ask on an
//                  explanation beat (owner priority 6)
//   vibe           the persona knobs (recorded; they reach the client as `pace` and the compile as the VIBE row)
// The conductor guard (caps, bedtime, wrapAt) has no per-turn proposer yet: the Director's own minutes wrap carries it.
import { AUTHORITY, proposal } from "./kernel.js";
import { relationalProposals } from "./relational-adapter.js";
import { EXPLAIN_BEATS } from "./beat.js";
import { BANDS } from "../learner/bands.js";
import { splitSentences } from "../voice/sentences.js";
import * as BF from "../stagecraft/board-first.js";
import { gateCtxFor } from "../stagecraft/board-sync.js";
import { offsetsOf } from "./lineParts.js";

/** The Director's proposal with the kernel's turn rules: one move (mandatory in its rank), safety freezes the rest. */
export function directorProposalOf(r) {
  const base = r?.proposal ?? proposal("director", "move", AUTHORITY.director, { payload: { move: { ...(r?.move ?? { kind: "repair" }) } }, reason: [`move.${r?.move?.kind ?? "repair"}`] });
  const safety = base.source === "safety";
  return { ...base, mandatory: true, ...(safety ? { vetoes: ["*"] } : {}) };
}

/** Studio's proposals for this turn from W2-H's turn view (TurnStudio actions). */
export function studioProposalsOf(view) {
  const p = view?.propose;
  if (!p || typeof p !== "object") return [];
  const out = [];
  // ship5 p4-content: a piece the CHILD asked for ("animation dikhao", "game khelna hai") is the one new thing they chose:
  // it costs no attention, so the Director's own chips cannot price their request out (the seam's slotFor still yields to
  // the Director's tray, and a closing move still refuses any reveal)
  if (p.reveal) out.push(proposal("studio", "reveal", AUTHORITY.studio, { payload: { reveal: String(p.reveal) }, costs: { attention: p.requested ? 0 : 1, novelty: 1 }, urgency: p.requested ? 3 : 0, reason: p.requested ? ["studio.reveal", "child.asked_visual"] : ["studio.reveal"] }));
  if (p.highlight) out.push(proposal("studio", "highlight", AUTHORITY.studio, { payload: { highlight: String(p.highlight) }, reason: ["studio.highlight"] }));
  if (p.retire) out.push(proposal("studio", "retire", AUTHORITY.studio, { payload: { retire: String(p.retire) }, urgency: 1, reason: ["studio.retire"] }));
  if (p.setParam && typeof p.setParam === "object") out.push(proposal("studio", "set_param", AUTHORITY.studio, { payload: { setParam: p.setParam }, reason: ["studio.set_param"] }));
  return out;
}

/** The accepted Studio actions, as the wire's TurnStudio (absent when none). */
export function turnStudioOf(arb) {
  const acc = (arb?.accepted ?? []).filter((p) => p.source === "studio");
  const out = {};
  for (const p of acc) {
    if (p.kind === "reveal") out.reveal = p.payload.reveal;
    if (p.kind === "highlight") out.highlight = p.payload.highlight;
    if (p.kind === "retire") out.retire = p.payload.retire;
    if (p.kind === "set_param") out.setParam = p.payload.setParam;
  }
  return Object.keys(out).length ? out : null;
}

/** The moves that open or carry an explanation: only they ask Studio for the live board (not a repair or a hint inside one). */
export const WHITEBOARD_MOVES = Object.freeze(new Set(["explain", "worked_example", "reteach", "recap"]));
/** The Director's template whiteboard rung (W2-B, director/modules.js rungs 4-5): the live board replaces it, never adds. */
export const RUNG_ENGINE = "explainer@1";

/**
 * The whiteboard ask (owner priority 6; LIVE-STUDIO whiteboard slot): on an explanation beat, Studio is asked to draw
 * the explanation as a timed drawing script in sync with her line. A proposal, so the kernel can refuse it. It is not
 * proposed: on a move that does not explain (a repair, a hint or a module turn inside the beat), during strain (a
 * struggling child gets smaller steps, not a new thing to watch; TEACHER-BRAIN §6.3 step 2), on the voice lane (the
 * realtime model's words are not known before it speaks), for a late answer, while an interactive Studio piece is on
 * screen (never pull a game away from a child using it: requestIntent's own refusal rule), or when Studio proposes a
 * reveal this turn (the piece made for this beat wins).
 * It needs the attention slot (nothing else new on screen), EXCEPT when the Director's only new thing is its template
 * whiteboard rung (`rungMounted`): the live board is then the explanation surface and the rung its fallback, so the ask
 * costs no attention and carries `replacesRung` (turn.js drops the rung once Studio acks; a refusal keeps it).
 * Returns { proposals, declined } (the reason code for the trace when nothing was proposed).
 */
export function whiteboardAskOf({ beat, lane, late, strained, move = null, studioView = null, rungMounted = false, requested = false }) {
  // `requested` (owner-truth patch 09, F16; OWNER TEST 2026-10-04 item 5): the CHILD asked to see it (director/requests.js
  // visual → move.visual). Their ask is honoured on any beat, on the voice lane, and when strained (a picture is their
  // smaller step). W2-H's attention and reveal gates below still hold: an interactive piece mid-use is never pulled away.
  if (!requested && (!beat || !EXPLAIN_BEATS.has(beat.type))) return { proposals: [], declined: null };
  if (late) return { proposals: [], declined: "studio_rejected.late" };
  // release 13 (r12 RCA failure 4): the turn that clears the board draws nothing new
  if (move?.clear) return { proposals: [], declined: "studio_rejected.cleared" };
  // round 5: on the agent lane the Teacher draws its own board (server/agent/board.js); no Director whiteboard beside it
  if (move?.agent) return { proposals: [], declined: "studio_rejected.not_explain" };
  // release 13 (A): a picture nothing can make was asked for: no board this turn (the release-13 replay drew the maths table
  // beside "aloo gol, bhura hota hai")
  if (move?.request === "visual_unavailable") return { proposals: [], declined: "studio_rejected.not_explain" };
  // (v6.1, director9 c5-t02 offtopic T26: "drawing karke samjhao" over a live card is a `practice` move, the card re-posed;
  // the child's own picture ask is honoured on it, as on any beat, never declined as "not an explanation")
  if (move && !WHITEBOARD_MOVES.has(move.kind) && !(requested && move.request === "visual")) return { proposals: [], declined: "studio_rejected.not_explain" };
  if (!requested && lane === "voice") return { proposals: [], declined: "studio_rejected.voice_lane" };
  if (!requested && strained) return { proposals: [], declined: "studio_rejected.strained" };
  const on = studioView?.onScreen;
  const interactive = !!on && typeof on.kind === "string" && on.kind !== "whiteboard" && on.archetype !== "whiteboard";
  if (interactive && !studioView?.propose?.retire) return { proposals: [], declined: "studio_rejected.attention" };
  // a ready reveal answers the beat — but the child's own ask for the board outranks a reveal the child did not ask for
  // (ship5 fixer, experience B1: "diagram bana ke dikhao" got neither the board nor the piece, both waiting on the other)
  if (studioView?.propose?.reveal && !(requested && !studioView.propose.requested)) return { proposals: [], declined: "studio_rejected.reveal_ready" };
  return {
    proposals: [proposal("studio", "ask_whiteboard", AUTHORITY.studio, { payload: { beat: beat?.type ?? "explain", beatId: beat?.id ?? null, ...(rungMounted ? { replacesRung: true } : {}), ...(requested ? { requested: true } : {}) },
      urgency: requested ? 3 : 2, costs: { attention: rungMounted ? 0 : 1 }, reason: ["studio.whiteboard_asked", requested ? "child.asked_visual" : `beat.${beat.type}`, ...(rungMounted ? ["studio.replaces_rung"] : [])] })],
    declined: null,
  };
}

/** Vibe's proposal: the knobs this turn runs on (recorded; attention 0). */
export function vibeProposalOf(vibe) {
  if (!vibe) return [];
  return [proposal("vibe", "knobs", AUTHORITY.vibe, { payload: { waitNudgeSec: vibe.waitNudgeSec ?? null, endpointSilenceMs: vibe.endpointSilenceMs ?? null } })];
}

/** Every proposal of the turn. */
export function proposalsOf({ r, relational, studioView, whiteboard, vibe }) {
  return [directorProposalOf(r), ...relationalProposals(relational), ...studioProposalsOf(studioView), ...(whiteboard ?? []), ...vibeProposalOf(vibe)];
}

/** The child's visual request as Studio reads it: { kind, subject?, said? } (shared/brain.ts StudioRequest), or null. PURE. */
export function requestOfSee(see) {
  if (!see || typeof see !== "object") return null;
  const kind = ["number_line", "picture", "draw", "show"].includes(see.show) ? see.show : "show";
  const subject = typeof see.subject === "string" && see.subject.trim() ? see.subject.trim().slice(0, 40) : null;
  const said = Array.isArray(see.said) ? see.said.map(String).filter((x) => /^-?[\d./+]+$/.test(x)).slice(0, 6) : [];
  return { kind, ...(subject ? { subject } : {}), ...(said.length ? { said } : {}), ...(see.off ? { offKit: true } : {}) };
}
const STUDIO_LANG = { hinglish: "hinglish", english: "en", hindi: "hi" };
/**
 * The whiteboard ask for Studio (shared/brain.ts StudioAsk → server/studio/seam.js requestIntent, W2-H; the drawing-script
 * planner is W2-F's archetype; the renderer is W2-B's). It carries the guarded line she is about to speak and the kit
 * content the move was written from; never the child's id or words, never the answer of an item still to be asked.
 * `mode` is "continue" while the same explanation beat goes on (a worked example drawn across turns), else "fresh".
 * @returns {import("../../shared/brain").StudioAsk}
 */
/**
 * round 7 (S4, director3 prep): the item a board is drawn from. The move's own card; else, on a picture ask with no card up
 * (the teach phase: "picture dikhao" while she explains), the worked example's faded step, so the board draws the lesson's
 * own shape (c6 perimeter: measured@1 on the 50 m × 30 m park) instead of nothing. null otherwise (the board as before).
 * @param {(state: object, kit: object, id: string) => object|null} find  director/items.js findItem
 */
export function boardItemOf(next, kit, find) {
  if (next?.lastMove?.itemId) return find(next, kit, next.lastMove.itemId) ?? null;
  if (next?.lastMove?.request === "visual" && next?.fadeItem?.id) return find(next, kit, next.fadeItem.id) ?? null;
  return null;
}

export function whiteboardIntentOf({ lessonId, turn, beat, next, kit, item, line }) {
  const band = BANDS[next?.ctx?.classLevel]?.b4 ?? "B3"; // the one bands table (BUILD-PLAN §1.10)
  const mis = beat.type === "contrast" && next?.lastReteach?.turn === next?.turn ? next.lastReteach.misId ?? null : null;
  const skillId = next?.lastMove?.skillId ?? item?.skillId ?? kit?.skills?.[0]?.id ?? "";
  // round 5 (stream 2, RCA-1): what the child asked to see (director/state.js move.see: how, the thing named, the numbers
  // named), this turn only. Studio draws THAT; it is never the child's words, only the request's shape and subject.
  // (state.js sets lastMove on every step, so a see from an earlier turn never rides on a later move)
  // an example asked for ("ek example do") is drawn as her worked example, on a new page
  // (v6.1, director9 c5-t02: "picture dikhao" with nothing named carries no `see`, so the ask carried no request and Studio's
  // second view — keyed on a request — never came: a picture ask is always a request, at least "show")
  const visualNow = next?.lastMove?.request === "visual" || (!!next?.lastMove?.visual && next.lastMove.visual !== "game");
  // (v6.6, main on director14 c5-t01 steady 18: the content filter dropped the picture's own line and the bare card was said over
  // the second view): a scripted picture turn whose line has the card and no alt part is the card on its own board — no second
  // view is asked under the card's words
  const list = line?.parts?.list ?? null;
  const cardNoAlt = !!list && list.some((p) => p.part === "card") && !list.some((p) => p.part === "alt");
  const request = (visualNow && !cardNoAlt ? requestOfSee(next.lastMove.see) ?? { kind: "show" } : null) ?? (next?.lastMove?.request === "example" ? { kind: "example" } : null);
  return {
    intent: {
      intentId: `${lessonId}:wb:${turn}`, lessonId, kind: "whiteboard", skillId, ...(item?.id ? { itemIds: [item.id] } : {}),
      need: mis ? "contrast_misconception" : "explain", ...(mis ? { misconceptionId: mis } : {}), beat: beat.type, neededAtMs: 0, priority: "on_cue",
      style: { band, lang: STUDIO_LANG[next?.ctx?.lang] ?? "hinglish", motion: band === "B1" ? "calm" : "lively" },
      ...(request ? { request } : {}),
      // round 7 (dc-r7-teaching-scripts; Studio's BOARD-REFS): the scripted beat's board, explicit on the ask, so Studio's
      // preselect reads one field and never the Director's state shape (an absent or failing ref: Studio's own pick)
      // v5 B1 (main; Studio's segments): the line's parts each have the board they describe. The first part's board is
      // boardRef/scriptBeat (as before: the beat's board when nothing is closed and the card shares it); each later part is a
      // segment from its character offset in the FINAL line (a closure → the beat's board → the card's own board)
      // v6: the assembled parts' texts (brain/say.js guard.parts) place them exactly when the line has them
      ...ofCardMarks(revealOnVerdict(boardPartsOf(next?.lastMove, String(line.text ?? ""), item ? ((next?.ctx?.lang === "english" ? item.prompt_en : item.prompt_hi) || item.prompt_en || null) : null, line.parts ?? null), next), next),
    },
    line: { lessonId, ...(line.teacherReplySeq != null ? { teacherReplySeq: line.teacherReplySeq } : {}), text: String(line.text ?? "") },
    // a page drawn for the child's request is a new page: it clears the board (never drawn over what was there)
    // (a script beat's own board is a new page: e1 → e2 → e3 are one "explain" beat to the Director; Studio, director4 S1)
    mode: !request && next?.wbBeat === beat.id && !next?.lastMove?.scriptBeat?.board ? "continue" : "fresh",
    kit: { topicId: kit?.topicId ?? next?.topicId ?? "", ...(next?.kitHash ? { kitHash: next.kitHash } : {}),
      content: (next?.lastContent ?? []).map((x) => String(typeof x === "string" ? x : JSON.stringify(x))).slice(0, 8),
      ...(item ? { item: { id: item.id, prompt_en: item.prompt_en ?? "", prompt_hi: item.prompt_hi ?? "" } } : {}),
      ...(next?.module ? { onScreen: true } : {}) },
  };
}

/**
 * The clause (0-based, as brain/clauses.js numbers the reply: voice/sentences.js splitSentences) that holds character `at`
 * of the reply, or null. A part that starts inside a merged piece switches at that piece's start (a moment early, never late).
 */
export function clauseAt(reply, at) {
  const r = String(reply ?? "").replace(/\s+/g, " ").trim();
  if (!r || !(at >= 0)) return null;
  let pos = 0;
  for (const [i, p] of splitSentences(r).entries()) {
    const start = r.indexOf(p, pos);
    const end = start + p.length;
    if (at < end) return i;
    pos = end;
  }
  return null;
}
/** Where the card (her line's last part) starts in the reply, or null when it is not in it. */
export function cardAt(reply, card) {
  const r = String(reply ?? "").replace(/\s+/g, " ").trim(), c = String(card ?? "").replace(/\s+/g, " ").trim();
  if (!r || !c) return null;
  const at = r.lastIndexOf(c);
  return at >= 0 ? at : (() => { const h = r.lastIndexOf(c.slice(0, Math.min(40, c.length))); return h >= 0 ? h : null; })();
}
/** The clause where the card starts (cardAt → clauseAt). */
export const cardClauseOf = (reply, card) => { const at = cardAt(reply, card); return at == null ? null : clauseAt(reply, at); };
// the closure sentences say.js assembles (the give-up reveal, "Toh poora jawab", the missed card's close), in either language
const CLOSURE = /(?:Pichhle sawaal ka jawab|Toh poora jawab|Aur pehle wale sawaal ka jawab|The last question's answer was|So the full answer|And the earlier question's answer was)[^.!?\u0964]*(?:[.!?\u0964]+|$)/g;
const CLOSED = /(?:Aur pehle wale sawaal ka jawab|And the earlier question's answer was)[^.!?\u0964]*(?:[.!?\u0964]+|$)/;
const norm1 = (t) => String(t ?? "").replace(/\s+/g, " ").trim();
const skipSpace = (r, i) => { while (i < r.length && r[i] === " ") i++; return i; };
/** The end of the last closure sentence in the reply (0 when there is none). */
export function closureEnd(reply) {
  const r = norm1(reply);
  let end = 0;
  for (const m of r.matchAll(CLOSURE)) end = m.index + m[0].length;
  return end ? skipSpace(r, end) : 0;
}
const refOf = (b) => ({ scriptId: b.scriptId, beatId: b.beatId, kind: b.kind, ...(b.ownBoard ? { ownBoard: true } : {}), ...(b.answers?.length ? { answers: [...b.answers] } : {}) });
/**
 * v5 B1: the parts of a scripted line and their boards, from the move (state.js closeBeat / closedBeat / scriptBeat / cardBeat):
 * a closure, a give-up and the skill's bridge on the board the last turn ended on; a missed card's close on that card's own
 * board; the beat; the card. `segmentPlan` [{ part, boardRef, scriptBeat, said? }] always when there is more than one part
 * (Studio places it on a line it replaces with segmentsAt); on a line with text: boardRef/scriptBeat = the first part's,
 * `segments` [{ atChar, atClause, boardRef, scriptBeat }] = each later part whose board differs. {} with no scripted board.
 * v6 (main, director8 hand judges): `parts` (brain/say.js guard.parts: the texts of the assembled parts) makes the first part
 * everything about the card just answered: the verdict with its reason too (a graded-right "Haan, sahi hai, kyunki …" was
 * unsegmented and read against the next card's board); a missed card's close is its own part; a bridge with its own board
 * (move.bridgeBeat) is its own part, and with none it stays on the board before it (its words point at nothing, say.js).
 */
/**
 * v6.2 G3 (main, director10, with Studio): a right answer's verdict segment carries the key, so Studio's confirm-reveal fires on the
 * answered card's board whether or not her page says the digits: { reveal: true, answers } (Studio's shape: true reveals answers[0], so
 * the key is put first) on the first segment's scriptBeat, when that
 * segment is on the answered card's board (move.closeBeat) and this turn graded the card right (turn.js lastVerdict / lastGraded).
 */
/**
 * App's replay (LESSON-REPLAY-d10 3b, main approved): while the board on screen is not the open card's board, App collapses the
 * card to "your question is waiting". Each page Brain sends says so: `ofCard` true on a page drawn on the open card's own board
 * (state.js cardBeat, else the beat the card is asked on), false on any other. No open card, or no board: no field (today's
 * behaviour). In a paged turn a new card is always on the LAST page (the card part is last in the plan, and segmentsAt never
 * places a page after it), so App's pinned card switches at the last page switch.
 */
/**
 * v6.5 P2′ (main, director13 c4 steady 56/60, offtopic 56: c3's page refused, "Kya yeh chhota tukda cake ka ek-chauthaai hai?"
 * said over c2's 1/3 bar): whether Studio would refuse the CARD's own page of this line — the last page of a paged turn — taken
 * as stagecraft/board-first.js pagesBoard takes a later page (its board, its words, a check on its own board). Pure code, no
 * model; its pick has its own id, so the real ask's picks are untouched. A one-page turn is never "refused" here.
 */
export function cardPageRefused({ lessonId, turn, next, kit, item, line }) {
  try {
    const a = whiteboardIntentOf({ lessonId, turn, beat: { id: "visual", type: "explain" }, next, kit, item, line });
    const segs = a.intent.segments ?? [];
    const card = next?.activeItemId ? next?.lastMove?.cardBeat?.board ?? null : null;
    const last = segs.at(-1);
    if (!last || !card || JSON.stringify(last.boardRef) !== JSON.stringify(card)) return false;
    const text = String(line?.text ?? "").replace(/\s+/g, " ").trim().slice(last.atChar);
    const beat = { ...(last.scriptBeat ?? {}) };
    if (!beat.kind) beat.kind = "check";
    if (beat.kind === "check" && beat.ownBoard === undefined) beat.ownBoard = true;
    const intent = { ...a.intent, intentId: `${a.intent.intentId}:cardpg`, boardRef: last.boardRef, scriptBeat: beat };
    delete intent.then; delete intent.segments; delete intent.cardBoard; delete intent.request; delete intent.segmentPlan;
    const one = { ...a, intent, mode: "fresh", line: { ...a.line, text } };
    BF.preselect(one, { kit });
    return !BF.takePreselected(one, gateCtxFor(one, { kit, redact: [], prior: [] }))?.script;
  } catch { return false; }
}
export function ofCardMarks(bp, next) {
  const move = next?.lastMove;
  const cardBoard = next?.activeItemId ? (move?.cardBeat?.board ?? move?.scriptBeat?.board ?? null) : null;
  // (v6.5 P3: the first page of a picture turn is Studio's second view, never the card's own page, though it names the card's board)
  const { altPage, ...bp0 } = bp ?? {};
  if (!cardBoard || !bp0?.boardRef) return bp ? bp0 : bp;
  bp = bp0;
  const key = JSON.stringify(cardBoard);
  const of = (b) => JSON.stringify(b) === key;
  return { ...bp, ofCard: altPage ? false : of(bp.boardRef), ...(bp.segments ? { segments: bp.segments.map((g) => (g.boardRef ? { ...g, ofCard: of(g.boardRef) } : g)) } : {}) };
}
export function revealOnVerdict(bp, next) {
  const g = next?.lastGraded, cb = next?.lastMove?.closeBeat;
  if (!bp?.scriptBeat || !bp.boardRef || next?.lastVerdict !== "correct" || !g?.key || !cb?.board) return bp;
  if (JSON.stringify(bp.boardRef) !== JSON.stringify(cb.board)) return bp;
  const key = String(g.key);
  const answers = [key, ...(bp.scriptBeat.answers?.length ? bp.scriptBeat.answers : (g.accept ?? [])).map(String).filter((a) => a !== key)];
  return { ...bp, scriptBeat: { ...bp.scriptBeat, reveal: true, answers } };
}
/**
 * v6.6 P4 (main, director14): the pages of a line given as its ordered parts (brain/say.js guard.lineParts, kept through every
 * later edit): each part on its own board, offsets from the join — never a search of the text. A part with no board of its own
 * (an aside, a bridge with no board, a close with no answered board) is said over the page it follows (the first, over the page
 * after it). Consecutive parts on one board are one page; a picture turn's alt part is its own page (Studio's second view) and
 * the card part the next, both naming the card's board. The short-page rules are segmentsAt's.
 */
const STRICT_PAGES = () => !!process.env.NODE_TEST_CONTEXT || process.env.TAXILA_STRICT_PAGES === "1";
export function pagesOfParts(move, list, line) {
  const text = norm1(line);
  const offs = offsetsOf(list);
  if (STRICT_PAGES() && offs.map((p) => p.text).join(" ") !== text) throw new Error(`P4: the parts are not the line (${JSON.stringify(offs.map((p) => p.part))})`);
  const closing = move?.gave || move?.workedDone || move?.sayFirst?.length || offs.some((p) => p.part === "close");
  const beatFor = (part) => {
    switch (part) {
      case "close": return closing && move?.closeBeat?.board ? move.closeBeat : null;
      case "closed": return move?.closed ? (move.closedBeat ?? move.closeBeat ?? null) : null;
      case "bridge": return move?.bridgeBeat?.board ? move.bridgeBeat : null;
      case "simpler": return move?.simplerBeat?.board ? move.simplerBeat : move?.scriptBeat?.board ? move.scriptBeat : null;
      case "alt": case "card": return move?.cardBeat?.board ? move.cardBeat : move?.scriptBeat?.board ? move.scriptBeat : null;
      case "body": return move?.scriptBeat?.board ? move.scriptBeat : move?.cardBeat?.board ? move.cardBeat : null;
      case "aside": return null;
      default: return move?.scriptBeat?.board ? move.scriptBeat : move?.cardBeat?.board ? move.cardBeat : move?.closeBeat?.board ? move.closeBeat : null;
    }
  };
  // (a close that says nothing about the card — no why, no key, only "not right": "Nahi, yeh jawab nahi hai. Koi baat nahi, ek alag tarah se
  // dekhte hain." — has no board of its own: it is said over the page it opens, as a bare verdict always was)
  // (a right verdict stays on the card it confirms: the board's reveal is on that page)
  // (a not-right verdict that only names their answer — "7 cm sahi nahi hai." — says nothing a board shows: it opens the page after)
  const says = (t) => /(?<![\p{L}])(?:kyunki|because|isliye|jawab\s+.{1,30}?\s+tha)(?![\p{L}])/iu.test(t) || /^(?:haan|bilkul|sahi|right|correct|yes)\b/i.test(t)
    || (/\d/.test(t) && !/(?<![\p{L}])(?:nahi|nahin|not|galat)(?![\p{L}])/iu.test(t));
  let placed = offs.map((p) => ({ part: p.part, start: p.start, beat: p.part === "close" && !says(p.text) && offs.length > 1 ? null : beatFor(p.part), alt: p.part === "alt" }));
  // (a part with no board rides on the page before it; leading ones on the first page with a board)
  for (let i = 1; i < placed.length; i++) if (!placed[i].beat) placed[i] = { ...placed[i], beat: placed[i - 1].beat, alt: placed[i - 1].alt };
  const firstB = placed.find((p) => p.beat);
  if (!firstB) return null;
  placed = placed.map((p) => (p.beat ? p : { ...p, beat: firstB.beat, alt: firstB.alt }));
  const pages = [];
  for (const p of placed) {
    const last = pages.at(-1);
    if (last && JSON.stringify(last.beat.board) === JSON.stringify(p.beat.board) && last.alt === p.alt) { last.parts.push(p.part); continue; }
    pages.push({ atChar: p.start, beat: p.beat, alt: p.alt, parts: [p.part] });
  }
  const hasCard = (i) => pages[i].parts.includes("card");
  const seg = (i) => text.slice(pages[i].atChar, pages[i + 1]?.atChar ?? text.length);
  // (segmentsAt's rules: a later page under PAGE_MIN_WORDS with no card is no page; a bare first page — no number, under
  // FIRST_PAGE_MIN_WORDS, no card — joins the next. Never an alt page: Studio's second view is a page of its own)
  for (let i = pages.length - 1; i > 0; i--) if (!hasCard(i) && !pages[i].alt && seg(i).split(/\s+/).filter(Boolean).length < PAGE_MIN_WORDS) { pages[i - 1].parts.push(...pages[i].parts); pages.splice(i, 1); }
  if (pages.length > 1 && !hasCard(0) && !pages[0].alt && !/\d/.test(seg(0)) && seg(0).split(/\s+/).filter(Boolean).length < FIRST_PAGE_MIN_WORDS) {
    pages[1] = { ...pages[1], atChar: 0, parts: [...pages[0].parts, ...pages[1].parts] }; pages.shift();
  }
  for (let i = pages.length - 1; i > 0; i--) if (JSON.stringify(pages[i].beat.board) === JSON.stringify(pages[i - 1].beat.board) && pages[i].alt === pages[i - 1].alt) { pages[i - 1].parts.push(...pages[i].parts); pages.splice(i, 1); }
  const out = pages.map((p, i) => ({ atChar: i ? p.atChar : 0, atClause: clauseAt(text, i ? p.atChar : 0), boardRef: p.beat.board, scriptBeat: refOf(p.beat), alt: p.alt, parts: p.parts }));
  if (STRICT_PAGES()) {
    // P4 predicates (main): a close that says something, then a card on another board, is ≥ 2 pages, the first on the answered
    // card's board; a picture turn is the alt page, then the card on its own board
    const closeT = offs.filter((p) => p.part === "close").map((p) => p.text).join(" ");
    const cardB = beatFor("card")?.board, closeB = beatFor("close")?.board;
    if (closeB && cardB && offs.some((p) => p.part === "card") && JSON.stringify(closeB) !== JSON.stringify(cardB)
      && says(closeT)
      && (out.length < 2 || JSON.stringify(out[0].boardRef) !== JSON.stringify(closeB))) throw new Error(`P4: a close and a next card are not two pages (${JSON.stringify(out.map((p) => p.parts))})`);
    if (offs.some((p) => p.part === "alt") && offs.some((p) => p.part === "card") && !(out[0].alt && out.length > 1 && out.at(-1).parts.includes("card") && !out.at(-1).alt)) {
      throw new Error(`P4: a picture turn is not the alt page then the card's page (${JSON.stringify(out.map((p) => [p.alt, p.parts]))})`);
    }
  }
  return out;
}
export function boardPartsOf(move, line, card, parts = null) {
  // v6.6 P4: a line given as its parts is paged from them (the probe on the card just answered is asked on that card's board)
  if (move?.kind === "probe" && move?.closeBeat?.board && move?.scriptBeat?.beatId && move.scriptBeat.beatId === move.closeBeat.beatId) {
    move = { ...move, scriptBeat: { ...move.scriptBeat, board: move.closeBeat.board }, ...(move.cardBeat?.beatId === move.closeBeat.beatId ? { cardBeat: { ...move.cardBeat, board: move.closeBeat.board } } : {}) };
  }
  if (parts?.list?.length) {
    const pages = norm1(line) ? pagesOfParts(move, parts.list, line) : null;
    if (pages?.length) {
      const segPlan = pages.flatMap((p) => p.parts.map((part) => ({ part, boardRef: p.boardRef, scriptBeat: p.scriptBeat })));
      return { boardRef: pages[0].boardRef, scriptBeat: pages[0].scriptBeat, ...(pages[0].alt ? { altPage: true } : {}),
        ...(pages.length > 1 ? { segments: pages.slice(1).map(({ atChar, atClause, boardRef, scriptBeat }) => ({ atChar, atClause, boardRef, scriptBeat })) } : {}),
        ...(segPlan.length > 1 ? { segmentPlan: segPlan } : {}) };
    }
  }
  // v6.6 P4: a line with no parts (a line say.js did not assemble, a preselect before her line exists) is never searched for its
  // parts: it is one page, on the board the turn is about (the beat's, else the card's, else the close's)
  const one = move?.scriptBeat?.board ? move.scriptBeat : move?.cardBeat?.board ? move.cardBeat : move?.closeBeat?.board ? move.closeBeat : null;
  if (!one) return move?.scriptBeat ? { scriptBeat: refOf(move.scriptBeat) } : {};
  return { boardRef: one.board, scriptBeat: refOf(one) };
}
/** Where a part's text starts and ends in the line ([start, end] after the trailing space), or null. */
function spanOf(text, part) {
  const t = norm1(part);
  if (!t) return null;
  const i = text.indexOf(t);
  return i < 0 ? null : [i, skipSpace(text, i + t.length)];
}
/**
 * A segment plan placed on a line: the closure part from 0; a missed card's close from its sentence; the beat after the last
 * closure sentence and any bridge line; the card where its text starts. Consecutive parts on the same board merge, empty parts
 * drop. With no text (a preselect before her line exists) the parts cannot be placed: the beat's (else the first) alone.
 * v6: with `parts` (say.js guard.parts) the closure, the missed card's close and the bridge are found by their own texts.
 */
export const PAGE_MIN_WORDS = 5;
// (a code verdict is 3-5 words: "Haan, sahi hai.", "Nahi, yeh jawab nahi hai.")
export const FIRST_PAGE_MIN_WORDS = 6;
export function segmentsAt(plan, line, card, parts = null) {
  const text = norm1(line);
  const closePart = plan.find((p) => p.part === "close");
  let bodyAt, closedAt, bridgeAt = null;
  const prevS = parts?.prev ? spanOf(text, parts.prev) : null, closedS = parts?.closed ? spanOf(text, parts.closed) : null, bridgeS = parts?.bridge ? spanOf(text, parts.bridge) : null;
  if (prevS || closedS || bridgeS) {
    bodyAt = Math.max(prevS?.[1] ?? 0, closedS?.[1] ?? 0, bridgeS?.[1] ?? 0);
    closedAt = closedS?.[0] ?? null;
    bridgeAt = bridgeS?.[0] ?? null;
  } else {
    bodyAt = closureEnd(text);
    for (const said of closePart?.said ?? []) { const t = norm1(said).replace(/[.!?\u0964]+$/, ""); const i = t ? text.indexOf(t) : -1; if (i >= 0) bodyAt = Math.max(bodyAt, skipSpace(text, text.indexOf(" ", i + t.length) < 0 ? text.length : i + t.length + 1)); }
    const cm = CLOSED.exec(text);
    closedAt = cm ? cm.index : null;
  }
  // (v6.3 P1, director11 c4 steady T74, offtopic T50, stuck T54: "Tumne khaye hue tukde 1 ko upar …", her line taking up what they
  // did on the card just closed, was paged onto the next card's board): a sentence of hers about what THEY did, straight after
  // the close, stays on the close's page
  if (bodyAt && (prevS || closePart)) {
    const rest = text.slice(bodyAt);
    const m = /^(?:Tumne|Tum ne|Aapne|You)\b[^.!?\u0964]*[.!?\u0964]+\s*/u.exec(rest);
    const cardStart = cardAt(text, card);
    if (m && !/[?？]/.test(m[0]) && !(cardStart != null && cardStart < bodyAt + m[0].length)) bodyAt += m[0].length;
  }
  // (v6.3 P1: a simpler part of its own is placed by its text; what follows it — the body, the card — starts after it)
  const simplerS = parts?.simpler && plan.some((p) => p.part === "simpler") ? spanOf(text, parts.simpler) : null;
  if (simplerS) bodyAt = Math.max(bodyAt ?? 0, simplerS[1]);
  const at = { close: 0, closed: closedAt, bridge: bridgeAt, simpler: simplerS?.[0] ?? null, body: bodyAt, card: cardAt(text, card) };
  if (!text) {
    const one = plan.find((p) => p.part === "body") ?? plan.find((p) => p.part === "card") ?? plan[0];
    return [{ atChar: 0, boardRef: one.boardRef, scriptBeat: one.scriptBeat }];
  }
  const out = [];
  for (const p of plan) {
    const a = at[p.part];
    if (a == null || (p.part === "close" && !bodyAt && closedAt == null)) continue;
    const prev = out.at(-1);
    if (prev && a <= prev.atChar) out.pop();
    const keep = out.at(-1);
    if (keep && JSON.stringify(keep.boardRef) === JSON.stringify(p.boardRef)) continue;
    out.push({ atChar: out.length ? a : 0, atClause: clauseAt(text, out.length ? a : 0), boardRef: p.boardRef, scriptBeat: p.scriptBeat });
  }
  if (!out.length) out.push({ atChar: 0, atClause: 0, boardRef: plan.at(-1).boardRef, scriptBeat: plan.at(-1).scriptBeat });
  out[0] = { ...out[0], atChar: 0, atClause: 0 };
  // (dc-r7-script-walk-v6-1 P1, replay of director9 c5-t01 steady T21: a page whose own words are a bare transition — "Ab agla
  // hissa.", 3 words, back on the answered card's board — cannot be drawn in its time (Studio W6.timing), so the whole paged
  // turn failed and the verdict page's revealed 1/8 never reached the screen. A page switch with fewer than PAGE_MIN_WORDS
  // words and no card of its own is no page: the board before it stays up while it is said)
  for (let i = out.length - 1; i > 0; i--) {
    const seg = text.slice(out[i].atChar, out[i + 1]?.atChar ?? text.length);
    const hasCard = at.card != null && at.card >= out[i].atChar && at.card < (out[i + 1]?.atChar ?? text.length + 1);
    if (!hasCard && seg.split(/\s+/).filter(Boolean).length < PAGE_MIN_WORDS) out.splice(i, 1);
  }
  // (director10, main: 9 of 31 unpaged turns opened on a code not-right verdict, "Nahi, yeh jawab nahi hai.", as a first page of
  // its own; Studio cannot draw a page that short and a failing FIRST page fails the turn. A bare first page under PAGE_MIN_WORDS
  // (FIRST_PAGE_MIN_WORDS) with no card and no number (a bare verdict) joins the next page: its words are said over that page's board — a bare verdict says nothing a board contradicts)
  if (out.length > 1) {
    const seg0 = text.slice(0, out[1].atChar);
    const hasCard0 = at.card != null && at.card < out[1].atChar;
    if (!hasCard0 && !/\d/.test(seg0) && seg0.split(/\s+/).filter(Boolean).length < FIRST_PAGE_MIN_WORDS) { out.shift(); out[0] = { ...out[0], atChar: 0, atClause: 0 }; }
  }
  for (let i = out.length - 1; i > 0; i--) if (JSON.stringify(out[i].boardRef) === JSON.stringify(out[i - 1].boardRef)) out.splice(i, 1);
  return out;
}

/**
 * v6 (Studio's S3′ second view; main on integration 11: preselectWhiteboard returns the facts row, a string, so the pick's
 * altView never reached Brain): the second view of the same numbers, read off the preselected row itself. Bars ("bar1 6 equal
 * parts, 1 shaded = 1/6"; an asked bar "… 3 shaded = ?") → { view: "parts", labels }; with Studio's hint "line" (a bar card's
 * second view is a number line: "line 0 to 1 · gaps 8 equal gaps in each whole · each 1/8 · marks 1/8") → { view: "line",
 * labels, gaps }. Labels never carry an asked "?". null when the row is no second view. Pure.
 */
export function altViewOfRow(row, hint = null) {
  const r = String(row ?? "");
  const hv = hint?.view ?? hint;
  // (Studio director12 S4: a count-key card's second view is a smaller case of the same rule — "bar1 4 equal parts, 1 shaded
  // = 1/4" — and a bar card's is the same whole round, a circle card's the bar: "whole circle · parts 8 · shaded 1 · fraction 1/8")
  if (hv === "example") { const b = /\bbar1\s+(\d+)\s+equal parts,\s*(\d+)\s+shaded\s*=\s*(\d+\/\d+)/.exec(r); return b ? { view: "example", labels: [b[3]], parts: Number(b[1]) } : null; }
  const one = /\bwhole (circle|bar) · parts (\d+) · shaded (\d+)(?: · fraction (\d+\/\d+))?/.exec(r);
  if (one && (hv === "round" || hv === "parts")) return { view: one[1] === "circle" ? "round" : "parts", labels: one[4] ? [one[4]] : [], parts: Number(one[2]), shaded: Number(one[3]) };
  if (hint === "line" || (hint && hint.view === "line")) {
    const marks = (/\bmarks\s+([\d/ ,]+)/.exec(r)?.[1] ?? "").match(/\d+\/\d+/g) ?? [];
    const gaps = Number(/\bgaps\s+(\d+)\s+equal gaps/.exec(r)?.[1]) || null;
    return { view: "line", labels: marks, ...(gaps ? { gaps } : {}) };
  }
  // (Studio wholes@1, a compare card's two wholes: "whole1 3 unequal parts · whole2 3 equal parts, 1 shaded")
  const wholes = [...r.matchAll(/\bwhole\d+\s+(\d+)\s+(equal|unequal)\s+parts(?:,\s*(\d+)\s+shaded)?/g)];
  if (wholes.length && (hint === "wholes" || hint?.view === "wholes" || !/\bbar\d+\s/.test(r))) {
    return { view: "wholes", labels: [], wholes: wholes.map((w) => ({ parts: Number(w[1]), equal: w[2] === "equal", ...(w[3] != null ? { shaded: Number(w[3]) } : {}) })) };
  }
  const bars = [...r.matchAll(/\bbar\d+\s+(\d+)\s+equal parts,\s*(?:(\d+)\s+shaded\s*=\s*(\d+\/\d+|\?)|\?\s*\(asked\))/g)];
  if (!bars.length) return null;
  return { view: "parts", labels: bars.map((b) => b[3]).filter((x) => x && x !== "?") };
}
