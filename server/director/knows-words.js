// Round 8 (dc-r8-one-reader-with-because): the parent's "why" lines for a lesson, from the `because` records knows.js wrote
// (and the trace kept). PURE. Plain words, Hinglish or English by the parent's language; at least two shapes per choice,
// picked by a seed so one parent does not read the same sentence every day (law: sentence-shaped text gets recited; these
// are shapes with slots, never one fixed line). No internal id ever reaches the text: a skill, topic or mix-up with no
// title given is named generically. The child's gender is unknown here, so Hinglish lines use forms that do not mark it
// (ne … kiya, -na, nouns), and English lines use the name or "they". No line blames ("she failed") or names a diagnosis:
// each says what was done and the fact behind it.

const pick = (shapes, seed) => shapes[Math.abs(seed) % shapes.length];
const hash = (s) => { let h = 2166136261; for (const c of String(s)) { h ^= c.codePointAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };
const said = (x, en) => (x == null ? null : typeof x === "string" ? x : en ? x.en ?? x.hi ?? null : x.hi ?? x.en ?? null);
const cap = (t) => (t ? t[0].toUpperCase() + t.slice(1) : t);

/**
 * @param {{ choice: string, on: string, fact: object }} rec
 * @param {{ lang?: string, name?: string, seed?: number|string,
 *   skills?: Record<string, string|{hi?: string, en?: string}>, topics?: Record<string, string|{hi?: string, en?: string}>,
 *   mixups?: Record<string, string|{hi?: string, en?: string}>, interests?: Record<string, string> }} ctx
 *   lang: the parent's language ("english" → English; anything else → Hinglish). skills/topics/mixups: plain titles by id.
 * @returns {string|null}  null for a record this page does not explain
 */
export function becauseLine(rec, ctx = {}) {
  if (String(rec?.kind ?? "").startsWith("play.")) return playLine(rec, ctx);
  const en = String(ctx.lang ?? "").toLowerCase().startsWith("en");
  const name = String(ctx.name ?? "").trim() || (en ? "Your child" : "Aapke bachche");
  const f = rec?.fact ?? {};
  const seed = hash(`${ctx.seed ?? 0}|${rec?.choice}|${rec?.on}`);
  const skill = (id) => said(ctx.skills?.[id], en) ?? (en ? "this skill" : "yeh hissa");
  const topic = (id) => said(ctx.topics?.[id], en) ?? (en ? "an earlier topic" : "pichhla ek topic");
  const mix = (id) => said(ctx.mixups?.[id], en) ?? (en ? "a mix-up seen before" : "ek purani uljhan");
  const interest = (id) => ctx.interests?.[id] ?? String(id ?? "").replace(/_/g, " ");
  switch (`${rec?.choice}:${f.kind}`) {
    case "compress:learned_delayed_check": return pick(en ? [
      `${name} already knew "${skill(f.skillId)}" and still got it right days later, so today it started with one question on it instead of the full explanation.`,
      `"${skill(f.skillId)}" was not taught again: ${name} got it right without help, and again on a later day. One question checked it.`,
    ] : [
      `"${skill(f.skillId)}" aaj dobara nahi padhaya, kyunki ${name} ne yeh bina madad ke sahi kiya tha, aur kuch din baad bhi yaad tha. Bas ek sawaal se check kiya.`,
      `${name} ne "${skill(f.skillId)}" pehle hi seekh liya tha, aur baad mein bhi sahi kiya. Isliye poori samjhaaish ki jagah ek sawaal se shuru kiya.`,
    ], seed);
    case "compress_fallback:missed_compress_check": return pick(en ? [
      `After today's check question on "${skill(f.skillId)}", the teacher went through the whole of it again, explanation and example.`,
      `"${skill(f.skillId)}" got its full explanation again today, starting from the check question.`,
    ] : [
      `Aaj "${skill(f.skillId)}" ke check sawaal ke baad woh hissa poora dobara samjhaya, misaal ke saath.`,
      `"${skill(f.skillId)}" ko aaj check ke sawaal se shuru karke shuru se dobara padhaya.`,
    ], seed);
    case "allKnown:all_learned_delayed_check": return pick(en ? [
      `${name} already knew every part of "${topic(rec.on)}" and still had it days later, so each part was checked with one question.`,
      `Every part of "${topic(rec.on)}" was already learned and remembered later, so the lesson only checked each one.`,
    ] : [
      `"${topic(rec.on)}" ke saare hisse ${name} pehle hi seekh chuke the aur baad mein bhi yaad the, isliye har hisse ka bas ek sawaal se check kiya.`,
      `"${topic(rec.on)}" poora pehle se aata tha, aur kuch din baad bhi. Aaj sirf har hisse ki jaanch hui.`,
    ], seed);
    case "firstCard:closed_badly": return pick(en ? [
      `The last lesson was a hard one, so today began with an easy question ${name} could get right.`,
      `After a tough last lesson, the first question today was kept easy, to start with a win.`,
    ] : [
      `Pichhli class mushkil rahi thi, isliye aaj shuruaat ek aasaan sawaal se ki jo ${name} kar sake.`,
      `Pichhli baar class thodi bhaari gayi thi. Aaj pehla sawaal jaan-boojhkar aasaan rakha, taaki shuruaat jeet se ho.`,
    ], seed);
    case "firstCard:first_week": case "firstCard:success_first": return pick(en ? [
      `In the first days the opening question is kept easy, so ${name} starts with a win.`,
      `Today's first question was an easy one on purpose: early lessons start with something ${name} can do.`,
    ] : [
      `Shuru ke dinon mein pehla sawaal aasaan rakhte hain, taaki ${name} ki shuruaat jeet se ho.`,
      `Aaj ka pehla sawaal jaan-boojhkar aasaan tha: shuru ki classes aise sawaal se khulti hain jo ${name} kar sake.`,
    ], seed);
    case "opener:gap": {
      const d = Number.isFinite(f.days) ? f.days : null;
      return pick(en ? [
        `${d ? `It had been ${d} days since the last lesson` : "It had been a while since the last lesson"}, so it opened with one easier question to warm up.`,
        `After ${d ? `${d} days` : "a break"} away, the lesson started gently, with one easier question first.`,
      ] : [
        `${d ? `${d} din baad` : "Kaafi din baad"} class hui, isliye pehle ek aasaan sawaal se haath garam kiya.`,
        `Pichhli class ko ${d ? `${d} din` : "kaafi din"} ho gaye the. Aaj seedhe naya nahi, pehle ek halka sawaal poocha.`,
      ], seed);
    }
    case "ladderOrder:closed_badly": case "ladderOrder:first_week": case "ladderOrder:success_first": return pick(en ? [
      `The practice questions on "${skill(f.skillId)}" went from easy to hard, so each one built on a success.`,
      `Practice on "${skill(f.skillId)}" was ordered easiest first.`,
    ] : [
      `"${skill(f.skillId)}" ke abhyaas ke sawaal aasaan se mushkil ki taraf rakhe, taaki har sawaal pichhli jeet par tike.`,
      `"${skill(f.skillId)}" mein abhyaas aasaan sawaalon se shuru hua, phir mushkil.`,
    ], seed);
    case "checkOrder:open_mixup": return pick(en ? [
      `Earlier lessons showed the idea "${mix(f.misconceptionId)}", so today the question on it was asked first.`,
      `The first question on "${skill(f.skillId)}" was the one about "${mix(f.misconceptionId)}", which came up in earlier lessons.`,
    ] : [
      `Pichhli classon mein "${mix(f.misconceptionId)}" wali baat dikhi thi, isliye aaj uska sawaal sabse pehle poocha.`,
      `"${skill(f.skillId)}" mein pehla sawaal "${mix(f.misconceptionId)}" wala tha, jo pehle bhi saamne aaya tha.`,
    ], seed);
    case "remedy:classified_mixup": return pick(en ? [
      `One answer today followed the idea "${mix(f.misconceptionId)}", so that is what was explained next.`,
      `The explanation after one answer went straight at "${mix(f.misconceptionId)}", the idea that answer followed.`,
    ] : [
      `Aaj ek jawab "${mix(f.misconceptionId)}" wali soch se aaya, isliye usi baat ko samjhaya.`,
      `Ek jawab ke baad samjhaaish "${mix(f.misconceptionId)}" wali soch par hui, kyunki jawab usi se aaya tha.`,
    ], seed);
    case "prereqCheck:wheel_spin": return pick(en ? [
      `"${skill(f.skillId)}" had been stuck for a while, so the lesson first checked one thing from "${topic(f.prereqTopicId)}" that it rests on.`,
      `Before more of "${skill(f.skillId)}", one quick question on "${topic(f.prereqTopicId)}", the step underneath it.`,
    ] : [
      `"${skill(f.skillId)}" mein kaafi dino se atkaav tha, isliye pehle "${topic(f.prereqTopicId)}" ka ek chhota sawaal poocha, jis par yeh tika hai.`,
      `"${skill(f.skillId)}" aage badhane se pehle neeche ki seedhi dekhi: "${topic(f.prereqTopicId)}" ka ek sawaal.`,
    ], seed);
    case "revision:first_week": case "revision:test_soon": {
      const why = f.kind === "test_soon" ? (en ? "a test is close" : "test paas hai") : en ? "these are the first days" : "abhi shuru ke din hain";
      return pick(en ? [
        `No new topic today because ${why}: ${name} revised "${topic(rec.on)}".`,
        `Since ${why}, today was revision of "${topic(rec.on)}" rather than something new.`,
      ] : [
        `Aaj naya topic nahi liya, kyunki ${why}. ${name} ne "${topic(rec.on)}" dohraya.`,
        `${cap(why)}, isliye aaj kuch naya nahi, "${topic(rec.on)}" ki dohraai hui.`,
      ], seed);
    }
    case "hookSlot:interest": {
      const likes = interest(f.interest), ex = interest(f.slotInterest);
      const same = likes === ex;
      return pick(en ? [
        `${name} likes ${likes}, so the lesson opened with a ${ex} example${same ? "" : ` (${likes} → ${ex})`}.`,
        `The opening example was about ${ex}${same ? "" : `, close to ${likes}`}, because ${name} likes ${likes}.`,
      ] : [
        `${name} ko ${likes} pasand hai, isliye shuruaat ${ex} ki misaal se ki.`,
        `Pehli misaal ${ex} ki thi${same ? "" : ` (${likes} ke kareeb)`}, kyunki ${name} ko ${likes} pasand hai.`,
      ], seed);
    }
    case "practiceOrder:weak": case "practiceOrder:theta": case "practiceOrder:level": return pick(en ? [
      `The practice questions were ordered to match where ${name} is right now, starting from ones within reach.`,
      `Practice was set at ${name}'s current level, so each question was a step from the last.`,
    ] : [
      `Abhyaas ke sawaal ${name} ke abhi ke star ke hisaab se rakhe, pehunch mein aane wale sawaalon se shuru karke.`,
      `Abhyaas ${name} ke aaj ke star par rakha, taaki har sawaal pichhle se ek kadam aage ho.`,
    ], seed);
    case "practiceDiag:open_mixup": return pick(en ? [
      `One practice question was chosen to check the idea "${mix(f.misconceptionId)}", which came up before.`,
      `Practice included a question about "${mix(f.misconceptionId)}", to see if it is settled now.`,
    ] : [
      `Abhyaas mein ek sawaal "${mix(f.misconceptionId)}" wali baat jaanchne ke liye rakha, jo pehle dikhi thi.`,
      `Ek sawaal yeh dekhne ke liye tha ki "${mix(f.misconceptionId)}" wali baat ab saaf hai ya nahi.`,
    ], seed);
    case "practiceFast:fast_unaided": return pick(en ? [
      `${name} answered "${skill(f.skillId)}" quickly and without help, so the next question was a harder one.`,
      `Quick, unaided answers on "${skill(f.skillId)}" moved practice straight to a harder question.`,
    ] : [
      `${name} ne "${skill(f.skillId)}" ke sawaal jaldi aur bina madad ke kiye, isliye agla sawaal mushkil wala diya.`,
      `"${skill(f.skillId)}" mein tez aur bina madad ke jawab aaye, toh abhyaas seedhe ek mushkil sawaal par gaya.`,
    ], seed);
    case "practiceEasier:two_misses": case "practiceEasier:asked": {
      const asked = f.kind === "asked";
      return pick(en ? [
        `${asked ? `${name} asked for an easier one` : "After two questions in a row that did not go through"}, the next question on "${skill(f.skillId)}" was a gentler one.`,
        `${asked ? "On request" : "After two tries that needed more"}, practice on "${skill(f.skillId)}" stepped back to an easier question.`,
      ] : [
        `${asked ? `${name} ne aasaan sawaal maanga` : "Lagaatar do sawaal nahi bane"}, isliye "${skill(f.skillId)}" ka agla sawaal halka rakha.`,
        `${asked ? "Maangne par" : "Do koshishon ke baad"} "${skill(f.skillId)}" ka abhyaas ek aasaan sawaal par laaya.`,
      ], seed);
    }
    case "topic:scripted": return pick(en ? [
      `"${topic(rec.on)}" was picked among equally due topics because its full lesson is ready.`,
      `Of the topics due today, "${topic(rec.on)}" has a complete prepared lesson, so it came first.`,
    ] : [
      `Barabar zaroori topics mein se "${topic(rec.on)}" chuna, kyunki iska poora paath taiyaar hai.`,
      `Aaj ke topics mein "${topic(rec.on)}" ka poora paath taiyaar tha, isliye wahi pehle liya.`,
    ], seed);
    default: return null;
  }
}

// ───────────── round 8 Play (docs/patches/to-learning/011) ─────────────
// A play session's because records { choice, fact, source, kind: "play.*", when?, mis? } (server/play/choose.js) and a
// level's trail (server/play/trail.js). The record's fact is the play server's own text (it may hold the kit's belief) and
// is NOT shown: each line is built from the kind, the game's title and the mix-up's title, like every line above.
const gameOf = (rec) => /([a-z][a-z-]*\/[a-z][a-z0-9-]*)/.exec(String(rec?.choice ?? rec?.game ?? ""))?.[1] ?? null;

/** One play because record → a line, or null. ctx.games: titles by "family/mode"; ctx.mixups: titles by kit mis id. */
export function playLine(rec, ctx = {}) {
  const en = String(ctx.lang ?? "").toLowerCase().startsWith("en");
  const name = String(ctx.name ?? "").trim() || (en ? "Your child" : "Aapke bachche");
  const seed = hash(`${ctx.seed ?? 0}|${rec?.kind}|${rec?.choice}`);
  const g = said(ctx.games?.[gameOf(rec)], en) ?? (en ? "a game" : "ek khel");
  const m = said(ctx.mixups?.[rec?.mis], en) ?? (en ? "a mix-up seen before" : "ek purani uljhan");
  const earlier = rec?.when === "earlier";
  const more = /more help/.test(String(rec?.choice ?? ""));
  switch (rec?.kind) {
    case "play.pick_mixup": return pick(en ? [
      `The game started with ${g}, because "${m}" came up ${earlier ? "in earlier lessons" : "in this lesson"}.`,
      `${cap(g)} came first: its first level shows "${m}" clearly, which came up ${earlier ? "before" : "today"}.`,
    ] : [
      `Khel ${g} se shuru hua, kyunki "${m}" wali baat ${earlier ? "pichhli classon mein" : "isi class mein"} dikhi thi.`,
      `Pehle ${g} khela, kyunki uska pehla level "${m}" wali baat saaf dikhata hai.`,
    ], seed);
    case "play.pick_novelty": return pick(en ? [
      `${cap(g)} this time, for a change from the game ${name} had just played.`,
      `A different game (${g}), since ${name} had just played another one.`,
    ] : [
      `Is baar ${g}, taaki abhi khele gaye khel se kuch alag ho.`,
      `Alag khel (${g}), kyunki ${name} ne abhi doosra khel khela tha.`,
    ], seed);
    case "play.pick_fit": return pick(en ? [
      `${cap(g)} was picked because its first level suits where ${name} is on this skill now.`,
      `The first level of ${g} matched where ${name} is on this skill best.`,
    ] : [
      `${cap(g)} chuna, kyunki uska pehla level ${name} ke abhi ke star ke hisaab se theek tha.`,
      `Is hisse mein ${name} jahan hai, ${g} ka pehla level wahin se shuru hota hai.`,
    ], seed);
    case "play.fade_history": return pick(en ? [
      `The game gave ${more ? "more" : "less"} help, from how ${name} has done on this skill so far.`,
      `${more ? "More" : "Less"} help in the game, going by ${name}'s answers on this skill.`,
    ] : [
      `Khel mein ${more ? "zyada" : "kam"} madad di, is hisse ke pichhle jawabon ke hisaab se.`,
      `${name} ke ab tak ke jawab dekhkar khel mein ${more ? "zyada" : "kam"} madad rakhi.`,
    ], seed);
    case "play.fade_director": return pick(en ? [
      "The lesson set how much help the game gave.",
      "How much help the game gave was the teacher's choice in the lesson.",
    ] : [
      "Khel mein kitni madad ho, yeh class ne tay kiya.",
      "Khel ki madad kitni ho, yeh teacher ne class mein tay kiya.",
    ], seed);
    case "play.mixup_focus": return pick(en ? [
      `One move followed the idea "${m}", so the next level was one that shows it clearly.`,
      `After a move that followed "${m}", the next level looked at exactly that.`,
    ] : [
      `Ek chaal "${m}" wali soch se aayi, isliye agla level wahi baat saaf dikhane wala tha.`,
      `"${m}" wali chaal ke baad agla level usi baat par tha.`,
    ], seed);
    case "play.step_up": return pick(en ? [
      `${name} solved a level on the first try, so the next one was a step harder.`,
      "Solved on the first try: the next level went one step up.",
    ] : [
      `${name} ne ek level pehli koshish mein kiya, isliye agla thoda mushkil tha.`,
      "Pehli baar mein hal hua, to agla level ek kadam aage tha.",
    ], seed);
    case "play.step_down": return pick(en ? [
      "After a level that took more than one try, the next one was a step easier.",
      "The next level went one step back down, after one that took a few tries.",
    ] : [
      "Ek level mein ek se zyada koshish lagi, isliye agla thoda aasaan rakha.",
      "Kuch koshishon wale level ke baad agla ek kadam aasaan tha.",
    ], seed);
    case "play.switch": return pick(en ? [
      `The game changed to ${g}, to look at "${m}" another way.`,
      `${cap(g)} next: the same idea, "${m}", in a different game.`,
    ] : [
      `Khel badal kar ${g} kiya, taaki "${m}" wali baat doosre tareeke se dikhe.`,
      `Wahi baat, "${m}", ab ${g} mein dekhi.`,
    ], seed);
    case "play.studio_gate": return pick(en ? [
      `On a phone the bigger activity does not fit, so ${name} played ${g} instead.`,
      `${cap(g)} was played because the bigger activity is too small to use on a phone.`,
    ] : [
      `Phone par bada activity theek se nahi aata, isliye ${g} khela.`,
      `Phone ki screen chhoti thi, to bade activity ki jagah ${g}.`,
    ], seed);
    default: return null;
  }
}

/** A level's trail (server/play/trail.js) → one plain line: how it went, never a verdict on the child. null when unreadable. */
export function trailLine(t, ctx = {}) {
  if (!t || typeof t !== "object" || typeof t.game !== "string") return null;
  const en = String(ctx.lang ?? "").toLowerCase().startsWith("en");
  const g = cap(said(ctx.games?.[t.game], en) ?? (en ? "A game" : "Ek khel"));
  const extra = Number.isFinite(t.extra) && t.extra > 0 ? t.extra : 0;
  const more = extra ? (en ? `, ${extra} move${extra === 1 ? "" : "s"} more than the shortest way` : `, sabse chhote raaste se ${extra} chaal zyada`) : "";
  if (t.solved && t.firstTry) return en ? `${g}: solved on the first try${more}.` : `${g}: pehli koshish mein hal${more}.`;
  if (t.solved) return en ? `${g}: solved after a few tries${more}.` : `${g}: kuch koshishon ke baad hal${more}.`;
  return en ? `${g}: not finished this time.` : `${g}: is baar poora nahi hua.`;
}

/**
 * The lines for a lesson's because list: one per record the page explains, in order; records that say the same thing (a
 * remediation planned for several cards from one mix-up) are said once.
 */
export function becauseLines(because = [], ctx = {}) {
  const seen = new Set(), out = [];
  for (const rec of because ?? []) {
    const f = rec?.fact ?? {};
    const key = String(rec?.kind ?? "").startsWith("play.") ? `${rec.kind}|${rec.mis ?? ""}|${gameOf(rec) ?? ""}`
      : ["remedy", "checkOrder"].includes(rec?.choice) ? `${rec.choice}|${f.kind}|${f.misconceptionId}` : `${rec?.choice}|${rec?.on}|${f.kind}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const line = becauseLine(rec, ctx);
    if (line) out.push(line);
  }
  return out;
}
