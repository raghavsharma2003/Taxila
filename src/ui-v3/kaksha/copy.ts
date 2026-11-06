// Kaksha chrome strings (BUILD-SPEC §8). G-EN-1 stands (dc-r4-kaksha-k-o-answers K-O1): chrome is English, fixed in
// code; there is no child-facing language switch. The Hinglish and Hindi columns sit dormant as the localisation
// parameter G-EN-1's reversal names ("reverse if Hindi-medium children can't navigate English chrome"): they are never
// rendered while CHROME_LANG is "en". Her speech and captions never come from this table (they follow language_pref).
// Proper nouns allowed in English chrome: Kaksha, Antariksh, Khand, Asha (K-P7 allowlist).
import { futurist } from "./look.ts";

export type ChromeLang = "en" | "hinglish" | "hi";
/** Fixed. Changing it is an owner decision (reverse G-EN-1), not a setting. */
export const CHROME_LANG: ChromeLang = "en";

type Row = { en: string; hinglish: string; hi: string };
const K = (en: string, hinglish: string, hi: string): Row => ({ en, hinglish, hi });

export const KX = {
  start: K("Start", "Shuru karo", "शुरू करो"),
  // r5 QA D24: an open lesson is continued, not restarted
  continueCta: K("Continue", "Aage chalo", "आगे चलो"),
  resumeSub: K("Pick up where you left off.", "Jahan ruke the, wahin se chalo.", "जहाँ रुके थे, वहीं से चलो।"),
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
  notMe: K("Not {name}?", "{name} nahi?", "{name} नहीं?"),
  // Hello (K-P13, audit B02): what really happens next, for every start (session-first or a planned lesson)
  helloOlder: K("First a quick chat, then Asha teaches from there. Nobody sees a score.", "Pehle thodi baat, phir Asha padhayegi. Score koi nahi dekhta.", "पहले थोड़ी बात, फिर आशा पढ़ाएगी। स्कोर कोई नहीं देखता।"),
  back: K("Back", "Wapas", "वापस"),
  // r7 app-lesson-moments-later: the moment cards and the Later list (stage overlays)
  later: K("Later", "Baad mein", "बाद में"),
  laterTitle: K("Later: she comes back to these", "Baad mein: yeh wapas aayenge", "बाद में: ये वापस आएँगे"),
  laterEmpty: K("Nothing parked.", "Kuch nahi rakha.", "कुछ नहीं रखा।"),
  momentPark: K("Parked for the end", "End ke liye rakha", "अंत के लिए रखा"),
  momentDetour: K("Quick detour", "Chhota sa detour", "छोटा-सा मोड़"),
  momentDecline: K("Not for lessons", "Lesson ke liye nahi", "पाठ के लिए नहीं"),
  momentStop: K("Your call. Nothing is lost.", "Tumhari marzi. Kuch nahi khoyega.", "तुम्हारी मर्ज़ी। कुछ नहीं खोएगा।"),
  momentReturned: K("Back to your question", "Tumhara sawaal", "तुम्हारा सवाल"),
  laterNext: K("Next", "Agla", "अगला"),
  laterDebrief: K("Your questions for next time", "Agli baar ke sawaal", "अगली बार के सवाल"),
  // r7 app-home-plan-states: Home's plan states (one CTA each; the lesson stays one tap away)
  homeworkSub: K("Homework help is on. Bring the question you're stuck on.", "Homework help on hai. Jo sawaal atka hai, laao.", "होमवर्क मदद चालू है। अटका सवाल लाओ।"),
  homeworkCta: K("Homework help", "Homework help", "होमवर्क मदद"),
  todaysLesson: K("Today's lesson instead", "Aaj ka lesson", "आज का पाठ"),
  testSub: K("Your {subject} test is coming up. Today is revision, at your pace.", "{subject} test aa raha hai. Aaj revision, aaram se.", "{subject} की परीक्षा आ रही है। आज दोहराई, आराम से।"),
  reviseCta: K("Revise", "Revise", "दोहराओ"),
  anotherCta: K("One more", "Ek aur", "एक और"),
  didToday: K("Today you did", "Aaj tumne kiya", "आज तुमने किया"),
  // r7 app-secondary-screens-kaksha: the Me screen's sections and the picture sheet
  meLessons: K("Lessons", "Lessons", "पाठ"),
  meScreen: K("Screen and sound", "Screen aur awaaz", "स्क्रीन और आवाज़"),
  meYou: K("You", "Tum", "तुम"),
  meSees: K("Who sees what", "Kaun kya dekhta hai", "कौन क्या देखता है"),
  change: K("Change", "Badlo", "बदलो"),
  // Hello as a boot sequence: one log line per step (what this step sets up), never a count
  bootHello: K("Teacher online", "Teacher online", "टीचर ऑनलाइन"),
  bootAi: K("AI teacher, not a person", "AI teacher, insaan nahi", "AI टीचर, इंसान नहीं"),
  bootPicture: K("Your picture", "Tumhari picture", "तुम्हारी तस्वीर"),
  bootLikes: K("What you like", "Tumhe kya pasand hai", "तुम्हें क्या पसंद है"),
  bootHi: K("Voice check", "Awaaz check", "आवाज़ जाँच"),
  madeForYou: K("Made for you", "Tumhare liye bana", "तुम्हारे लिए बना"),
  playAgain: K("Play again", "Phir se khelo", "फिर से खेलो"),
  practiseThis: K("Practise this", "Isko practise karo", "इसका अभ्यास करो"),
  revisit: K("Revisit", "Phir se dekho", "फिर से देखो"),
  // r7 app-world-hangar-depth: chapter seals (the ledger's: every skill Got it or Secure)
  chapterSealed: K("Chapter sealed", "Chapter pakka", "अध्याय पक्का"),
  sealNote: K("Every idea in this chapter is yours now.", "Is chapter ka har idea ab tumhara hai.", "इस अध्याय का हर विचार अब तुम्हारा है।"),
  sealedChapters: K("Sealed chapters", "Pakke chapters", "पक्के अध्याय"),
  sealedSince: K("since {date}", "{date} se", "{date} से"),
  // r7 Debrief: "What helped?" (Older, one tap) and the closing emote to her
  helpedQ: K("What helped today?", "Aaj kisne madad ki?", "आज किसने मदद की?"),
  helpedBoard: K("The drawing", "Drawing", "ड्रॉइंग"),
  helpedExplain: K("How {T} explained", "{T} ne kaise samjhaya", "{T} ने कैसे समझाया"),
  helpedSelf: K("Trying it myself", "Khud try karna", "ख़ुद कोशिश करना"),
  helpedUnsure: K("Not sure", "Pata nahi", "पता नहीं"),
  helpedThanks: K("Thanks for telling {T}.", "{T} ko batane ke liye thanks.", "{T} को बताने के लिए धन्यवाद।"),
  emoteQ: K("Send {T} a goodbye", "{T} ko bye bolo", "{T} को बाय बोलो"),
  emoteWave: K("Wave", "Wave", "हाथ हिलाओ"),
  emoteThanks: K("Thanks", "Thanks", "धन्यवाद"),
  emoteFun: K("That was fun", "Maza aaya", "मज़ा आया"),
  emoteSent: K("Sent to {T}.", "{T} ko bhej diya.", "{T} को भेज दिया।"),
  jarWaiting: K("Your questions from last time are waiting. She brings them back in the next lesson.", "Pichhli baar ke sawaal intezaar mein hain.", "पिछली बार के सवाल इंतज़ार में हैं।"),
  // r7 app-nav-unified: the one dock (nav.tsx)
  navHome: K("Home", "Home", "होम"),
  navWorld: K("World", "Duniya", "दुनिया"),
  navPractice: K("Practice", "Practice", "अभ्यास"),
  navAsk: K("Ask", "Poochho", "पूछो"),
  navNotebook: K("Notebook", "Notebook", "नोटबुक"),
  navMe: K("Me and settings", "Main aur settings", "मैं और सेटिंग्स"),
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
  // K1 · Debrief (BUILD-SPEC §3.5): facts from this session only; no points, no score, no count against a target
  debrief: K("Debrief", "Debrief", "डीब्रीफ़"),
  sessionDone: K("Session done", "Session ho gaya", "सेशन हो गया"),
  setDone: K("That's the set", "Set ho gaya", "सेट हो गया"),
  didTitle: K("What you did", "Tumne kya kiya", "तुमने क्या किया"),
  answered: K("You said", "Tumne kaha", "तुमने कहा"),
  onOwn: K("on your own", "khud se", "ख़ुद से"),
  withHint: K("with a hint", "hint ke saath", "संकेत के साथ"),
  triedOne: K("You tried 1 question.", "Tumne 1 sawaal try kiya.", "तुमने 1 सवाल हल करने की कोशिश की।"),
  tried: K("You tried {n} questions.", "Tumne {n} sawaal try kiye.", "तुमने {n} सवाल हल करने की कोशिश की।"),
  nothing: K("You and {T} talked it through today.", "Aaj tumne aur {T} ne baat ki.", "आज तुमने और {T} ने बात की।"),
  nowSecure: K("Now secure", "Ab pakka", "अब पक्का"),
  secureNote: K("Checked again on another day, and still there.", "Doosre din phir check kiya, aur yaad hai.", "दूसरे दिन फिर जाँचा, और याद है।"),
  openedTitle: K("Opened", "Khula", "खुला"),
  raises: K("Raises a {what} in your settlement", "Basti mein {what} banega", "बस्ती में {what} बनेगा"),
  next: K("Next time: {topic}", "Agli baar: {topic}", "अगली बार: {topic}"),
  ending: K("Saving your session…", "Session save ho raha hai…", "सेशन सेव हो रहा है…"),
  finish: K("Finish", "Khatam", "ख़त्म"),
  showParents: K("Show your parents?", "Ghar walon ko dikhao?", "घरवालों को दिखाओ?"),
  showYes: K("Show", "Dikhao", "दिखाओ"),
  showNo: K("Not now", "Abhi nahi", "अभी नहीं"),
  showTitle: K("{child} did this today", "{child} ne aaj yeh kiya", "{child} ने आज यह किया"),
  done: K("Done", "Ho gaya", "हो गया"),
  // K2 · Briefing (BUILD-SPEC §3.4): every line names something the level or the dress already carries
  briefing: K("Briefing", "Briefing", "ब्रीफ़िंग"),
  builtFrom: K("Built from today's lesson", "Aaj ke lesson se bana", "आज के पाठ से बना"),
  checks: K("Checks", "Dekhega", "जाँचेगा"),
  lookLine: K("Look: {theme} · pace: {pace}", "Look: {theme} · raftaar: {pace}", "रूप: {theme} · रफ़्तार: {pace}"),
  holdToLaunch: K("Hold to launch", "Daba ke rakho", "दबाकर रखो"),
  launching: K("Launching", "Chal pade", "चल पड़े"),
  launchHint: K("or press Enter", "ya Enter dabao", "या Enter दबाओ"),
  lineFractions: K("Fractions in {parts} parts, on a line from {lo} to {hi}", "{parts} hisson wale fractions, {lo} se {hi} tak", "{parts} हिस्सों वाले भिन्न, {lo} से {hi} तक"),
  lineDecimals: K("Decimals on a line from {lo} to {hi}", "Decimals, {lo} se {hi} tak", "दशमलव, {lo} से {hi} तक"),
  lineNumbers: K("Numbers on a line from {lo} to {hi}", "Numbers, {lo} se {hi} tak", "संख्याएँ, {lo} से {hi} तक"),
  lineRound: K("Round to the nearest {to}", "Nazdeeki {to} tak round karo", "निकटतम {to} तक"),
  // engine, wrapper, mode, theme and pace names (data ids → words; proper nouns: Antariksh, Khand)
  engAntariksh: K("Antariksh", "Antariksh", "अंतरिक्ष"), engKhand: K("Khand", "Khand", "खंड"), engYantra: K("Yantra", "Yantra", "यंत्र"),
  wrapBeacon: K("Beacon rescue", "Beacon bachao", "बीकन बचाओ"), wrapMines: K("Mine sweep", "Mine safai", "माइन सफ़ाई"), wrapComet: K("Comet catch", "Comet pakdo", "धूमकेतु पकड़ो"),
  modeLine: K("number line", "number line", "संख्या रेखा"), modeCompare: K("compare on a line", "line par tulna", "रेखा पर तुलना"),
  themeBlue: K("blue nebula", "neela nebula", "नीला नेबुला"), themeRed: K("red planet", "laal grah", "लाल ग्रह"), themeGreen: K("green storm", "hara toofan", "हरा तूफ़ान"),
  themeClay: K("clay", "mitti", "मिट्टी"), themeSnow: K("snow", "barf", "बर्फ़"), themeJungle: K("jungle", "jungle", "जंगल"),
  themeLab: K("science lab", "science lab", "विज्ञान प्रयोगशाला"), themeRooftop: K("rooftop at dusk", "shaam ki chhat", "शाम की छत"), themeBench: K("workbench", "kaam ki mez", "काम की मेज़"),
  paceSteady: K("steady", "aaram se", "आराम से"), paceBrisk: K("brisk", "tez", "तेज़"),
  // what a level is built to tell apart (the family's mal-rule ids → plain words; never "your mistake")
  malWholeBias: K("is a bigger bottom number a bigger fraction?", "bada neeche wala number, bada fraction?", "बड़ा हर, बड़ी भिन्न?"),
  malLineUnit: K("is the whole line always 1?", "poori line hamesha 1?", "पूरी रेखा हमेशा 1?"),
  malAllBelowOne: K("is every fraction less than 1?", "har fraction 1 se chhota?", "हर भिन्न 1 से छोटी?"),
  malCountMarks: K("counting marks or counting parts", "nishan gino ya hisse", "निशान गिनो या हिस्से"),
  malDecimalPlace: K("where the decimal point sits", "decimal kahan hai", "दशमलव कहाँ है"),
  malSign: K("what a minus sign does", "minus ka matlab", "ऋण चिह्न का मतलब"),
  malNegOrder: K("which negative number is smaller", "kaunsa minus number chhota", "कौन-सी ऋण संख्या छोटी"),
  malLonger: K("does a longer decimal mean bigger?", "lamba decimal yaani bada?", "लंबा दशमलव यानी बड़ा?"),
  malFirstDigit: K("comparing more than the first digit", "sirf pehla digit nahi", "सिर्फ़ पहला अंक नहीं"),
  malSpacing: K("equal spacing on the line", "line par barabar doori", "रेखा पर बराबर दूरी"),
  malRound: K("which way a number rounds", "round kis taraf", "किस ओर पूर्णांक"),
  // K3 · intake (BUILD-SPEC §3.2): the card names what the server mapped (ui.intake), in the syllabus's own words
  intakeToday: K("Today at school", "Aaj school mein", "आज स्कूल में"),
  intakeWhich: K("Which one was it?", "Kaunsa tha?", "कौन-सा था?"),
  intakeFromSchool: K("From school", "School se joda", "स्कूल से जोड़ा"),
  intakePlan: K("Today's plan", "Aaj ka plan", "आज की योजना"),
  intakePlanSteps: K("{n} parts today", "Aaj {n} hisse", "आज {n} हिस्से"),
  ringMaths: K("Maths", "Ganit", "गणित"), ringScience: K("Science", "Vigyan", "विज्ञान"), ringEvs: K("EVS", "EVS", "पर्यावरण"),
  ringEnglish: K("English", "English", "अंग्रेज़ी"), ringHindi: K("Hindi", "Hindi", "हिंदी"), ringSocial: K("Social", "Social", "सामाजिक"),
} as const;

