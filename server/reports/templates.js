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
/** A month slot { y, m } (S14 Then → now) in the report language: "Apr" / "अप्रैल" (no digits: the term names its months). */
export const fmtMonth = (lang, mo) => MONTH[lang][mo.m - 1];

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

/** A school subject in the report language (S17's exam line). [U: native review] */
/** S5: the way Taxila explained a new idea (learner/formats.js FORMAT_WORDS; F-codes never render). What Taxila DID, never a claim
 *  about how the child learns. */
export const WAY_LABEL = {
  F1: { en: "a short explanation with the key thing on screen", hinglish: "chhoti si samjhaish, khaas baat screen par", hi: "छोटी सी समझाइश, ख़ास बात स्क्रीन पर" },
  F2: { en: "one solved example first", hinglish: "pehle ek hal kiya hua udaharan", hi: "पहले एक हल किया हुआ उदाहरण" },
  F3: { en: "a picture or number line first", hinglish: "pehle ek chitra ya sankhya rekha", hi: "पहले एक चित्र या संख्या रेखा" },
  F4: { en: "a story or example from what they like", hinglish: "unki pasand ki kahani ya udaharan", hi: "उनकी पसंद की कहानी या उदाहरण" },
  F5: { en: "a rhythm, like a chant", hinglish: "ek lay, jaise koi chant", hi: "एक लय, जैसे कोई गीत" },
  F6: { en: "a game with no points", hinglish: "bina points ka khel", hi: "बिना अंकों का खेल" },
  F7: { en: "their turn to explain", hinglish: "unki baari samjhane ki", hi: "उनकी बारी समझाने की" },
  F8: { en: "trying first, then the explanation", hinglish: "pehle koshish, phir samjhaish", hi: "पहले कोशिश, फिर समझाइश" },
};

