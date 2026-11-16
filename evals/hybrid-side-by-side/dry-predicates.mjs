// dc-r7-script-walk-v6-11 G2 (main's director19 judgement): the dry matrix is a gate. These predicates run over every lesson of the
// dry matrix (evals/hybrid-side-by-side.mjs --matrix --director-only --reactive --dry: the 16 pilot lessons, the rule-based child, the
// model stubbed, no network) and name each fault director19 found. tests/r7-dry-matrix.test.mjs runs the matrix inside test:all and
// fails on any flag. Every predicate was seen failing on the tree before its fix (counts in the v6.11 step-1 report). Pure.
//
// A lesson is { topicId, persona, rows } (the harness's director rows), with the topic's lesson script (`script`, for its joints).

import { readFileSync } from "node:fs";
import { asideReplyForms, phraseOf } from "../../server/brain/asideReplies.js";
import { asideTopic } from "../../server/director/state.js";
import { seamJoint } from "../../server/brain/seams.js";

const norm = (t) => String(t ?? "").replace(/\s+/g, " ").trim();
const low = (t) => norm(t).toLowerCase();
const sentencesOf = (t) => norm(t).split(/(?<=[.!?।])\s+(?=\S)/).map((x) => x.trim()).filter(Boolean);
const key3 = (t) => String(t ?? "").toLowerCase().replace(/[^\p{L}\p{N}/ ]+/gu, " ").replace(/\s+/g, " ").trim();
const key = (t) => low(t).replace(/[^\p{L}\p{N}/ ]+/gu, " ").replace(/\s+/g, " ").trim();
const words = (t) => norm(t).split(" ").filter(Boolean).length;
// (S1: a card re-asked by its question alone — its last sentence — is said too)
const cardQ = (c) => sentencesOf(c).at(-1) ?? "";
const cardIn = (r) => !!r?.card && (low(r.text).includes(low(r.card).slice(0, 30)) || (sentencesOf(r.card).length > 1 && low(r.text).endsWith(low(cardQ(r.card)))));

