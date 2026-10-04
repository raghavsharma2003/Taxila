// G-SIG (TEACHER-BRAIN §15.1; BUILD-PLAN W2-E acceptance): does the signals block ride on the production classify call
// without moving the grading labels, and are its dialogue acts right?
//   A. label agreement: the REAL classify() on evals/classify-accuracy.mjs's cases, plain vs signals arm, same deployment
//      (run that eval twice with --out, TAXILA_CLASSIFY_SIGNALS unset / =1, then pass both files here with --agree a,b);
//   B. act accuracy: 120 child replies (10 acts × 12; Hinglish, Hindi, English; written to reach the model, i.e. no exact
//      key and no bare "pata nahi") through the real classify() with the block on, scored against labels written BEFORE
//      the run. SINGLE RATER (the W2-E author): the two-rater κ the gate asks for is an owner/coder task (O22c).
//   NODE_USE_ENV_PROXY=1 node evals/teacher-brain/g-sig.mjs [--model grok-4-1-fast-non-reasoning] [--out f.json]
//   node evals/teacher-brain/g-sig.mjs --agree plain.json,signals.json
// Not in `npm test` (it calls Azure). Child lines are inputs, never prompt text.
import fs from "fs";
const ROOT = new URL("../..", import.meta.url).pathname;
for (const line of fs.readFileSync(ROOT + ".env.local", "utf8").split("\n")) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^"(.*)"$/, "$1");
}
const arg = (n, d) => { const i = process.argv.indexOf(n); return i > 0 ? process.argv[i + 1] : d; };

if (arg("--agree")) {
  const [a, b] = arg("--agree").split(",").map((f) => JSON.parse(fs.readFileSync(f, "utf8")));
  for (const model of Object.keys(a.out)) {
    const ra = a.out[model].rows.filter((r) => !r.skipped), rb = b.out[model]?.rows.filter((r) => !r.skipped) ?? [];
    let same = 0, n = 0;
    for (let i = 0; i < Math.min(ra.length, rb.length); i++) {
      if (ra[i].text !== rb[i].text) continue;
      n += 1;
      if (ra[i].got === rb[i].got && (ra[i].gotMis ?? null) === (rb[i].gotMis ?? null)) same += 1;
    }
    console.log(`${model}: label agreement plain vs signals ${same}/${n} (${(100 * same / Math.max(1, n)).toFixed(1)}%); exact plain ${a.out[model].exact}/${a.out[model].n}, signals ${b.out[model]?.exact}/${b.out[model]?.n}; p50 ${a.out[model].p50} → ${b.out[model]?.p50} ms`);
  }
  process.exit(0);
}

process.env.TAXILA_CLASSIFY_SIGNALS = "1";
const MODEL = arg("--model", "grok-4-1-fast-non-reasoning");
process.env.DEPLOY_CLASSIFY = MODEL;
process.env.TAXILA_CLASSIFY_FALLBACK = "0"; // measure the deployment itself
await import("../../server/net.js");
const { getKit } = await import("../../server/content/index.js");
const { classify, classifyFast, targetFor } = await import("../../server/director/classify.js");
const kit = await getKit("c4-maths-ch01-t01", { generate: false });
const item = kit.items.find((i) => i.id === "c4-maths-ch01-t01-i01"); // "A dice is a cube. How many flat faces does it have?"

