// Child-facing words in play: goals, buttons, door hints, labels. Authored, short, verdict-free (live-tech §2.7: model
// wording broke its limits 13/24, so no model writes these). Hinglish in Roman script, Hindi in Devanagari, English.
// The teacher's spoken micro-reactions are NOT here: they are in data/play/reactions.json, chosen by the server.
import type { Lang } from "../../shared/play.ts";

type Line = Record<Lang, string>;
const L = (hinglish: string, en: string, hi: string): Line => ({ hinglish, en, hi });

export const COPY = {
  // atoms
  "atoms.goal": L("Har block ko atom tak todo", "Split every block down to atoms", "हर ब्लॉक को एटम तक तोड़ो"),
  "atoms.goal.two": L("Bittu ne bhi {n} toda. Atoms same ya alag?", "Bittu split {n} too. Same atoms or different?", "बिट्टू ने भी {n} तोड़ा। एटम एक जैसे या अलग?"),
  "atoms.goal.hcf": L("Jode-dar atoms milao, phir HCF batao", "Pair the matching atoms, then name the HCF", "जोड़ीदार एटम मिलाओ, फिर HCF बताओ"),
  "atoms.goal.lcm": L("Jode-dar atoms milao, phir LCM batao", "Pair the matching atoms, then name the LCM", "जोड़ीदार एटम मिलाओ, फिर LCM बताओ"),
  "atoms.pick": L("Ek block chuno", "Pick a block", "एक ब्लॉक चुनो"),
  "atoms.by": L("÷ kis se?", "÷ by what?", "÷ किससे?"),
  "atoms.split": L("Todo", "Split", "तोड़ो"),
  "atoms.atom": L("atom", "atom", "एटम"),
  "atoms.bittu": L("Bittu ka ped", "Bittu's tree", "बिट्टू का पेड़"),
  "atoms.mine": L("Tumhara", "Yours", "तुम्हारा"),
  "atoms.same": L("Same", "Same", "एक जैसे"),
  "atoms.diff": L("Alag", "Different", "अलग"),
  "atoms.pairs": L("Jode", "Pairs", "जोड़े"),
  "atoms.name": L("Batao", "Name it", "बताओ"),
  // strips
  "strips.goal.make": L("Roti ka {t} hissa rango", "Shade {t} of the roti", "रोटी का {t} हिस्सा रंगो"),
  "strips.goal.equal": L("Utni hi roti, par alag tukdon mein", "The same amount, in different pieces", "उतनी ही रोटी, पर अलग टुकड़ों में"),
  "strips.goal.compare": L("Kis mein zyada? Pehle socho", "Which has more? Think first", "किसमें ज़्यादा? पहले सोचो"),
  "strips.goal.compare2": L("Ab dono ko barabar tukdon mein kaato", "Now cut both into the same pieces", "अब दोनों को बराबर टुकड़ों में काटो"),
  "strips.goal.add": L("Dono ko neeche wali patti mein daalo", "Pour both into the bottom strip", "दोनों को नीचे वाली पट्टी में डालो"),
  "strips.cut": L("Kaato", "Cut", "काटो"),
  "strips.join": L("Jodo", "Join", "जोड़ो"),
  "strips.pour": L("Daalo", "Pour", "डालो"),
  "strips.same": L("Barabar", "Same", "बराबर"),
  "strips.more": L("Yeh zyada", "This is more", "यह ज़्यादा"),
  // bundles
  "bundles.goal": L("{a} mein se {b} hatao", "Take {b} away from {a}", "{a} में से {b} हटाओ"),
  "bundles.open": L("1 → 10 kholo", "Open 1 → 10", "1 → 10 खोलो"),
  "bundles.take": L("Hatao", "Take", "हटाओ"),
  "bundles.places": L("das hazaar|hazaar|sau|das|ek", "ten thousands|thousands|hundreds|tens|ones", "दस हज़ार|हज़ार|सौ|दस|इकाई"),
  // balance
  "balance.goal": L("Bag ko akela karo, taraazu seedha rakho", "Get the bag alone, keep the scale level", "थैले को अकेला करो, तराज़ू सीधा रखो"),
  "balance.goal.fill": L("Dabbe mein kitne? Taraazu seedha karo", "How many in the box? Level the scale", "डिब्बे में कितने? तराज़ू सीधा करो"),
  "balance.open": L("Bag kholo", "Open the bag", "थैला खोलो"),
  "balance.group": L("Barabar baanto", "Share equally", "बराबर बाँटो"),
  "balance.name": L("x batao", "Name x", "x बताओ"),
  "balance.level": L("seedha", "level", "सीधा"),
  "balance.tipped": L("jhuka", "tipped", "झुका"),
  // line
  "line.goal": L("{v} ko line par rakho", "Put {v} on the line", "{v} को रेखा पर रखो"),
  "line.goal.cmp": L("Dono ko rakho, phir chhota kaun?", "Place both, then which is smaller?", "दोनों को रखो, फिर छोटा कौन?"),
  "line.here": L("Yahan!", "Here!", "यहाँ!"),
  "line.goal.round": L("{v} ko line par rakho", "Put {v} on the line", "{v} को रेखा पर रखो"),
  "line.goal.round2": L("Kaunsa {t} zyada paas hai?", "Which {t} is nearer?", "कौन-सा {t} ज़्यादा पास है?"),
  "line.half": L("beech", "halfway", "बीच"),
  "line.leftSmaller": L("baayein wala chhota", "further left is smaller", "बाईं ओर वाला छोटा"),
  "line.u10": L("das", "ten", "दस"),
  "line.u100": L("sau", "hundred", "सौ"),
  "line.u1000": L("hazaar", "thousand", "हज़ार"),
  "line.u10000": L("das hazaar", "ten thousand", "दस हज़ार"),
  "line.smaller": L("{v} chhota", "{v} is smaller", "{v} छोटा"),
  "line.gap": L("{g} ka farak", "off by {g}", "{g} का अंतर"),
  "line.gapAbout": L("lagbhag {g} ka farak", "about {g} off", "लगभग {g} का अंतर"),

  // lab
  "lab.goal.predict": L("Pehle socho: kis {noun} mein zyada?", "Think first: which {noun} gets more?", "पहले सोचो: किस {noun} में ज़्यादा?"),
  "lab.goal.predict.less": L("Pehle socho: kaunsa pehle?", "Think first: which one first?", "पहले सोचो: कौन-सा पहले?"),
  "lab.goal.fair": L("Sirf {f} badlo, baaki sab same", "Change only {f}, keep the rest the same", "सिर्फ़ {f} बदलो, बाकी सब वही"),
  "lab.goal.golu": L("Golu ka test. Isse kya pata chalta hai?", "Golu's test. What does it tell us?", "गोलू का टेस्ट। इससे क्या पता चलता है?"),
  "lab.goal.predict.bin": L("Pehle socho: {q}", "Think first: {q}", "पहले सोचो: {q}"),
  "lab.goal.run": L("Socha hua pakka. Ab chalao: {run}", "Prediction locked. Now run: {run}", "सोचा हुआ पक्का। अब चलाओ: {run}"),
  "lab.goal.conclude": L("Kya farak pada, aur kis wajah se?", "What changed, and because of what?", "क्या फ़र्क पड़ा, और किस वजह से?"),
  "lab.onlyA": L("Sirf A", "Only A", "सिर्फ़ A"),
  "lab.onlyB": L("Sirf B", "Only B", "सिर्फ़ B"),
  "lab.alike": L("Dono ek jaise", "Both alike", "दोनों एक जैसे"),
  "lab.run": L("Chalao", "Run", "चलाओ"),
  "lab.same": L("Barabar", "Same", "बराबर"),
  "lab.because": L("{f} se", "Because of {f}", "{f} से"),
  "lab.none": L("Koi farak nahi", "No difference", "कोई अंतर नहीं"),
  "lab.canttell": L("Pata nahi chal sakta", "Can't tell", "पता नहीं चल सकता"),
  "lab.differ": L("{n} cheez alag", "{n} different", "{n} चीज़ें अलग"),
  "lab.golu": L("Golu ka test", "Golu's test", "गोलू का टेस्ट"),
  // shared
  "done": L("Ho gaya", "Done", "हो गया"),
  "undo": L("Wapas", "Undo", "वापस"),
  "door.garam": L("Garam", "Warm", "गरम"),
  "door.teekha": L("Teekha", "Spicy", "तीखा"),
  "door.garam.hint": L("isi tarah ka ek aur", "one more like this", "इसी तरह का एक और"),
  "door.teekha.hint": L("thoda mushkil", "a bit harder", "थोड़ा मुश्किल"),
  "map": L("Naksha", "Map", "नक्शा"),
  "map.ahead": L("aage", "ahead", "आगे"),
  "map.hatched": L("chal raha", "working on it", "चल रहा"),
  "map.pencil": L("aaj kiya", "got it today", "आज किया"),
  "map.ink": L("pakka", "secure", "पक्का"),
  "map.note": L("Pakka tab, jab kisi aur din bhi bina madad sahi ho", "Secure means right again on another day, without help", "पक्का तब, जब किसी और दिन भी बिना मदद सही हो"),
  "bittu": L("Bittu ka kaam", "Bittu's work", "बिट्टू का काम"),
  "think": L("Socho", "Think", "सोचो"),
} as const;
export type CopyKey = keyof typeof COPY;
export function say(lang: Lang, key: CopyKey, vars: Record<string, string | number> = {}): string {
  const line = COPY[key][lang] ?? COPY[key].hinglish;
  return line.replace(/\{(\w+)\}/g, (_, k: string) => (k in vars ? String(vars[k]) : ""));
}
