// Lane A: reviewed templates, one per (shape × language), typed slots (PARENT-REPORT.md §5, §10.2). No model is
// involved. These are UI strings, never prompt text. Gender-neutral by construction: English uses the name or
// "they"; Hindi and Hinglish use ने / respectful-plural constructions so no verb agrees with the child's gender (the
// child record has no pronoun field). Hindi / Hinglish wording is [U: native review].
//
// Slot types (gate.js reads them): name = the child's first name; curriculum = verified kit text about the TOPIC
// (masked for the full lexicon, checked against the severe list); child = the child's own words (full lexicon);
// number / date = numeric slots (every digit in a line must be one of them).

const MONTH = {
  en: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
  hinglish: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
  hi: ["जनवरी", "फ़रवरी", "मार्च", "अप्रैल", "मई", "जून", "जुलाई", "अगस्त", "सितंबर", "अक्टूबर", "नवंबर", "दिसंबर"],
};
/** A date slot { y, m, d } (local calendar parts) in the report language: "6 Oct" / "6 अक्टूबर". */
export const fmtDate = (lang, dt) => `${dt.d} ${MONTH[lang][dt.m - 1]}`;

const q = (s) => `“${s}”`;
const times = { en: (k) => (k === 1 ? "once" : `${k} times`), hinglish: (k) => `${k} baar`, hi: (k) => `${k} बार` };
const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;
const daysEn = (d) => plural(d, "day", "days");

/** Things in every home for the weekly activity, by subject [U: native review]. `parentNeedsMaths: false` by type. Hinglish
 * values open a sentence in their template, so they are capitalised. */
export const HOME_OBJECT = {
  maths: { en: "coins, spoons or rotis", hinglish: "Sikkon, chammach ya roti", hi: "सिक्कों, चम्मचों या रोटी" },
  science: { en: "things around the house", hinglish: "Ghar ki cheezon", hi: "घर की चीज़ों" },
  evs: { en: "things around the house", hinglish: "Ghar ki cheezon", hi: "घर की चीज़ों" },
  english: { en: "a story book or a sign on the road", hinglish: "Kahani ki kitaab ya sadak ke kisi board", hi: "कहानी की किताब या सड़क के किसी बोर्ड" },
  hindi: { en: "a story book or a sign on the road", hinglish: "Kahani ki kitaab ya sadak ke kisi board", hi: "कहानी की किताब या सड़क के किसी बोर्ड" },
  sst: { en: "a map, the calendar or a newspaper picture", hinglish: "Naqshe, calendar ya akhbaar ki photo", hi: "नक़्शे, कैलेंडर या अख़बार की फ़ोटो" },
};

/**
 * Claim shapes. `slots`: slot → type. Each language renders from typed slots only.
 * @type {Record<string, { slots: Record<string, 'name'|'curriculum'|'child'|'number'|'date'|'object'>, en: Function, hinglish: Function, hi: Function, locked?: boolean }>}
 */
