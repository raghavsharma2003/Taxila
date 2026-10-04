// Relational signal predicates over the child's words (RELATIONAL-OS §4.3; BUILD-PLAN W2-I #2). PURE, ≤ 1 ms, no network.
// Bilingual: English, Roman Hinglish and Devanagari (lexicon/**), matched in safety.js normForMatch form (\p{M} kept,
// nukta and chandrabindu folded), letter-bounded, with three exclusions a keyword list cannot make:
//   - NEGATION: "I don't love maths", "main tumhari dost nahi" — a negator right before the hit turns a warmth, romance,
//     permanence or feelings hit off (contact, secret, harm and goodbye are never switched off by a negation: "don't tell
//     mummy" IS the secret ask);
//   - QUOTATION / REPORTED SPEECH: "my friend said I love you", "bhaiya bolte hain photo bhejo" — reported words are not
//     the child's own offer; for contact and secret asks they are the opposite: a THIRD PARTY asking is the F6 grooming
//     branch (thirdParty: true), never a boundary moment;
//   - HYPOTHETICAL / META: "what if I said…", "agar main bolun…" read as reported.
// What a signal never is: an emotion label. The child's voice is never classified (Microsoft AI Code of Conduct;
// ct-no-voice-emotion-inference): every signal here is lexical, from words the child chose to say.
import { normForMatch, scanSafety } from "../director/safety.js";
import { LEXICON } from "./lexicon/index.js";

const LEX = Object.entries(LEXICON);

/** Kinds a negator right before the hit switches off. */
const NEGATABLE = new Set(["warmth_offer", "romance", "permanence_ask", "feelings_q", "loneliness", "self_label", "tired", "share", "share_sad", "night_ask"]);
/** Kinds a reported-speech frame switches off (the child is quoting someone, not offering it). */
const REPORTABLE = new Set(["warmth_offer", "romance", "permanence_ask", "feelings_q", "self_label", "goodbye", "end_request", "identity_q", "joke"]);
/** Kinds where a third party's ask is the danger itself (F4 → F6). */
const THIRD_PARTY_KINDS = new Set(["contact_ask", "secret_ask"]);

const NEG = /(?:^|\s)(?:not|no|never|don'?t|dont|doesn'?t|didn'?t|won'?t|isn'?t|aren'?t|nahi|nahin|nai|nhi|mat|na|नहीं|मत|ना)$/u;
/** A reporting frame: someone else said / asked / wants it ("he said", "bhaiya bolte hain", "woh kehta hai", "usne kaha"). */
const REPORT = /(?:^|\s)(?:said|says|say|told|tells|asked|asks|asking|wants|wanted|messaged|texted|bola|boli|bole|bolta|bolti|bolte|kaha|kehta|kehti|kehte|keh rahe|keh raha|keh rahi|bol rahe|bol raha|bol rahi|maanga|maangta|maangte|maang raha|maang rahe|बोला|बोले|बोलते|कहा|कहते|कहता|मांगा|मांगते)(?:\s+(?:hai|hain|ki|that|me|mujhse|mujhe|to me|ke|है|हैं|कि))*(?:\s|$)/u;
const HYPO = /(?:what if i (?:said|say|told)|if i (?:said|say|told) you|agar (?:main|mai) (?:bolun|kahun|bol doon|bol du|bolu)|suppose)(?:\s|$)/u;
/** Who the third party is: an actor other than the child or the teacher. */
const ACTOR = /(?:^|\s)(?:bhaiya|bhaiyya|uncle|aunty|auntie|stranger|someone|somebody|a man|a boy|a girl|a guy|online|game wale|game wala|game mein|koi|unknown|anjaan|anjan|insta wale|he|she|they|woh|wo|vo|usne|unhone|ek admi|ek aadmi|ladka|ladki|friend ka|भैया|अंकल|कोई|उसने|वो)(?:\s|$)/u;
/** A short break is a break, never a goodbye or an end ("I need to go to the toilet", "paani peeke aati hoon"). */
const SHORT_BREAK = /(?<![\p{L}\p{M}])(?:toilet|bathroom|washroom|loo|pee|potty|susu|paani|pani|water|drink|शौचालय|पानी)(?![\p{L}\p{M}])/iu;
/** A 10-digit Indian mobile number in the child's words (offering their own number is a contact ask). */
const PHONE = /(?<!\d)(?:\+?91[\s-]?)?[6-9]\d(?:[\s-]?\d){8}(?!\d)/;
const LAUGH_EMOJI = /[\u{1F602}\u{1F923}\u{1F606}\u{1F605}\u{1F604}\u{1F601}]/u;
const PERSONAL_DATA = /(?<![\p{L}\p{M}])(?:number|phone|mobile|whatsapp|insta|instagram|snapchat|address|pata|photo|pic|picture|selfie|video|नंबर|फोटो|पता)(?![\p{L}\p{M}])/iu;

