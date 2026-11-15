// dc-r7-script-walk-v6-11 G2 (main's director19 judgement): the dry matrix is a gate. These predicates run over every lesson of the
// dry matrix (evals/hybrid-side-by-side.mjs --matrix --director-only --reactive --dry: the 16 pilot lessons, the rule-based child, the
// model stubbed, no network) and name each fault director19 found. tests/r7-dry-matrix.test.mjs runs the matrix inside test:all and
// fails on any flag. Every predicate was seen failing on the tree before its fix (counts in the v6.11 step-1 report). Pure.
//
// A lesson is { topicId, persona, rows } (the harness's director rows), with the topic's lesson script (`script`, for its joints).

import { readFileSync } from "node:fs";
import { asideReplyForms } from "../../server/brain/asideReplies.js";

const norm = (t) => String(t ?? "").replace(/\s+/g, " ").trim();
const low = (t) => norm(t).toLowerCase();
const sentencesOf = (t) => norm(t).split(/(?<=[.!?।])\s+(?=\S)/).map((x) => x.trim()).filter(Boolean);
const key = (t) => low(t).replace(/[^\p{L}\p{N}/ ]+/gu, " ").replace(/\s+/g, " ").trim();
const words = (t) => norm(t).split(" ").filter(Boolean).length;
// (S1: a card re-asked by its question alone — its last sentence — is said too)
const cardQ = (c) => sentencesOf(c).at(-1) ?? "";
const cardIn = (r) => !!r?.card && (low(r.text).includes(low(r.card).slice(0, 30)) || (sentencesOf(r.card).length > 1 && low(r.text).endsWith(low(cardQ(r.card)))));