export const SHAPES = {
  "header.daily": { slots: { lessons: "number", min: "number" },
    en: (s) => `${plural(s.lessons, "lesson", "lessons")} · ${s.min} min`,
    hinglish: (s) => `${s.lessons} lesson · ${s.min} min`,
    hi: (s) => `${s.lessons} पाठ · ${s.min} मिनट` },
  "header.weekly": { slots: { lessons: "number", days: "number", min: "number" },
    en: (s) => `${plural(s.lessons, "lesson", "lessons")} · ${daysEn(s.days)} · ${s.min} min`,
    hinglish: (s) => `${s.lessons} lesson · ${s.days} din · ${s.min} min`,
    hi: (s) => `${s.lessons} पाठ · ${s.days} दिन · ${s.min} मिनट` },
  // a daily window with evidence but no lesson row (practice outside a lesson): never "0 lessons · 0 min" above rows
  "header.nolesson": { slots: {},
    en: () => "No lesson started; some time with Taxila outside a lesson.",
    hinglish: () => "Koi lesson shuru nahi hua; lesson ke bahar Taxila ke saath thoda samay.",
    hi: () => "कोई पाठ शुरू नहीं हुआ; पाठ के बाहर Taxila के साथ थोड़ा समय।" },
  "header.zero": { slots: {},
    en: () => "No lessons this week.",
    hinglish: () => "Is hafte koi lesson nahi hua.",
    hi: () => "इस हफ़्ते कोई पाठ नहीं हुआ।" },

  // Delayed success. The previous contact can be a teach row, a wrong or helped answer (derive.js), so the copy says
  // only when the topic last CAME UP, never "right again" / "baad bhi sahi" (which would claim the earlier time was right).
  "st.delayed": { slots: { skill: "curriculum", d: "number" },
    en: (s) => `${q(s.skill)}: right on the first try without help, ${daysEn(s.d)} after it last came up.`,
    hinglish: (s) => `${q(s.skill)}: ${s.d} din baad phir aaya, aur pehli baar mein bina madad ke sahi.`,
    hi: (s) => `${q(s.skill)}: ${s.d} दिन बाद फिर आया, और पहली बार में बिना मदद के सही।` },
  "st.delayed_before": { slots: { skill: "curriculum", d: "number", date: "date" },
    en: (s) => `On ${s.date}: ${q(s.skill)} right on the first try without help, ${daysEn(s.d)} after it last came up.`,
    hinglish: (s) => `${s.date} ko: ${q(s.skill)} ${s.d} din baad phir aaya, aur pehli baar mein bina madad ke sahi.`,
    hi: (s) => `${s.date} को: ${q(s.skill)} ${s.d} दिन बाद फिर आया, और पहली बार में बिना मदद के सही।` },
  // calibration-gated (CALIBRATION.k7Passed): the only shape that may say pakka
  "st.pakka": { locked: true, slots: { skill: "curriculum", d: "number", k: "number" },
    en: (s) => `${q(s.skill)} is now pakka: right on the first try on ${s.k} different questions, the last one ${daysEn(s.d)} after it last came up.`,
    hinglish: (s) => `${q(s.skill)} ab pakka: ${s.k} alag sawaalon par pehli baar mein sahi, aakhri wala ${s.d} din ke gap ke baad.`,
    hi: (s) => `${q(s.skill)} अब पक्का: ${s.k} अलग सवालों पर पहली बार में सही, आख़िरी वाला ${s.d} दिन के अंतर के बाद।` },
  "st.explained": { slots: { name: "name", skill: "curriculum", k: "number" },
    en: (s) => `${s.name} explained ${q(s.skill)} in their own words ${times.en(s.k)}.`,
    hinglish: (s) => `${s.name} ne ${q(s.skill)} ${times.hinglish(s.k)} apne shabdon mein samjhaya.`,
    hi: (s) => `${s.name} ने ${q(s.skill)} ${times.hi(s.k)} अपने शब्दों में समझाया।` },
  "st.transfer": { slots: { name: "name", skill: "curriculum", k: "number" },
    en: (s) => `${s.name} used ${q(s.skill)} in a new kind of question${s.k > 1 ? `, ${s.k} times` : ""}.`,
    hinglish: (s) => `${s.name} ne ${q(s.skill)} ko naye tarah ke sawaal mein lagaya${s.k > 1 ? `, ${s.k} baar` : ""}.`,
    hi: (s) => `${s.name} ने ${q(s.skill)} को नए तरह के सवाल में लगाया${s.k > 1 ? `, ${s.k} बार` : ""}।` },
  "st.errorspot": { slots: { name: "name", skill: "curriculum", k: "number" },
    en: (s) => `${s.name} spotted and fixed a mistake in a pretend friend's work on ${q(s.skill)}${s.k > 1 ? `, ${s.k} times` : ""}.`,
    hinglish: (s) => `${s.name} ne ${q(s.skill)} mein ek pretend dost ki galti pakdi aur theek ki${s.k > 1 ? `, ${s.k} baar` : ""}.`,
    hi: (s) => `${s.name} ने ${q(s.skill)} में एक नक़ली दोस्त की ग़लती पकड़ी और ठीक की${s.k > 1 ? `, ${s.k} बार` : ""}।` },

  "row.work": { slots: { skill: "curriculum", n: "number", k: "number" },
    en: (s) => `Practised ${q(s.skill)}: ${plural(s.n, "question", "questions")}, ${s.k} right on the first try without help.`,
    hinglish: (s) => `${q(s.skill)} par ${s.n} sawaal kiye, ${s.k} pehli baar mein bina madad ke sahi.`,
    hi: (s) => `${q(s.skill)} पर ${s.n} सवाल किए, ${s.k} पहली बार में बिना मदद के सही।` },
  "row.started": { slots: { skill: "curriculum" },
    en: (s) => `Started ${q(s.skill)}.`,
    hinglish: (s) => `${q(s.skill)} shuru kiya.`,
    hi: (s) => `${q(s.skill)} शुरू किया।` },

  // growth edge, three parts (S11): the task feature · [hedged reasoning, only past the diagnostic gate] · Taxila's re-check date
  "tricky.work": { slots: { skill: "curriculum", n: "number", k: "number", date: "date" },
    en: (s) => `Still working on ${q(s.skill)}: ${s.k} of ${s.n} right on the first try so far. It comes back on ${s.date}.`,
    hinglish: (s) => `Abhi ${q(s.skill)} par kaam chal raha hai: ${s.n} mein se ${s.k} pehli baar mein sahi. ${s.date} ko yeh phir aayega.`,
    hi: (s) => `अभी ${q(s.skill)} पर काम चल रहा है: ${s.n} में से ${s.k} पहली बार में सही। ${s.date} को यह फिर आएगा।` },
  "tricky.mixup": { slots: { skill: "curriculum", belief: "curriculum", n: "number", k: "number", date: "date" },
    en: (s) => `Still working on ${q(s.skill)}: answers like ${s.k} of ${s.n} fit a common mix-up, ${q(s.belief)}. It comes back on ${s.date}.`,
    hinglish: (s) => `Abhi ${q(s.skill)} par kaam chal raha hai: ${s.n} mein se ${s.k} jawab ek aam confusion se milte hain, ${q(s.belief)}. ${s.date} ko yeh phir aayega.`,
    hi: (s) => `अभी ${q(s.skill)} पर काम चल रहा है: ${s.n} में से ${s.k} जवाब एक आम उलझन से मिलते हैं, ${q(s.belief)}। ${s.date} को यह फिर आएगा।` },

  // no scheduled re-check yet (FSRS sets one only once a skill is learned): the action is the placement rule itself —
  // content/next-topic.js pickTopic teaches the first not-done topic again, or back-chains to its prerequisite
  "tricky.work_next": { slots: { skill: "curriculum", n: "number", k: "number" },
    en: (s) => `Still working on ${q(s.skill)}: ${s.k} of ${s.n} right on the first try so far. Taxila comes back to it, or to the step before it, in the next lessons.`,
    hinglish: (s) => `Abhi ${q(s.skill)} par kaam chal raha hai: ${s.n} mein se ${s.k} pehli baar mein sahi. Agle lessons mein yeh, ya isse pehle wala step, phir aayega.`,
    hi: (s) => `अभी ${q(s.skill)} पर काम चल रहा है: ${s.n} में से ${s.k} पहली बार में सही। अगले पाठों में यह, या इससे पहले वाला कदम, फिर आएगा।` },
  "tricky.mixup_next": { slots: { skill: "curriculum", belief: "curriculum", n: "number", k: "number" },
    en: (s) => `Still working on ${q(s.skill)}: answers like ${s.k} of ${s.n} fit a common mix-up, ${q(s.belief)}. Taxila comes back to it, or to the step before it, in the next lessons.`,
    hinglish: (s) => `Abhi ${q(s.skill)} par kaam chal raha hai: ${s.n} mein se ${s.k} jawab ek aam confusion se milte hain, ${q(s.belief)}. Agle lessons mein yeh, ya isse pehle wala step, phir aayega.`,
    hi: (s) => `अभी ${q(s.skill)} पर काम चल रहा है: ${s.n} में से ${s.k} जवाब एक आम उलझन से मिलते हैं, ${q(s.belief)}। अगले पाठों में यह, या इससे पहले वाला कदम, फिर आएगा।` },

  // (no interest shape: memory.text is model paraphrase, not a typed value; see config.js and decision reports-no-interest-line)

  // S12: fact → activity (object + ask) → praise cue → failure cue. Rank 1-2: from a skill with first-try successes only (PLI18).
  "home.skill": { slots: { name: "name", skill: "curriculum", object: "object" },
    en: (s) => `At home: ${s.name} has been practising ${q(s.skill)}. With ${s.object}, ask ${s.name} to show you how it works, then name one step ${s.name} did. If it goes wrong, ask what ${s.name} tried and what to try next.`,
    hinglish: (s) => `Ghar par: ${s.name} ${q(s.skill)} par kaam kar rahe hain. ${s.object} ke saath ${s.name} se kahiye ki aapko karke dikhayein, phir ${s.name} ke kiye ek step ka naam lekar taareef kijiye. Galat ho jaaye to poochhiye: kya try kiya, aage kya try karenge?`,
    hi: (s) => `घर पर: ${s.name} ${q(s.skill)} पर काम कर रहे हैं। ${s.object} के साथ ${s.name} से कहिए कि आपको करके दिखाएँ, फिर ${s.name} के किए एक कदम का नाम लेकर तारीफ़ कीजिए। ग़लत हो जाए तो पूछिए: क्या आज़माया, आगे क्या आज़माएँगे?` },
};