// [reply, act] — labels written before any run.
const SET = [
  // answer (attempts the question, right or wrong)
  ["mujhe lagta hai cube ke chhe faces hote hain", "answer"], ["शायद चार faces हैं dice के", "answer"], ["I think it has six flat sides", "answer"],
  ["Teen dikhte hain toh teen hi honge", "answer"], ["dice ke saare taraf gin ke chhe aaye", "answer"], ["पाँच faces होंगे शायद", "answer"],
  ["six hain didi, upar neeche aur chaar side", "answer"], ["It has eight faces maybe", "answer"], ["chhe wale faces, ek se chhe tak dots", "answer"],
  ["मेरे हिसाब से छह", "answer"], ["four sides and top bottom so six", "answer"], ["teen faces hi hote hain na", "answer"],
  // question_curious (a new question out of interest)
  ["didi dice pe dots kyun hote hain numbers kyun nahi", "question_curious"], ["kya football bhi cube hota hai?", "question_curious"],
  ["Why do dice have opposite sides that add up to seven?", "question_curious"], ["सूरज किस shape का होता है दीदी?", "question_curious"],
  ["kya koi dice gol bhi hota hai?", "question_curious"], ["Can a shape have a hundred faces?", "question_curious"],
  ["didi pyramid ke kitne faces hote hain?", "question_curious"], ["रुबिक क्यूब में कितने छोटे cube होते हैं?", "question_curious"],
  ["Who made the first dice?", "question_curious"], ["kya ghar bhi cuboid hota hai?", "question_curious"],
  ["didi ice cube bhi cube hai kya?", "question_curious"], ["What shape is a TV remote?", "question_curious"],
  // question_clarify (asks what the question means)
  ["face matlab kya didi?", "question_clarify"], ["flat face ka matlab kya hota hai?", "question_clarify"], ["What do you mean by flat faces?", "question_clarify"],
  ["फेस मतलब चेहरा?", "question_clarify"], ["didi dobara bolo kya poocha", "question_clarify"], ["Do you mean the sides with dots?", "question_clarify"],
  ["kaunsa dice, ludo wala?", "question_clarify"], ["सवाल समझ नहीं आया, फिर से बताइए", "question_clarify"], ["are corners also faces?", "question_clarify"],
  ["andar ke bhi gine kya?", "question_clarify"], ["kya side ko face bolte hain?", "question_clarify"], ["Should I count the bottom one too?", "question_clarify"],
  // chit_chat
  ["didi aaj school mein holiday thi", "chit_chat"], ["mere paas naya cycle aaya hai", "chit_chat"], ["My brother is watching cartoons", "chit_chat"],
  ["आज बहुत गर्मी है दीदी", "chit_chat"], ["didi aapne khana khaya?", "chit_chat"], ["kal mera birthday hai pata hai", "chit_chat"],
  ["We went to the market today", "chit_chat"], ["मम्मी ने आज पराठे बनाए", "chit_chat"], ["didi baarish ho rahi hai bahar", "chit_chat"],
  ["mera dost aaj nahi aaya school", "chit_chat"], ["I have a new pencil box", "chit_chat"], ["हमारे घर बिल्ली आई थी", "chit_chat"],
  // idk_not_known (never learned it)
  ["maine yeh kabhi padha hi nahi didi", "idk_not_known"], ["humein school mein abhi faces nahi padhaya", "idk_not_known"],
  ["We have not learnt shapes like this yet", "idk_not_known"], ["यह तो मुझे सिखाया ही नहीं गया", "idk_not_known"],
  ["face wala chapter abhi aaya hi nahi", "idk_not_known"], ["I never learned what a face is", "idk_not_known"],
  ["mujhe yeh topic bilkul nahi aata, kabhi nahi padha", "idk_not_known"], ["ये हमने कभी नहीं पढ़ा दीदी", "idk_not_known"],
  ["teacher ne yeh abhi tak nahi sikhaya", "idk_not_known"], ["This is new for me, never studied it", "idk_not_known"],
  ["cube ke baare mein kuch nahi padha maine", "idk_not_known"], ["हमारी किताब में यह नहीं है", "idk_not_known"],
  // idk_cant_recall (knew it, cannot remember now)
  ["yaad tha didi par abhi bhool gaya", "idk_cant_recall"], ["pichle hafte padha tha, abhi yaad nahi aa raha", "idk_cant_recall"],
  ["I knew this yesterday but I forgot", "idk_cant_recall"], ["पढ़ा था पर अभी याद नहीं आ रहा", "idk_cant_recall"],
  ["zubaan pe hai par yaad nahi aa raha", "idk_cant_recall"], ["I learnt it in class, it slipped my mind", "idk_cant_recall"],
  ["sir ne bataya tha, bhool gayi main", "idk_cant_recall"], ["याद था, अब भूल गया दीदी", "idk_cant_recall"],
  ["ek minute, yaad karta hoon, bhool gaya", "idk_cant_recall"], ["We did it last week, I can't remember now", "idk_cant_recall"],
  ["pehle aata tha ab bhool gaya", "idk_cant_recall"], ["मैंने रटा था पर भूल गई", "idk_cant_recall"],
  // frustration_words
  ["ye bahut mushkil hai, mujhse nahi hoga", "frustration_words"], ["uff mujhe gussa aa raha hai is sawaal pe", "frustration_words"],
  ["This is so hard, I hate this", "frustration_words"], ["मुझसे नहीं होता यह, बहुत मुश्किल है", "frustration_words"],
  ["har baar galat ho jata hai mera", "frustration_words"], ["I'm so bad at this, it's annoying", "frustration_words"],
  ["bas karo didi, samajh hi nahi aata", "frustration_words"], ["यह सवाल बेकार है", "frustration_words"],
  ["main kabhi sahi nahi kar paunga", "frustration_words"], ["Ugh, this is too difficult for me", "frustration_words"],
  ["dimaag kharab ho gaya is se", "frustration_words"], ["मैं थक गया हूँ इससे, बहुत कठिन", "frustration_words"],
  // pride_words
  ["maine khud se gin liya, mujhe aata hai!", "pride_words"], ["dekha didi main sahi tha", "pride_words"], ["I knew it! I'm good at shapes", "pride_words"],
  ["मैंने खुद से निकाला!", "pride_words"], ["main toh class mein sabse pehle batata hoon", "pride_words"], ["Yes! I solved it myself", "pride_words"],
  ["mujhe yeh bahut achhe se aata hai", "pride_words"], ["मुझे पहले से पता था", "pride_words"], ["easy tha, maine turant kar diya", "pride_words"],
  ["I'm really good at this one", "pride_words"], ["maine apne bhai ko bhi sikhaya tha", "pride_words"], ["वाह, मैं सही था!", "pride_words"],
  // meta_slow (asks her to go slower)
  ["didi thoda dheere boliye", "meta_slow"], ["aap bahut fast bol rahe ho", "meta_slow"], ["Can you speak slower please", "meta_slow"],
  ["धीरे-धीरे समझाइए", "meta_slow"], ["aaram se batao na", "meta_slow"], ["Please slow down a little", "meta_slow"],
  ["itna jaldi mat bolo didi", "meta_slow"], ["थोड़ा धीरे बोलिए दीदी", "meta_slow"], ["ek ek karke dheere batao", "meta_slow"],
  ["You're going too fast for me", "meta_slow"], ["thoda ruk ruk ke bolo", "meta_slow"], ["आप जल्दी जल्दी बोल रही हो", "meta_slow"],
  // meta_break (a break, or to stop for now)
  ["didi thoda break le sakte hain?", "meta_break"], ["main thak gaya, baad mein karte hain", "meta_break"], ["Can we take a break now?", "meta_break"],
  ["अभी बस, बाद में पढ़ेंगे", "meta_break"], ["paani peeke aata hoon, ruko", "meta_break"], ["I want to stop for today", "meta_break"],
  ["5 minute ka break chahiye", "meta_break"], ["थोड़ी देर रुकते हैं दीदी", "meta_break"], ["ab khelne jaana hai, kal karenge", "meta_break"],
  ["Let's continue later please", "meta_break"], ["aaj ke liye itna kaafi hai", "meta_break"], ["मुझे आराम करना है अभी", "meta_break"],
];