export type KxKey = keyof typeof KX;

// The futurist looks' English (owner directive 2026-10-10: global, modern names; the direction pass,
// docs/design/round4/build/kaksha/futurist/). The world and shell names are the first of the shortlist there, until the
// main session names them. The settlement is the base.
export const KX_NAMES = { world: "Zenith", shell: "Flight Deck" } as const;
const FUTURIST: Partial<Record<KxKey, string>> = {
  myOrbit: "My world",
  yourWorld: "Planet {world}",
  orbitTitle: "{name}'s world",
  viewSettlement: "Base",
  settlementSub: "Each idea you make secure builds one part of your base, and the part shows the idea.",
  raises: "Builds a {what} at your base",
  emptyWorld: "Your first secure idea lands here. Ideas become secure after a short check on another day.",
  hangarSub: "Every idea you make secure opens a part for your ship. Nothing here is bought, and nothing is ever taken away.",
  hidden: "Your parent has kept this private for now. Your Hangar and your ship are still yours.",
};

/** The chrome string (always English while G-EN-1 stands), with {vars}. */
export function kt(key: KxKey, vars: Record<string, string> = {}): string {
  const row = KX[key];
  const on = futurist();
  const fut = on ? FUTURIST[key] : undefined;
  if (on) vars = { world: KX_NAMES.world, shell: KX_NAMES.shell, ...vars };
  const s = fut ?? (row[CHROME_LANG] || row.en);
  return s.replace(/\{(\w+)\}/g, (_, k: string) => vars[k] ?? "");
}

export const RING_LABEL: Record<string, KxKey> = {
  maths: "ringMaths", science: "ringScience", evs: "ringEvs", english: "ringEnglish", hindi: "ringHindi", social: "ringSocial", sst: "ringSocial",
};