/**
 * Fixed copy: reviewed strings that make no claim about the child (title, disclosure, footers, the generic home
 * activity). The gate checks a fixed line equals its registered text exactly; only these are exempt from the full
 * lexicon (S16's "not a comparison with other children" would otherwise trip it).
 */
export const FIXED = {
  "title.daily": { en: () => "Today with Taxila", hinglish: () => "Aaj Taxila ke saath", hi: () => "आज Taxila के साथ" },
  "title.weekly": { en: () => "This week with Taxila", hinglish: () => "Is hafte Taxila ke saath", hi: () => "इस हफ़्ते Taxila के साथ" },
  disclosure: { en: (s) => `This is Taxila, an AI teacher, with a note about ${s.name}.`,
    hinglish: (s) => `Main Taxila hoon, ek AI teacher. Yeh ${s.name} ke baare mein ek note hai.`,
    hi: (s) => `मैं Taxila हूँ, एक AI टीचर। यह ${s.name} के बारे में एक नोट है।` },
  // no 'behind' / 'peeche' / 'पीछे' (the prediction list's words) even in exempt fixed copy
  "footer.howweknow": { en: () => "Tap a line to see the questions for it.", hinglish: () => "Kisi line par tap karke uske sawaal dekhiye.",
    hi: () => "किसी लाइन पर टैप करके उसके सवाल देखिए।" },
  "footer.notamark": { en: () => "This note is not a mark, not a comparison with other children and not a prediction.",
    hinglish: () => "Yeh note koi number nahi hai, dusre bachchon se tulna nahi hai, aur koi bhavishyavani nahi hai.",
    hi: () => "यह नोट कोई अंक नहीं है, दूसरे बच्चों से तुलना नहीं है, और कोई भविष्यवाणी नहीं है।" },
  "home.generic": { en: (s) => `At home: ask ${s.name} what they would like to learn about next, and listen to the answer.`,
    hinglish: (s) => `Ghar par: ${s.name} se poochhiye ki aage kis cheez ke baare mein seekhna chahenge, aur jawab dhyaan se suniye.`,
    hi: (s) => `घर पर: ${s.name} से पूछिए कि आगे किस चीज़ के बारे में सीखना चाहेंगे, और जवाब ध्यान से सुनिए।` },
  close: { en: () => "That is all for now.", hinglish: () => "Abhi ke liye itna hi.", hi: () => "अभी के लिए इतना ही।" },
};

