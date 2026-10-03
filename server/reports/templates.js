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
  "header.zero": { slots: {},
    en: () => "No lessons this week.",
    hinglish: () => "Is hafte koi lesson nahi hua.",
    hi: () => "इस हफ़्ते कोई पाठ नहीं हुआ।" },

  "st.delayed": { slots: { skill: "curriculum", d: "number" },
    en: (s) => `${q(s.skill)}: right again ${daysEn(s.d)} later, on the first try without help.`,
    hinglish: (s) => `${q(s.skill)}: ${s.d} din baad bhi pehli baar mein bina madad ke sahi.`,
    hi: (s) => `${q(s.skill)}: ${s.d} दिन बाद भी पहली बार में बिना मदद के सही।` },
  "st.delayed_before": { slots: { skill: "curriculum", d: "number", date: "date" },
    en: (s) => `On ${s.date}: ${q(s.skill)} right again ${daysEn(s.d)} later, on the first try without help.`,
    hinglish: (s) => `${s.date} ko: ${q(s.skill)} ${s.d} din baad bhi pehli baar mein bina madad ke sahi.`,
    hi: (s) => `${s.date} को: ${q(s.skill)} ${s.d} दिन बाद भी पहली बार में बिना मदद के सही।` },
  // calibration-gated (CALIBRATION.k7Passed): the only shape that may say pakka
  "st.pakka": { locked: true, slots: { skill: "curriculum", d: "number", k: "number" },
    en: (s) => `${q(s.skill)} is now pakka: right again after ${daysEn(s.d)}, on ${s.k} different questions.`,
    hinglish: (s) => `${q(s.skill)} ab pakka: ${s.d} din baad bhi sahi, ${s.k} alag sawaalon par.`,
    hi: (s) => `${q(s.skill)} अब पक्का: ${s.d} दिन बाद भी सही, ${s.k} अलग सवालों पर।` },
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

  interest: { slots: { name: "name", interest: "child" },
    en: (s) => `${s.name} said they like ${s.interest}; Taxila will use it in examples.`,
    hinglish: (s) => `${s.name} ne bataya ki unhe ${s.interest} pasand hai; Taxila ke examples mein yeh aayega.`,
    hi: (s) => `${s.name} ने बताया कि उन्हें ${s.interest} पसंद है; Taxila के उदाहरणों में यह आएगा।` },

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
  "footer.howweknow": { en: () => "Tap a line to see the questions behind it.", hinglish: () => "Kisi line par tap karke uske peeche ke sawaal dekhiye.",
    hi: () => "किसी लाइन पर टैप करके उसके पीछे के सवाल देखिए।" },
  "footer.notamark": { en: () => "This note is not a mark, not a comparison with other children and not a prediction.",
    hinglish: () => "Yeh note koi number nahi hai, dusre bachchon se tulna nahi hai, aur koi bhavishyavani nahi hai.",
    hi: () => "यह नोट कोई अंक नहीं है, दूसरे बच्चों से तुलना नहीं है, और कोई भविष्यवाणी नहीं है।" },
  "home.generic": { en: (s) => `At home: ask ${s.name} what they would like to learn about next, and listen to the answer.`,
    hinglish: (s) => `Ghar par: ${s.name} se poochhiye ki aage kis cheez ke baare mein seekhna chahenge, aur jawab dhyaan se suniye.`,
    hi: (s) => `घर पर: ${s.name} से पूछिए कि आगे किस चीज़ के बारे में सीखना चाहेंगे, और जवाब ध्यान से सुनिए।` },
  close: { en: () => "That is all for now.", hinglish: () => "Abhi ke liye itna hi.", hi: () => "अभी के लिए इतना ही।" },
};

/** Approved connectives for Lane B (ids only reach the model's output; text is ours). */
export const CONNECTIVES = {
  "c.next": { en: "Next:", hinglish: "Aage:", hi: "आगे:" },
  "c.also": { en: "Also:", hinglish: "Aur:", hi: "और:" },
  "c.good": { en: "A good moment:", hinglish: "Ek achha pal:", hi: "एक अच्छा पल:" },
  "c.tricky": { en: "One part still in progress:", hinglish: "Ek hissa jis par kaam chal raha hai:", hi: "एक हिस्सा जिस पर काम चल रहा है:" },
  "c.home": { en: "For home:", hinglish: "Ghar ke liye:", hi: "घर के लिए:" },
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