export const SUBJECT_LABEL = {
  maths: { en: "Maths", hinglish: "Maths", hi: "गणित" },
  science: { en: "Science", hinglish: "Science", hi: "विज्ञान" },
  evs: { en: "EVS", hinglish: "EVS", hi: "पर्यावरण" },
  english: { en: "English", hinglish: "English", hi: "अंग्रेज़ी" },
  hindi: { en: "Hindi", hinglish: "Hindi", hi: "हिंदी" },
  sst: { en: "Social Science", hinglish: "Social Science", hi: "सामाजिक विज्ञान" },
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
  "header.monthly": { slots: { lessons: "number", days: "number", min: "number" },
    en: (s) => `${plural(s.lessons, "lesson", "lessons")} · ${daysEn(s.days)} · ${s.min} min`,
    hinglish: (s) => `${s.lessons} lesson · ${s.days} din · ${s.min} min`,
    hi: (s) => `${s.lessons} पाठ · ${s.days} दिन · ${s.min} मिनट` },
  "header.zero_month": { slots: {},
    en: () => "No lessons this month.",
    hinglish: () => "Is mahine koi lesson nahi hua.",
    hi: () => "इस महीने कोई पाठ नहीं हुआ।" },
  // round 7 F batch R2: the term report (Apr-Sep, Oct-Mar)
  "header.term": { slots: { lessons: "number", days: "number", min: "number" },
    en: (s) => `${plural(s.lessons, "lesson", "lessons")} · ${daysEn(s.days)} · ${s.min} min`,
    hinglish: (s) => `${s.lessons} lesson · ${s.days} din · ${s.min} min`,
    hi: (s) => `${s.lessons} पाठ · ${s.days} दिन · ${s.min} मिनट` },
  "header.zero_term": { slots: {},
    en: () => "No lessons this term.",
    hinglish: () => "Is term mein koi lesson nahi hua.",
    hi: () => "इस टर्म में कोई पाठ नहीं हुआ।" },
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

  // ───────────── round 7 F: monthly sections and the weekly exam line (PARENT-REPORT §5) ─────────────
  // S4 holding up over time (L0): wording is about topics and the schedule, never memory (S4 banned list)
  "hold.week": { slots: { n: "number", k: "number" },
    en: (s) => `Topics that came back after a week or more: ${plural(s.n, "question", "questions")}, ${s.k} right on the first try without help.`,
    hinglish: (s) => `Jo topics ek hafte ya zyada baad phir aaye, un par ${s.n} sawaal; ${s.k} pehli baar mein bina madad ke sahi.`,
    hi: (s) => `जो विषय एक हफ़्ते या ज़्यादा बाद फिर आए, उन पर ${s.n} सवाल; ${s.k} पहली बार में बिना मदद के सही।` },
  "hold.few": { slots: { name: "name", n: "number" },
    en: (s) => `Taxila is still learning how topics hold up for ${s.name} after a week or more: ${plural(s.n, "question", "questions")} like that so far.`,
    hinglish: (s) => `${s.name} ke liye topics ek hafte baad kaise tikte hain, Taxila abhi seekh rahi hai: ab tak aise ${s.n} sawaal.`,
    hi: (s) => `${s.name} के लिए विषय एक हफ़्ते बाद कैसे टिकते हैं, Taxila अभी सीख रही है: अब तक ऐसे ${s.n} सवाल।` },
  // S6 when it gets hard: what Taxila did, and what happened next (never a trait)
  "hard.hint": { slots: { h: "number", k: "number" },
    en: (s) => `When a question was hard, Taxila gave a hint before any answer ${times.en(s.h)}; ${s.k} of those were then solved.`,
    hinglish: (s) => `Jab sawaal mushkil laga, Taxila ne jawab se pehle hint diya: ${times.hinglish(s.h)}; unmein se ${s.k} phir hal hue.`,
    hi: (s) => `जब सवाल मुश्किल लगा, Taxila ने जवाब से पहले संकेत दिया: ${times.hi(s.h)}; उनमें से ${s.k} फिर हल हुए।` },
  // S7 curiosity: the child's own questions (question_jar), counted; Taxila's follow-up
  "curious.asked": { slots: { name: "name", q: "number", k: "number" },
    en: (s) => `${s.name} asked ${plural(s.q, "question", "questions")} of their own in lessons; Taxila came back to ${s.k} of them in a later lesson.`,
    hinglish: (s) => `${s.name} ne lessons mein apne ${s.q} sawaal poochhe; Taxila ne unmein se ${s.k} par agle lesson mein baat ki.`,
    hi: (s) => `${s.name} ने पाठों में अपने ${s.q} सवाल पूछे; Taxila ने उनमें से ${s.k} पर अगले पाठ में बात की।` },
  "curious.asked_open": { slots: { name: "name", q: "number" },
    en: (s) => `${s.name} asked ${plural(s.q, "question", "questions")} of their own in lessons; Taxila comes back to them in the next lessons.`,
    hinglish: (s) => `${s.name} ne lessons mein apne ${s.q} sawaal poochhe; Taxila agle lessons mein in par baat karegi.`,
    hi: (s) => `${s.name} ने पाठों में अपने ${s.q} सवाल पूछे; Taxila अगले पाठों में इन पर बात करेगी।` },
  // S9 routine: counts only (no streaks, no missed days)
  "routine.days": { slots: { n: "number", d: "number", m: "number" },
    en: (s) => `Lessons on ${s.n} of ${s.d} days this month; a usual lesson was about ${s.m} min.`,
    hinglish: (s) => `Is mahine ${s.d} mein se ${s.n} din lesson hue; aam taur par ek lesson lagbhag ${s.m} min ka.`,
    hi: (s) => `इस महीने ${s.d} में से ${s.n} दिन पाठ हुए; आम तौर पर एक पाठ लगभग ${s.m} मिनट का।` },
  // S5 ways Taxila explained (counts of what Taxila did; never "learns best by")
  "ways.used": { slots: { n: "number", k: "number", way: "way", t: "number" },
    en: (s) => `Taxila explained ${plural(s.n, "new idea", "new ideas")} this month, in ${plural(s.k, "way", "ways")}; ${s.t} of them with ${s.way}.`,
    hinglish: (s) => `Is mahine Taxila ne ${s.n} nayi baatein ${s.k} tareekon se samjhaayi; unmein se ${s.t} ${s.way} ke saath.`,
    hi: (s) => `इस महीने Taxila ने ${s.n} नई बातें ${s.k} तरीक़ों से समझाईं; उनमें से ${s.t} ${s.way} के साथ।` },
  "routine.days_term": { slots: { n: "number", d: "number", m: "number" },
    en: (s) => `Lessons on ${s.n} of ${s.d} days this term; a usual lesson was about ${s.m} min.`,
    hinglish: (s) => `Is term ${s.d} mein se ${s.n} din lesson hue; aam taur par ek lesson lagbhag ${s.m} min ka.`,
    hi: (s) => `इस टर्म ${s.d} में से ${s.n} दिन पाठ हुए; आम तौर पर एक पाठ लगभग ${s.m} मिनट का।` },
  "ways.used_term": { slots: { n: "number", k: "number", way: "way", t: "number" },
    en: (s) => `Taxila explained ${plural(s.n, "new idea", "new ideas")} this term, in ${plural(s.k, "way", "ways")}; ${s.t} of them with ${s.way}.`,
    hinglish: (s) => `Is term Taxila ne ${s.n} nayi baatein ${s.k} tareekon se samjhaayi; unmein se ${s.t} ${s.way} ke saath.`,
    hi: (s) => `इस टर्म Taxila ने ${s.n} नई बातें ${s.k} तरीक़ों से समझाईं; उनमें से ${s.t} ${s.way} के साथ।` },
  // S14 Then → now (term only, RP-D6): the two months' counts side by side; the rule that admitted it is in HOW, never
  // a verdict word ("improved", "better", "sabse") in the line itself
  "change.row": { slots: { skill: "curriculum", m1: "month", n1: "number", k1: "number", m2: "month", n2: "number", k2: "number" },
    en: (s) => `${q(s.skill)}: in ${s.m1}, ${s.k1} of ${s.n1} right on the first try without help; in ${s.m2}, ${s.k2} of ${s.n2}.`,
    hinglish: (s) => `${q(s.skill)}: ${s.m1} mein ${s.n1} mein se ${s.k1} pehli baar mein bina madad ke sahi; ${s.m2} mein ${s.n2} mein se ${s.k2}.`,
    hi: (s) => `${q(s.skill)}: ${s.m1} में ${s.n1} में से ${s.k1} पहली बार में बिना मदद के सही; ${s.m2} में ${s.n2} में से ${s.k2}।` },
  // S14 still learning: every other topic practised in the term, counted (no rate, no direction)
  "still.count": { slots: { n: "number" },
    en: (s) => `Still learning: ${plural(s.n, "other topic", "other topics")} practised this term. A change shows here only once there are enough questions in two months far enough apart.`,
    hinglish: (s) => `Abhi seekh rahe hain: is term ${s.n} aur topics par kaam hua. Yahan badlaav tabhi dikhta hai jab do door ke mahinon mein kaafi sawaal hon.`,
    hi: (s) => `अभी सीख रहे हैं: इस टर्म ${s.n} और विषयों पर काम हुआ। यहाँ बदलाव तभी दिखता है जब दो दूर के महीनों में काफ़ी सवाल हों।` },
  // S13 what we're trying next: the next scheduled re-check
  "next.recheck": { slots: { skill: "curriculum", date: "date" },
    en: (s) => `Next: Taxila checks ${q(s.skill)} again on ${s.date}.`,
    hinglish: (s) => `Aage: Taxila ${s.date} ko ${q(s.skill)} phir jaanchegi.`,
    hi: (s) => `आगे: Taxila ${s.date} को ${q(s.skill)} फिर जाँचेगी।` },
  // S17 exam shape (weekly, inside a test window the parent entered)
  // no pressure words (lexicon "pressure": test, exam, परीक्षा, marks): the dates the parent entered, in plain words
  "exam.review": { slots: { subject: "subject" },
    en: (s) => `${s.subject} at school, the dates you entered: Taxila is going over those chapters again, with no new topics in the last two days.`,
    hinglish: (s) => `School mein ${s.subject}, aapki di hui tareekhein: Taxila un chapters ko dohra rahi hai, aur aakhri do din koi naya topic nahi.`,
    hi: (s) => `स्कूल में ${s.subject}, आपकी दी हुई तारीख़ें: Taxila उन अध्यायों को दोहरा रही है, और आख़िरी दो दिन कोई नया विषय नहीं।` },

  // (no interest shape: memory.text is model paraphrase, not a typed value; see config.js and decision reports-no-interest-line)

  // S12: fact → activity (object + ask) → praise cue → failure cue. Rank 1-2: from a skill with first-try successes only (PLI18).
  "home.skill": { slots: { name: "name", skill: "curriculum", object: "object" },
    en: (s) => `At home: ${s.name} has been practising ${q(s.skill)}. With ${s.object}, ask ${s.name} to show you how it works, then name one step ${s.name} did. If it goes wrong, ask what ${s.name} tried and what to try next.`,
    hinglish: (s) => `Ghar par: ${s.name} ${q(s.skill)} par kaam kar rahe hain. ${s.object} ke saath ${s.name} se kahiye ki aapko karke dikhayein, phir ${s.name} ke kiye ek step ka naam lekar taareef kijiye. Galat ho jaaye to poochhiye: kya try kiya, aage kya try karenge?`,
    hi: (s) => `घर पर: ${s.name} ${q(s.skill)} पर काम कर रहे हैं। ${s.object} के साथ ${s.name} से कहिए कि आपको करके दिखाएँ, फिर ${s.name} के किए एक कदम का नाम लेकर तारीफ़ कीजिए। ग़लत हो जाए तो पूछिए: क्या आज़माया, आगे क्या आज़माएँगे?` },

  // Cold-start placement note (round 7 F, server/placement/note.js; not a report line): where a new child begins in a
  // subject and what that was made from. One shape per answer value, so no free word rides in a slot; never a level word
  // (lexicon "prediction": behind / on track) and never a class number (rejected grade-equivalent-parent-band).
  "place.start": { slots: { name: "name", subject: "subject", skill: "curriculum" },
    en: (s) => `${s.subject}: Taxila will begin with ${q(s.skill)}, and move along as ${s.name}'s answers in lessons show the next step.`,
    hinglish: (s) => `${s.subject}: Taxila ${q(s.skill)} se shuru karegi, aur lessons mein ${s.name} ke jawaab dekhkar aage badhegi.`,
    hi: (s) => `${s.subject}: Taxila ${q(s.skill)} से शुरू करेगी, और पाठों में ${s.name} के जवाब देखकर आगे बढ़ेगी।` },
  "place.easier": { slots: { subject: "subject" },
    en: (s) => `${s.subject} starts a little before the class's current chapter, so the first lessons go smoothly.`,
    hinglish: (s) => `${s.subject} class ke abhi ke chapter se thoda pehle se shuru hoga, taaki pehle lessons aaraam se chalein.`,
    hi: (s) => `${s.subject} कक्षा के अभी के अध्याय से थोड़ा पहले से शुरू होगा, ताकि पहले पाठ आराम से चलें।` },
  "place.parent_hard": { slots: { subject: "subject" },
    en: (s) => `You told us ${s.subject} feels hard right now.`, hinglish: (s) => `Aapne bataya ki ${s.subject} abhi mushkil lagta hai.`,
    hi: (s) => `आपने बताया कि ${s.subject} अभी मुश्किल लगता है।` },
  "place.parent_fine": { slots: { subject: "subject" },
    en: (s) => `You told us ${s.subject} feels about right.`, hinglish: (s) => `Aapne bataya ki ${s.subject} theek-thaak lagta hai.`,
    hi: (s) => `आपने बताया कि ${s.subject} ठीक-ठाक लगता है।` },
  "place.parent_easy": { slots: { subject: "subject" },
    en: (s) => `You told us ${s.subject} feels easy.`, hinglish: (s) => `Aapne bataya ki ${s.subject} aasaan lagta hai.`,
    hi: (s) => `आपने बताया कि ${s.subject} आसान लगता है।` },
  "place.child_tricky": { slots: { name: "name", subject: "subject" },
    en: (s) => `${s.name} picked “tricky” for ${s.subject}.`, hinglish: (s) => `${s.name} ne ${s.subject} ke liye “tricky” chuna.`,
    hi: (s) => `${s.name} ने ${s.subject} के लिए “मुश्किल” चुना।` },
  "place.child_okay": { slots: { name: "name", subject: "subject" },
    en: (s) => `${s.name} picked “okay” for ${s.subject}.`, hinglish: (s) => `${s.name} ne ${s.subject} ke liye “okay” chuna.`,
    hi: (s) => `${s.name} ने ${s.subject} के लिए “ठीक” चुना।` },
  "place.child_easy": { slots: { name: "name", subject: "subject" },
    en: (s) => `${s.name} picked “easy” for ${s.subject}.`, hinglish: (s) => `${s.name} ne ${s.subject} ke liye “easy” chuna.`,
    hi: (s) => `${s.name} ने ${s.subject} के लिए “आसान” चुना।` },
  "place.firstweek": { slots: {},
    en: () => "The first two lessons stay on familiar ground, then one new idea comes in at a time.",
    hinglish: () => "Pehle do lessons jaani-pehchaani cheezon par rahenge, phir ek baar mein ek naya idea aayega.",
    hi: () => "पहले दो पाठ जानी-पहचानी चीज़ों पर रहेंगे, फिर एक बार में एक नई बात आएगी।" },
};