const REPOSE = /^(?:Phir se dekho|Ek baar aur dekho|Ek baar phir dekho|Look again|One more look)\s*:/i;
const KEY_SAID = /(?:is sawaal ka|iska|yahan|pichhle sawaal ka|woh wala:?) (?:sahi )?jawab|sahi jawab:|the answer (?:here )?(?:is|was)|iska jawab hai|poora jawab:?|the full answer/i;
const GIVE_UP = /\b(?:aap batao|aap hi batao|tum batao|batao na|nahi pata,? aap|pata nahi,? aap|give up|i give up|chhodo|nahi aata)\b/i;
/** Any give-up: "pata nahi" bare, "mujhe nahi pata", "aap batao", "nahi aata"… (a request for the answer, or not knowing it). */
const GIVE_UP_ANY = /(?<![\p{L}])(?:pata\s+nahi|nahi\s+pata|aap\s+(?:hi\s+)?batao|tum\s+batao|i\s+(?:don'?t|do\s+not)\s+know|give\s+up|chhodo|nahi\s+aata)(?![\p{L}])/iu;
const CLARIFY = /\b(?:samajh nahi aaya|samajh nahi aa raha|samjha nahi|samjhi nahi|didn'?t understand|don'?t understand|kya matlab)\b/i;
const CHECKIN = /(?:Yahan tak (?:theek|saaf) hai|Ab tak samajh aaya|Yeh hissa saaf hua|Yeh kadam (?:saaf hai|samajh aaya)|Does that make sense so far|Clear so far|All good so far|Is that (?:part|step) clear)\?\s*$/i;
const RET_STOP = new Set(["maine", "mujhe", "mera", "meri", "mere", "aapko", "tumhe", "hain", "kyunki", "jab", "woh", "sabse", "lagti", "lagta", "with", "that", "this", "have", "when"]);
const TASTE = /(?<![\p{L}])(?:mujhe\s+(?:bhi\s+)?\S+(?:\s+\S+)?\s+pasand|meri\s+favourite|mera\s+favourite|mujhe\s+(?:bhi\s+)?achha\s+lagta|i\s+(?:also\s+)?(?:love|like|enjoy)|my\s+favou?rite)/iu;
const SPLIT_CARD_RE = /(?:Ab isi par ek sawaal|Ab is par ek chhota sawaal|Ab ise ek sawaal se dekhte hain|Now a question on this|Now a small question on this|Let's try a question on it)[.!]?/i;
const JOINT_ONLY = /^(?:achha|theek hai|hmm,? achha|okay|alright|right|haan)[.!,]?$/i;
/** English words and their Hindi twins: Learning's one list (data/lesson-twins.json, also read by scripts/lesson-scripts/check.mjs and
 *  by server/brain/say.js). Each side's forms longest first, so "number line" is tried before "line". */
const twinRe = (forms) => new RegExp(`(?<![\\p{L}])(?<!question\\s)(?:${[...forms].sort((a, b) => b.length - a.length).map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/\s+/g, "\\s+")).join("|")})(?![\\p{L}])`, "iu");
export const TWINS = JSON.parse(readFileSync(new URL("../../data/lesson-twins.json", import.meta.url), "utf8")).twins
  .map((t) => ({ en: t.en, hi: t.hi, enRe: twinRe(t.en), hiRe: twinRe(t.hi) }));

const GOODBYE = /^(?:wrap|break)$/;
const AI_LINE = /(?:Main AI teacher hoon|I'm an AI|No favourites for me|Main AI hoon)/i;
/** The parts of a turn that are the lesson's own (a return or a park's turn is checked against them). */
const UNIT_PART = new Set(["body", "simpler", "card", "alt", "bridge"]);
/** A joint form with its {aside} slot as a pattern; the slot's words are captured. */
const formRe = (f) => new RegExp(String(f).replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/\\\{aside\\\}/g, "(.{2,40}?)").replace(/\s+/g, "\\s+"), "iu");
/** The aside a turn parks (the script's asidePark forms), or null. */
function parkOf(r, ctx) {
  for (const re of ctx.parkRes ?? []) { const m = String(r.text ?? "").match(re); if (m) return norm(m[1] ?? "").replace(/^[.!?,\s]+/, ""); }
  return null;
}
/** Whether a turn is a return to a parked aside (the harness marks it; the script's asideReturn forms otherwise). */
function returnOf(r, ctx) {
  return !!r.returnSaid || (ctx.retRes ?? []).some((re) => re.test(String(r.text ?? "")));
}

/** Each predicate: (lesson, row, i, ctx) → reason or null. ctx = { prevT, prevChild, script, saidCards, jointUse }. */
export const PREDICATES = {
  /** A sentence said twice in one turn. */
  doubledSentence(L, r) {
    const seen = new Set();
    for (const s of sentencesOf(r.text)) { const k = key(s); if (words(s) < 3) continue; if (seen.has(k)) return `said twice: "${s}"`; seen.add(k); }
    return null;
  },
  /** A joint form used twice before another form of its kind was used once (the rotation does not reach the joints). */
  jointRotation(L, r, i, ctx) {
    for (const [kind, forms] of Object.entries(ctx.jointHeads)) {
      const hit = forms.findIndex((h) => h && low(r.text).includes(h));
      if (hit < 0) continue;
      const use = (ctx.jointUse[kind] ??= forms.map(() => 0));
      if (use[hit] >= 1 && use.some((n, j) => j !== hit && n === 0)) { use[hit]++; return `${kind} form ${hit + 1} again before the others`; }
      use[hit]++;
    }
    return null;
  },
  /** A slot left unfilled; the child's own first-person words in her mouth; a return whose {said} sentence was dropped. */
  slotsAndVoice(L, r, i, ctx) {
    if (/\{\w+\}/.test(r.text)) return "a slot left unfilled";
    const child = low(ctx.prevChild);
    const own = child.match(/(?:^|\s)((?:kal |aaj )?(?:maine|mujhe|main|mera|meri) [\p{L} ]{6,})/u)?.[1]?.trim();
    if (own && words(own) >= 3 && low(r.text).includes(own)) return `the child's words in her mouth: "${own}"`;
    if (/(?:^|[.!?]\s+)(?:Uske|Usmein|Uske baare mein)\b/.test(norm(r.text)) && !/(?:tumne|you said)/i.test(r.text) && /(?:Ab tumhari baat|tumhari .* wali baat)/i.test(r.text) === false && ctx.returnDue) return "a return pointing at nothing";
    return null;
  },
  /** A re-pose frame on a card's first posing, or glued onto anything but a card. */
  reposeFirst(L, r, i, ctx) {
    const s = sentencesOf(r.text).find((x) => REPOSE.test(x));
    if (!s) return null;
    const rest = norm(s.replace(REPOSE, ""));
    if (!r.card || !low(r.card).startsWith(low(rest).slice(0, 20))) return `a re-pose frame on no card: "${s.slice(0, 60)}"`;
    return ctx.saidCards.has(low(r.card).slice(0, 40)) ? null : "a re-pose frame on the card's first posing";
  },
  /** A turn that asks the child a question and poses a card. */
  askAndCard(L, r) {
    if (!cardIn(r)) return null;
    // (a return asks the child about their aside — "… thoda aur batao" — whether or not it ends in "?")
    if (r.returnSaid) return "an aside return and a card in one turn";
    const card = low(r.card);
    const unframed = (x) => low(x).replace(/^[^:—]{0,40}(?::|—)\s*/, "");
    const qs = sentencesOf(r.text).filter((x) => /[?？]\s*$/.test(x) && !card.includes(low(x).slice(0, 25)) && !card.includes(unframed(x).slice(0, 25)) && !CHECKIN.test(x));
    return qs.length ? `asks "${qs[0].slice(0, 60)}" and poses a card` : null;
  },
  /** A turn holding a key, a new point and a new card. */
  keyPointCard(L, r, i, ctx) {
    if (!KEY_SAID.test(r.text) || !cardIn(r) || !(r.pageParts ?? []).some((p) => p.part === "body")) return null;
    const newCard = !ctx.prevT?.card || low(ctx.prevT.card) !== low(r.card);
    return newCard && !/bridge/.test(JSON.stringify(r.pageParts)) ? "a key, a new point and a new card in one turn" : null;
  },
  /** A give-up with the card's help spent, answered without the key (fault 5). dc-r8-director20 G3: it survived director20 on c4 stuck 12,
   *  c5-t01 stuck 12 and c5-t02 steering 30 — a bare "pata nahi" / "mujhe nahi pata" is a give-up too, and the help is spent once the
   *  card had a miss or was already said twice; the turn must say the key, whatever card it poses or drops. */
  giveUpNoKey(L, r, i, ctx) {
    if (!GIVE_UP_ANY.test(ctx.prevChild)) return null;
    const card = ctx.prevT?.check?.itemId;
    if (!card || ctx.prevT?.check?.gave) return null;
    const spent = (ctx.prevT.check.misses ?? 0) >= 1 || (ctx.cardTurns[card] ?? 0) >= 2;
    if (!spent || r.check?.gave || KEY_SAID.test(r.text)) return null;
    return `a give-up with the help spent (${(ctx.prevT.check.misses ?? 0)} miss, said ${ctx.cardTurns[card] ?? 0}×), answered without the key`;
  },
  /** A clarify at a check-in (after a point, a key or a remediation) answered with the card alone. */
  clarifyCard(L, r, i, ctx) {
    if (!CLARIFY.test(ctx.prevChild) || !ctx.prevT) return null;
    const atCheckin = CHECKIN.test(norm(ctx.prevT.text)) || (KEY_SAID.test(ctx.prevT.text) && !cardIn(ctx.prevT)) || (!cardIn(ctx.prevT) && /rem:|then:/.test(String(ctx.prevT.beat ?? "")));
    // (main on director19: re-saying and then posing the card in the same turn is still answering the clarify with the card — the turn
    // re-says, ends on its check-in, and the card waits)
    // (dc-r8-second-clarify-shows-not-rewords: the key and its why said twice after the first — a third ask may move on)
    if (KEY_SAID.test(ctx.prevT.text) && ctx.prevPrevT && KEY_SAID.test(ctx.prevPrevT.text) && !cardIn(ctx.prevPrevT)) return null;
    return atCheckin && cardIn(r) ? "clarify at a check-in answered with a card" : null;
  },
  /** A planned in-turn board change the record does not draw; a board change under a joint word. */
  boardChange(L, r) {
    const H = r.held;
    if (!H) return null;
    if (H.intent?.switchTo && (H.pages ?? []).length < 2) return "a planned board change not drawn";
    const first = sentencesOf(r.text)[0] ?? "";
    if (H.changed && !H.intent?.switchTo && JOINT_ONLY.test(first) && sentencesOf(r.text).length > 1) return `a board change under the joint "${first}"`;
    return null;
  },
  /** A worked example's card answered right, closed without its final answer. */
  workedFinal(L, r, i, ctx) {
    const id = String(ctx.prevT?.check?.itemId ?? "");
    if (!/:ask:worked$/.test(id) || ctx.prevCls !== "correct") return null;
    const sk = id.replace(/^script:/, "").replace(/:ask:worked$/, "");
    const we = (ctx.script?.skills ?? []).find((s) => s.skillId === sk)?.workedExample;
    const a = String(we?.answer?.hi ?? we?.answer ?? "");
    // (dc-r8-director20 item 6: c4's answer is "2/3" — reading only its "2", the why's "2 khaye gaye" passed it on steady 44, offtopic 48
    // and steering 46; the whole number, a fraction whole, must be said)
    const num = a.match(/\d+(?:[./]\d+)?/)?.[0];
    const esc = (x) => x.replace(/[.*+?^${}()|[\]\\/]/g, "\\$&");
    return num && !new RegExp(`(?<![\\d./])${esc(num)}(?![\\d/])`).test(r.text) ? `a worked example closed without its final answer (${num})` : null;
  },
  /** A worked step said before its problem in the lesson (an aside resumed at step 1). */
  workedOrder(L, r, i, ctx) {
    const b = String(r.beat ?? "");
    const m = /^(s\d+):worked:worked:(problem|step\d+)/.exec(b);
    if (!m) return null;
    if (m[2] === "problem") { ctx.problemSaid.add(m[1]); return null; }
    return ctx.problemSaid.has(m[1]) ? null : `a worked ${m[2]} before its problem`;
  },
  /** R1 (dc-r8-director20, was J2): the turn after the child answered her return question (or her question after the AI line) opens
   *  on one of Learning's reply forms — a form with a word the child said in its slot, a plain form, or the sad set — and then goes on
   *  with the lesson. Never a park again, never a model-written sentence. */
  returnReply(L, r, i, ctx) {
    if (!ctx.prevT?.returnSaid || !ctx.prevChild || /^(?:wrap|safeguard|break)$/.test(String(r.move?.kind ?? r.move ?? ""))) return null;
    const t = norm(r.text);
    const ss = sentencesOf(t);
    const park = ss.find((x) => /(?<![\p{L}])(?:karenge|karungi|baad\s+mein|thodi\s+der|yaad\s+rahega|likh\s+li|later|come\s+back)(?![\p{L}])/iu.test(x));
    if (park) return `their answer to the return parked again: "${park.slice(0, 70)}"`;
    const F = (ctx.replyForms ??= asideReplyForms());
    const fixed = [...F.plain, ...F.sad].map(norm).find((f) => low(t).startsWith(low(f)));
    let used = fixed ?? null;
    if (!used) for (const re of F.word) {
      for (let n = 1; n <= Math.min(ss.length, 2) && !used; n++) {
        const head = ss.slice(0, n).join(" "), m = head.match(re);
        if (m && new RegExp(`(?<![\\p{L}])${m[1].replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?![\\p{L}])`, "iu").test(ctx.prevChild)) used = head;
      }
      if (used) break;
    }
    if (!used) return `the reply to their answer is no form of Learning's: "${ss[0]?.slice(0, 70) ?? ""}"`;
    return norm(t.slice(used.length)) ? null : `no lesson after the reply: "${used.slice(0, 60)}"`;
  },
  /** Main's order 1 (dc-r8-director20 G3 b, c): every authored part she starts is said whole — a point, a simpler, a card, a remediation,
   *  a worked problem or given, a hook, a bridge, greetSimpler. A turn that says one sentence of an authored unit (one no other unit
   *  holds) and not the whole unit, word for word in one run, dropped or changed a part of it: a sentence cut, a word swapped, another
   *  line put inside it. Frames before a sentence ("Phir se dekho: …") are allowed; the unit's own words are not touched. */
  authoredWhole(L, r, i, ctx) {
    const units = (ctx.units ??= authoredUnits(ctx.script));
    const T = ` ${key(r.text)} `;
    // (a unit sentence is said when a sentence of hers is it — or ends with it after a frame's ":" or "—", "Phir se dekho: …"; never as
    // the tail of a longer sentence of hers, "… aur upar ka woh ek hissa 1/4 hai")
    const TS = sentencesOf(r.text).map((x) => ({ k: key(x), raw: low(x) }));
    const said = (k) => TS.some((t) => t.k === k || (t.k.endsWith(` ${k}`) && /[:—–]\s*[^:—–]*$/.test(t.raw) && key(t.raw.split(/[:—–]/).at(-1)) === k));
    // (S1: a card said whole in one of her last two turns may be re-asked by its question alone)
    const recentT = [ctx.prevT, ctx.prevPrevT].filter(Boolean).map((t) => ` ${key(t.text)} `);
    for (const u of units) {
      if (T.includes(` ${u.whole} `)) continue;
      if (u.inline) {
        // (a run of five of its words or more in the turn, in its order — not numbers alone — and no form said whole: it was started
        // and changed)
        if (u.forms.some((f) => T.includes(` ${f} `))) continue;
        // (a run another unit holds, said whole in this turn — a simpler, a card, another why — is that unit's)
        // (any spoken string of the script counts, a slotted one by what filled its slot: "{friend} galat hai" said as "Zoya galat hai")
        const own = new Set(u.forms);
        const saidOther = [...units.filter((v) => v !== u).flatMap((v) => v.forms ?? [v.whole]).filter((f) => T.includes(` ${f} `)).map((f) => ` ${f} `),
          ...scriptSaidIn(ctx, T).filter((f) => !own.has(f.trim()))];
        let best = 0, of = 0;
        for (const f of u.forms) {
          const w = f.split(" ");
          for (let a = 0; a < w.length; a++) for (let b = w.length; b - a > best && b - a >= 5; b--) {
            const run = w.slice(a, b);
            if (run.filter((x) => /\p{L}{2,}/u.test(x)).length >= 3 && T.includes(` ${run.join(" ")} `) && !saidOther.some((o) => o.includes(` ${run.join(" ")} `))) { best = b - a; of = w.length; break; }
          }
        }
        if (best < 5) continue;
        return `${u.where} not said word for word (${best} of ${of} words in one run)`;
      }
      if (/ card$/.test(u.where) && recentT.some((t) => t.includes(` ${u.whole} `)) && u.sents.filter(said).every((x) => x === u.sents.at(-1))) continue;
      const hit = u.sents.filter(said);
      // (a sentence two units share, "Barfi ka kitna hissa khaya gaya?", proves neither was started; nor does a short generic one —
      // "Kya woh sahi hai?", "Kitni tape lagegi?" — which a kit card can end on too: a start is a sentence of five words or more)
      if (!hit.some((h) => h.split(" ").length >= 5 && !units.some((v) => v.whole !== u.whole && v.whole.includes(h)))) continue;
      const miss = u.sents.filter((x) => !said(x));
      return `${u.where} not said whole (${hit.length} of ${u.sents.length} sentences${miss.length ? `; not said: "${miss[0].slice(0, 60)}"` : "; split"})`;
    }
    return null;
  },
  /** P1 (dc-r8-director20): every park is kept. A park (her promise to talk about their aside later) gets its return before the
   *  goodbye — and, mid-lesson, within ten turns of hers — unless her goodbye names it. director20: c5-t01 steering 24 and c5-t02
   *  stuck 34 were never returned to. */
  parkReturned(L, r, i, ctx) {
    const pk = parkOf(r, ctx);
    if (!pk) return null;
    let n = 0;
    for (let j = i + 1; j < L.rows.length; j++) {
      const t = L.rows[j];
      if (t.who !== "teacher") continue;
      if (returnOf(t, ctx)) return null;
      if (GOODBYE.test(String(t.move?.kind ?? t.move ?? ""))) return low(t.text).includes(low(pk)) ? null : `the park of "${pk}" not returned to before the goodbye (row ${j})`;
      if (++n >= 10) return `the park of "${pk}" not returned to in ten turns`;
    }
    return null;
  },
  /** P1: a return answers a park; one with none (c4 offtopic 37) is a promise she never made. */
  returnNoPark(L, r, i, ctx) {
    if (parkOf(r, ctx)) ctx.openParks = (ctx.openParks ?? 0) + 1;
    if (!returnOf(r, ctx)) return null;
    if ((ctx.openParks ?? 0) > 0) { ctx.openParks--; return null; }
    return "a return with no park before it";
  },
  /** P1: a return is a turn of its own: the verdict on the card just answered may come first, and nothing of the lesson after. */
  returnAlone(L, r, i, ctx) {
    if (!returnOf(r, ctx)) return null;
    const unit = (r.pageParts ?? []).find((p) => UNIT_PART.has(p.part));
    return unit || cardIn(r) ? `a return said with the lesson's ${unit?.part ?? "card"}` : null;
  },
  /** P1: a park's turn goes on into the live part (a park alone leaves the child nothing to do: c4 offtopic 22, c6 36). */
  parkGoesOn(L, r, i, ctx) {
    const pk = parkOf(r, ctx);
    if (!pk) return null;
    const ss = sentencesOf(r.text);
    return ctx.parkRes.some((re) => re.test(ss.at(-1) ?? "")) ? `the turn ends on the park of "${pk}"` : null;
  },
  /** P1: after the "Main AI teacher hoon …" line she asks no question unless her next turn answers the child's reply. */
  aiAskAnswered(L, r, i, ctx) {
    // (the question is the AI line's own, ending her turn — not a card or a worked problem said after it)
    const lastQ = ctx.prevT ? sentencesOf(ctx.prevT.text).at(-1) ?? "" : "";
    const q = ctx.prevT && AI_LINE.test(ctx.prevT.text) && /[?？]\s*$/.test(lastQ) && !low(ctx.prevT.card ?? "").includes(low(lastQ).slice(0, 25))
      && !(ctx.prevT.pageParts ?? []).some((p) => p.part === "body" || p.part === "card");
    // (a request in reply — "hindi mein batao na", a picture — is served as that request)
    if (!q || r.j2 || /·/.test(ctx.prevRead ?? "") || /^(?:wrap|safeguard|break)$/.test(String(r.move?.kind ?? r.move ?? ""))) return null;
    const first = (r.pageParts ?? [])[0]?.part;
    return !first || UNIT_PART.has(first) || first === "card" ? `her question after the AI line, "${sentencesOf(ctx.prevT.text).at(-1).slice(0, 50)}", not answered` : null;
  },
  /** L1 (dc-r8-director20): a give-up ("pata nahi", "aap batao") at a check-in is never read as yes and never moves to new material.
   *  After a point or a remediation it gets that part's simpler and then the card; after a key, the why again and the check-in. */
  giveUpCheckin(L, r, i, ctx) {
    const p = ctx.prevT;
    if (!p || !GIVE_UP_ANY.test(ctx.prevChild) || CLARIFY.test(ctx.prevChild) || cardIn(p) || !CHECKIN.test(norm(p.text))) return null;
    if (/^(?:wrap|safeguard|break)$/.test(String(r.move?.kind ?? r.move ?? ""))) return null;
    // (a second give-up after the key and its why were said again may move on)
    if (KEY_SAID.test(p.text) && ctx.prevPrevT && KEY_SAID.test(ctx.prevPrevT.text) && !cardIn(ctx.prevPrevT)) return null;
    // (after a second clarify on any part its help is spent: the cell's third level moves on — C1, main on director21)
    if (p.clarifyN === 2) return null;
    if (/worked:(?:step|problem)/.test(String(p.beat ?? ""))) {
      if (ctx.prevPrevT && /worked:(?:step|problem)/.test(String(ctx.prevPrevT.beat ?? "")) && ctx.prevPrevT.beat === p.beat) return null;
      return (r.pageParts ?? []).some((x) => x.part === "simpler" || x.part === "body") && r.beat === p.beat ? null : "a give-up at a worked step's check-in moved on";
    }
    if (KEY_SAID.test(p.text)) {
      if (cardIn(r)) return "a give-up after a key answered with a card";
      return CHECKIN.test(norm(r.text)) ? null : "a give-up after a key not answered with its why and the check-in";
    }
    const simpler = (r.pageParts ?? []).some((x) => x.part === "simpler");
    return simpler && cardIn(r) ? null : `a give-up at a check-in answered with ${simpler ? "no card" : cardIn(r) ? "the card and no simpler" : "neither the simpler nor the card"}`;
  },
  /** L3 (dc-r8-director20): a clarify or a give-up at the greeting gets the script's greetSimpler, then the hook. */
  greetSimpler(L, r, i, ctx) {
    if (!ctx.prevT || String(ctx.prevT.move?.kind ?? ctx.prevT.move ?? "") !== "greet" || !(CLARIFY.test(ctx.prevChild) || GIVE_UP_ANY.test(ctx.prevChild))) return null;
    const g = [ctx.script?.greetSimpler?.hi, ctx.script?.greetSimpler?.en].filter(Boolean).map(key);
    if (!g.length) return null;
    return g.some((x) => key(r.text).startsWith(x)) ? null : "a clarify at the greeting not answered with greetSimpler first";
  },
  /** L4 (dc-r8-director20): a Hindi request on an explain card gets that point's simpler (the card's own ask.simpler where it has one)
   *  and then the card's question; she says "Hindi mein bolti hoon" only when what follows is not what she just said. */
  hindiCard(L, r, i, ctx) {
    const p = ctx.prevT;
    if (!p || !/·\s*language/.test(ctx.prevRead ?? "") || !cardIn(p) || !/:ask:e\d+$/.test(String(p.check?.itemId ?? ""))) return null;
    if (/^(?:wrap|safeguard|break)$/.test(String(r.move?.kind ?? r.move ?? ""))) return null;
    const simpler = (r.pageParts ?? []).some((x) => x.part === "simpler");
    const q = sentencesOf(p.card ?? "").at(-1) ?? "";
    if (!simpler) return "a Hindi request on a card answered with no simpler";
    if (!low(r.text).includes(low(q).slice(0, 25))) return "a Hindi request on a card: the simpler, then no question";
    const ack = sentencesOf(r.text).find((x) => /hindi mein/i.test(x));
    const rest = low(r.text.replace(ack ?? "", "")).replace(low(p.card ?? ""), "");
    return ack && low(p.text).includes(rest.trim().slice(0, 40)) ? `"${ack}" with nothing changed` : null;
  },
  /** S1 (dc-r8-director20): after a hint on a card said whole in one of her last two turns, she asks only its question (its last
   *  sentence, or the card's ask) — the whole card said again is fault 7 (23 times in c5-t01). */
  cardWholeAgain(L, r, i, ctx) {
    // (a picture turn keeps its card whole on its own page, v6.5 P3: a hint is a simpler or a miss's close)
    if (!cardIn(r) || (r.pageParts ?? []).some((x) => x.part === "alt") || !(r.pageParts ?? []).some((x) => x.part === "simpler" || x.part === "close")) return null;
    // (a right answer's close is no hint: the card after it — a parent card coming back — is posed whole)
    if (ctx.prevCls === "correct" && !(r.pageParts ?? []).some((x) => x.part === "simpler")) return null;
    const c = low(r.card ?? "");
    if (sentencesOf(r.card ?? "").length < 2) return null;
    const said = [ctx.prevT, ctx.prevPrevT].some((t) => t && low(t.text).includes(c));
    return said && low(r.text).includes(c) ? "the whole card said again after a hint, said whole in her last two turns" : null;
  },
  /** S1: "Ab isi par ek sawaal." only when the card follows in the same turn. */
  splitCardEmpty(L, r) {
    return SPLIT_CARD_RE.test(r.text) && !cardIn(r) ? `"${norm(r.text).match(SPLIT_CARD_RE)[0]}" with no card after it` : null;
  },
  /** S1: no turn ends on a close with nothing for the child — a close is followed by the next part, a card or a check-in. */
  bareClose(L, r) {
    if (/^(?:wrap|safeguard|break)$/.test(String(r.move?.kind ?? r.move ?? "")) || cardIn(r) || /[?？]\s*$/.test(norm(r.text))) return null;
    const last = (r.pageParts ?? []).at(-1)?.part;
    return last === "close" || last === "closed" ? `the turn ends on a close: "${sentencesOf(r.text).at(-1)?.slice(0, 60)}"` : null;
  },
  /** Main on the shadow (2026-11-11): a clarify or a give-up on a worked problem gets the problem's simpler (never step 1); a clarify on
   *  a worked step gets that step's simpler (never the step again). Where the script has no simpler, nothing is asked of the turn. */
  workedClarify(L, r, i, ctx) {
    const p = ctx.prevT;
    const m = /^s(\d+):worked:worked:(problem|step(\d+))$/.exec(String(p?.beat ?? ""));
    if (!m || r.clarifyN === 2) return null;
    const clar = CLARIFY.test(ctx.prevChild) || /·\s*(?:another|clarify|confused)/.test(ctx.prevRead ?? "");
    const giveUp = !clar && GIVE_UP_ANY.test(ctx.prevChild);
    if (!clar && !(giveUp && m[2] === "problem")) return null;
    const we = ctx.script?.skills?.[Number(m[1]) - 1]?.workedExample;
    const sm = m[2] === "problem" ? we?.simpler : we?.steps?.[Number(m[3]) - 1]?.simpler;
    const t = sm?.hi ?? sm?.en ?? (typeof sm === "string" ? sm : null);
    if (!t) return null;
    // (said already on that part — a third ask may move on, as after a key)
    if (key(p.text).includes(key(t))) return null;
    return key(r.text).includes(key(t)) ? null : `a ${giveUp ? "give-up" : "clarify"} on the worked ${m[2]} not answered with its simpler`;
  },
  /** A second clarify on one part (dc-r8-second-clarify-shows-not-rewords): the same authored line with the board shown, then the
   *  check-in — never the card, never the key (unless the part was the key). Gated (state.js step's second-clarify cell). */
  secondClarify(L, r, i, ctx) {
    if (r.clarifyN !== 2) return null;
    if (cardIn(r)) return "a second clarify answered with the card";
    // (the same line: when the part they asked about was the key and its why, it is the key again)
    if (KEY_SAID.test(r.text) && !(ctx?.prevT && KEY_SAID.test(ctx.prevT.text))) return "a second clarify answered with the key";
    return CHECKIN.test(norm(r.text)) ? null : "a second clarify that does not end on its check-in";
  },
  /** An English word and its Hindi twin in one turn. */
  // (dc-r8-director20 W1: code never swaps a word inside an authored sentence, so a pair BOTH of whose words the script itself uses is
  // the script's to fix — twinsData, reported to Learning — and twins flags only a word code brought in. A gloss that introduces a term,
  // "line yaani rekha", is no twin fault, as Learning's rule allows)
  twins(L, r, i, ctx) {
    const t = twinHit(r.text);
    return t && !(scriptUses(ctx, t.e) && scriptUses(ctx, t.h)) ? `"${t.e}" beside "${t.h}"` : null;
  },
  /** An English word and its Hindi twin in one turn, both from the script's own sentences. PENDING: Learning's at-source fix
   *  (one term per idea per script, d1acefe95). */
  twinsData(L, r, i, ctx) {
    const t = twinHit(r.text);
    return t && scriptUses(ctx, t.e) && scriptUses(ctx, t.h) ? `"${t.e}" beside "${t.h}" (both in the script)` : null;
  },
};

/** Every authored unit of a lesson script, in both forms: { where, whole, sents } (keys; sentences of three words or more). A unit
 *  with a slot is filled by code and left out. */
export function authoredUnits(script) {
  const out = [];
  const add = (where, v) => {
    for (const t of typeof v === "string" ? [v] : [v?.hi, v?.en]) {
      if (!t || /\{\w+\}/.test(t)) continue;
      const sents = sentencesOf(t).map(key).filter((k) => k.split(" ").length >= 3);
      if (sents.length) out.push({ where, whole: key(t), sents });
    }
  };
  add("greetSimpler", script?.greetSimpler);
  for (const [n, sk] of (script?.skills ?? []).entries()) {
    const S = `s${n + 1}`;
    for (const sl of sk.hook?.interestSlots ?? []) add(`${S} hook`, sl.use);
    for (const e of sk.explain ?? []) { add(`${S} ${e.id} point`, e.point); add(`${S} ${e.id} simpler`, e.simpler); add(`${S} ${e.id} card`, e.ask?.prompt); add(`${S} ${e.id} ask.simpler`, e.ask?.simpler); }
    for (const m of sk.remediation ?? []) { add(`${S} rem ${m.targets}`, m.say); add(`${S} rem ${m.targets} simpler`, m.simpler); add(`${S} then ${m.targets} card`, m.then?.prompt); add(`${S} then ${m.targets} simpler`, m.then?.simpler); }
    const we = sk.workedExample;
    if (we) {
      add(`${S} worked problem`, we.problem); add(`${S} worked simpler`, we.simpler); (we.givens ?? []).forEach((g, k) => add(`${S} worked given ${k + 1}`, g));
      (we.steps ?? []).forEach((st, k) => add(`${S} worked step ${k + 1} simpler`, st.simpler));
      add(`${S} yourStep card`, we.yourStep?.prompt); add(`${S} yourStep simpler`, we.yourStep?.simpler);
    }
    for (const c of sk.checks ?? []) { add(`${S} ${c.id} card`, c.prompt); add(`${S} ${c.id} simpler`, c.simpler); }
    add(`${S} bridge`, sk.bridgeToNext);
    // (main on integration 51, c5-t01 steady 96: the key's why said with "line" and "mark" swapped passed as said whole — a why and a
    // worked close are units too, said after code's frame "Bilkul sahi, kyunki …", so word for word anywhere in the turn)
    // (one unit for both its forms: a Hindi turn holds the English form's numbers, "8 5 7 6 3 29 m", and that is no start)
    const close = (where, v) => { const n0 = out.length; add(where, v); const us = out.splice(n0); if (us.length) out.push({ ...us[0], inline: true, forms: us.map((u) => u.whole) }); };
    for (const e of sk.explain ?? []) close(`${S} ${e.id} why`, e.ask?.why);
    for (const m of sk.remediation ?? []) close(`${S} then ${m.targets} why`, m.then?.why);
    if (we) { close(`${S} worked why`, we.why); close(`${S} worked close`, typeof we.answer === "object" ? we.answer : null); close(`${S} yourStep why`, we.yourStep?.why); }
    for (const c of sk.checks ?? []) close(`${S} ${c.id} why`, c.why);
  }
  return out;
}

/** The script's spoken strings said in a turn's key text T (" … "), each as the stretch of T it covers (" … "): plain strings whole or
 *  sentence by sentence, a slotted one ("{friend} kehta hai …") with its slot filled by one to three words. */
function scriptSaidIn(ctx, T) {
  const all = (ctx.scriptStrs ??= (() => {
    const SKIP = new Set(["id", "itemId", "skillId", "beatId", "template", "params", "board", "answerBoard", "accept", "targets", "wrongIfMis", "key", "topicId", "scriptId", "ladder", "notes", "source", "version", "recordedRun", "match"]);
    const out = new Set();
    const walk = (o) => { if (typeof o === "string") { out.add(o); return; } if (Array.isArray(o)) { o.forEach(walk); return; } if (o && typeof o === "object") for (const [k, v] of Object.entries(o)) if (!SKIP.has(k)) walk(v); };
    walk(ctx.script ?? {});
    return [...new Set([...out].flatMap((f) => [f, ...sentencesOf(f)]))].map((f) => {
      const parts = f.split(/\{\w+\}/).map(key).filter(Boolean);
      return parts.join(" ").split(" ").length >= 3 ? parts : null;
    }).filter(Boolean);
  })());
  const out = [];
  for (const parts of all) {
    if (parts.length === 1) { if (T.includes(` ${parts[0]} `)) out.push(` ${parts[0]} `); continue; }
    const re = new RegExp(` ${parts.map((p) => p.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("(?: \\S+){1,3} ")} `, "u");
    const m = T.match(re);
    if (m) out.push(m[0]);
  }
  return out;
}
/** The first twin pair in a turn, not a gloss ("line yaani rekha", "rekha, yaani line"): { e, h } or null. */
function twinHit(text) {
  const t0 = String(text ?? "");
  for (const t of TWINS) {
    const e = t0.match(t.enRe), h = t0.match(t.hiRe);
    if (!e || !h) continue;
    const gloss = new RegExp(`(?:${e[0]}|${h[0]})[,\\s]+(?:yaani|matlab|ya(?:ni)?|or|i\\.e\\.)\\s+(?:${e[0]}|${h[0]})`, "iu");
    if (gloss.test(t0)) continue;
    return { e: e[0], h: h[0] };
  }
  return null;
}
/** Whether the lesson's script uses a word anywhere in its own text (its spoken Hindi or English). */
function scriptUses(ctx, w) {
  if (!ctx) return false;
  ctx.scriptText ??= JSON.stringify(ctx.script ?? {}).toLowerCase();
  return new RegExp(`(?<![\\p{L}])${String(w).toLowerCase().replace(/\s+/g, "\\s+")}(?![\\p{L}])`, "u").test(ctx.scriptText);
}

/** Predicates that report and do not gate yet (the gate test leaves them out): each names the step that makes it pass. */
// (secondClarify gates from 2026-11-11: the stuck child says "phir bhi samajh nahi aaya" right after her first re-explanation, and the
// walk's second-clarify cell — the same line, then the check-in — holds it at 0)
// ───────────── dc-r8-director21 O: the order laws, over live and dry rows ─────────────
// Each reads the turn's page parts (each part's own beat: "e2", "worked:problem", "worked:step1", "worked" — the child's step —,
// "rem:<mix-up>", "then:<mix-up>", "c3", "bridge") and the skill the turn is in (held.unit, else the walk's beat).
const TEACH = new Set(["body", "simpler", "alt", "held"]);
const beatOfPart = (p) => String(p?.beat ?? "").replace(/^explain:/, "");
const skillOfRow = (r, ctx) => {
  const u = /^(.+?-s\d+):/.exec(String(r.held?.unit ?? ""))?.[1];
  if (u) return (ctx.o.skill = u);
  const n = /^s(\d+):/.exec(String(r.beat ?? ""))?.[1];
  if (n && ctx.script?.skills?.[+n - 1]) return (ctx.o.skill = ctx.script.skills[+n - 1].skillId);
  return ctx.o.skill ?? null;
};
const skillById = (ctx, id) => (ctx.script?.skills ?? []).find((s) => s.skillId === id) ?? null;
/** The walk's beat at the end of a turn as a part beat ("s1:explain:e3" → e3, "s1:worked:worked:problem" → worked:problem). */
const liveBeatOf = (r) => { const b = String(r.beat ?? ""); const m = /^s\d+:(?:explain:(e\d+)|worked:(worked:(?:problem|step\d+))|remediation:(rem:.+))$/.exec(b); return m ? m[1] ?? m[2] ?? m[3] : null; };
const SAYS_CLARIFY_C = /(?<![\p{L}])(?:samajh\s+nahi|samjha\s+nahi|samjhi\s+nahi|didn'?t\s+understand|don'?t\s+understand|kya\s+matlab)(?![\p{L}])/iu;
const FIGURE = /(?<![\p{L}])(?:square|rectangle|triangle|circle|hexagon|varg|aayat|tribhuj|vritt|patti|pattiyaan|rekha|line|bar|pizza|roti|cake|board|chitra|shape|aakaar|kinaara|bhuja|bhujayein|dekho|look)(?![\p{L}])/iu;
const remAll = (ctx) => (ctx.o.remAll ??= (ctx.script?.skills ?? []).flatMap((sk) => (sk.remediation ?? []).flatMap((m) => [m.say, m.simpler]
  .flatMap((v) => (typeof v === "string" ? [v] : [v?.hi, v?.en])).filter(Boolean).flatMap(sentencesOf).map(key).filter((k) => k.split(" ").length >= 5)
  .map((k) => ({ k, skill: sk.skillId, targets: m.targets })))));
const remSentences = (ctx) => (ctx.o.rem ??= remAll(ctx).filter((x) => !nonRemText(ctx).includes(` ${x.k} `)));
const nonRemText = (ctx) => (ctx.o.nonRemT ??= ` ${[...nonRemKeys(ctx)].join(" | ")} `);
/** Every sentence key of the script's other spoken text (points, simplers, cards, whys, worked): a sentence a remediation shares with
 *  one is no sign of the remediation. */
const nonRemKeys = (ctx) => (ctx.o.nonRem ??= (() => {
  const out = new Set();
  const walk = (o, inRem) => { if (typeof o === "string") { if (!inRem) for (const x of sentencesOf(o)) out.add(key(x)); return; }
    if (Array.isArray(o)) return o.forEach((x) => walk(x, inRem));
    if (o && typeof o === "object") for (const [k, v] of Object.entries(o)) walk(v, inRem || k === "remediation"); };
  walk(ctx.script ?? {}, false);
  return out;
})());

export const ORDER_LAWS = {
  /** O1: a unit's parts are said in order and none is skipped — a card never before its point, a step never before its problem (or the
   *  step before it), the child's own step never before the problem, a then-card never before its remediation, a point never after a
   *  later point of its skill when it was not said. */
  orderParts(L, r, i, ctx) {
    const sk = skillOfRow(r, ctx);
    if (!sk) return null;
    const said = ctx.o.said, has = (b) => said.has(`${sk}|${b}`) || ctx.o.reported.has(`${sk}|${b}`);
    const ex = (skillById(ctx, sk)?.explain ?? []).map((e) => e.id);
    let why = null;
    const mine = new Set();
    for (const p of r.pageParts ?? []) {
      const b = beatOfPart(p), seen = (x) => has(x) || mine.has(x);
      if (!why && p.part === "card" && /^e\d+$/.test(b) && !seen(b)) why = `the card of ${b} before its point`;
      if (!why && p.part !== "close" && /^worked:step(\d+)$/.test(b)) { const n = +b.slice(11); if (!seen("worked:problem")) why = `${b} before the worked problem`; else if (n > 1 && !seen(`worked:step${n - 1}`)) why = `${b} before worked:step${n - 1}`; }
      if (!why && p.part === "card" && b === "worked" && !seen("worked:problem")) why = "the child's own step before the worked problem";
      if (!why && p.part === "card" && /^then:/.test(b) && !seen(`rem:${b.slice(5)}`)) why = `the then-card of ${b.slice(5)} before its remediation`;
      if (!why && TEACH.has(p.part) && /^e\d+$/.test(b)) { const k = ex.indexOf(b); const skipped = ex.slice(0, Math.max(0, k)).find((x) => !seen(x)); if (skipped) why = `${skipped} skipped: ${b} said with ${skipped} never said`; }
      if (TEACH.has(p.part) || (p.part === "body" && b)) mine.add(b);
    }
    for (const b of mine) said.add(`${sk}|${b}`);
    // (each missing part once: the skipped part counts as reported, the turns after it are not flagged for it again)
    if (why) { const m = /^(?:the card of (e\d+)|(worked:step\d+) before (?:the worked problem|(worked:step\d+))|the child's own step|the then-card of (.+) before|(e\d+) skipped)/.exec(why);
      const miss = !m ? null : m[1] ?? (m[2] ? (m[3] ?? "worked:problem") : null) ?? (m[4] ? `rem:${m[4]}` : null) ?? m[5] ?? (/child's own step/.test(why) ? "worked:problem" : null);
      if (miss) ctx.o.reported.add(`${sk}|${miss}`); }
    return why;
  },
  /** O2: a return, an AI line or a request reply never takes a part's place — the part the walk is on at the end of that turn, unsaid in
   *  it, is said in the next turn of hers. */
  orderDisplaced(L, r, i, ctx) {
    const sk = skillOfRow(r, ctx);
    let why = null;
    const pend = ctx.o.pend;
    if (pend) {
      const said = (r.pageParts ?? []).some((p) => TEACH.has(p.part) && beatOfPart(p) === pend.beat);
      if (!said && !ctx.o.said.has(`${pend.sk}|${pend.beat}`)) why = `${pend.beat} displaced at row ${pend.row} by ${pend.by}, not said here`;
      ctx.o.pend = null;
    }
    const live = liveBeatOf(r);
    if (live && sk && !ctx.o.said.has(`${sk}|${live}`) && !(r.pageParts ?? []).some((p) => TEACH.has(p.part) && beatOfPart(p) === live)) {
      const by = returnOf(r, ctx) ? "a return" : AI_LINE.test(String(r.text ?? "")) ? "the AI line" : /·/.test(ctx.prevRead ?? "") ? `a request reply (${String(ctx.prevRead).split("·")[1].trim()})` : null;
      if (by) ctx.o.pend = { beat: live, sk, row: i, by };
    }
    return why;
  },
  /** O3: a remediation is said only after the wrong answer that shows its misconception (or as the live part, re-said), on its own
   *  then-card's board — never as help after a give-up, a clarify or a plain miss. */
  orderRemediation(L, r, i, ctx) {
    const T = ` ${key(r.text)} `;
    const hit = remSentences(ctx).find((x) => T.includes(` ${x.k} `));
    // (the remediation is the live part when her turn before said any of it: its simpler on a clarify of it is the cell's)
    const prevHad = hit && ctx.prevT && remAll(ctx).some((x) => x.targets === hit.targets && ` ${key(ctx.prevT.text)} `.includes(` ${x.k} `));
    const out = hit && !ctx.prevCls?.startsWith("misconception") && !prevHad ? `a remediation (${hit.targets}) said after "${ctx.prevRead}", not its misconception` : null;
    if (out) return out;
    if (hit && !prevHad) {
      const card = (r.pageParts ?? []).find((p) => p.part === "card");
      if (card && beatOfPart(card) !== `then:${hit.targets}`) return `a remediation (${hit.targets}) said over another card (${beatOfPart(card)})`;
    }
    return null;
  },
  /** O4: a picture, Hindi, repeat or clarify request stays on the part it was asked about (the parts of her turn before it): none moves
   *  the lesson on, none changes the unit. */
  orderStays(L, r, i, ctx) {
    const rq = /·\s*(visual|language|repeat|another|clarify|confused|which)/.exec(ctx.prevRead ?? "")?.[1] ?? (SAYS_CLARIFY_C.test(ctx.prevChild ?? "") ? "clarify" : null);
    if (!rq || !ctx.prevT) return null;
    // (one unit: a remediation and its then-card; the worked problem, its steps and the child's own step)
    const unitOf = (b) => (/^worked/.test(b) ? "worked" : /^(?:rem|then):/.test(b) ? `rem:${b.replace(/^(?:rem|then):/, "")}` : b);
    const asked = new Set([...(ctx.prevT.pageParts ?? []).map(beatOfPart), liveBeatOf(ctx.prevT)].filter(Boolean).map(unitOf));
    const moved = (r.pageParts ?? []).find((p) => p.part !== "close" && p.part !== "bridge" && beatOfPart(p) && !asked.has(unitOf(beatOfPart(p))));
    return moved ? `a ${rq} request moved from ${[...asked].join("/") || "?"} to ${unitOf(beatOfPart(moved))}` : null;
  },
  /** O5: a turn with no unit (the teach-back, the wrap, the goodbye, the break) says nothing about a figure, and no board of another unit
   *  is up while it does. */
  orderNoUnit(L, r) {
    const noUnit = !!r.held?.intent?.noUnit || (r.beat == null && /^(?:teachback|wrap|break)$/.test(String(r.move ?? "")));
    if (!noUnit) return null;
    // (the break's offer to go on leaves the lesson's board where it was; its words still name no figure)
    const up = String(r.move) !== "break" && (r.boardUp === true || (!!r.held?.unit && r.held?.drawn === "kept" && r.held?.kept));
    const fig = FIGURE.exec(String(r.text ?? ""))?.[0];
    return up || fig ? `${r.move} turn${up ? ` over ${r.held?.unit ?? "another unit"}'s board` : ""}${fig ? ` names a figure ("${fig}")` : ""}` : null;
  },
  /** O6: the first miss on a card — a wrong answer or a give-up — never gets the key (a clarify spends no help). */
  orderFirstMiss(L, r, i, ctx) {
    const c = ctx.prevT?.card ? low(ctx.prevT.card).slice(0, 60) : null;
    const miss = ["incorrect", "partial", "misconception"].includes(ctx.prevCls) || (ctx.prevCls === "no_evidence" && !/·/.test(ctx.prevRead ?? "") && GIVE_UP_ANY.test(ctx.prevChild ?? ""));
    if (!c || !miss) return null;
    const n = (ctx.o.misses[c] = (ctx.o.misses[c] ?? 0) + 1);
    return n === 1 && KEY_SAID.test(String(r.text ?? "")) ? `the key on the first miss ("${ctx.prevChild}")` : null;
  },
  /** O7: her answer to the child's question about her comes first in its turn (the AI line before any teaching). */
  orderAnswerFirst(L, r) {
    const t = String(r.text ?? ""), at = t.search(AI_LINE);
    if (at <= 0) return null;
    const before = sentencesOf(t.slice(0, at)).length;
    return before ? `the AI line after ${before} sentence${before > 1 ? "s" : ""} of hers` : null;
  },
};
Object.assign(PREDICATES, ORDER_LAWS);

// (each law leaves this set in the commit that fixes it: O1 and O2 — the return's held part said whole, on its own board)
export const PENDING = new Set(["twinsData", ...Object.keys(ORDER_LAWS).filter((k) => !["orderParts", "orderDisplaced"].includes(k))]);

/** The flags of one dry lesson: [{ row, predicate, why, text }]. */
export function lessonFlags({ rows, script }) {
  const heads = {};
  // (each form is recognised by its longest stretch with no slot in it)
  for (const [kind, forms] of Object.entries(script?.joints ?? {})) heads[kind] = (forms ?? []).map((f) => String(f?.hi ?? f ?? "").split(/\{\w+\}/).map((x) => low(x).replace(/^[\s,.:;!?]+|[\s,.:;!?]+$/g, "")).sort((a, b) => b.length - a.length)[0]?.slice(0, 32) ?? "").map((h) => (h.length >= 8 ? h : null));
  const workedBy = new Map((script?.skills ?? []).map((sk, n) => [`s${n + 1}`, sk.workedExample ?? null]));
  const forms = (k) => (script?.joints?.[k] ?? []).flatMap((f) => [f?.hi ?? f, f?.en]).filter((x) => typeof x === "string" && x.includes("{aside}")).map(formRe);
  const ctx = { o: { said: new Set(), reported: new Set(), pend: null, misses: {}, skill: null }, script, parkRes: forms("asidePark"), retRes: forms("asideReturn"), prevT: null, prevChild: "", prevCls: null, saidCards: new Set(), jointUse: {}, jointHeads: heads, problemSaid: new Set(), returnDue: false, cardTurns: {},
    workedOf: (r) => workedBy.get(String(r.beat ?? "").split(":")[0]) ?? null };
  const out = [];
  rows.forEach((r, i) => {
    if (r.who !== "teacher") { ctx.prevChild = r.text ?? ""; ctx.prevRead = String(r.read ?? ""); ctx.prevCls = ctx.prevRead.split(" ")[0]; return; }
    ctx.returnDue = !!r.returnSaid;
    for (const [name, f] of Object.entries(PREDICATES)) { const why = f({ rows }, r, i, ctx); if (why) out.push({ row: i, predicate: name, why, text: norm(r.text).slice(0, 140) }); }
    if (cardIn(r)) ctx.saidCards.add(low(r.card).slice(0, 40));
    if (r.check?.itemId) ctx.cardTurns[r.check.itemId] = (ctx.cardTurns[r.check.itemId] ?? 0) + 1;
    ctx.prevPrevT = ctx.prevT;
    ctx.prevT = r;
  });
  return out;
}

/** Counts per predicate over a whole matrix: { predicate: n }. */
export function matrixCounts(lessons) {
  const c = Object.fromEntries(Object.keys(PREDICATES).map((k) => [k, 0]));
  for (const L of lessons) for (const f of lessonFlags(L)) c[f.predicate]++;
  return c;
}
