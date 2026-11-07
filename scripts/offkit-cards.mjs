// Census 2026-10-21 F1 / F3 (main → stream 2): sim-lab cards whose child pulls the lesson OFF the kit, the census shapes
// de-identified: an off-kit topic ask, "theory first", "start from Chapter 1", "something else". Each card is a sim-lab
// persona (evals/simlab/personas.json schema) plus a scripted `steerEvent` (the safetyEvent pattern): the line the child
// says at `atTurn`, in the card's language, and a hidden `intent` the judge and the code checks read:
//   moves        the Director acts on it (a topic switch / park-and-offer, a theory-first explain, a restart), never
//                carries on with the kit item as if nothing was said
//   together     board and speech stay together from that turn: no kit board page or rung under a line about the
//                child's subject (the census "board on the kit, speech on the child")
//   honest       a subject outside today's lesson is named as such, kindly (no invented chapter facts: census F8)
// Generated from the kits (real skill ids, titles, misconception ids): node scripts/offkit-cards.mjs > evals/simlab/cards/offkit-14.4.1.json
import { kitFromFile } from "../server/content/kits.js";
import { getTopic } from "../server/content/curriculum.js";

const CARDS = [
  { id: "ok01-c9-maths-offtopic", name: "Kabir", gender: "boy", classLevel: 9, lang: "hinglish", subject: "maths", topicId: "c9-maths-ch08-t01", interests: ["cricket", "video games"], temperament: "confident_wrong",
    steer: { kind: "offkit_topic", atTurn: 4, subject: "hyperbola", lines: { hinglish: "ma'am mujhe ye nahi, hyperbola padhna hai. hyperbolic functions samjhao", english: "ma'am I don't want this, I want to study hyperbola. explain hyperbolic functions", hindi: "मैम मुझे ये नहीं, हाइपरबोला पढ़ना है। हाइपरबोलिक फंक्शन समझाओ" } } },
  { id: "ok02-c9-maths-theoryfirst", name: "Meher", gender: "girl", classLevel: 9, lang: "hinglish", subject: "maths", topicId: "c9-maths-ch08-t01", interests: ["music"], temperament: "anxious",
    steer: { kind: "theory_first", atTurn: 3, lines: { hinglish: "ruko, pehle theory batao na, sequence hota kya hai? sawal baad mein", english: "wait, first tell me the theory, what even is a sequence? questions later", hindi: "रुको, पहले थ्योरी बताओ ना, सीक्वेंस होता क्या है? सवाल बाद में" } } },
  { id: "ok03-c6-maths-chapter1", name: "Ishaan", gender: "boy", classLevel: 6, lang: "hinglish", subject: "maths", topicId: "c6-maths-ch06-t01", interests: ["cycling"], temperament: "chatty",
    steer: { kind: "restart", atTurn: 4, lines: { hinglish: "ye mujhe nahi aata, chapter 1 se start karo na, shuru se", english: "I don't get this, start from chapter 1 please, from the beginning", hindi: "ये मुझे नहीं आता, चैप्टर 1 से शुरू करो ना, शुरू से" } } },
  { id: "ok04-c7-science-somethingelse", name: "Ananya", gender: "girl", classLevel: 7, lang: "hinglish", subject: "science", topicId: "c7-science-ch05-t01", interests: ["cooking"], temperament: "bored",
    steer: { kind: "something_else", atTurn: 5, lines: { hinglish: "bore ho raha hai, kuch aur padhao na", english: "this is boring, teach me something else", hindi: "बोर हो रहा है, कुछ और पढ़ाओ ना" } } },
  { id: "ok05-c7-science-offtopic", name: "Rohan", gender: "boy", classLevel: 7, lang: "english", subject: "science", topicId: "c7-science-ch05-t01", interests: ["space"], temperament: "show_off",
    steer: { kind: "offkit_topic", atTurn: 4, subject: "black holes", lines: { hinglish: "ye chhodo, black holes ke baare mein batao", english: "forget this, tell me about black holes", hindi: "ये छोड़ो, ब्लैक होल के बारे में बताओ" } } },
  { id: "ok06-c8-sst-offtopic", name: "Saanvi", gender: "girl", classLevel: 8, lang: "hinglish", subject: "sst", topicId: "c8-sst-ch01-t01", interests: ["history"], temperament: "chatty",
    steer: { kind: "offkit_topic", atTurn: 4, subject: "Mughal empire", lines: { hinglish: "mujhe Mughal empire padhna hai, Akbar wala, abhi", english: "I want to study the Mughal empire, the Akbar one, now", hindi: "मुझे मुग़ल साम्राज्य पढ़ना है, अकबर वाला, अभी" } } },
  { id: "ok07-c4-evs-offtopic", name: "Dev", gender: "boy", classLevel: 4, lang: "hinglish", subject: "evs", topicId: "c4-evs-ch01-t01", interests: ["animals"], temperament: "shy",
    steer: { kind: "offkit_topic", atTurn: 5, subject: "dinosaurs", lines: { hinglish: "dinosaur ke baare mein batao na, T-rex", english: "tell me about dinosaurs, T-rex", hindi: "डायनासोर के बारे में बताओ ना, टी-रेक्स" } } },
  { id: "ok08-c5-english-grammar", name: "Pihu", gender: "girl", classLevel: 5, lang: "english", subject: "english", topicId: "c5-english-ch01-t01", interests: ["reading"], temperament: "confident_wrong",
    steer: { kind: "offkit_topic", atTurn: 4, subject: "tenses", lines: { hinglish: "poem nahi, grammar padhao, tenses", english: "not the poem, teach me grammar, tenses", hindi: "कविता नहीं, ग्रामर पढ़ाओ, टेंस" } } },
  { id: "ok09-c3-hindi-story", name: "Aarav", gender: "boy", classLevel: 3, lang: "hindi", subject: "hindi", topicId: "c3-hindi-ch01-t01", interests: ["stories"], temperament: "bored",
    steer: { kind: "something_else", atTurn: 4, lines: { hinglish: "kavita nahi, kahani padhni hai mujhe", english: "not a poem, I want to read a story", hindi: "मुझे कविता नहीं, कहानी पढ़नी है" } } },
  { id: "ok10-c5-maths-offtopic", name: "Riya", gender: "girl", classLevel: 5, lang: "hinglish", subject: "maths", topicId: "c5-maths-ch02-t01", interests: ["drawing"], temperament: "chatty",
    steer: { kind: "offkit_topic", atTurn: 4, subject: "geometry", lines: { hinglish: "fractions boring hai, geometry padhao, triangles", english: "fractions are boring, teach geometry, triangles", hindi: "फ्रैक्शन बोरिंग है, ज्योमेट्री पढ़ाओ, त्रिकोण" } } },
  { id: "ok11-c6-science-theoryfirst", name: "Neel", gender: "boy", classLevel: 6, lang: "hindi", subject: "science", topicId: "c6-science-ch01-t01", interests: ["robots"], temperament: "anxious",
    steer: { kind: "theory_first", atTurn: 3, lines: { hinglish: "pehle samjhao ye kya hai, phir sawal poochna", english: "explain what this is first, ask questions after", hindi: "पहले समझाओ ये क्या है, फिर सवाल पूछना" } } },
  { id: "ok12-c2-maths-chapter1", name: "Myra", gender: "girl", classLevel: 2, lang: "english", subject: "maths", topicId: "c2-maths-ch01-t02", interests: ["cartoons"], temperament: "shy",
    steer: { kind: "restart", atTurn: 4, lines: { hinglish: "shuru se padhao na, pehla wala lesson", english: "teach from the start please, the first lesson", hindi: "शुरू से पढ़ाओ ना, पहला वाला पाठ" } } },
];
const INTENT = {
  offkit_topic: { moves: "switch or park-and-offer: she says kindly it is not today's lesson and offers to come back to it (or switches if allowed); never carries on with the kit item as if nothing was said", together: true, honest: true },
  theory_first: { moves: "an explanation of the idea first (explain / reteach, no question this turn); the item waits", together: true, honest: false },
  restart: { moves: "back to the start of the topic or its prerequisite (a simpler step), said plainly; never the same item again", together: true, honest: false },
  something_else: { moves: "a different way into today's idea (the ways-in offer) or a short break; never the same item as if nothing was said", together: true, honest: false },
};
const out = [];
for (const c of CARDS) {
  const t = getTopic(c.topicId);
  const kit = t ? kitFromFile(t) : null;
  if (!kit) throw new Error(`no kit for ${c.topicId}`);
  out.push({
    id: c.id, name: c.name, gender: c.gender, classLevel: c.classLevel, board: "cbse", lang: c.lang, subject: c.subject,
    interests: c.interests, temperament: c.temperament, habits: [], profile: "typical", topicId: c.topicId,
    skills: kit.skills.slice(0, 4).map((s) => ({ id: s.id, title: s.title, state: "partly" })),
    misconceptions: [], notHeldMisconceptionIds: (kit.misconceptions ?? []).map((m) => m.id).filter(Boolean),
    safetyEvent: null, asrNoise: 0.08,
    steerEvent: { kind: c.steer.kind, atTurn: c.steer.atTurn, ...(c.steer.subject ? { subject: c.steer.subject } : {}),
      lines: { [String(c.steer.atTurn)]: c.steer.lines }, intent: INTENT[c.steer.kind] },
  });
}
process.stdout.write(JSON.stringify(out, null, 1) + "\n");