/**
 * Fixed copy: reviewed strings that make no claim about the child (title, disclosure, footers, the generic home
 * activity). The gate checks a fixed line equals its registered text exactly; only these are exempt from the full
 * lexicon (S16's "not a comparison with other children" would otherwise trip it).
 */
export const FIXED = {
  "title.daily": { en: () => "Today with Taxila", hinglish: () => "Aaj Taxila ke saath", hi: () => "आज Taxila के साथ" },
  "title.weekly": { en: () => "This week with Taxila", hinglish: () => "Is hafte Taxila ke saath", hi: () => "इस हफ़्ते Taxila के साथ" },
  "title.monthly": { en: () => "This month with Taxila", hinglish: () => "Is mahine Taxila ke saath", hi: () => "इस महीने Taxila के साथ" },
  "title.term": { en: () => "This term with Taxila", hinglish: () => "Is term Taxila ke saath", hi: () => "इस टर्म Taxila के साथ" },
  // S13 when no re-check is scheduled after the month (required monthly)
  "next.generic": { en: () => "Next: Taxila keeps to the plan in the coming lessons and will share what it finds.",
    hinglish: () => "Aage: Taxila agle lessons mein plan ke hisaab se chalegi aur jo milega, batayegi.",
    hi: () => "आगे: Taxila अगले पाठों में योजना के हिसाब से चलेगी और जो मिलेगा, बताएगी।" },
  // S16 the cross-context note (once per monthly report)
  "footer.context": { en: () => "Children can be different with different people and on different days. What you see at home is just as real.",
    hinglish: () => "Bachche alag logon ke saath aur alag dinon mein alag ho sakte hain. Ghar par jo aap dekhte hain, woh bhi utna hi sach hai.",
    hi: () => "बच्चे अलग लोगों के साथ और अलग दिनों में अलग हो सकते हैं। घर पर जो आप देखते हैं, वह भी उतना ही सच है।" },
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
const PLACE_HOW = { en: "Made from the answers you and your child gave when you joined, and the class. Nothing extra was asked of your child. It changes on its own once a few lessons have shown where to begin.",
  hinglish: "Judte samay aapke aur bachche ke diye jawaab, aur class se bana. Bachche se alag se kuch nahi poochha gaya. Kuch lessons ke baad yeh apne aap badal jaata hai.",
  hi: "जुड़ते समय आपके और बच्चे के दिए जवाब, और कक्षा से बना। बच्चे से अलग से कुछ नहीं पूछा गया। कुछ पाठों के बाद यह अपने आप बदल जाता है।" };
export const HOW = {
  "place.start": PLACE_HOW, "place.easier": PLACE_HOW, "place.parent_hard": PLACE_HOW, "place.parent_fine": PLACE_HOW, "place.parent_easy": PLACE_HOW,
  "place.child_tricky": PLACE_HOW, "place.child_okay": PLACE_HOW, "place.child_easy": PLACE_HOW,
  "place.firstweek": { en: "The plan for a new child's first lessons in a subject: two lessons with no new topic, then one new idea per lesson.",
    hinglish: "Naye bachche ke kisi subject ke pehle lessons ka plan: do lessons bina naye topic ke, phir har lesson mein ek naya idea.",
    hi: "नए बच्चे के किसी विषय के पहले पाठों की योजना: दो पाठ बिना नए विषय के, फिर हर पाठ में एक नई बात।" },
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
  "header.monthly": HEADER_HOW,
  "header.zero_month": { en: "No lesson started in this month.", hinglish: "Is mahine koi lesson shuru nahi hua.", hi: "इस महीने कोई पाठ शुरू नहीं हुआ।" },
  "hold.week": { en: "Questions on a topic whose last appearance was at least a week earlier, and how many were right on the first try with no hint and no help asked first.",
    hinglish: "Un topics ke sawaal jo pichhli baar kam se kam ek hafta pehle aaye the, aur unmein se kitne pehli baar mein, bina hint aur bina pehle madad maange, sahi hue.",
    hi: "उन विषयों के सवाल जो पिछली बार कम से कम एक हफ़्ता पहले आए थे, और उनमें से कितने पहली बार में, बिना संकेत और बिना पहले मदद माँगे, सही हुए।" },
  "hold.few": { en: "Questions on a topic whose last appearance was at least a week earlier. There are not enough yet to say more.",
    hinglish: "Un topics ke sawaal jo pichhli baar kam se kam ek hafta pehle aaye the. Abhi itne nahi hain ki aur kuch kaha jaaye.",
    hi: "उन विषयों के सवाल जो पिछली बार कम से कम एक हफ़्ता पहले आए थे। अभी इतने नहीं हैं कि और कुछ कहा जाए।" },
  "hard.hint": { en: "Questions where Taxila gave one or more hints before the answer, and how many of those were then solved with the hints.",
    hinglish: "Woh sawaal jinmein Taxila ne jawab se pehle ek ya zyada hint diye, aur unmein se kitne hint ke saath hal hue.",
    hi: "वे सवाल जिनमें Taxila ने जवाब से पहले एक या ज़्यादा संकेत दिए, और उनमें से कितने संकेत के साथ हल हुए।" },
  "curious.asked": { en: "Questions the child asked in lessons that Taxila kept for later, and how many Taxila has come back to.",
    hinglish: "Lessons mein bachche ke poochhe sawaal jo Taxila ne baad ke liye rakhe, aur unmein se kitno par Taxila laut chuki hai.",
    hi: "पाठों में बच्चे के पूछे सवाल जो Taxila ने बाद के लिए रखे, और उनमें से कितनों पर Taxila लौट चुकी है।" },
  "curious.asked_open": { en: "Questions the child asked in lessons that Taxila kept for later.",
    hinglish: "Lessons mein bachche ke poochhe sawaal jo Taxila ne baad ke liye rakhe.",
    hi: "पाठों में बच्चे के पूछे सवाल जो Taxila ने बाद के लिए रखे।" },
  "routine.days": { en: "Days of the month with a lesson, and the middle lesson length.",
    hinglish: "Mahine ke woh din jin par lesson hua, aur beech wali lesson ki lambai.",
    hi: "महीने के वे दिन जिन पर पाठ हुआ, और बीच वाली पाठ की लंबाई।" },
  "ways.used": { en: "How many new ideas Taxila explained this month and in how many ways, and how many of them in one of those ways. It says what Taxila did, not how your child learns.",
    hinglish: "Is mahine Taxila ne kitni nayi baatein kitne tareekon se samjhaayi, aur unmein se kitni ek khaas tareeke se. Yeh batata hai Taxila ne kya kiya, yeh nahin ki aapka bachcha kaise seekhta hai.",
    hi: "इस महीने Taxila ने कितनी नई बातें कितने तरीक़ों से समझाईं, और उनमें से कितनी एक ख़ास तरीक़े से। यह बताता है कि Taxila ने क्या किया, यह नहीं कि आपका बच्चा कैसे सीखता है।" },
  "next.recheck": DATED,
  "header.term": HEADER_HOW,
  "header.zero_term": { en: "No lesson started in this term.", hinglish: "Is term mein koi lesson shuru nahi hua.", hi: "इस टर्म में कोई पाठ शुरू नहीं हुआ।" },
  "routine.days_term": { en: "Days of the term with a lesson, and the middle lesson length.",
    hinglish: "Term ke woh din jin par lesson hua, aur beech wali lesson ki lambai.",
    hi: "टर्म के वे दिन जिन पर पाठ हुआ, और बीच वाली पाठ की लंबाई।" },
  "ways.used_term": { en: "How many new ideas Taxila explained this term and in how many ways, and how many of them in one of those ways. It says what Taxila did, not how your child learns.",
    hinglish: "Is term Taxila ne kitni nayi baatein kitne tareekon se samjhaayi, aur unmein se kitni ek khaas tareeke se. Yeh batata hai Taxila ne kya kiya, yeh nahin ki aapka bachcha kaise seekhta hai.",
    hi: "इस टर्म Taxila ने कितनी नई बातें कितने तरीक़ों से समझाईं, और उनमें से कितनी एक ख़ास तरीक़े से। यह बताता है कि Taxila ने क्या किया, यह नहीं कि आपका बच्चा कैसे सीखता है।" },
  "change.row": { en: "Every question on this topic in the first month of the term with at least 10 of them, and in the last such month, at least 2 months later. A line appears only when first-try answers rose by a rule fixed before any child's data: a clear rise that chance alone is very unlikely to explain.",
    hinglish: "Term ke pehle mahine ke saare sawaal jismein is topic ke kam se kam 10 sawaal hue, aur aakhri aise mahine ke, kam se kam 2 mahine baad. Line tabhi aati hai jab pehli baar wale sahi jawab ek pehle se tay niyam se badhe: saaf badhat, jise sirf sanyog se samjhana bahut mushkil hai.",
    hi: "टर्म के पहले महीने के सारे सवाल जिसमें इस विषय के कम से कम 10 सवाल हुए, और आख़िरी ऐसे महीने के, कम से कम 2 महीने बाद। लाइन तभी आती है जब पहली बार वाले सही जवाब एक पहले से तय नियम से बढ़े: साफ़ बढ़त, जिसे सिर्फ़ संयोग से समझाना बहुत मुश्किल है।" },
  "still.count": { en: "Topics with questions this term that have no line above. It says nothing about whether they went up or down.",
    hinglish: "Is term ke woh topics jin par sawaal hue par upar koi line nahi hai. Yeh nahi batata ki woh badhe ya ghate.",
    hi: "इस टर्म के वे विषय जिन पर सवाल हुए पर ऊपर कोई लाइन नहीं है। यह नहीं बताता कि वे बढ़े या घटे।" },
  "exam.review": { en: "The school dates you entered in the Parent corner. In the last two days before them Taxila only goes over earlier work.",
    hinglish: "Parent corner mein aapki daali school ki tareekhein. Unse pehle ke aakhri do din Taxila sirf pehle ka kaam dohrati hai.",
    hi: "Parent corner में आपकी डाली स्कूल की तारीख़ें। उनसे पहले के आख़िरी दो दिन Taxila सिर्फ़ पहले का काम दोहराती है।" },
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
    if (type === "month") s[k] = fmtMonth(lang, s[k]);
    if (type === "object") s[k] = HOME_OBJECT[s[k]]?.[lang] ?? (() => { throw new Error(`reports: unknown home object ${s[k]}`); })();
    if (type === "subject") s[k] = SUBJECT_LABEL[s[k]]?.[lang] ?? (() => { throw new Error(`reports: unknown subject ${s[k]}`); })();
    if (type === "way") s[k] = WAY_LABEL[s[k]]?.[lang] ?? (() => { throw new Error(`reports: unknown way ${s[k]}`); })();
  }
  return sh[lang](s);
};
export const renderFixed = (id, lang, slots = {}) => {
  const f = FIXED[id];
  if (!f) throw new Error(`reports: unknown fixed copy ${id}`);
  return f[lang](slots);
};