/**
 * "How this line is counted" in the evidence drawer: reviewed fixed copy per claim shape, in every report language
 * (the internal `rule` strings in claims.js are for the checker and audit, never shown: they hold jargon and locked
 * words). Every string passes the full lexicon and the locked list (tests/reports-gate.test.mjs). [U: native review]
 */
const TOPIC_ROWS = {
  en: "Every question on this topic in this period, and how many were right on the first try with no hint and no help asked first. Questions where someone at home helped are not counted.",
  hinglish: "Is samay mein is topic ke saare sawaal, aur unmein se kitne pehli baar mein, bina hint aur bina pehle madad maange, sahi hue. Jin sawaalon mein ghar par kisi ne madad ki, woh nahi gine jaate.",
  hi: "इस समय में इस विषय के सारे सवाल, और उनमें से कितने पहली बार में, बिना संकेत और बिना पहले मदद माँगे, सही हुए। जिन सवालों में घर पर किसी ने मदद की, वे नहीं गिने जाते।",
};
const TRICKY_HOW = {
  en: "Fewer than half of at least 3 questions on this topic were right on the first try.",
  hinglish: "Is topic ke kam se kam 3 sawaalon mein se aadhe se kam pehli baar mein sahi hue.",
  hi: "इस विषय के कम से कम 3 सवालों में से आधे से कम पहली बार में सही हुए।",
};
const MIXUP_HOW = {
  en: "Answers so far on questions made to tell this mix-up apart, and how many of them fit it.",
  hinglish: "Ab tak un sawaalon ke jawab jo is confusion ko pehchaanne ke liye bane hain, aur unmein se kitne isse milte hain.",
  hi: "अब तक उन सवालों के जवाब जो इस उलझन को पहचानने के लिए बने हैं, और उनमें से कितने इससे मिलते हैं।",
};
const DATED = { en: "The date is Taxila's next planned check of this topic.", hinglish: "Tareekh is topic ki Taxila ki agli tay jaanch hai.", hi: "तारीख़ इस विषय की Taxila की अगली तय जाँच है।" };
const NEXT = { en: "The topic is not finished yet, so Taxila's next lessons return to it or to the step before it.",
  hinglish: "Yeh topic abhi poora nahi hua; Taxila ke agle lessons isi par ya isse pehle wale step par lautte hain.",
  hi: "यह विषय अभी पूरा नहीं हुआ, तो Taxila के अगले पाठ इसी पर या इससे पहले वाले कदम पर लौटते हैं।" };
