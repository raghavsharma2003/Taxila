// dc-r8-director25 H4 (docs/patches/to-brain/039, Part A): the help predicates, read against the said set. director25's own predicate
// check read 0 on rows where three judges found help saying the point again word for word: helpRepeats and hindiNewWords looked at her
// last two turns only, and partOnce let any request excuse a point said again. These read every sentence she has said in the lesson
// (the said set, rebuilt here from her earlier rows), and the help turn's part (the walk's record; after a key's check-in, the card just
// keyed). Each was run over the director25 fixture rows it is written for and reads non-zero there
// (tests/r8-director25-help-predicates.test.mjs). Merged into dry-predicates.mjs's PREDICATES; gated. Pure.
import { missesOnQuestion } from "./d29-predicates.mjs";
import { hindiFormSaid } from "./d30-predicates.mjs";
import { compiledFor } from "../../server/director/compile.js";
import { helpPart, ladderOf, sameSentence, normSentence, sentencesOf, at, FALLBACK_JOINTS, keyLine } from "../../server/director/help.js";

const norm = (t) => String(t ?? "").replace(/\s+/g, " ").trim();
const low = (t) => norm(t).toLowerCase();
const KEY_SAID = /(?:is sawaal ka|iska|yahan|pichhle sawaal ka|woh wala:?) (?:sahi )?jawab|sahi jawab:|the answer (?:here )?(?:is|was)|iska jawab hai|poora jawab:?|the full answer|(?:^|[.!?]\s+)(?:haan|nahi|yes|no), (?:kyunki|because)\b/i;
const GIVE_UP_ANY = /(?<![\p{L}])(?:pata\s+nahi|nahi\s+pata|aap\s+(?:hi\s+)?batao|tum\s+batao|i\s+(?:don'?t|do\s+not)\s+know|give\s+up|chhodo|nahi\s+aata)(?![\p{L}])/iu;
const CLARIFY = /(?<![\p{L}])(?:samajh\s+nahi|samjha\s+nahi|samjhi\s+nahi|didn'?t\s+understand|don'?t\s+understand|kya\s+matlab)(?![\p{L}])/iu;
const CHECKIN = /(?:Yahan tak (?:theek|saaf) hai|Ab tak samajh aaya|Yeh hissa saaf hua|Yeh kadam (?:saaf hai|samajh aaya)|Does that make sense so far|Clear so far|All good so far|Is that (?:part|step) clear)\?\s*$/i;
const HINDI_LINE = /hindi (?:mein|ke shabdon)/i;
const ENDS = /^(?:wrap|safeguard|break|teachback|done)$/;
const sameBoard = (a, b) => !!a && !!b && a.template === b.template && JSON.stringify(a.params ?? {}) === JSON.stringify(b.params ?? {});

/** The script's help material, once per script: every ladder rung's sentences (by key) with the rung's path and board, every card. */
function helpIndex(ctx) {
  if (ctx.o.helpIx) return ctx.o.helpIx;
  const script = ctx.script ?? {};
  const rungs = new Map(), cards = [];
  let parts = [];
  try { parts = compiledFor(script).parts ?? []; } catch { parts = []; }
  // (d31: the closing question's help — teachback.simpler, picked by state.js through TEACHBACK_PART — is a rung too: a give-up there opens
  // on it, the staged c4-ch01-t02's dry steady 106)
  for (const t of [script.teachback?.simpler?.hi, script.teachback?.simpler?.en]) for (const s of sentencesOf(t ?? "")) { const k = normSentence(s); if (k.split(" ").length >= 4 && !rungs.has(k)) rungs.set(k, { path: "teachback.simpler", field: "simpler", board: script.teachback?.board ?? null }); }
  for (const p of parts) {
    const hp = helpPart(script, p.id);
    if (!hp) continue;
    if (hp.key != null) cards.push(hp);
    for (const keyed of [false, true]) for (const r of ladderOf(script, hp, { keyed })) {
      for (const t of typeof r.value === "string" ? [r.value] : [r.value?.hi, r.value?.en]) for (const s of sentencesOf(t)) {
        const k = normSentence(s);
        if (k.split(" ").length >= 4 && !rungs.has(k)) rungs.set(k, { path: r.path, field: r.field, board: r.board });
      }
    }
  }
  // (the script's spoken sentences, four words or more: what "authored" means for the said set)
  const authored = new Set();
  const SKIP = new Set(["id", "itemId", "skillId", "beatId", "template", "params", "board", "answerBoard", "accept", "targets", "wrongIfMis", "key", "topicId", "ladder", "notes", "did", "joints"]);
  const walk = (o) => { if (typeof o === "string") { for (const s of sentencesOf(o)) { const k = normSentence(s); if (k.split(" ").length >= 4) authored.add(k); } return; }
    if (Array.isArray(o)) return o.forEach(walk); if (o && typeof o === "object") for (const [k, v] of Object.entries(o)) if (!SKIP.has(k)) walk(v); };
  walk(script.skills ?? []);
  const cardSents = new Set();
  const walkC = (o) => { if (Array.isArray(o)) return o.forEach(walkC); if (o && typeof o === "object") { for (const f of ["prompt", "reask"]) { const v = o[f];
    for (const t of typeof v === "string" ? [v] : [v?.hi, v?.en]) for (const x of sentencesOf(t)) cardSents.add(normSentence(x)); } for (const v of Object.values(o)) walkC(v); } };
  walkC(script.skills ?? []);
  const joints = new Set([...Object.values(FALLBACK_JOINTS).flat(), ...["helpSpent", "afterKeyGoOn", "helpToCard", "afterKeyReturn"].flatMap((k) => script.joints?.[k] ?? [])]
    .flatMap((f) => [f?.hi, f?.en, typeof f === "string" ? f : null]).filter(Boolean).map(normSentence));
  // (Learning 016: a rung may name the child's friend — "{friend} galat hai" — which she says with the name filled: a slot sentence matches
  // any one or two words in the slot's place)
  const slotted = [...rungs.entries()].filter(([k]) => /(?:^| )friend(?: |$)/.test(k)).map(([k, v]) => ({ re: new RegExp(`^${k.split(/(?:^| )friend(?= |$)/).map((x) => x.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join(" \\S+(?: \\S+)? ").trim()}$`), v }));
  const rungsAll = Object.assign(new Map(rungs), { get(k) { return Map.prototype.get.call(this, k) ?? slotted.find((x) => x.re.test(k))?.v; }, has(k) { return this.get(k) !== undefined; } });
  return (ctx.o.helpIx = { rungs: rungsAll, cards, authored, joints, parts, cardSents });
}
/** The said set before this row: every sentence of her earlier turns, with its row. */
function saidBefore(L, i) {
  const out = [];
  if (!Array.isArray(L?.rows)) return out;
  const have = new Set();
  for (let j = 0; j < i; j++) {
    const r = L.rows[j];
    if (r.who !== "teacher") continue;
    for (const s of sentencesOf(r.text)) { const k = normSentence(s); if (k && !have.has(k)) { have.add(k); out.push({ k, row: j }); } }
  }
  return out;
}
const inSet = (k, said) => said.find((x) => sameSentence(k, x.k)) ?? null;
/** The skill a row is in (held.unit, else the beat's skill number). */
function skillOf(r, ctx) {
  const u = /^(.+?-s\d+):/.exec(String(r.held?.unit ?? ""))?.[1];
  if (u) return u;
  const n = /^s(\d+):/.exec(String(r.beat ?? ""))?.[1];
  return n ? ctx.script?.skills?.[+n - 1]?.skillId ?? null : null;
}
/** The card a turn keyed, as a compile part id, from its close's beat ("e1", "c2", "then:<mix-up>", "worked"). */
function keyedCardOf(r, ctx) {
  const close = (r.pageParts ?? []).find((p) => p.part === "close" && p.beat);
  const sk = skillOf(r, ctx);
  if (!close || !sk) return null;
  const b = String(close.beat).replace(/^explain:/, "");
  if (/^e\d+$/.test(b)) return `${sk}:${b}:card`;
  if (/^c\d+$/.test(b)) return `${sk}:check:${b}`;
  if (b === "worked") return `${sk}:worked:yourStep`;
  const m = /^then:(.+)$/.exec(b);
  if (m) { const i = (ctx.script?.skills?.find((x) => x.skillId === sk)?.remediation ?? []).findIndex((x) => x.targets === m[1]); return i >= 0 ? `${sk}:rem:${i}:then` : null; }
  return null;
}
const keyedTurn = (r) => !!r?.check?.gave || !!r?.keyFact || KEY_SAID.test(String(r?.text ?? ""));
const cardIn = (r) => !!r?.card && (low(r.text).includes(low(r.card).slice(0, 30)) || low(r.text).endsWith(low(sentencesOf(r.card).at(-1) ?? "\u0000")));
/**
 * The help request a teacher row answers, and the part it is on: { request, part, keyed } or null. The request: the walk's column
 * (clarify, give_up, hindi; a wrong answer's or an unremedied mix-up's hint), else the child's words. The part: the walk's record — and
 * after a key's check-in (a key said and no card posed since), the card just keyed, whatever the record says.
 */
export function helpTurnOf(L, r, i, ctx) {
  if (r.who !== "teacher" || ENDS.test(String(r.move?.kind ?? r.move ?? ""))) return null;
  const col = String(r.cell?.column ?? "");
  const read = String(ctx.prevRead ?? "");
  let request = col === "clarify" || col === "give_up" || col === "hindi" ? col : null;
  if (!request && ["wrong", "misconception"].includes(col)) {
    // (a misconception answered by its remediation is the remediation, not help)
    const remedied = (r.pageParts ?? []).some((p) => /^rem:/.test(String(p.beat ?? "")) && p.part === "body");
    if (!remedied && /^(?:incorrect|partial|misconception)/.test(read)) request = "hint";
  }
  if (!request && !col) request = /·\s*language/.test(read) ? "hindi" : CLARIFY.test(ctx.prevChild ?? "") ? "clarify" : GIVE_UP_ANY.test(ctx.prevChild ?? "") && /^no_evidence/.test(read) ? "give_up" : null;
  if (!request) return null;
  const keyedPart = keyedBefore(L, i, ctx);
  // (a part help does not cover — the greeting, the hook — is answered by its own law, greetSimpler)
  const covered = (id) => !!helpPart(ctx.script, id);
  if (r.cell?.keyed && r.cell?.part) return covered(r.cell.part) ? { request, part: r.cell.part, keyed: true } : null;
  // (dc-r8-director27 P3: a card answered right — its help reads its why's other wording first, as after a key; it is no key)
  if (r.cell?.closed && r.cell?.part) return covered(r.cell.part) ? { request, part: r.cell.part, keyed: true, closed: true } : null;
  if (keyedPart && request !== "hint" && !/:(?:greet|hook)$/.test(String(r.cell?.part ?? ""))) return covered(keyedPart) ? { request, part: keyedPart, keyed: true } : null;
  return r.cell?.part && covered(r.cell.part) ? { request, part: r.cell.part, keyed: false } : null;
}
/** A card's walk item id ("script:<skill>:ask:e1", "…:then:<mix-up>", "…:c2") as a compile part id. */
function partOfItem(id, ctx) {
  const m = /^script:(.+?):(?:ask:(.+)|then:(.+)|([^:]+))$/.exec(String(id ?? ""));
  if (!m) return null;
  if (m[2]) return m[2] === "worked" ? `${m[1]}:worked:yourStep` : `${m[1]}:${m[2]}:card`;
  if (m[3]) { const i = (ctx.script?.skills?.find((x) => x.skillId === m[1])?.remediation ?? []).findIndex((x) => x.targets === m[3]); return i >= 0 ? `${m[1]}:rem:${i}:then` : null; }
  return `${m[1]}:check:${m[4]}`;
}
/** The card just keyed when row i is said (a key said, and no card posed nor a new unit taught since), else null. Read over the
 *  earlier rows, once each (the predicates run in row order). */
function keyedBefore(L, i, ctx) {
  if (!Array.isArray(L?.rows)) return null;
  const st = (ctx.o.helpKeyedAt ??= { upto: 0, val: null, card: null });
  if (st.upto > i) { st.upto = 0; st.val = null; st.card = null; }
  for (; st.upto < i; st.upto++) {
    const r = L.rows[st.upto];
    if (r.who !== "teacher") continue;
    if (cardIn(r)) { st.val = null; st.card = partOfItem(r.check?.itemId, ctx) ?? st.card; continue; }
    // (a key with no close part on the record — a yes-or-no key said as the fact — keys the card last posed)
    // (dc-r8-director27 P3: a key and a bridge in one turn — the bridge is said last, and the address is the bridge's, not the keyed card's)
    if (keyedTurn(r) && (r.pageParts ?? []).some((p) => p.part === "bridge")) { st.val = null; continue; }
    if (keyedTurn(r)) { const k = keyedCardOf(r, ctx) ?? st.card; if (k) { st.val = k; continue; } }
    // (a new unit's teaching — a point, a worked step, a bridge — ends the key's check-in; help said on the key does not)
    if ((r.pageParts ?? []).some((p) => ["body", "held", "bridge"].includes(p.part) && p.beat)) {
      const ix = helpIndex(ctx);
      // (main's R3 on the merged tree, c4 stuck 48: the go-on line after a spent why, then the next point — the lesson went on; a turn
      // ends the key's check-in when it says teaching beside help's own sentences, not only when it says none of them)
      const own = (s) => ix.rungs.has(normSentence(s)) || ix.joints.has(normSentence(s)) || CHECKIN.test(s) || s.split(/\s+/).length < 4;
      if (!sentencesOf(r.text).every(own)) st.val = null;
    }
  }
  return st.val;
}
/** The board up at a character of a row: its drawn pages (row.screen.pages, each with its board), else the row's board. */
function boardAt(r, ch) {
  const pages = Array.isArray(r.screen?.pages) && r.screen.pages.length ? r.screen.pages : null;
  if (pages) return [...pages].reverse().find((p) => (p.from ?? 0) <= ch)?.board ?? pages[0].board ?? null;
  // (dc-r8-director26 B1: a recorded row's pages carry their boards in its segments — the held pages only name templates, so a two-page
  // help turn read no board at all and helpBoard read 0 on all six of the run's rows)
  const segs = Array.isArray(r.segments) && r.segments.some((g) => g?.board) ? r.segments.filter((g) => g?.board) : null;
  if (segs) return [...segs].reverse().find((g) => (g.from ?? 0) <= ch)?.board ?? segs[0].board ?? null;
  const held = r.held?.pages ?? [];
  // (pages with no boards recorded: only a one-page turn is known — its board is the row's)
  if (held.length > 1) return null;
  return r.boardRef ?? r.screen?.boardRef ?? null;
}
/** The board up when row i begins: the board her last turn ended on (its last page). */
function boardUpBefore(L, i) {
  for (let j = i - 1; j >= 0; j--) {
    const r = L?.rows?.[j];
    if (r?.who !== "teacher") continue;
    const b = boardAt(r, Number.MAX_SAFE_INTEGER);
    if (b) return b;
  }
  return null;
}
/** The teaching sentences of a help turn: four words or more, not the card's own, not a check-in, a switch line or a help joint. */
function helpSentences(r, ctx) {
  const ix = helpIndex(ctx);
  const card = normSentence(r.card ?? "");
  return sentencesOf(r.text).map((s) => ({ s, k: normSentence(s) }))
    .filter(({ s, k }) => k.split(" ").length >= 4 && !(card && card.includes(k)) && !ix.cardSents.has(k) && !CHECKIN.test(s) && !HINDI_LINE.test(s) && !ix.joints.has(k));
}

/** The first unsaid wording of a part's ladder before row i (its text), or null when the ladder has nothing unsaid. */
export function helpFirstUnsaid(L, i, ctx, partId, { keyed = false } = {}) {
  const part = helpPart(ctx.script, partId);
  if (!part) return null;
  const said = saidBefore(L, i);
  for (const x of ladderOf(ctx.script, part, { keyed })) {
    const t = typeof x.value === "string" ? x.value : x.value?.hi ?? x.value?.en;
    const ss = sentencesOf(t).map(normSentence);
    if (ss.length && !ss.some((k) => inSet(k, said))) return t;
  }
  return null;
}
/** Whether a turn opens on help's go-on after a key (afterKeyGoOn: the seams record, else one of its forms). */
export function helpGoOnSaid(r, ctx) {
  // (dc-r8-director26 J1: where the back-to joint follows, it is the go-on — the seam pass drops the go-on line and marks the back-to)
  if ((r.seams ?? []).some((x) => x.joint === "afterKeyGoOn" || (x.joint === "backTo" && x.goOn))) return true;
  const forms = [...FALLBACK_JOINTS.afterKeyGoOn, ...(ctx.script?.joints?.afterKeyGoOn ?? [])].flatMap((f) => [f?.hi, f?.en, typeof f === "string" ? f : null]).filter(Boolean).map(normSentence);
  // (Brain 044 T5: after a key the "nothing easier" line comes first, then the go-on line)
  const spent = [...FALLBACK_JOINTS.helpSpent, ...(ctx.script?.joints?.helpSpent ?? [])].flatMap((f) => [f?.hi, f?.en, typeof f === "string" ? f : null]).filter(Boolean).map(normSentence);
  const ss = sentencesOf(r.text).map(normSentence);
  const first = ss[0] ?? "";
  return (!!first && forms.includes(first)) || (spent.includes(first) && forms.includes(ss[1] ?? ""));
}
/** dc-r8-director26 N1: whether a sentence is help's own — a rung of any ladder, or a help joint (exported for d26-predicates.mjs). */
export function helpSentenceOf(ctx, sentence) {
  const ix = helpIndex(ctx);
  const k = normSentence(sentence);
  return ix.rungs.has(k) || ix.joints.has(k);
}
export const KEY_SAID_RE = KEY_SAID;
/** A walk item id as a compile part id (exported for the order laws). */
export const helpPartOfItem = (id, ctx) => partOfItem(id, ctx);
/** Whether a turn says the key of the help turn's card: a "jawab" key, the walk's gave, or a yes-or-no key said as its why. */
function keySays(r, h, ctx) {
  if (KEY_SAID.test(String(r.text ?? "")) || r.keyFact || r.check?.gave) return true;
  const p = h ? helpPart(ctx.script, h.part) : null;
  const k = p ? keyLine(p) : null;
  const T = normSentence(r.text);
  return !!k && sentencesOf(k.text).map(normSentence).filter((x) => x.split(" ").length >= 4).some((x) => T.includes(x.slice(0, 60)));
}
export const HELP_PREDICATES = {
  /** dc-r8-director20 G3, rewritten for H4 (the count of misses decides nothing): a give-up on a card whose ladder has nothing unsaid
   *  gets its key and why — never the card again with nothing for it. */
  giveUpNoKey(L, r, i, ctx) {
    const h = helpTurnOf(L, r, i, ctx);
    if (!h || h.request !== "give_up" || h.keyed) return null;
    const part = helpPart(ctx.script, h.part);
    if (!part || part.key == null) return null;
    const said = saidBefore(L, i);
    const left = ladderOf(ctx.script, part).some((x) => { const ss = (typeof x.value === "string" ? [x.value] : [x.value?.hi, x.value?.en]).filter(Boolean).flatMap(sentencesOf).map(normSentence); return ss.length && !ss.some((k) => inSet(k, said)); });
    if (left) return null;
    return keySays(r, h, ctx) ? null : `a give-up on ${h.part} with nothing unsaid on its ladder, answered without the key`;
  },
  /** H4: no help turn says a sentence of the script she has already said in this lesson (the said set: equal, or 8 words in 10), on a
   *  clarify, a give-up, a Hindi request or a wrong answer's hint. The card's own sentences, a check-in and a joint are not help. */
  helpRepeats(L, r, i, ctx) {
    const h = helpTurnOf(L, r, i, ctx);
    if (!h) return null;
    // (dc-r8-director26: after a key's go-on line the lesson goes on — what follows it is the next part, not help: dry c5-t01 steady 80,
    // the next point's "Yeh rahi 0 se 2 tak ki line." is 8 words in 10 of the first point's "Yeh rahi 0 se 1 tak ki line.")
    if (h.keyed && helpGoOnSaid(r, ctx)) return null;
    // (dc-r8-director27 P3: with nothing left the helpSpent line is said and the lesson goes on — what follows it is the next part, not help)
    if ((r.seams ?? []).some((x) => x.joint === "helpSpent") && !/·\s*language/.test(String(ctx.prevRead ?? "")) && r.cell?.column !== "hindi") return null;
    const ix = helpIndex(ctx);
    const said = saidBefore(L, i);
    // (a key closes a card: its why may have been heard in the card's own help — the key is the close, not help)
    const keyK = (() => { const p = helpPart(ctx.script, h.part); const k = p ? keyLine(p) : null; return new Set(k ? sentencesOf(k.text).map(normSentence) : []); })();
    for (const { s, k } of helpSentences(r, ctx)) {
      if (!ix.authored.has(k) || keyK.has(k)) continue;
      const e = inSet(k, said);
      if (e) return `help (${h.request}) says a sentence she said at row ${e.row}: "${s.slice(0, 60)}"`;
    }
    return null;
  },
  /** H4: a Hindi request gets words she has not said in this lesson — the part's first unsaid wording — or, with none left, the line
   *  that there are no easier words (helpSpent) and the question. Every teaching sentence already said, or none at all, is the fault. */
  hindiNewWords(L, r, i, ctx) {
    const h = helpTurnOf(L, r, i, ctx);
    if (h?.request !== "hindi") return null;
    // (Brain 046 Q2: the card's `hindi` form is the answer — new words the first time, the card's question again after help the second)
    if (hindiFormSaid(ctx.script, r)) return null;
    const ix = helpIndex(ctx);
    const spentLine = sentencesOf(r.text).some((s) => ix.joints.has(normSentence(s)));
    const ss = helpSentences(r, ctx);
    if (!ss.length) return spentLine ? null : "a Hindi request answered with no new words (the switch line and the card only)";
    const said = saidBefore(L, i);
    return ss.every(({ k }) => inSet(k, said)) ? `a Hindi request answered with words she has said: "${ss[0].s.slice(0, 60)}"` : null;
  },
  /** dc-r8-director24 P, rewritten for H4: a point is said once. An explain point's sentence said again on a later turn — whatever the
   *  child asked, help included (only "say it again" asks for it) — and a card's first posing with its point never said (c4 steady 96). */
  partOnce(L, r, i, ctx) {
    const pts = (ctx.o.points4 ??= (() => { const out = []; for (const sk of ctx.script?.skills ?? []) for (const b of sk.explain ?? []) {
      out.push({ id: `${sk.skillId}:${b.id}`, ss: [b.point?.hi, b.point?.en].filter(Boolean).flatMap(sentencesOf).map(normSentence).filter((k) => k.split(" ").length >= 5),
        card: [b.ask?.prompt?.hi, b.ask?.prompt?.en].filter(Boolean).map((x) => low(x).slice(0, 40)) }); }
      // (a sentence two points share, or a point shares with a card, proves nothing)
      const all = out.flatMap((p) => p.ss.map((k) => `${p.id}|${k}`));
      for (const p of out) p.ss = p.ss.filter((k) => all.filter((x) => x.endsWith(`|${k}`)).length === 1 && !out.some((q) => q.card.some((c) => c && c.includes(k.slice(0, 30)))));
      return out; })());
    const said = (ctx.o.ptSaid4 ??= new Map()), seen = (ctx.o.cardSeen4 ??= new Set());
    const T = sentencesOf(r.text).map(normSentence);
    const repeatAsked = /·\s*(?:repeat|which)/.test(String(ctx.prevRead ?? ""));
    let why = null;
    for (const p of pts) {
      const has = p.ss.some((k) => T.includes(k));
      if (has && said.has(p.id) && !repeatAsked && !why) why = `the ${p.id.split(":").pop()} point said again (first at row ${said.get(p.id)})`;
      // (d31: the card the row asks is its walk item where the row records one — two cards' first 30 characters can be one: the staged
      // c5-t03's s1 e2 and s2 e1 both open "Doosri patti utni hi lambi hai, par")
      const askId = /^script:(.+?):ask:([^:]+)$/.exec(String(r.check?.itemId ?? ""));
      const posed = r.card && (askId ? `${askId[1]}:${askId[2]}` === p.id : p.card.some((c) => c && low(r.card).startsWith(c.slice(0, 30))));
      if (posed && !has && !said.has(p.id) && !seen.has(p.id) && !why) why = `the ${p.id.split(":").pop()} card posed with its point never said`;
      if (posed) seen.add(p.id);
      if (has && !said.has(p.id)) said.set(p.id, i);
    }
    return why;
  },
  /** H4: a help turn says its part's first unsaid wording and no other part's: a sentence of a rung that is not on the part's ladder is
   *  help for another part (c4 stuck 30, offtopic 46); a later rung, or another field, said while an earlier rung is unsaid skips it. */
  helpLadder(L, r, i, ctx) {
    const h = helpTurnOf(L, r, i, ctx);
    if (!h) return null;
    const ix = helpIndex(ctx);
    const part = helpPart(ctx.script, h.part);
    if (!part) return null;
    const ladder = ladderOf(ctx.script, part, { keyed: h.keyed });
    const mine = new Set(ladder.map((x) => x.path));
    const said = saidBefore(L, i);
    const rungText = (x) => (typeof x.value === "string" ? [x.value] : [x.value?.hi, x.value?.en]).filter(Boolean);
    const first = ladder.find((x) => { const ss = rungText(x).flatMap(sentencesOf).map(normSentence); return ss.length && !ss.some((k) => inSet(k, said)); });
    const used = sentencesOf(r.text).map((s) => ({ s, hit: ix.rungs.get(normSentence(s)) })).filter((x) => x.hit);
    const other = used.find((x) => !mine.has(x.hit.path));
    if (other) return `help for another part (${h.part}${h.keyed ? ", keyed" : ""}): "${other.s.slice(0, 50)}" is ${other.hit.path}`;
    if (first && used.length && !used.some((x) => x.hit.path === first.path)) return `${first.field} unsaid on ${h.part}, ${used[0].hit.field} said instead`;
    return null;
  },
  /** H4 item 5: a help wording is said over the board of the part it belongs to (the rung's own board) — never the follow-up card's
   *  (c4 steady 124) nor another unit's (c4 stuck 30). */
  // (dc-r8-director26 B1: a remediation's own board is its `board` field and nothing else — with none, its help is said over the board
  // that is up, never a card's. director26's six rows (c4 steering 12; c6 steady 48, stuck 58, steering 8; c5-t02 steady 82, steering 12)
  // said a remediation's other wording over the skill's first check card for the same mix-up; help.js had lent it that card's board, and
  // this predicate compared against the lent board)
  helpBoard(L, r, i, ctx) {
    if (!helpTurnOf(L, r, i, ctx)) return null;
    const ix = helpIndex(ctx);
    const t = norm(r.text);
    for (const s of sentencesOf(t)) {
      const hit = ix.rungs.get(normSentence(s));
      if (!hit) continue;
      const rem = /^(.*\.remediation\[\d+\])\.(?:sayAlt|simpler)$/.exec(hit.path);
      // (the rung's own board — a wording Learning drew a board for — else its part's; a remediation's part board is its own `board`, else
      // none: the board up)
      const own = hit.board ?? (rem ? at(ctx.script, `${rem[1]}.board`) : null);
      const want = own && typeof own === "object" ? own : rem ? boardUpBefore(L, i) : null;
      if (!want) continue;
      const b = boardAt(r, t.indexOf(s));
      if (b && !sameBoard(b, want)) return `${hit.path} said over ${b.template} ${JSON.stringify(b.params ?? {}).slice(0, 60)}, not ${own ? "its own board" : "the board up"}`;
    }
    return null;
  },
  /** H4 item 5: a card's key is said over its answer board from its first word — never the posing board (c4 stuck 12; c5-t01 and c6
   *  offtopic 34; c5-t02 stuck 12). A right answer's close is no key. */
  keyAnswerBoard(L, r, i, ctx) {
    if (r.who !== "teacher" || ctx.prevCls === "correct" || ENDS.test(String(r.move?.kind ?? r.move ?? ""))) return null;
    const ix = helpIndex(ctx);
    const t = norm(r.text), T = normSentence(t);
    for (const c of ix.cards) {
      const ab = at(ctx.script, `${c.path}.answerBoard`);
      if (!ab || typeof ab !== "object") continue;
      const whys = (typeof c.why === "string" ? [c.why] : [c.why?.hi, c.why?.en]).filter(Boolean).map((w) => normSentence(w)).filter((w) => w.split(" ").length >= 5);
      const w = whys.find((x) => T.includes(x.slice(0, 60)));
      if (!w || !(KEY_SAID.test(t) || r.keyFact || helpTurnOf(L, r, i, ctx))) continue;
      // (the key's first word: its "jawab" sentence, else the sentence that holds its why)
      const ss = sentencesOf(t);
      const ks = ss.find((x) => KEY_SAID.test(x)) ?? ss.find((x) => normSentence(x).includes(w.slice(0, 40))) ?? ss[0];
      const b = boardAt(r, t.indexOf(ks));
      if (b && !sameBoard(b, ab)) return `${c.id}'s key said over ${b.template} ${JSON.stringify(b.params ?? {}).slice(0, 60)}, not its answer board`;
    }
    return null;
  },
  /** H4 item 4: a request for Hindi never gets a key (c5-t01 and c6 offtopic 34). */
  hindiNoKey(L, r, i, ctx) {
    const h = helpTurnOf(L, r, i, ctx);
    return h?.request === "hindi" && (KEY_SAID.test(String(r.text ?? "")) || r.check?.gave || r.keyFact) ? "a Hindi request answered with the key" : null;
  },
  /** H4 items 4 and 6: a give-up or a clarify is answered — with its part's wording, the key, or one of the help joints (after a key's
   *  check-in: the why's other wording, else "we'll meet this again"); never by going on to another part with no word to the child
   *  (c5-t01 stuck 80, offtopic 62, steering 20; c5-t02 steering 64; c6 steering 20; c4 stuck 14). */
  giveUpAnswered(L, r, i, ctx) {
    const h = helpTurnOf(L, r, i, ctx);
    if (!h || !["give_up", "clarify"].includes(h.request)) return null;
    // (dc-r8-director27 Brain 042: after her reply said alone before a worked segment there is no part to help — the segment comes; a
    // give-up on a quick question gets its `say` and the card, on an asked step the step told)
    if (ctx.prevT?.leadAlone) return null;
    if (h.request === "give_up" && /:quick$/.test(String(r.cell?.part ?? "")) && (r.pageParts ?? [])[0]?.part === "quickReply") return null;
    if (h.request === "give_up" && /:worked:step\d+:ask$/.test(String(r.cell?.part ?? ""))) return null;
    const ix = helpIndex(ctx);
    const ss = sentencesOf(r.text).map(normSentence);
    if (ss.some((k) => ix.rungs.has(k) || ix.joints.has(k))) return null;
    if (h.keyed && helpGoOnSaid(r, ctx)) return null;
    if (keySays(r, h, ctx)) return null;
    // (a point's give-up with nothing unsaid left asks the point's own card: that is its answer)
    const part = helpPart(ctx.script, h.part);
    if (!h.keyed && part?.card && r.card) {
      const own = helpPart(ctx.script, part.card);
      const prompt = own ? at(ctx.script, `${own.path}.prompt`) : null;
      if (prompt && [prompt.hi, prompt.en].filter(Boolean).some((x) => low(r.card).startsWith(low(x).slice(0, 30)))) return null;
    }
    // (a worked step's give-up with nothing unsaid goes on to the next step)
    if (!h.keyed && part?.kind === "worked_step") return null;
    return `a ${h.request === "give_up" ? "give-up" : "clarify"}${h.keyed ? " after a key" : ""} answered with nothing for it`;
  },
  /** H4 item 9: a give-up is never given a verdict word ("Haan, kyunki" to "mujhe nahi pata": c4 offtopic 24). */
  giveUpVerdict(L, r, i, ctx) {
    if (r.who !== "teacher" || !GIVE_UP_ANY.test(ctx.prevChild ?? "") || CLARIFY.test(ctx.prevChild ?? "") || !/^no_evidence/.test(String(ctx.prevRead ?? "")) || /·/.test(String(ctx.prevRead ?? ""))) return null;
    return /^(?:haan|nahi|yes|no|bilkul|sahi|correct|right)\b[,!.]/i.test(norm(r.text)) ? `a give-up given a verdict word: "${norm(r.text).slice(0, 40)}"` : null;
  },
  /** H4 items 4 and 7: a card's key comes when its ladder has nothing unsaid, never on a count of requests or misses — a give-up, a
   *  clarify or a wrong answer's hint answered with the key while a rung of the card's ladder is unsaid (H4 dry, c5-t02 stuck 22 and
   *  offtopic 28: the second miss on e2 got the key with e2's simpler unsaid; director25: the second-request rule's keys). */
  keyEarly(L, r, i, ctx) {
    const h = helpTurnOf(L, r, i, ctx);
    if (!h || h.keyed || h.request === "hindi") return null;
    const part = helpPart(ctx.script, h.part);
    if (!part || part.key == null || !keySays(r, h, ctx)) return null;
    // (Brain 044 Small: a hint on the fifth wrong answer to one question is its key, whatever the ladder still has — server/director/help.js
    // KEY_AFTER_MISSES)
    if (h.request === "hint" && missesOnQuestion(L.rows ?? [], i) >= 5) return null;
    const left = helpFirstUnsaid(L, i, ctx, h.part);
    return left ? `the key of ${h.part} given to a ${h.request} with "${String(left).slice(0, 50)}" unsaid` : null;
  },
};