const target = targetFor({ phase: "practice", hintLevel: 0 }, kit, { ...item, misconceptions: kit.misconceptions });
const rows = [];
const pool = 6;
let next = 0;
async function worker() {
  while (next < SET.length) {
    const i = next++;
    const [text, want] = SET[i];
    const args = { target, childText: text, heard: item.prompt_en, asrConfidence: 0.9, typed: false, classLevel: 4, trace: [] };
    if (classifyFast(args).result) { rows[i] = { text, want, skipped: "bytes decided" }; continue; }
    const t0 = performance.now();
    const r = await classify(args);
    rows[i] = { text, want, got: r.signals?.act ?? null, source: r.source, ms: Math.round(performance.now() - t0), outcome: r.outcome };
  }
}
await Promise.all(Array.from({ length: pool }, worker));
const scored = rows.filter((r) => !r.skipped && r.source === "model");
const right = scored.filter((r) => r.got === r.want);
const byAct = {};
for (const r of scored) { const b = (byAct[r.want] ??= { n: 0, right: 0, confusions: {} }); b.n += 1; if (r.got === r.want) b.right += 1; else b.confusions[r.got] = (b.confusions[r.got] ?? 0) + 1; }
const ms = scored.map((r) => r.ms).sort((a, b) => a - b);
console.log(`${MODEL}: act accuracy ${right.length}/${scored.length} (${(right.length / Math.max(1, scored.length)).toFixed(3)}), skipped ${rows.length - scored.length}, missing block ${scored.filter((r) => !r.got).length}, p50 ${ms[Math.floor(ms.length / 2)]} ms p90 ${ms[Math.floor(ms.length * 0.9)]} ms`);
for (const [act, b] of Object.entries(byAct)) console.log(`  ${act.padEnd(18)} ${b.right}/${b.n} ${Object.keys(b.confusions).length ? JSON.stringify(b.confusions) : ""}`);
const o = arg("--out");
if (o) fs.writeFileSync(o, JSON.stringify({ date: new Date().toISOString().slice(0, 10), model: MODEL, n: scored.length, right: right.length, byAct, rows, rater: "single (W2-E author)" }, null, 1));
process.exit(0);
