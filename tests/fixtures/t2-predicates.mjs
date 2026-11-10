// dc-r7-script-walk-v6-10 T2/A6/R7 (main's director18 judgement): the predicate that would have caught each failing row, over a teacher
// row as the harness records it ({ text, card, beat }) with the child's line before it and her teacher row before that. Each returns a
// reason string or null. tests/r7-brain-v610.test.mjs runs them on director18's own rows (they flag) and on the live walk (they do not).
const norm = (t) => String(t ?? "").replace(/\s+/g, " ").trim();
const low = (t) => norm(t).toLowerCase();
const sentencesOf = (t) => norm(t).split(/(?<=[.!?।])\s+/).filter(Boolean);
const minusCard = (row) => { const t = norm(row?.text), c = norm(row?.card); return c && t.includes(c) ? norm(t.replace(c, "")) : t; };
const words = (t) => norm(t).split(" ").filter(Boolean).length;
const CHECKIN = /(?:Yahan tak (?:theek|saaf) hai|Ab tak samajh aaya|Yeh hissa saaf hua|Kuch poochna hai ab tak)\?\s*$/;

export const T2 = {
  /** T2.1: "samajh nahi aaya" at the check-in after a point got the card alone, the point not re-said. */
  clarifyAtCheckin(row, child, prevT) {
    if (!/samajh nahi/i.test(child) || !CHECKIN.test(norm(prevT?.text))) return null;
    return row?.card && words(minusCard(row)) < 4 ? "clarify at the check-in after a point posed the card alone" : null;
  },
  /** T2.2: "is sawaal ke baad" said when the child had not heard a card yet. */
  parkNoCard(row, child, prevT) {
    if (!/is sawaal ke baad|after this question|yeh sawaal khatam karke/i.test(row?.text ?? "")) return null;
    const heard = !!prevT?.card && low(prevT.text).includes(low(prevT.card).slice(0, 30));
    return heard ? null : "parked 'is sawaal ke baad' with no card open";
  },
  /** T2.3: a language switch line that promises a change for every turn after. */
  hindiPromise(row) { return /ab se hindi mein|from now on in hindi/i.test(row?.text ?? "") ? "the Hindi switch promised what nothing changes" : null; },
  /** T2.4: on a worked step, the aside's reply said after the step. */
  asideAfterStep(row, child) {
    if (!/pasand|favourite/i.test(child) || !/worked:step/.test(String(row?.beat ?? ""))) return null;
    const i = norm(row.text).search(/Main AI|meri (?:apni )?(?:koi )?pasand/i);
    return i > 0 ? "a worked step taught before the aside was answered" : null;
  },
  /** T2.6: after the aside reply, an acknowledgement and the card alone (the unit's point dropped). */
  resumeDropped(row, child, prevT) {
    if (!/[?？]\s*$/.test(norm(prevT?.text)) || !/(?:Main AI|tumhari .* wali baat|ke baare mein batao)/i.test(prevT?.text ?? "")) return null;
    const rest = sentencesOf(minusCard(row)).filter((x) => !/^(?:theek hai|achha|hmm)[\s,.!]*$/i.test(x) && !/jaankar achha laga|samajh gayi|mazedaar/i.test(x));
    return row?.card && rest.length === 0 ? "after the aside reply the card alone, the unit's point dropped" : null;
  },
  /** T2.7: "maine bata diya" / "ho gaya" after a card just posed got the key. */
  alreadySaidKey(row, child, prevT) {
    if (!/maine bata diya|woh wala ho gaya|already/i.test(child) || !prevT?.card) return null;
    return /(?:is sawaal ka|iska|yahan) (?:sahi )?jawab/i.test(row?.text ?? "") ? "an answer said to be given already got the key" : null;
  },
  /** T2.8: a try-first with no card open got no card. */
  tryFirstNoCard(row, child) { return /khud (?:karti|karta|karungi|karunga|try)|main khud/i.test(child) && !row?.card ? "try-first with no card posed" : null; },
  /** T2.9: the check-in form that a "haan" answers with a question. */
  kuchPoochna(row) { return /Kuch poochna hai ab tak\?|Anything to ask so far\?/i.test(row?.text ?? "") ? "the 'Kuch poochna hai?' check-in form" : null; },
  /** A6: the acknowledgement of an aside reply. */
  asideAck(row) { return /yeh jaankar achha laga|Wah, mazedaar|thanks for telling me/i.test(row?.text ?? "") ? "an aside acknowledgement" : null; },
  /** R7: a give-up stacked with a new point and a new card (more than a key, its why and a card). */
  gaveStacked(row) {
    if (!/(?:is sawaal ka|iska|yahan) (?:sahi )?jawab/i.test(row?.text ?? "")) return null;
    return words(row.text) > 70 ? `a give-up stacked with new teaching (${words(row.text)} words)` : null;
  },
  /** R7: a step opener that names another step, or two openers in one turn, or a line appended after a bridge. */
  openers(row) {
    const b = String(row?.beat ?? "");
    const n = Number(/worked:step(\d+)/.exec(b)?.[1] ?? 0);
    if (n > 1 && /Pehla kadam|First step|shuruaati hissa|Pehle yeh hissa/i.test(row?.text ?? "")) return "a first-step opener on a later step";
    const FRAME = /^(?:Pehla kadam dekho|Iska shuruaati hissa dekhte hain|Pehle yeh hissa|Ab (?:doosra|teesra|agla) kadam(?: dekhte hain)?)\.$/i;
    const ss = sentencesOf(row?.text);
    const fi = ss.findIndex((x) => FRAME.test(x));
    if (fi >= 0 && (ss.slice(fi + 1).some((x) => FRAME.test(x) || /^Ab agla kadam dekhte hain\.$/i.test(x)) || /^(?:ab|phir|pehle)\b/i.test(ss[fi + 1] ?? ""))) return "two step openers in one turn";
    return /Ab aage chalte hain\.\s*$/.test(norm(row?.text)) ? "'Ab aage chalte hain.' appended" : null;
  },
  /** R7: "Toh poora jawab" after a miss; a single word swapped into an English frame in Hindi mode. */
  wording(row, child) {
    if (/Toh poora jawab/i.test(row?.text ?? "") && /^(?:nahi|yeh jawab|abhi yeh|\S+ sahi nahi)/i.test(norm(row.text))) return "'Toh poora jawab' after a miss";
    return /bhuja mein \d/i.test(row?.text ?? "") ? "a single word swapped into an English frame" : null;
  },
};

/** Every predicate over one teacher row. → [reason] */
export function t2Flags(row, child, prevT) {
  return Object.entries(T2).map(([k, f]) => { const r = f(row, String(child ?? ""), prevT ?? null); return r ? `${k}: ${r}` : null; }).filter(Boolean);
}