const join2 = (a, b) => Object.fromEntries(Object.keys(a).map((l) => [l, `${a[l]} ${b[l]}`]));
const DELAYED_HOW = {
  en: "A question on this topic right on the first try with no hint, in a different session at least 20 hours after the topic last came up. It says nothing about how that earlier time went.",
  hinglish: "Is topic ka ek sawaal pehli baar mein, bina hint ke, sahi; alag session mein, topic pichhli baar aane ke kam se kam 20 ghante baad. Pichhli baar kaisa gaya, yeh line uske baare mein kuch nahi kehti.",
  hi: "इस विषय का एक सवाल पहली बार में, बिना संकेत के, सही; अलग सत्र में, विषय पिछली बार आने के कम से कम 20 घंटे बाद। पिछली बार कैसा गया, यह लाइन उसके बारे में कुछ नहीं कहती।",
};
const NO_GAME = { en: "Game rounds are not counted.", hinglish: "Game ke round nahi gine jaate.", hi: "खेल के राउंड नहीं गिने जाते।" };
const HEADER_HOW = {
  en: "Lessons that started in this period, and their minutes from start to end. A lesson that did not close counts up to its last question.",
  hinglish: "Is samay mein shuru hue lessons, aur shuru se khatam tak ke minute. Jo lesson band nahi hua, uska samay aakhri sawaal tak gina gaya.",
  hi: "इस समय में शुरू हुए पाठ, और शुरू से ख़त्म तक के मिनट। जो पाठ बंद नहीं हुआ, उसका समय आख़िरी सवाल तक गिना गया।",
};
export const HOW = {
  "header.daily": HEADER_HOW, "header.weekly": HEADER_HOW,
  "header.zero": { en: "No lesson started in this week.", hinglish: "Is hafte koi lesson shuru nahi hua.", hi: "इस हफ़्ते कोई पाठ शुरू नहीं हुआ।" },
  "header.nolesson": { en: "No lesson started on this day. The rows below are questions or teaching outside a lesson.",
    hinglish: "Is din koi lesson shuru nahi hua. Neeche ke sawaal ya padhai lesson ke bahar hue.", hi: "इस दिन कोई पाठ शुरू नहीं हुआ। नीचे के सवाल या पढ़ाई पाठ के बाहर हुए।" },
  "st.delayed": DELAYED_HOW, "st.delayed_before": DELAYED_HOW,
  "st.pakka": { en: "At least two such later first-try answers, on different questions, at least a day apart. Shown only once Taxila's own accuracy check has passed.",
    hinglish: "Kam se kam do aise baad ke pehli-baar sahi jawab, alag sawaalon par, ek din ke gap par. Yeh tabhi dikhta hai jab Taxila ki apni accuracy jaanch paas ho.",
    hi: "कम से कम दो ऐसे बाद के पहली-बार सही जवाब, अलग सवालों पर, एक दिन के अंतर पर। यह तभी दिखता है जब Taxila की अपनी सटीकता जाँच पास हो।" },
  "st.explained": join2({ en: "Times in this period the idea was explained in their own words, and the check found a full or nearly full explanation.",
    hinglish: "Is samay mein kitni baar apne shabdon mein idea samjhaya, aur jaanch mein poora ya lagbhag poora mila.",
    hi: "इस समय में कितनी बार अपने शब्दों में बात समझाई, और जाँच में पूरी या लगभग पूरी मिली।" }, NO_GAME),
  "st.transfer": join2({ en: "Times a new kind of question on the same idea was answered right.", hinglish: "Usi idea par naye tarah ke sawaal kitni baar sahi hue.",
    hi: "उसी बात पर नए तरह के सवाल कितनी बार सही हुए।" }, NO_GAME),
  "st.errorspot": join2({ en: "Times the mistake in a pretend friend's work was found and fixed.", hinglish: "Pretend dost ke kaam mein galti kitni baar pakdi aur theek ki.",
    hi: "नक़ली दोस्त के काम में ग़लती कितनी बार पकड़ी और ठीक की।" }, NO_GAME),
  "row.work": TOPIC_ROWS,
  "row.started": { en: "Taxila taught this topic in this period; no questions on it yet.", hinglish: "Is samay mein Taxila ne yeh topic padhaya; is par abhi sawaal nahi hue.",
    hi: "इस समय में Taxila ने यह विषय पढ़ाया; इस पर अभी सवाल नहीं हुए।" },
  "tricky.work": join2(TRICKY_HOW, DATED), "tricky.work_next": join2(TRICKY_HOW, NEXT),
  "tricky.mixup": join2(MIXUP_HOW, DATED), "tricky.mixup_next": join2(MIXUP_HOW, NEXT),
  "home.skill": { en: "A topic with right first-try answers in this period. The activity is a suggestion, not a task.",
    hinglish: "Is samay mein jis topic par pehli baar mein sahi jawab aaye. Activity ek sujhaav hai, kaam nahi.",
    hi: "इस समय में जिस विषय पर पहली बार में सही जवाब आए। गतिविधि एक सुझाव है, काम नहीं।" },
};

