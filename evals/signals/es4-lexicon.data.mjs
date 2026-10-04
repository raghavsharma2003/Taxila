// ES-4 lexicon precision set (SIGNALS-SPEC §7.1, SG-M7 bar: precision ≥ 0.8 per lexicon before it changes behaviour).
// 5 lexicons × 60 hand-written frames × 2 answer fills = 600 turns. Each frame carries the author's label (true = the
// construct is present). LIMITS, stated so the number is not over-read:
//   - single rater (this workstream), so no κ; the spec's two-rater review has not happened;
//   - the same author wrote the lexicons, so precision here is OPTIMISTIC; confusers were written to be adversarial
//     (the construct's surface words in another sense), roughly half of each set;
//   - effective diversity is 60 frames per lexicon, not 120.
// "{a}" is replaced by two answer fills per frame.

const FILLS = [["5", "paanch"], ["aadha", "half"]];

const hedge = [
  // positives
  ["shayad {a}", 1], ["mujhe lagta hai {a}", 1], ["I think {a}", 1], ["maybe {a}", 1], ["{a} ho sakta hai", 1], ["pakka nahi par {a}", 1],
  ["शायद {a}", 1], ["probably {a}", 1], ["not sure, {a}?", 1], ["kya pata, {a}", 1], ["i guess {a}", 1], ["sure nahi hoon, {a}", 1],
  ["lagta hai {a}", 1], ["mere ko lagta {a}", 1], ["{a} might be", 1], ["could be {a}", 1], ["{a}, I think so", 1], ["sort of {a}", 1],
  ["mujhe lag raha hai {a}", 1], ["{a}… maybe", 1], ["mere hisaab se {a}", 1], ["perhaps {a}", 1], ["I believe it's {a}", 1], ["guess karun toh {a}", 1],
  ["shaayad {a} hai", 1], ["aisa lagta hai {a}", 1], ["हो सकता है {a}", 1], ["im not sure {a}", 1], ["kind of {a}", 1], ["{a} hoga shayad", 1],
  // confusers
  ["{a} hai na?", 0], ["{a}, right?", 0], ["dar lagta hai mujhe, {a}", 0], ["bhook lagti hai, {a}", 0], ["{a} pakka", 0], ["100% {a}", 0],
  ["{a}, I know it", 0], ["I am sure, {a}", 0], ["{a} hai bilkul", 0], ["mujhe pata hai {a}", 0], ["{a} obviously", 0], ["definitely {a}", 0],
  ["teacher ne bola shayad {a}", 0], ["'maybe' ka matlab kya hai", 0], ["thand lagti hai, {a}", 0], ["{a}! easy", 0], ["{a} hi hoga, pakka", 0], ["accha lagta hai ye game, {a}", 0],
  ["{a} hai ki nahi?", 0], ["sach mein {a}", 0], ["{a}, done", 0], ["yes {a}", 0], ["{a} confirm", 0], ["haan {a}", 0],
  ["mummy kehti hai maybe kal, {a}", 0], ["think karo, {a}", 0], ["probability chapter hai, {a}", 0], ["{a} ki shape", 0], ["bura lagta hai jab galat hota, {a}", 0], ["{a} sahi", 0],
];
const cantRecall = [
  ["bhool gaya", 1], ["bhool gayi didi", 1], ["yaad nahi aa raha", 1], ["याद नहीं आ रहा", 1], ["I forgot", 1], ["can't remember", 1], ["yaad tha par bhool gaya", 1],
  ["dimag se nikal gaya", 1], ["zubaan pe hai", 1], ["I don't remember", 1], ["भूल गया", 1], ["bhul gya", 1], ["yaad nahi", 1], ["i forgot the formula", 1],
  ["kal yaad tha", 1], ["it's on the tip of my tongue", 1], ["bhool gaye hum", 1], ["cannot remember now", 1], ["yaad nahi aa rahi", 1], ["forgot it", 1],
  ["dimaag mein tha abhi", 1], ["slipped my mind", 1], ["abhi yaad aa jayega", 1], ["I knew it a minute ago", 1], ["tha mere paas, nikal gaya", 1],
  ["bhool gaya tha par ab yaad aaya, {a}", 0], ["nahi bhoola, {a}", 0], ["pata nahi", 0], ["I don't know", 0], ["no idea", 0], ["kabhi padha nahi", 0],
  ["yaad hai, {a}", 0], ["I remember, {a}", 0], ["mujhe yaad hai {a}", 0], ["bhool gaya ki homework tha", 0], ["yaad karo na didi", 0], ["forget it, {a}", 0],
  ["main kabhi nahi bhoolta, {a}", 0], ["remember karna padega? {a}", 0], ["teacher ne kaha bhool jao, {a}", 0], ["yaad aa gaya! {a}", 0], ["don't forget, {a}", 0],
  ["mummy bhool gayi lunch, {a}", 0], ["bhoolna mat, {a}", 0], ["yaadon mein, {a}", 0], ["remembered it, {a}", 0], ["{a}, yaad tha", 0], ["nahi aata", 0], ["ye kabhi seekha hi nahi", 0],
  ["never learned it", 0], ["koi idea nahi", 0], ["samajh nahi aaya", 0], ["didi yaad hai pichli baar?", 0], ["kal bhool gaya tha, aaj yaad hai {a}", 0], ["forgetting is normal, {a}", 0], ["{a}", 0], ["hmm", 0],
];
const initiative = [
  ["main karun?", 1], ["main try karu", 1], ["can I try?", 1], ["let me try", 1], ["mujhe karne do", 1], ["aise bhi kar sakte, {a}", 1], ["ek aur tarika hai", 1],
  ["another way is {a}", 1], ["ek aur do", 1], ["one more please", 1], ["harder wala do", 1], ["what about 3/4?", 1], ["main bataun?", 1], ["मैं करूं?", 1],
  ["pehle 2 phir {a}", 1], ["first double it then {a}", 1], ["mera tarika: {a}", 1], ["next one", 1], ["aur sawal do", 1], ["can I solve it", 1],
  ["main isko tod ke karti hoon", 1], ["I split it, {a}", 1], ["kya ye pizza pe bhi kaam karega?", 1], ["isse related ek sawal", 1], ["what if we use a circle", 1], ["let me do it", 1],
  ["main nahi karunga", 0], ["mujhe nahi karna", 0], ["aap karo", 0], ["you do it", 0], ["{a}", 0], ["pata nahi", 0], ["ek minute", 0], ["try karna padega?", 0],
  ["ek aur galti", 0], ["phir se galat", 0], ["mujhe nahi aata karna", 0], ["mat karo", 0], ["main kyun karun?", 0], ["haan {a}", 0], ["teacher ne kaha try karo, {a}", 0],
  ["what is {a}?", 0], ["one is {a}", 0], ["first answer {a}", 0], ["another day", 0], ["bas", 0], ["kitne aur?", 0], ["aur kitna", 0], ["{a} hai", 0], ["ok", 0],
  ["I tried, {a}", 0], ["main thak gaya", 0], ["kya main jaun?", 0], ["can I go?", 0], ["let me go", 0], ["mummy ko karne do", 0], ["ek aur baar galat", 0], ["one more mistake", 0], ["harder hai ye", 0], ["mujhe mat do", 0],
];
const qdepth = [
  ["ye kyun hota hai?", 1], ["kaise pata chala?", 1], ["why is it {a}?", 1], ["how do you know?", 1], ["agar 3 hota toh?", 1], ["what if it was bigger?", 1],
  ["क्यों?", 1], ["कैसे?", 1], ["suppose two pizzas?", 1], ["maan lo 10 log ho?", 1], ["iska reason kya hai, kyun?", 1], ["how does it work?", 1],
  ["kyun didi?", 1], ["why not {a}?", 1], ["kaise karte hain?", 1], ["what if we add?", 1], ["agar ulta karein toh kya hoga?", 1], ["why?", 1],
  ["how?", 1], ["kyon aisa?", 1], ["what happens if zero?", 1], ["kaise {a} aaya?", 1], ["agar denominator same ho toh?", 1], ["why does it change?", 1],
  ["is it bigger, why?", 1], ["kaise solve karein?", 1], ["kyunki?", 1], ["but how?", 1], ["aur agar 100 ho toh?", 1], ["how come?", 1],
  ["{a} hai kyunki aadha hai", 0], ["because {a}", 0], ["{a}, kyunki dono same", 0], ["kya?", 0], ["what?", 0], ["kaun sa?", 0], ["{a}?", 0],
  ["kitna?", 0], ["kab?", 0], ["where?", 0], ["which one?", 0], ["kya ye {a} hai?", 0], ["is it {a}?", 0], ["kya main jaun?", 0], ["kaisa laga?", 0],
  ["agar main bolun {a}", 0], ["how are you", 0], ["kaise ho didi", 0], ["why not", 0], ["{a} hai, kaise na ho", 0], ["agar time ho toh game", 0], ["what is this", 0],
  ["kya?", 0], ["haan?", 0], ["{a} na?", 0], ["sahi hai?", 0], ["right?", 0], ["ok?", 0], ["phir?", 0], ["aur?", 0],
];
const filler = [
  ["umm {a}", 1], ["umm matlab {a}", 1], ["aa {a}", 1], ["hmm {a}", 1], ["matlab {a}", 1], ["woh {a}", 1], ["toh {a}", 1], ["like {a}", 1], ["so {a}", 1],
  ["actually {a}", 1], ["uhh {a}", 1], ["ummm woh {a}", 1], ["achha toh {a}", 1], ["basically {a}", 1], ["haan umm {a}", 1], ["उम्म {a}", 1], ["मतलब {a}", 1],
  ["err {a}", 1], ["hmm toh {a}", 1], ["well {a}", 1], ["yaani {a}", 1], ["aaa {a}", 1], ["okay so {a}", 1], ["woh woh {a}", 1], ["mm {a}", 1],
  ["umm main soch rahi thi {a}", 1], ["toh matlab {a}", 1], ["acha {a}", 1], ["ji {a}", 1], ["so like {a}", 1],
  ["{a}", 0], ["{a} matlab aadha", 0], ["{a} toh hai", 0], ["{a} like this", 0], ["{a}, umm", 0], ["{a} hmm", 0], ["mera answer {a}", 0], ["answer {a}", 0],
  ["the answer is {a}", 0], ["{a} hai", 0], ["{a} actually", 0], ["{a} so easy", 0], ["it is {a}", 0], ["jawab {a}", 0], ["{a} woh wala", 0], ["half {a}", 0],
  ["denominator {a}", 0], ["{a} because", 0], ["{a} toh", 0], ["{a} basically", 0], ["{a} well", 0], ["{a}, achha", 0], ["{a} ji", 0], ["numerator {a}", 0],
  ["{a} aur kuch nahi", 0], ["{a} yaani aadha", 0], ["{a} like pizza", 0], ["fraction {a}", 0], ["{a} hmm sahi?", 0], ["is {a}", 0],
];

function expand(name, frames) {
  const out = [];
  frames.forEach(([t, y], i) => {
    for (const [k, fill] of FILLS.entries()) {
      const text = t.replaceAll("{a}", fill[i % 2]);
      out.push({ id: `${name}-${i}-${k}`, lexicon: name, text: t.includes("{a}") ? text : k === 0 ? t : `${t}`, y });
    }
  });
  return out;
}

export const ES4 = [...expand("hedge", hedge), ...expand("cant_recall", cantRecall), ...expand("initiative", initiative), ...expand("question_depth", qdepth), ...expand("filler_lead", filler)];
