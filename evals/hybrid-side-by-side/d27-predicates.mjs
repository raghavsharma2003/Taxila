// dc-r8-director27 (docs/patches/to-brain/041): the predicates written from the gate's own sentences, not from director27's shapes
// (fd-predicate-must-fail-on-judges-rows, fd-predicate-proved-on-last-runs-fault). Each reads non-zero on every director27 row the work
// order lists for it (tests/r8-director27-predicates.test.mjs) and is gated at 0 on the dry matrix. Merged into dry-predicates.mjs's
// PREDICATES. Pure.
//
// P1, one paging law: a turn's pages come from the parts said in it, in order. A part with a board of its own pages it at its own first
// word; a part with no board keeps what is up; a card's board is never drawn before the card's first word.
//   boardOfSaidPart  every board on screen during a turn belongs to a part said in that turn or earlier in the lesson (never a card not
//                    yet said)
//   partOwnBoard     a part that has its own board has that board up at its first word (and through it); a part with none keeps what is up
//   cardBoardUp      a turn that says a card (first telling, re-ask or return) has that card's board up from the card's first word
// P3, requests:
//   requestHelped    a turn that answers a request (clarify, give-up, Hindi) holds a help part of the part she was on, its key, or — only
//                    when that part has nothing unsaid — the helpSpent line (or after a key, the after-key line). A back-to line with a
//                    card, or a next step, is not an answer
// P5, joints:
//   returnLed        a card said again after other parts were said since its last telling (a return) is led by the back-to joint or the
//                    after-key return form
import { FALLBACK_JOINTS, helpPart, ladderOf, sentencesOf, normSentence, sameSentence } from "../../server/director/help.js";
import { CODE_SEAM_FORMS } from "../../server/brain/seams.js";

const norm = (t) => String(t ?? "").replace(/\s+/g, " ").trim();
const low = (t) => norm(t).toLowerCase();
/** A board's identity: its template and params, keys sorted (a board is the same board however its params were written). */
const canon = (v) => (Array.isArray(v) ? `[${v.map(canon).join(",")}]` : v && typeof v === "object" ? `{${Object.keys(v).sort().map((k) => `${JSON.stringify(k)}:${canon(v[k])}`).join(",")}}` : JSON.stringify(v ?? null));
const keyOf = (b) => (b && typeof b === "object" && b.template ? canon({ template: b.template, params: b.params ?? {} }) : null);
const sameB = (a, b) => !!keyOf(a) && keyOf(a) === keyOf(b);
const brief = (b) => (b ? `${String(b.template).replace(/@\d+$/, "")} ${JSON.stringify(b.params ?? {}).slice(0, 40)}` : "nothing");
/** A part that is only a check-in (brain/say.js BEAT_ASK and WORKED_ASK, both languages): a question to the child, no part's content. */
const CHECKIN_ONLY = /^(?:Yahan tak (?:theek|saaf) hai|Ab tak samajh aaya|Yeh hissa saaf hua|Yeh kadam (?:saaf hai|samajh aaya)|Does that make sense so far|Clear so far|All good so far|Is that (?:part|step) clear|Did that step make sense)\?$/i;
const KEY_SAID = /(?:is sawaal ka|iska|yahan|pichhle sawaal ka|woh wala:?) (?:sahi )?jawab|sahi jawab:|the answer (?:here )?(?:is|was)|iska jawab hai|poora jawab:?|the full answer|(?:^|[.!?]\s+)(?:haan|nahi|yes|no), (?:kyunki|because)\b/i;
const CARDISH = new Set(["card", "alt"]);
// (Brain 042: a quick question is its point's, an asked step is its step: the address moves to them)
const TEACH = new Set(["body", "simpler", "card", "alt", "bridge", "held", "close", "closed", "quick", "stepAsk"]);