/** Clauses of the raw text, quoted spans split out and marked reported. */
function clausesOf(text) {
  const raw = String(text ?? "");
  const out = [];
  const QUOTED = /["“”‘’]([^"“”‘’\n]{2,})["“”‘’]/gu;
  const unquoted = raw.replace(QUOTED, (_, inner) => { out.push({ text: inner, quoted: true }); return " . "; });
  for (const c of unquoted.split(/[.!?।;\n]+/u)) if (c.trim()) out.push({ text: c, quoted: false });
  return out;
}

/**
 * The relational signals in one child turn.
 * @param {string} text the child's words (typed, a chip label, or the final transcript)
 * @param {{ turn?: number, lane?: "L"|"G"|"typed"|"chip", harm?: boolean }} [ctx] harm: false skips the safety predicate when the
 *   caller already ran it (the turn's safety gate: its verdict arrives as the seam input's `safety`)
 * @returns {import("../../shared/relational").RelSignal[]}
 */
export function signalsOf(text, ctx = {}) {
  const turn = Number(ctx.turn) || 0;
  const lane = ctx.lane ?? "typed";
  const raw = String(text ?? "");
  if (!raw.trim()) return [];
  const found = new Map();
  const add = (kind, extra = {}) => {
    const prev = found.get(kind);
    if (!prev) found.set(kind, { kind, turn, lane, confidence: "lexical", ...extra });
    else if (extra.thirdParty) prev.thirdParty = true;
  };
  const whole = normForMatch(raw.replace(/\?/g, " "));
  const anyActor = ACTOR.test(` ${whole} `);
  for (const clause of clausesOf(raw)) {
    const norm = normForMatch(clause.text.replace(/\?/g, " "));
    if (!norm) continue;
    for (const [kind, re] of LEX) {
      re.lastIndex = 0;
      if (!re.test(norm)) continue;                 // most kinds miss: no allocation for them
      re.lastIndex = 0;
      for (let m = re.exec(norm); m; m = re.exec(norm)) {
        if (m[0] === "") { re.lastIndex++; continue; }
        const before = norm.slice(0, m.index).trim();
        const reported = clause.quoted || REPORT.test(` ${before} `) || HYPO.test(`${before} `);
        if (NEGATABLE.has(kind) && NEG.test(before)) continue;
        if (THIRD_PARTY_KINDS.has(kind)) {
          // the child repeating someone else's ask (or an actor asking for their data) is the third-party branch
          const third = reported || (anyActor && REPORT.test(` ${norm} `));
          add(kind, third ? { thirdParty: true } : {});
          break;
        }
        if (reported && REPORTABLE.has(kind)) continue;
        add(kind);
        break;
      }
    }
  }
  // An actor asking the child for personal data, said without the lexicon's verb forms ("ek uncle ne mera number maanga").
  if (!found.has("contact_ask") && anyActor && REPORT.test(` ${whole} `) && PERSONAL_DATA.test(whole)) add("contact_ask", { thirdParty: true });
  if (PHONE.test(raw.replace(/[०-९]/g, (d) => String(d.charCodeAt(0) - 0x0966)))) add("contact_ask");
  if (LAUGH_EMOJI.test(raw)) add("joke");
  // A break is a break: no goodbye, no end request.
  if (SHORT_BREAK.test(raw)) { found.delete("goodbye"); found.delete("end_request"); }
  // Leaving wins over a bare stop ("bas, mummy bula rahi hai, bye" is a goodbye, released at once).
  if (found.has("goodbye")) found.delete("end_request");
  // Harm words are the safety gate's (F6): the same predicate the turn already runs, mirrored as a signal for the policy's
  // precedence (a goodbye after harm words gets the check-in, I-7).
  if (ctx.harm !== false && scanSafety(raw).distress) add("harm");
  // A share that is sad is a sad share (gentle concern, never a helpline on its own).
  if (found.has("share_sad")) found.delete("share");
  // "you are my best friend" is a warmth offer, not a share about their life
  if (found.has("warmth_offer")) found.delete("share");
  return [...found.values()];
}

/** Words in the child's turn (for the session median and withdrawal), Devanagari and Roman alike. */
export const wordCount = (text) => (normForMatch(text).match(/[\p{L}\p{N}][\p{L}\p{M}\p{N}']*/gu) ?? []).length;

/** True when the signals include any of the kinds. */
export const has = (signals, ...kinds) => (signals ?? []).some((s) => kinds.includes(s.kind));

/**
 * The stop protocol's reading of a child turn (OWNER RESET #7; CONVERSATION-V2 §3.5): "leaving" (a true goodbye: released
 * at once), "end_request" (a stop phrase: one warm check-in with choices first; a second stop releases), or null. A short
 * break ("toilet", "paani") is neither. Consumed by W2-C's state.js stop check (server/relational/seam-patches).
 * @param {string} text
 * @returns {"leaving" | "end_request" | null}
 */
export function stopKind(text) {
  const k = new Set(signalsOf(text).map((s) => s.kind));
  return k.has("goodbye") ? "leaving" : k.has("end_request") ? "end_request" : null;
}
