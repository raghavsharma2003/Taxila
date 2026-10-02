// Child UI strings: short labels only (Young ≤ 3-4 words, spoken on tap; Older dry and respectful). These
// are interface labels, never teacher lines: nothing here is ever sent to compile() (shapes-not-lines law).
// Banned on child surfaces (PD-G18 lexicon): streak, XP, coins, level up, unlock, inaam, rank, topper,
// score, marks, test/exam for Young, "come back", "miss you", countdowns.
export type Lang = "hinglish" | "hindi" | "english";

const S = {
  todayLesson: ["Aaj ka paath", "आज का पाठ", "Today's lesson"],
  garden: ["Bagiya", "बगिया", "Garden"],
  sky: ["Aasmaan", "आसमान", "Sky map"],
  practice: ["Abhyaas", "अभ्यास", "Practice"],
  doubt: ["Ek sawaal poochho", "एक सवाल पूछो", "Ask a doubt"],
  continue: ["Aage padhein", "आगे पढ़ें", "Continue"],
  myMap: ["Mera map", "मेरा नक्शा", "My map"],
  myNotes: ["Meri notes", "मेरे नोट्स", "My notes"],
  notebook: ["Copy", "कॉपी", "Notebook"],
  me: ["Main", "मैं", "Me"],
  home: ["Ghar", "घर", "Home"],
  pause: ["Ruko", "रुको", "Pause"],
  phirSe: ["Phir se", "फिर से", "Say it again"],
  slower: ["Dheere", "धीरे", "Slower"],
  tapInstead: ["Likh kar", "लिख कर", "Type instead"],
  talk: ["Bolo", "बोलो", "Talk"],
  stopTalk: ["Bas", "बस", "Done"],
  send: ["Bhejo", "भेजो", "Send"],
  typeHere: ["Yahan likho…", "यहाँ लिखो…", "Type here…"],
  yourTurn: ["Tumhari baari", "तुम्हारी बारी", "Your turn"],
  listening: ["Sun rahe hain", "सुन रहे हैं", "Listening"],
  thinking: ["Soch rahe hain", "सोच रहे हैं", "Thinking"],
  speaking: ["Bol rahe hain", "बोल रहे हैं", "Speaking"],
  continueLesson: ["Aage chalein", "आगे चलें", "Continue"],
  stopLesson: ["Band karein", "बंद करें", "Stop"],
  help: ["Madad", "मदद", "Help"],
  talkToGrownup: ["Ghar ke bade se baat karo", "घर के बड़े से बात करो", "Talk to a grown-up"],
  leaveQ: ["Paath band karein?", "पाठ बंद करें?", "Leave the lesson?"],
  yes: ["Haan", "हाँ", "Yes"],
  no: ["Nahi", "नहीं", "No"],
  finish: ["Ho gaya", "हो गया", "Finish"],
  whatWeMade: ["Aaj humne banaya", "आज हमने बनाया", "What we made"],
  oneMoment: ["Ek pal", "एक पल", "One moment"],
  connectionWeak: ["Hamara connection dheema hai", "हमारा कनेक्शन धीमा है", "Our connection is slow"],
  connectionBack: ["Jud rahe hain", "जुड़ रहे हैं", "Reconnecting"],
  startLesson: ["Shuru karein", "शुरू करें", "Start"],
  tapToStart: ["Chhoo kar shuru karo", "छू कर शुरू करो", "Tap to start"],
  aiTeacher: ["AI teacher", "AI टीचर", "AI teacher"],
  grownupSignIn: ["Ghar ke bade ko bulao", "घर के बड़े को बुलाओ", "Ask a grown-up to sign in"],
  loading: ["…", "…", "…"],
  captions: ["Likha hua", "लिखा हुआ", "Captions"],
  notMe: ["Yeh main nahi", "यह मैं नहीं", "Not me"],
  resting: ["Teacher aaram kar rahe hain", "टीचर आराम कर रहे हैं", "The teacher is resting"],
  nextTopic: ["Agla: ", "अगला: ", "Next: "],
  another: ["Ek aur paath", "एक और पाठ", "Another lesson"],
  thatsAll: ["Bas itna", "बस इतना", "That's all"],
  voiceOnly: ["Sirf awaaz aur board", "सिर्फ़ आवाज़ और बोर्ड", "Voice and board only"],
  recorded: ["Recorded", "रिकॉर्डेड", "Recorded"],
  practiceStop: ["Bas, ab rukein", "बस, अब रुकें", "Stop here"],
} satisfies Record<string, [string, string, string]>;

export type CopyKey = keyof typeof S;

export function t(key: CopyKey, lang: string): string {
  const row = S[key];
  return lang === "hindi" ? row[1] : lang === "english" ? row[2] : row[0];
}

/** `lang` attribute for a label in this UI language (Devanagari spans need lang="hi", PD-G14). */
export const langAttr = (lang: string) => (lang === "hindi" ? "hi" : "en");