/** The forms of a joint kind, as normalised sentences: the script's own and code's fallback. */
function jointSentences(script, kind) {
  const forms = [...(script?.joints?.[kind] ?? []), ...(FALLBACK_JOINTS[kind] ?? [])];
  return forms.flatMap((f) => [f?.hi, f?.en, typeof f === "string" ? f : null]).filter(Boolean).flatMap((t) => sentencesOf(String(t).replace(/\{\w+\}/g, ""))).map(normSentence).filter((k) => k.split(" ").length >= 3);
}
const hasJoint = (text, script, kinds) => { const ss = sentencesOf(text).map(normSentence); return kinds.some((k) => jointSentences(script, k).some((j) => ss.some((s) => sameSentence(s, j)))); };

/**
 * A turn's parts with their texts and own boards. A part's own board is the board of the script part it says: a point's, a card's, a
 * remediation's own `board`, a worked problem's or step's, a close's answered board, help's board as the help decision returned it. None
 * (it keeps what is up): an aside, a bridge, a check-in, a remediation with no board in the script. A seam's joint is said over the board of
 * the part it leads into. The record's `own` is that board when the run wrote it; an older record's `boards` list names a remediation's own
 * board first and its then-card's after it (a remediation with no board lists only the card's).
 */
/** Brain 044 T4: every joint sentence a turn may say that owns no board — the script's joints (every kind), the closing question's lead-ins,
 *  the skills' hooks (their interest lines) and bridges, code's fallback joints and seam forms. Normalised sentences. */
export function leadSentencesOf(script) {
  const out = new Set();
  const add = (t) => { if (typeof t !== "string") return; for (const x of sentencesOf(t.replace(/\{\w+\}/g, " "))) { const k = normSentence(x); if (k.split(" ").length >= 2) out.add(k); } };
  for (const forms of Object.values(script?.joints ?? {})) for (const f of Array.isArray(forms) ? forms : []) { add(typeof f === "string" ? f : f?.hi); add(f?.en); }
  for (const f of script?.teachback?.leadIn ?? []) { add(f?.hi); add(f?.en); }
  for (const sk of script?.skills ?? []) { add(sk.bridgeToNext?.hi); add(sk.bridgeToNext?.en); for (const sl of sk.hook?.interestSlots ?? []) { add(sl?.use?.hi); add(sl?.use?.en); } }
  for (const forms of Object.values(FALLBACK_JOINTS)) for (const f of forms) { add(f.hi); add(f.en); }
  for (const k of ["beforeWorked", "workedInvite"]) for (const f of [...CODE_SEAM_FORMS[k].hinglish, ...CODE_SEAM_FORMS[k].english]) add(f);
  return out;
}
const LEADS_CACHE = new WeakMap();
/** Whether a part's words are all lead sentences (a joint, a lead-in, a hook, a bridge, a seam's form on this row). */
export function isLeadText(text, r, script) {
  let J = script && typeof script === "object" ? LEADS_CACHE.get(script) : null;
  if (!J) { J = leadSentencesOf(script); if (script && typeof script === "object") LEADS_CACHE.set(script, J); }
  const seamForms = new Set((r.seams ?? []).flatMap((s) => [s.form, s.opener?.joint ? s.opener.form : null]).filter(Boolean).flatMap((f) => sentencesOf(f)).map(normSentence));
  const ss = sentencesOf(text).map(normSentence).filter(Boolean);
  return ss.length > 0 && ss.every((x) => J.has(x) || seamForms.has(x));
}
export function partsOf(r, script = null) {
  const t = String(r.text ?? "");
  const pp = r.pageParts ?? [];
  // (a seam's joint — back-to, before a remediation, before a worked problem, after an aside, after the AI line, after a key's return — leads
  // into the part after it; help's own joints — helpSpent, helpToCard, the go-on line, the Hindi switch — are help's words)
  const LEADS = new Set(["backTo", "afterAside", "afterAiLine", "beforeRemediation", "afterTryFirst", "beforeWorked", "afterKeyReturn"]);
  const forms = new Set((r.seams ?? []).filter((s) => LEADS.has(s.joint)).map((s) => s.form).filter(Boolean).map(low));
  const out = pp.map((p, n) => {
    const end = pp[n + 1]?.from ?? t.length;
    const text = t.slice(p.from ?? 0, end).trim();
    const joint = forms.has(low(text)) || isLeadText(text, r, script);
    let own;
    // (Brain 044 T4: a joint, a lead-in, a hook and a bridge own no board — they are said over what is up)
    if (CHECKIN_ONLY.test(text) || joint) own = null;
    else if (Object.prototype.hasOwnProperty.call(p, "own")) own = p.own ?? null;
    else {
      const b = p.boards ?? [];
      own = p.part === "bridge" || p.part === "aside" ? null : p.part === "body" && /(?:^|:)rem:/.test(String(p.beat ?? "")) ? (b.length >= 2 ? b[0] : null) : b[0] ?? null;
    }
    return { part: p.part, beat: String(p.beat ?? ""), from: p.from ?? 0, end, text, joint, checkin: CHECKIN_ONLY.test(text), own };
  });
  return out;
}