/** Approved connectives for Lane B (ids only reach the model's output; text is ours). */
export const CONNECTIVES = {
  "c.next": { en: "Next:", hinglish: "Aage:", hi: "आगे:" },
  "c.also": { en: "Also:", hinglish: "Aur:", hi: "और:" },
  "c.good": { en: "A good moment:", hinglish: "Ek achha pal:", hi: "एक अच्छा पल:" },
  "c.tricky": { en: "One part still in progress:", hinglish: "Ek hissa jis par kaam chal raha hai:", hi: "एक हिस्सा जिस पर काम चल रहा है:" },
};

export const renderShape = (shapeId, lang, slots) => {
  const sh = SHAPES[shapeId];
  if (!sh) throw new Error(`reports: unknown shape ${shapeId}`);
  const s = { ...slots };
  for (const [k, type] of Object.entries(sh.slots)) {
    if (s[k] === undefined || s[k] === null) throw new Error(`reports: ${shapeId} slot ${k} missing`);
    if (type === "date") s[k] = fmtDate(lang, s[k]);
    if (type === "object") s[k] = HOME_OBJECT[s[k]]?.[lang] ?? (() => { throw new Error(`reports: unknown home object ${s[k]}`); })();
  }
  return sh[lang](s);
};
export const renderFixed = (id, lang, slots = {}) => {
  const f = FIXED[id];
  if (!f) throw new Error(`reports: unknown fixed copy ${id}`);
  return f[lang](slots);
};