const REPOSE = /^(?:Phir se dekho|Ek baar aur dekho|Ek baar phir dekho|Look again|One more look)\s*:/i;
// (dc-r8-director22 K: a yes-or-no key is said as a sentence — "Nahi, kyunki …" — and is a key said)
const KEY_SAID = /(?:is sawaal ka|iska|yahan|pichhle sawaal ka|woh wala:?) (?:sahi )?jawab|sahi jawab:|the answer (?:here )?(?:is|was)|iska jawab hai|poora jawab:?|the full answer|(?:^|[.!?]\s+)(?:haan|nahi|yes|no), (?:kyunki|because)\b/i;
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
  askAndCard(L, r, i, ctx) {
    if (!cardIn(r)) return null;
    // (2.4 S2: a card's reask is its own question, said alone with its givens named — no second question)
    const reasks = (ctx.o.reasks ??= (() => { const out = []; const walk = (o) => { if (Array.isArray(o)) return o.forEach(walk); if (o && typeof o === "object") { if (o.reask) for (const v of [o.reask.hi, o.reask.en, o.reask]) if (typeof v === "string") out.push(key(v.replace(/\{\w+\}/g, ""))); for (const v of Object.values(o)) walk(v); } }; walk(ctx.script ?? {}); return out; })());
    // (a return asks the child about their aside — "… thoda aur batao" — whether or not it ends in "?")
    if (r.returnSaid) return "an aside return and a card in one turn";
    const card = low(r.card);
    const unframed = (x) => low(x).replace(/^[^:—]{0,40}(?::|—)\s*/, "");
    const isReask = (x) => reasks.some((k) => k.length > 10 && (key(x).includes(k.slice(-30)) || k.includes(key(x).slice(-30))));
    const qs = sentencesOf(r.text).filter((x) => /[?？]\s*$/.test(x) && !card.includes(low(x).slice(0, 25)) && !card.includes(unframed(x).slice(0, 25)) && !CHECKIN.test(x) && !isReask(x));
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
    // (O6, main on director21: a card said twice — re-said for a clarify or a picture — has had no miss; only a miss spends its help)
    const spent = (ctx.prevT.check.misses ?? 0) >= 1;
    if (!spent || r.check?.gave || KEY_SAID.test(r.text)) return null;
    return `a give-up with the help spent (${(ctx.prevT.check.misses ?? 0)} miss, said ${ctx.cardTurns[card] ?? 0}×), answered without the key`;
  },
  /** A clarify at a check-in (after a point, a key or a remediation) answered with the card alone. */
  clarifyCard(L, r, i, ctx) {
    if (!CLARIFY.test(ctx.prevChild) || !ctx.prevT) return null;
    // (C1: after a key the clarify gets its whyAlt once, else the walk goes on — a card may follow)
    if (KEY_SAID.test(ctx.prevT.text) && !cardIn(ctx.prevT)) return null;
    // (a hint that re-asks a live then-card by its question alone is that card, not a remediation's check-in: the row carries the card)
    const atCheckin = CHECKIN.test(norm(ctx.prevT.text)) || (!cardIn(ctx.prevT) && !ctx.prevT.card && /rem:|then:/.test(String(ctx.prevT.beat ?? "")));
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
    // (a {phrase} form: the slot is the child's own answer, in her voice — Brain's phraseOf)
    if (!used) for (const re of F.phrase ?? []) {
      for (let n = 1; n <= Math.min(ss.length, 2) && !used; n++) {
        const head = ss.slice(0, n).join(" "), m = head.match(re);
        if (m && low(m[1]) === low(phraseOf(ctx.prevChild) ?? "\u0000")) used = head;
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
    // (dc-r8-director23 K2: a yes-or-no key is said as the fact — no "jawab hai", no "Haan, kyunki" — the row records it gave the key)
    const keyed = (t) => !!t?.check?.gave || !!t?.keyFact || KEY_SAID.test(t?.text ?? "");
    if (!p || !GIVE_UP_ANY.test(ctx.prevChild) || CLARIFY.test(ctx.prevChild) || cardIn(p) || !CHECKIN.test(norm(p.text))) return null;
    if (/^(?:wrap|safeguard|break)$/.test(String(r.move?.kind ?? r.move ?? ""))) return null;
    // (a second give-up after the key and its why were said again may move on)
    if (KEY_SAID.test(p.text) && ctx.prevPrevT && KEY_SAID.test(ctx.prevPrevT.text) && !cardIn(ctx.prevPrevT)) return null;
    // (after a second clarify on any part its help is spent: the cell's third level moves on — C1, main on director21)
    if (p.clarifyN === 2) return null;
    // (dc-r8-director23 H2: no help says a sentence from her last two turns — the simpler she said on the turn just before is not said
    // again; the card alone follows)
    if ((p.pageParts ?? []).some((x) => x.part === "simpler")) return null;
    // (O4: the requests after a key stay on the closed card; once its key is said and no card has come since, a give-up may move on)
    if (ctx.keyOpenBefore && !keyed(p)) return null;
    if (/worked:(?:step|problem)/.test(String(p.beat ?? ""))) {
      if (ctx.prevPrevT && /worked:(?:step|problem)/.test(String(ctx.prevPrevT.beat ?? "")) && ctx.prevPrevT.beat === p.beat) return null;
      return (r.pageParts ?? []).some((x) => x.part === "simpler" || x.part === "body") && r.beat === p.beat ? null : "a give-up at a worked step's check-in moved on";
    }
    // (C1, main on director21: after a key a give-up gets the why's second wording once, else the walk goes on — never the same why
    // again; repeatedAuthored holds the repeat)
    if (keyed(p)) return null;
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
    // (2.4 S2: the card's re-ask — its question with its givens named — is its question too)
    const reasks = (ctx.o.reasks ??= (() => { const out = []; const walk = (o) => { if (Array.isArray(o)) return o.forEach(walk); if (o && typeof o === "object") { if (o.reask) for (const v of [o.reask.hi, o.reask.en, o.reask]) if (typeof v === "string") out.push(key(v.replace(/\{\w+\}/g, ""))); for (const v of Object.values(o)) walk(v); } }; walk(ctx.script ?? {}); return out; })());
    const reasked = reasks.some((k) => k && key(r.text).includes(k.slice(0, 40)));
    if (!reasked && !low(r.text).includes(low(q).slice(0, 25))) return "a Hindi request on a card: the simpler, then no question";
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
    // (dc-r8-director23 harness: a one-sentence card with an authored reask — c5-t01 steady 10, stuck 14, steering 10 — counts too)
    const hasReask = (() => { let hit = false; const walk = (o) => { if (hit || !o || typeof o !== "object") return; if (Array.isArray(o)) return o.forEach(walk);
      if (o.reask && o.prompt && [o.prompt.hi, o.prompt.en, o.prompt].some((p) => typeof p === "string" && low(p) === c)) { hit = true; return; } for (const v of Object.values(o)) walk(v); }; walk(ctx.script ?? {}); return hit; })();
    // (one-sentence cards count too, main on director23, when a shorter question exists: an authored reask, or a clause after its colon
    // that is a question of its own; a card that is only its question is said as its question)
    const clauseQ = (() => { const c0 = norm(r.card ?? ""); const m = c0.split(/[:;]\s+/).at(-1) ?? ""; return m !== c0 && /[?？]$/.test(m) && m.split(/\s+/).length >= 3; })();
    if (sentencesOf(r.card ?? "").length < 2 && !hasReask && !clauseQ) return null;
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
    // (a second clarify, and anything after one, has had the part's help: C1's cell says the part's own line, then moves on)
    if (!m || r.clarifyN === 2 || p.clarifyN === 2) return null;
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
    const prevHad = hit && ctx.prevT && (remAll(ctx).some((x) => x.targets === hit.targets && ` ${key(ctx.prevT.text)} `.includes(` ${x.k} `))
      // (a remediation and its then-card are one unit — main on director21: its say over its own then-card's board is allowed)
      || [...(ctx.prevT.pageParts ?? []), ...(r.pageParts ?? [])].some((p) => beatOfPart(p) === `then:${hit.targets}`));
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
    // (C1: a clarify after a key, the answer said plainly, may go on — picture, Hindi and repeat stay)
    if (["another", "clarify", "confused"].includes(rq) && KEY_SAID.test(ctx.prevT.text) && !cardIn(ctx.prevT)) return null;
    // (one unit: a remediation and its then-card; the worked problem, its steps and the child's own step)
    const unitOf = (b) => (/^worked/.test(b) ? "worked" : /^(?:rem|then):/.test(b) ? `rem:${b.replace(/^(?:rem|then):/, "")}` : b);
    const asked = new Set([...(ctx.prevT.pageParts ?? []).map(beatOfPart), liveBeatOf(ctx.prevT)].filter(Boolean).map(unitOf));
    // (a turn that teaches nothing — the break offer — is asked about the unit it held)
    if (!asked.size && ctx.prevT.held?.unit) asked.add(unitOf(String(ctx.prevT.held.unit).split(":").pop()));
    const moved = (r.pageParts ?? []).find((p) => p.part !== "close" && p.part !== "bridge" && beatOfPart(p) && !asked.has(unitOf(beatOfPart(p))));
    return moved ? `a ${rq} request moved from ${[...asked].join("/") || "?"} to ${unitOf(beatOfPart(moved))}` : null;
  },
  /** O5: a turn with no unit (the teach-back, the wrap, the goodbye, the break) says nothing about a figure, and no board of another unit
   *  is up while it does. */
  /** dc-r8-director22 R: the reader agrees with what the child meant. The rule-based child writes its intent on its row; the walk's
   *  reading of it (outcome, request, aside reply, flags) must be of the same kind. (Checked on the teacher row that answers it.) */
  readerAgrees(L, r, i, ctx) {
    // (dc-r8-director23 R2: no equivalence table — the child's intent and the column the walk recorded on her next row match by name;
    // the only other pairs allowed are these, each with its reason)
    const want = ctx.prevIntent;
    if (!want) return null;
    const col = r.cell?.column ?? "none";
    if (want === col) return null;
    const ALLOWED = {
      "miss>wrong": "a miss is a wrong answer: the column also says whether it matched a mix-up the card lists",
      "miss>misconception": "a miss is a wrong answer: the column also says whether it matched a mix-up the card lists",
      "yes>none": "a yes asks for nothing: the walk goes on, no column",
      "ack>none": "an acknowledgement asks for nothing: the walk goes on, no column",
      "done>none": "'done' asks for nothing: the walk goes on, no column",
      "reason>none": "her reason after a key or a verdict is heard and not graded: no column",
    };
    return ALLOWED[`${want}>${col}`] ? null : `the child meant ${want}; the walk recorded ${col} ("${String(ctx.prevChild).slice(0, 50)}")`;
  },
  /** Main's 026: no turn says a teach-back's key while the teach-back's question board is up — the key turn shows its answerBoard,
   *  or a cleared board when the script has none. */
  teachbackKeyBoard(L, r, i, ctx) {
    const tb = ctx.script?.teachback;
    const key = tb?.key != null ? String(tb.key).trim() : "";
    if (!key) return null;
    // (the turn that asks the teach-back may name the key among its options: the check starts on the turn after it)
    const q = [tb.prompt?.hi, tb.prompt?.en].filter(Boolean).map((x) => key3(x));
    if (!ctx.o.tbAsked) { if (q.some((x) => x && key3(r.text).includes(x.slice(0, 40)))) ctx.o.tbAsked = true; return null; }
    const esc = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    if (!new RegExp(`(?<![\\p{L}\\p{N}/])${esc}(?![\\p{L}\\p{N}/])`, "iu").test(String(r.text ?? ""))) return null;
    // (director22 T1: read from the pages drawn — the answer board from the first page, or the board cleared)
    // (the page up at the character where the key is said: it must be the answer board's — a switch to it after the key is the fault)
    const H = r.held ?? {};
    const at = String(r.text ?? "").search(new RegExp(`(?<![\\p{L}\\p{N}/])${esc}(?![\\p{L}\\p{N}/])`, "iu"));
    const pages = H.pages ?? [];
    const pageAt = pages.filter((x) => (x.from ?? 0) <= at).length;
    const ok = H.drawn === "cleared" || (pages.length <= 1 ? /teachback:answer$/.test(String(H.unit ?? "")) : pageAt === pages.length);
    return ok ? null : `the teach-back's key ("${key}") said on page ${pageAt} of ${pages.length || 1}, before its answer board (${H.unit ?? "no unit"})`;
  },
  orderNoUnit(L, r, i, ctx) {
    const noUnit = !!r.held?.intent?.noUnit || (r.beat == null && /^(?:teachback|wrap|break)$/.test(String(r.move ?? "")));
    if (!noUnit) return null;
    // (the break's offer to go on leaves the lesson's board where it was; its words still name no figure)
    // (main's 026: the wrap after a teach-back's key is said over its answer board and holds it)
    const up = String(r.move) !== "break" && r.held?.unit !== "end:teachback:answer" && (r.boardUp === true || (!!r.held?.unit && r.held?.drawn === "kept" && r.held?.kept));
    // (main's 026: a wrap that says the teach-back's key with no answerBoard clears the board; the key and its authored why name the
    // teach-back's figure — that sentence is checked by teachbackKeyBoard, the rest of the wrap here)
    const tk = ctx?.script?.teachback?.key != null ? String(ctx.script.teachback.key).trim() : "";
    // (and the script's own wrap — what was covered, the goodbye — names the lesson's ideas, not a figure on the board: it is checked
    // only for pointing at one — "dekho", "look", "board")
    const w = ctx?.script?.wrap;
    const authored = String(r.move) === "wrap" && w ? [w.covered?.hi, w.covered?.en, w.goodbye?.hi, w.goodbye?.en, ...(ctx.script.skills ?? []).flatMap((k) => [k.covered?.hi, k.covered?.en])].filter(Boolean).flatMap((x) => sentencesOf(x)).map((x) => low(x)) : [];
    const said = String(r.move) === "wrap" ? sentencesOf(String(r.text ?? "")).filter((x) => !(tk && x.includes(tk)))
      .filter((x) => !authored.includes(low(x)) || /(?<![\p{L}])(?:dekho|look|board)(?![\p{L}])/iu.test(x)).join(" ") : String(r.text ?? "");
    const fig = FIGURE.exec(said)?.[0];
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
  /** R2 (main on director21 c4 offtopic 38, c5-t02 stuck 46, 48: her aside reply said again on a later turn): a reply of Learning's
   *  library — a word, plain or sad form — is said once; the same reply sentence in any of her next six turns is a re-render. */
  asideReplyOnce(L, r, i, ctx) {
    // (a form may be two sentences, "Hmm, {word}. Samajh gayi.": each is found whole in the turn, its slot filled; a re-render picks the
    // next form in rotation, so the fault is a reply on a turn that does not follow her question — a return's or the AI line's)
    const F = (ctx.o.replyF ??= (() => { const f = asideReplyForms(); return [...f.word, ...(f.phrase ?? [])].map((re) => new RegExp(re.source.replace(/^\^/, "").replace(/\$$/, ""), "iu")); })());
    const hit = F.map((re) => norm(r.text).match(re)?.[0]).find(Boolean);
    if (!hit || !ctx.prevT) return null;
    const asked = returnOf(ctx.prevT, ctx) || AI_LINE.test(String(ctx.prevT.text ?? "")) || /[?？]\s*$/.test(norm(ctx.prevT.text)) && !cardIn(ctx.prevT) && /·\s*uptake/.test(ctx.prevRead ?? "");
    return asked ? null : `her aside reply on a turn after no question of hers about it: "${hit.slice(0, 60)}"`;
  },
  /** dc-r8-director23 S (rewritten on the seam pass's record): a seam into a return to an earlier card has its joint — backTo, or the one
   *  joint the seam already took out of an aside reply or a try-first — and backTo is said at no other seam. Reads `seams` only. */
  backToJoint(L, r) {
    for (const s of r.seams ?? []) {
      if (s.right === "returnCard" && !s.joint && seamJoint(s.left, s.right)) return `a return to an earlier card after ${s.left}, no joint`;
      if (s.joint === "backTo" && s.right !== "returnCard") return `backTo at ${s.left} → ${s.right}, no return`;
    }
    return null;
  },
  /** dc-r8-director22 K: a key is said once — never the same key in two of her turns running (only its opener changed). */
  keyOnce(L, r, i, ctx) {
    const keyOf = (t) => { const x = String(t ?? ""); const m = /(?:jawab(?: hai)?:?|answer (?:here )?(?:is|was))\s+([^,.;]+)/i.exec(x) ?? /(?:^|[.!?]\s+)(haan|nahi|yes|no), (?:kyunki|because)\b/i.exec(x); return m ? m[1].trim().toLowerCase() : null; };
    const k = keyOf(r.text), p = ctx.prevT ? keyOf(ctx.prevT.text) : null;
    return k && p && k === p ? `the key "${k}" said in two turns running` : null;
  },
  /** dc-r8-director22 H: a Hindi request gets words she did not say in her last two turns — the part's second wording or an unspent
   *  simpler; every teaching sentence of the turn (four words or more, the card aside) said already is the fault. */
  hindiNewWords(L, r, i, ctx) {
    if (!/·\s*language/.test(ctx.prevRead ?? "")) return null;
    const last2 = (ctx.o.teacherTexts ?? []).slice(-2).map(key).join(" | ");
    const card = key(r.card ?? "");
    const ss = sentencesOf(r.text ?? "").map(key).filter((x) => x.split(" ").length >= 4 && !(card && card.includes(x)) && !/hindi mein/.test(x));
    // (dc-r8-director23 harness, c4 stuck 10: the switch line and the card only — no new words at all — is the fault too)
    if (!ss.length) return "a Hindi request answered with no new words (the switch line and the card only)";
    return ss.every((x) => last2.includes(x)) ? `a Hindi request answered with her last two turns' words: "${ss[0].slice(0, 60)}"` : null;
  },
  /** dc-r8-director23 S (on the seam pass's record): a miss verdict and its remediation always have their joint. Reads `seams` only. */
  missRemediationJoint(L, r) {
    const s = (r.seams ?? []).find((x) => x.left === "missVerdict" && x.right === "remediation");
    return s && s.joint !== "beforeRemediation" ? "a miss verdict into its remediation with no joint" : null;
  },
  /** dc-r8-director23 S: every seam the table says takes a joint has one (when the script has its forms), and no seam the table says
   *  takes none has one; the joint's form is in the line, said once. Reads `seams` only. */
  seamJoints(L, r, i, ctx) {
    if (r.who !== "teacher" || !String(r.text ?? "").trim()) return null;
    // (the lesson's opening is the agent's first line, before any turn of the walk)
    if (!Array.isArray(r.seams) && !ctx.prevT) return null;
    if (!Array.isArray(r.seams)) return ctx.o.noSeamsReported ? null : ((ctx.o.noSeamsReported = true), "a turn with no seams record");
    const t = norm(r.text);
    for (const s of r.seams) {
      const want = seamJoint(s.left, s.right);
      const forms = want ? (ctx.script?.joints?.[want] ?? []).length : 0;
      if (want && forms && !s.joint && !r.seams.some((x) => x !== s && x.joint === want)) return `${s.left} → ${s.right} takes ${want}, none said`;
      if (s.joint && s.joint !== want) return `${s.joint} at ${s.left} → ${s.right}, which takes none`;
      if (s.form && t.split(s.form).length - 1 !== 1) return `the ${s.joint} form is not in the line once: "${s.form}"`;
    }
    return null;
  },
  /** Main on director21 (c4 steering 66, c5-t02 offtopic 72): the screen's controls are never named aloud ("Buttons: aage badhein"). */
  uiWords(L, r) {
    return /(?<![\p{L}])buttons?(?![\p{L}])/iu.test(String(r.text ?? "")) ? "the buttons named aloud" : null;
  },
  /** D (main on director21, 24 rows; c6 steady 115 jumped back on one): the child's reply to her return question or to her AI-line question
   *  has its own column — never read as an answer, a repeat or a misconception. Read on the child row after such a turn of hers. */
  readerAsideColumn(L, r, i, ctx) {
    const p = ctx.prevT;
    if (!p) return null;
    const asked = (returnOf(p, ctx) || AI_LINE.test(String(p.text ?? ""))) && /[?？]\s*$/.test(norm(p.text)) && !cardIn(p);
    if (!asked) return null;
    const rd = String(ctx.prevRead ?? "");
    return /^(?:correct|incorrect|partial|misconception)\b|·\s*repeat/.test(rd) ? `her question's answer read as "${rd}" ("${ctx.prevChild}")` : null;
  },
  /** C1 (main on director21: "the same why said three turns running"): no authored sentence of six words or more is said in two turns
   *  of hers running — except the card the child is asked again. */
  repeatedAuthored(L, r, i, ctx) {
    if (!ctx.prevT) return null;
    const prev = ` ${key(ctx.prevT.text)} `;
    const strs = (ctx.o.allStr ??= (() => { const out = new Set(); const walk = (o) => { if (typeof o === "string") { for (const x of sentencesOf(o)) out.add(key(x)); return; }
      if (Array.isArray(o)) return o.forEach(walk); if (o && typeof o === "object") for (const [k, v] of Object.entries(o)) if (!["id", "key", "accept", "targets", "board", "answerBoard", "params", "template", "ladder", "notes"].includes(k)) walk(v); };
      walk(ctx.script ?? {}); return [...out].filter((k) => k.split(" ").length >= 6 && !/\{/.test(k)); })());
    // (main's 030: no longer exempts the card — dc-r8-director22 W, a card is not said again within two turns unless she was asked for it)
    if (/·\s*(?:repeat|which)/.test(String(ctx.prevRead ?? ""))) return null;
    // (a card's question said again after new help in the same turn is the help's ask; its set-up said again, or the question with
    // nothing new before it, is a repeat)
    const qs = r.card ? sentencesOf(String(r.card)).filter((x) => /[?？]\s*$/.test(x)).map((x) => key(x)) : [];
    const fresh = sentencesOf(String(r.text ?? "")).some((x) => key(x).split(" ").length >= 4 && !prev.includes(` ${key(x)} `) && !qs.some((q) => q.includes(key(x)) || key(x).includes(q)));
    const hit = strs.find((k) => ` ${key(r.text)} `.includes(` ${k} `) && prev.includes(` ${k} `) && !(fresh && qs.some((q) => q.includes(k))));
    return hit ? `said in two turns running: "${hit.slice(0, 60)}"` : null;
  },
  /** O7: her answer to the child's question about her comes first in its turn (the AI line before any teaching). */
  orderAnswerFirst(L, r) {
    const t = String(r.text ?? ""), at = t.search(AI_LINE);
    if (at <= 0) return null;
    // (complete sentences only: "Meri apni pasand nahi hoti, main AI hoon." is one sentence, its AI words in it)
    const before = sentencesOf(t.slice(0, at)).filter((x) => /[.!?।]$/.test(x)).length;
    return before ? `the AI line after ${before} sentence${before > 1 ? "s" : ""} of hers` : null;
  },
};
Object.assign(PREDICATES, ORDER_LAWS);

/** dc-r8-director23 R2: the column is what the walk acted on this turn — an answer column (right, wrong, misconception) only on a line the
 *  walk read as that answer (director23: 11 give-ups and clarifies after a key's check-in recorded as "misconception"). Gated. */
PREDICATES.columnOfRead = (L, r, i, ctx) => {
  const col = r.cell?.column, out = String(ctx.prevRead ?? "").split(" ")[0];
  const want = { right: ["correct"], wrong: ["incorrect", "partial"], misconception: ["misconception"] }[col];
  return want && ctx.prevRead != null && !want.includes(out) ? `column ${col} on a line read "${ctx.prevRead}"` : null;
};
/** dc-r8-director23 H2: no help says a sentence from her last two turns — on a turn answering a clarify, a give-up or a Hindi request,
 *  a teaching sentence of five words or more (the card's own question and a check-in aside) already said in her last two turns. Gated. */
PREDICATES.helpRepeats = (L, r, i, ctx) => {
  if (!["clarify", "give_up", "hindi"].includes(String(r.cell?.column ?? ""))) return null;
  const last2 = (ctx.o.teacherTexts ?? []).slice(-2).map(key).join(" | ");
  const card = key(r.card ?? "");
  // (the card's question — its reask included — closes a card turn: it is the card, not help)
  const ss = sentencesOf(r.text ?? "");
  const q = r.card && /[?？]\s*$/.test(ss.at(-1) ?? "") ? key(ss.at(-1)) : null;
  const hit = ss.map(key).find((x) => x.split(" ").length >= 5 && x !== q && !(card && card.includes(x)) && !CHECKIN.test(x) && last2.includes(x));
  return hit ? `help says her last two turns' sentence again: "${hit.slice(0, 60)}"` : null;
};
/** Main's 031 T2: the turn that poses the teach-back holds one of the script's teachback.leadIn forms, before its question. Gated. */
PREDICATES.teachbackLeadIn = (L, r, i, ctx) => {
  const tb = ctx.script?.teachback;
  const leads = (tb?.leadIn ?? []).flatMap((f) => [f?.hi, f?.en]).filter(Boolean).map((x) => key3(x).slice(0, 30)).filter(Boolean);
  if (!leads.length || ctx.o.tbPosed) return null;
  const t = key3(r.text), q = [tb.prompt?.hi, tb.prompt?.en].filter(Boolean).map((x) => key3(x).slice(0, 40)).find((x) => x && t.includes(x));
  if (!q) return null;
  ctx.o.tbPosed = true;
  const at = t.indexOf(q), n = leads.filter((l) => { const k = t.indexOf(l); return k >= 0 && k < at; }).length;
  return n === 1 ? null : `the teach-back posed with ${n} lead-in forms before it`;
};
/** Main's 031 T5: the wrap says the covered sentence of no skill the lesson did not reach. Gated. */
PREDICATES.coveredReached = (L, r, i, ctx) => {
  if (String(r.move) !== "wrap") return null;
  const reached = new Set(L.rows.slice(0, i).map((x) => /^s(\d+):/.exec(String(x.beat ?? ""))?.[1]).filter(Boolean).map(Number));
  const t = key3(r.text);
  const bad = (ctx.script?.skills ?? []).map((k, n) => ({ n: n + 1, c: [k.covered?.hi, k.covered?.en].filter(Boolean).map((x) => key3(x).slice(0, 40)) }))
    .filter(({ n, c }) => !reached.has(n) && c.some((x) => x && t.includes(x))).map(({ n }) => `s${n}`);
  return bad.length ? `the covered sentence of ${bad.join(", ")}, not reached` : null;
};

/** Main on director22 (10 of the run's 13 contradictions; the dry run showed all 10 and no predicate counted them): a picture
 *  request draws a view (the seam's `held.picture.view`), and she never tells the child a picture cannot be made. Gated. */
PREDICATES.pictureDrawn = (L, r) => {
  const p = r.held?.picture;
  if (p && !p.view) return "a picture was asked for and no view was drawn";
  return /tasveer\s+(?:abhi\s+)?nahi\s+ban|alag\s+chitra\s+abhi\s+nahi/i.test(String(r.text ?? "")) ? "she says a picture cannot be made" : null;
};

// (each law leaves this set in the commit that fixes it: O1 and O2 — the return's held part said whole, on its own board)
export const PENDING = new Set(["twinsData", "repeatedAuthored", ...Object.keys(ORDER_LAWS).filter((k) => !["orderParts", "orderDisplaced", "orderRemediation", "orderStays", "orderFirstMiss", "orderAnswerFirst", "orderNoUnit", "asideReplyOnce", "backToJoint", "uiWords", "readerAsideColumn", "teachbackKeyBoard", "readerAgrees", "missRemediationJoint", "hindiNewWords", "keyOnce", "teachbackLeadIn", "coveredReached", "seamJoints", "columnOfRead", "helpRepeats"].includes(k))]);

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
    if (r.who !== "teacher") { ctx.prevChild = r.text ?? ""; ctx.prevRead = String(r.read ?? ""); ctx.prevCls = ctx.prevRead.split(" ")[0]; ctx.prevIntent = r.intent ?? null; ctx.prevFlags = r.readFlags ?? []; return; }
    ctx.returnDue = !!r.returnSaid;
    ctx.keyOpenBefore = ctx.keyOpen;
    for (const [name, f] of Object.entries(PREDICATES)) { const why = f({ rows }, r, i, ctx); if (why) out.push({ row: i, predicate: name, why, text: norm(r.text).slice(0, 140) }); }
    if (cardIn(r)) ctx.saidCards.add(low(r.card).slice(0, 40));
    ctx.keyOpen = cardIn(r) ? false : KEY_SAID.test(String(r.text ?? "")) || !!r.keyFact || !!ctx.keyOpen;
    if (r.check?.itemId) ctx.cardTurns[r.check.itemId] = (ctx.cardTurns[r.check.itemId] ?? 0) + 1;
    (ctx.o.teacherTexts ??= []).push(r.text ?? "");
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