/**
 * The pages drawn in a turn: [{ from, board }] from the record (the intent's boards — row.segments, else row.boardRef — at the froms
 * Studio drew them, held.pages), and the board it ends on. A turn that keeps the board up draws it from 0; a cleared turn draws nothing.
 */
export function pagesOf(r, up) {
  const H = r.held ?? null;
  if (H?.drawn === "cleared") return { pages: [], end: null };
  const segs = (r.segments ?? []).filter((g) => g?.board).map((g) => ({ from: g.from ?? 0, board: g.board }));
  let intent = segs.length ? segs : r.boardRef ? [{ from: 0, board: r.boardRef }] : [];
  if (H && (H.drawn === "kept" || H.kept)) intent = [{ from: 0, board: r.boardRef ?? up }];
  if (!intent.length) return { pages: up ? [{ from: 0, board: up }] : [], end: up ?? null };
  let pages = intent;
  const hp = Array.isArray(H?.pages) ? H.pages : [];
  // (Studio keeps the board up through her leading joints and brings the held board in at her first unit part: one page more, the first
  // the board up)
  if (hp.length === intent.length + 1 && up && hp[0].template === up.template) pages = [{ from: 0, board: up }, ...intent.map((p, k) => ({ ...p, from: hp[k + 1].from ?? p.from }))];
  // (Brain 044 T4: with nothing up, the screen is empty until the first part that owns a board — an empty first page, then the intent's)
  else if (hp.length === intent.length + 1 && !up && hp[0].template == null) pages = intent.map((p, k) => ({ ...p, from: hp[k + 1].from ?? p.from }));
  else if (hp.length === intent.length) pages = intent.map((p, k) => ({ ...p, from: hp[k].from ?? p.from }));
  return { pages, end: pages.at(-1)?.board ?? up ?? null };
}
const boardAtOf = (pages, up) => (x) => { let b = up; for (const p of pages) if (p.from <= x) b = p.board; return b; };
const boardBeforeOf = (pages, up) => (x) => { let b = up; for (const p of pages) if (p.from < x) b = p.board; return b; };

