// Kaksha chrome strings (BUILD-SPEC §8). G-EN-1 stands (dc-r4-kaksha-k-o-answers K-O1): chrome is English, fixed in
// code; there is no child-facing language switch. The Hinglish and Hindi columns sit dormant as the localisation
// parameter G-EN-1's reversal names ("reverse if Hindi-medium children can't navigate English chrome"): they are never
// rendered while CHROME_LANG is "en". Her speech and captions never come from this table (they follow language_pref).
// Proper nouns allowed in English chrome: Kaksha, Antariksh, Khand, Asha (K-P7 allowlist).
export type ChromeLang = "en" | "hinglish" | "hi";
/** Fixed. Changing it is an owner decision (reverse G-EN-1), not a setting. */
export const CHROME_LANG: ChromeLang = "en";

type Row = { en: string; hinglish: string; hi: string };
const K = (en: string, hinglish: string, hi: string): Row => ({ en, hinglish, hi });

export const KX = {
  start: K("Start", "Shuru karo", "शुरू करो"),
  continueIt: K("Continue", "Wahin se", "वहीं से"),
  greetMorning: K("Morning, {name}.", "Good morning, {name}.", "सुप्रभात, {name}।"),
  greetDay: K("Hi, {name}.", "Hi, {name}.", "नमस्ते, {name}।"),
  greetEvening: K("Evening, {name}.", "Shaam ho gayi, {name}.", "शाम हो गई, {name}।"),
  openSub: K("Just start. Asha takes it from there.", "Bas shuru karo. Baaki Asha sambhaal legi.", "बस शुरू करो। बाकी आशा सँभाल लेगी।"),
  doneSub: K("Today's session is done. Another one is fine if you like.", "Aaj ka session ho gaya. Chaho toh ek aur.", "आज का सेशन हो गया। चाहो तो एक और।"),
  restSub: K("Lessons open again at {time}. Your orbit is open any time.", "Lessons {time} baje phir khulenge.", "पाठ {time} बजे फिर खुलेंगे।"),
  cappedSub: K("That's today's time. See you tomorrow.", "Aaj ka time ho gaya. Kal milte hain.", "आज का समय हो गया। कल मिलते हैं।"),
  aiTeacher: K("AI teacher", "AI teacher", "AI टीचर"),
  myOrbit: K("My orbit", "Meri Kaksha", "मेरी कक्षा"),
  forParents: K("For parents", "Bade log", "बड़ों के लिए"),
  back: K("Back", "Wapas", "वापस"),
  yourWorld: K("Your world", "Tumhari duniya", "तुम्हारी दुनिया"),
  orbitTitle: K("{name}'s Kaksha", "{name} ki Kaksha", "{name} की कक्षा"),
  yesterday: K("Yesterday", "Kal", "कल"),
  today: K("Today", "Aaj", "आज"),
  viewOrbit: K("Orbit", "Kaksha", "कक्षा"),
  viewSettlement: K("Settlement", "Basti", "बस्ती"),
  hangar: K("Hangar", "Hangar", "हैंगर"),
  hangarSub: K("Every idea you make secure opens a part. Nothing here is bought, and nothing is ever taken away.", "Har pakki samajh ek naya hissa kholti hai. Kharida nahi jaata, kabhi chhinta nahi.", "हर पक्की समझ एक नया हिस्सा खोलती है। खरीदा नहीं जाता, कभी छिनता नहीं।"),
  settlementSub: K("Each idea you make secure raises one structure that shows the idea.", "Har pakki samajh ek imaarat banati hai.", "हर पक्की समझ एक इमारत बनाती है।"),
  emptyWorld: K("Your first secure idea docks here. Ideas become secure after a short check on another day.", "Pehli pakki samajh yahan aayegi.", "पहली पक्की समझ यहाँ आएगी।"),
  opensWhen: K("Opens when secure", "Khulega jab pakka ho", "खुलेगा जब पक्का हो"),
  opened: K("Opened", "Khula", "खुला"),
  newMark: K("New", "Naya", "नया"),
  secureSince: K("Secure", "Pakka", "पक्का"),
  equip: K("Use this", "Lagao", "लगाओ"),
  equipped: K("In use", "Laga hai", "लगा है"),
  close: K("Close", "Theek hai", "ठीक है"),
  hidden: K("Your parent has kept this private for now. Your Hangar is still yours.", "", ""),
  ringMaths: K("Maths", "Ganit", "गणित"), ringScience: K("Science", "Vigyan", "विज्ञान"), ringEvs: K("EVS", "EVS", "पर्यावरण"),
  ringEnglish: K("English", "English", "अंग्रेज़ी"), ringHindi: K("Hindi", "Hindi", "हिंदी"), ringSocial: K("Social", "Social", "सामाजिक"),
} as const;

export type KxKey = keyof typeof KX;

/** The chrome string (always English while G-EN-1 stands), with {vars}. */
export function kt(key: KxKey, vars: Record<string, string> = {}): string {
  const row = KX[key];
  const s = row[CHROME_LANG] || row.en;
  return s.replace(/\{(\w+)\}/g, (_, k: string) => vars[k] ?? "");
}

export const RING_LABEL: Record<string, KxKey> = {
  maths: "ringMaths", science: "ringScience", evs: "ringEvs", english: "ringEnglish", hindi: "ringHindi", social: "ringSocial", sst: "ringSocial",
};