/** The skill a row is in: its card's item id ("script:<skillId>:…"), else its beat's skill number. */
function skillIdOf(r, script) {
  const m = /^script:(.+?):/.exec(String(r.check?.itemId ?? ""));
  if (m) return m[1];
  const n = /^s(\d+):/.exec(String(r.beat ?? ""))?.[1];
  return n ? script?.skills?.[+n - 1]?.skillId ?? null : null;
}
/** The compile part id of an address ({ beat, kind, skill }), or null. */
function partIdOf(a, script) {
  if (!a?.skill) return null;
  const b = a.beat.replace(/^explain:/, "");
  if (b === "bridge") return `${a.skill}:bridge`;
  if (/^e\d+$/.test(b)) return `${a.skill}:${b}:${CARDISH.has(a.kind) || a.kind === "close" ? "card" : "point"}`;
  if (/^c\d+$/.test(b)) return `${a.skill}:check:${b}`;
  if (b === "worked" || b === "worked:yourStep") return `${a.skill}:worked:yourStep`;
  if (/^worked:(?:problem|step\d+)$/.test(b)) return `${a.skill}:${b}`;
  const m = /^(rem|then):(.+)$/.exec(b);
  if (m) { const i = (script?.skills?.find((x) => x.skillId === a.skill)?.remediation ?? []).findIndex((x) => x.targets === m[2]); return i < 0 ? null : m[1] === "rem" ? `${a.skill}:rem:${i}` : `${a.skill}:rem:${i}:then`; }
  return null;
}
/** The skill whose bridge a turn says (its bridgeToNext's words in the turn), else the row's. */
function bridgeSkillOf(r, script) {
  const T = normSentence(r.text);
  for (const sk of script?.skills ?? []) for (const t of [sk.bridgeToNext?.hi, sk.bridgeToNext?.en]) if (t && T.includes(normSentence(t).slice(0, 40))) return sk.skillId;
  return skillIdOf(r, script);
}
/** Whether a part's help is spent: no rung of its ladder (after a key: the why's other wording, then the card's own ladder) unsaid. */
function spent(script, partId, keyed, said) {
  const part = helpPart(script, partId);
  if (!part) return true;
  const rungs = [...(keyed ? ladderOf(script, part, { keyed: true }) : []), ...ladderOf(script, part)];
  return !rungs.some((x) => { const ss = (typeof x.value === "string" ? [x.value] : [x.value?.hi, x.value?.en]).filter(Boolean).flatMap(sentencesOf).map(normSentence); return ss.length && !ss.some((k) => said.some((s) => sameSentence(k, s))); });
}

/** The lesson state these predicates read at row i, advanced once per teacher row (the predicates run in row order). */
function stateAt(L, r, i, ctx) {
  const st = (ctx.o.d27 ??= { at: -1, up: null, said: new Set(), sents: [], addr: null, cards: new Map(), lastCardSkill: null, cur: null });
  if (st.at > i) { ctx.o.d27 = null; return stateAt(L, r, i, ctx); }
  if (st.at === i) return st;
  if (st.cur) commit(st, st.cur.r, ctx);
  const parts = partsOf(r, ctx.script);
  const { pages, end } = pagesOf(r, st.up);
  st.cur = { r, parts, pages, end, boardAt: boardAtOf(pages, st.up), boardBefore: boardBeforeOf(pages, st.up), prevIntent: ctx.prevIntent ?? null };
  st.at = i;
  return st;
}
/** What a said turn adds to the lesson: its parts' boards to the said set, the board it ends on, the address, the cards said. */
function commit(st, r, ctx) {
  const { parts, end, prevIntent } = st.cur;
  for (const p of parts) if (p.own) st.said.add(keyOf(p.own));
  st.up = end;
  for (const s of sentencesOf(r.text)) st.sents.push(normSentence(s));
  const script = ctx.script;
  const cardP = parts.find((p) => CARDISH.has(p.part) || p.part === "card");
  if (cardP && r.check?.itemId) st.lastCardSkill = skillIdOf(r, script);
  // (the address moves with the lesson's own parts — a point, a card, a bridge, a worked step, a verdict; help's words, a check-in and a
  // joint do not move it: help is about the part she is on)
  const moving = parts.filter((p) => TEACH.has(p.part) && p.part !== "simpler" && !p.checkin && !p.joint && p.beat);
  const last = moving.at(-1);
  const keyed = KEY_SAID.test(String(r.text ?? "")) || !!r.check?.gave || !!r.keyFact;
  if (last) {
    const skill = last.part === "bridge" ? bridgeSkillOf(r, script) : ["close", "closed"].includes(last.part) ? st.lastCardSkill ?? skillIdOf(r, script) : skillIdOf(r, script);
    const same = st.addr && st.addr.beat === last.beat && st.addr.skill === skill;
    st.addr = { beat: last.beat, kind: last.part, skill, keyed: same ? st.addr.keyed : false };
  }
  // (a key said as help — after a miss or a request, never a right answer's verdict — keys the part she is on)
  if (keyed && st.addr && prevIntent !== "right") st.addr = { ...st.addr, keyed: true };
  // (the cards said: a card said again after other parts were said is a return)
  const beats = new Set(parts.filter((p) => TEACH.has(p.part) && !p.checkin && !p.joint && p.beat).map((p) => p.beat));
  const said = parts.filter((p) => p.part === "card" && p.beat).map((p) => `${skillIdOf(r, script)}|${p.beat}`);
  for (const [id, c] of st.cards) if ([...beats].some((b) => b !== id.split("|")[1])) c.other = true;
  for (const id of said) st.cards.set(id, { other: false });
}

/** The part she is on when row i is said ({ beat, kind, skill, keyed } — keyed: a key was said on it as help, after a miss or a request), read
 *  from the record, not from the walk's own cell (dc-r8-director27 P3: the walk's `keyed` was set by a right answer's verdict). */
export function addressAt(L, r, i, ctx) { return stateAt(L, r, i, ctx).addr ?? null; }
export const D27_PREDICATES = {
  /** P1.1: every board on screen during a turn belongs to a part said in that turn or earlier in the lesson — never a card not yet said
   *  (a card's board belongs to the card from its first word). The board carried up from the turn before is not this turn's. */
  boardOfSaidPart(L, r, i, ctx) {
    if (r.who !== "teacher") return null;
    const st = stateAt(L, r, i, ctx);
    const { parts, pages } = st.cur;
    for (const pg of pages) {
      if (!pg.board || (pg.from === 0 && sameB(pg.board, st.up))) continue;
      if (st.said.has(keyOf(pg.board))) continue;
      const mine = parts.find((p) => p.own && sameB(p.own, pg.board) && (!CARDISH.has(p.part) || p.from <= pg.from));
      if (mine) continue;
      const card = parts.find((p) => CARDISH.has(p.part) && sameB(p.own, pg.board));
      return card ? `the ${card.beat} card's board drawn at ${pg.from}, before the card's first word (${card.from})` : `a board drawn at ${pg.from} that no part said belongs to: ${brief(pg.board)}`;
    }
    return null;
  },
  /** P1.2: a part with a board of its own has that board up from its first word to its last; a part with none (an aside, a bridge, a
   *  check-in, a remediation with no board, words with no part) keeps the board that is up. On an empty screen the first board may come
   *  up early. */
  partOwnBoard(L, r, i, ctx) {
    if (r.who !== "teacher") return null;
    const st = stateAt(L, r, i, ctx);
    const { parts, pages, boardAt, boardBefore } = st.cur;
    const spans = [...(parts.length && parts[0].from > 0 ? [{ part: "none", beat: "", from: 0, end: parts[0].from, own: null }] : []), ...parts];
    for (const p of spans) {
      const shown = [boardAt(p.from), ...pages.filter((g) => g.from > p.from && g.from < p.end).map((g) => g.board)];
      if (p.own) {
        const bad = shown.find((b) => !sameB(b, p.own));
        if (bad !== undefined) return `the ${p.part}@${p.beat || "-"} part (at ${p.from}) said over ${brief(bad)}, not its own ${brief(p.own)}`;
      } else {
        const before = boardBefore(p.from);
        if (!before) continue;
        const bad = shown.find((b) => !sameB(b, before));
        if (bad !== undefined) return `the ${p.part === "none" ? "words" : `${p.part}@${p.beat || "-"} part`} at ${p.from}, with no board of ${p.part === "none" ? "their" : "its"} own, drew ${brief(bad)} over ${brief(before)}`;
      }
    }
    return null;
  },
  /** P1.3: a turn that says a card — its first telling, a re-ask, a return — has that card's board up from the card's first word. */
  cardBoardUp(L, r, i, ctx) {
    if (r.who !== "teacher") return null;
    const st = stateAt(L, r, i, ctx);
    const { parts, boardAt } = st.cur;
    for (const p of parts) {
      if (p.part !== "card" || !p.own) continue;
      const b = boardAt(p.from);
      if (!sameB(b, p.own)) return `the ${p.beat} card (at ${p.from}) said over ${brief(b)}, not its own ${brief(p.own)}`;
    }
    return null;
  },
  /** P3: a request — a clarify, a give-up, a request for Hindi (a try-first only where the walk acted on it as one) — gets help for the
   *  part she was on: a help wording of that part, its key, or with that part's help all said, the helpSpent line (after a key: the
   *  after-key line). A back-to line with a card, the next step, another part's help: none of them answers her. */
  requestHelped(L, r, i, ctx) {
    if (r.who !== "teacher") return null;
    const st = stateAt(L, r, i, ctx);
    const col = String(r.cell?.column ?? "");
    const intent = ctx.prevIntent ?? null;
    const req = ["clarify", "give_up", "hindi"].includes(intent) ? intent : ["clarify", "give_up", "hindi"].includes(col) ? col : null;
    if (!req || /^(?:wrap|safeguard|break|greet|done|hook)$/.test(String(r.move?.kind ?? r.move ?? ""))) return null;
    // (Brain 042: after her reply said alone before a worked segment there is no part to help — the segment comes)
    if (ctx.prevT?.leadAlone) return null;
    // (dc-r8-director27 Brain 042: a give-up on a quick question gets its authored `say` and the card; on an asked step, the step told —
    // the work order's answer; a clarify or a Hindi request there is help on the point or the step, read below)
    if (req === "give_up" && /:quick$/.test(String(r.cell?.part ?? "")) && (r.pageParts ?? [])[0]?.part === "quickReply") return null;
    if (req === "give_up" && /:worked:step\d+:ask$/.test(String(r.cell?.part ?? "")) && /^worked:step\d+$/.test(String((r.pageParts ?? [])[0]?.beat ?? ""))) return null;
    const a = st.addr;
    if (!a || !ctx.script) return null;
    const { parts } = st.cur;
    if (parts.some((p) => p.part === "simpler" && p.beat === a.beat)) return null;
    if (KEY_SAID.test(String(r.text ?? "")) || r.check?.gave || r.keyFact) return null;
    const id = partIdOf(a, ctx.script);
    const isSpent = id ? spent(ctx.script, id, a.keyed || a.kind === "close", st.sents) : true;
    if (hasJoint(r.text, ctx.script, ["helpSpent", "helpToCard"]) || (a.keyed && hasJoint(r.text, ctx.script, ["afterKeyReturn", "afterKeyGoOn"]))) {
      return isSpent ? null : `a ${req} on ${a.beat} answered with a help joint while its help is unsaid`;
    }
    const other = parts.find((p) => p.part === "simpler");
    return `a ${req} on ${a.beat}${a.keyed ? " (after a key)" : ""} answered with ${other ? `help for ${other.beat}` : parts.length ? parts.filter((p) => !p.joint && !p.checkin).map((p) => `${p.part}@${p.beat}`).join(", ") || "a joint" : "no part"}`;
  },
  /** P5: a card said again after other parts were said since it was last said (a return, whatever led there) is led by the back-to joint
   *  or the after-key return form. */
  returnLed(L, r, i, ctx) {
    if (r.who !== "teacher") return null;
    const st = stateAt(L, r, i, ctx);
    const { parts } = st.cur;
    const card = parts.find((p) => p.part === "card" && p.beat);
    if (!card) return null;
    const c = st.cards.get(`${skillIdOf(r, ctx.script)}|${card.beat}`);
    if (!c || !c.other) return null;
    if ((r.seams ?? []).some((s) => ["backTo", "afterKeyReturn"].includes(s.joint))) return null;
    if (hasJoint(String(r.text ?? "").slice(0, card.from), ctx.script, ["backTo", "afterKeyReturn"])) return null;
    return `the ${card.beat} card said again after other parts, with no back-to joint`;
  },
};
