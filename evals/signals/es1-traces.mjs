// ES-1 scripted traces (SIGNALS-SPEC §7.1): session traces from a LATENT child process, labelled by construction.
//
// What this set can and cannot show. The generator knows each turn's latent state (fragile knowledge, productive vs
// unproductive struggle, can't-recall vs never-learned, disengaged run, process win). Surface words are drawn from phrase
// banks split IN-BANK (forms the lexicons were written from) and HELD-OUT (paraphrases written separately, never added to
// a lexicon), and latent states are expressed only probabilistically (a fragile child hedges with p = 0.7; a knower says
// "I think" with p = 0.08). So ES-1 measures (a) rule implementation on in-bank forms, (b) lexicon coverage on held-out
// forms, (c) guardrails over whole sessions. It does NOT show that the rules match real children (SG-M13..M16, E1).
//
//   node evals/signals/es1-traces.mjs            → evals/signals/data/es1.jsonl (deterministic, seed 1, 400 traces)
import fs from "node:fs";
import { rng } from "./lib/metrics.mjs";

const pick = (R, xs) => xs[Math.floor(R() * xs.length)];
const LANGS = ["hi", "hinglish", "en"];
const BANDS = ["B2", "B3", "B4"];

// Phrase banks: { in: {lang: [...]}, out: {lang: [...]} }. "{a}" = the answer surface, "{w}" = a wrong answer.
const B = {
  hedge: {
    in: { hi: ["शायद {a}", "mujhe lagta hai {a}", "shayad {a} hai"], hinglish: ["shayad {a}", "mujhe lagta hai {a}", "I think {a}", "{a} ho sakta hai"], en: ["I think {a}", "maybe {a}", "not sure but {a}", "probably {a}"] },
    out: { hi: ["mere hisaab se {a}", "mere khayal se {a}"], hinglish: ["guess karun toh {a}", "{a} hoga na", "ho na ho {a}"], en: ["I believe {a}", "perhaps {a}", "I'm guessing {a}"] },
  },
  plain: { in: { hi: ["{a}", "{a} hai", "जवाब {a} है"], hinglish: ["{a}", "{a} hai", "answer {a} hai"], en: ["{a}", "it is {a}", "the answer is {a}"] }, out: { hi: ["{a}"], hinglish: ["{a}"], en: ["{a}"] } },
  falseHedge: { in: { hi: ["mujhe lagta hai {a}"], hinglish: ["I think {a}"], en: ["I think {a}"] }, out: { hi: ["mujhe lagta hai {a}"], hinglish: ["I think {a}"], en: ["I think {a}"] } },
  notKnown: { in: { hi: ["pata nahi", "मुझे नहीं पता", "nahi aata"], hinglish: ["pata nahi didi", "I don't know"], en: ["I don't know", "no idea"] }, out: { hi: ["koi idea nahi", "kuch nahi aata isme"], hinglish: ["no clue yaar", "ye toh kabhi padha hi nahi"], en: ["never learned this", "no clue"] } },
  cantRecall: { in: { hi: ["bhool gaya", "याद नहीं आ रहा", "yaad tha par bhool gayi"], hinglish: ["bhool gaya didi", "yaad nahi aa raha", "I forgot"], en: ["I forgot", "can't remember", "I don't remember"] }, out: { hi: ["dimaag mein tha abhi", "abhi yaad aa jayega"], hinglish: ["slipped ho gaya mind se", "tha mere paas, nikal gaya"], en: ["it slipped my mind", "I knew it a minute ago"] } },
  method: { in: { hi: ["aise bhi kar sakte, pehle {x} phir {a}", "dusra tarika hai, {a}"], hinglish: ["aise bhi kar sakte, pehle {x} phir {a}", "another way, first {x} then {a}"], en: ["another way: first {x} then {a}", "we can also do it, first {x} then {a}"] }, out: { hi: ["main isko tod ke karti hoon, {a}"], hinglish: ["maine do part kiye, {a}"], en: ["I split it into two parts, {a}"] } },
  repair: { in: { hi: ["{w} nahi nahi {a}", "{w} sorry {a}"], hinglish: ["{w} nahi nahi {a}", "{w} no wait {a}", "{w} sorry {a}"], en: ["{w} no wait {a}", "{w} sorry {a}", "{w} I mean {a}"] }, out: { hi: ["{w} arre {a}"], hinglish: ["{w} oops {a}"], en: ["{w} oops {a}"] } },
  think: { in: { hi: ["pehle {x} toh", "ruko sochne do"], hinglish: ["pehle {x} toh", "matlab ye aur", "ek minute"], en: ["so first {x} and", "let me think"] }, out: { hi: ["haan toh pehle wala"], hinglish: ["accha ye wala na"], en: ["okay the first one"] } },
  joke: { in: { hi: ["haha ye toh easy tha", "😂 pizza ke tukde"], hinglish: ["haha pizza wale fractions", "hehe ye toh mast tha"], en: ["haha that was easy", "lol pizza slices"] }, out: { hi: ["ye toh pizza jaisa hai 😄"], hinglish: ["main toh poora pizza kha jaungi"], en: ["I'd eat the whole pizza"] } },
  sarcasm: { in: { hi: ["haan bahut easy hai 🙄 haha", "wow kitna maza aa raha hai haha"], hinglish: ["haan bahut easy hai 🙄 haha", "wow kitna maza aa raha haha"], en: ["yeah right haha 🙄", "so fun haha"] }, out: { hi: ["great ek aur galat haha"], hinglish: ["waah kya baat hai haha"], en: ["oh wonderful haha"] } },
  slow: { in: { hi: ["thoda dheere bolo", "धीरे बोलो"], hinglish: ["slowly please", "itna fast mat bolo"], en: ["slowly please", "slow down please"] }, out: { hi: ["ek ek karke batao"], hinglish: ["itni jaldi kyun"], en: ["one at a time please"] } },
  repeat: { in: { hi: ["phir se bolo", "dobara batao"], hinglish: ["repeat please", "kya bola"], en: ["say again", "repeat please"] }, out: { hi: ["suna nahi maine"], hinglish: ["sorry miss ho gaya"], en: ["sorry I missed that"] } },
  brk: { in: { hi: ["break chahiye", "thoda aaram"], hinglish: ["break le sakte", "thoda rest karna hai"], en: ["can I take a break", "I need a break"] }, out: { hi: ["sar dukh raha hai"], hinglish: ["ab nahi hoga mujhse"], en: ["my head hurts"] } },
  minimal: { in: { hi: ["hmm", "haan", "ji"], hinglish: ["hmm", "ok", "haan"], en: ["hmm", "ok", "yes"] }, out: { hi: ["achha"], hinglish: ["theek"], en: ["sure"] } },
  stuck: { in: { hi: ["ye bahut mushkil hai, mujhse nahi hoga", "pata nahi"], hinglish: ["mujhse nahi hoga ye", "pata nahi"], en: ["this is too hard", "I don't know"] }, out: { hi: ["chhodo isko"], hinglish: ["kuch samajh nahi aa raha"], en: ["whatever"] } },
  ask: { in: { hi: ["answer batao", "aap hi bata do"], hinglish: ["answer batao na", "bas bata do"], en: ["just tell me", "tell me the answer"] }, out: { hi: ["jaldi se bol do kya hai"], hinglish: ["aap bolo na kya hai"], en: ["what is it, say it"] } },
};
const HI_NUM = ["शून्य", "एक", "दो", "तीन", "चार", "पांच", "छह", "सात", "आठ", "नौ", "दस", "ग्यारह", "बारह"];
const ROMAN_NUM = ["zero", "ek", "do", "teen", "char", "paanch", "chhe", "saat", "aath", "nau", "das", "gyarah", "barah"];
const EN_NUM = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve"];
function surfaceNum(R, n, lang) {
  if (R() < 0.6 || n > 12) return String(n);
  return lang === "hi" ? (R() < 0.5 ? HI_NUM[n] : ROMAN_NUM[n]) : lang === "hinglish" ? ROMAN_NUM[n] : EN_NUM[n];
}

const PERSONAS = {
  steady: { known: 6, fragile: 1, prod: 1, unprod: 0.3, idk: 0.3, method: 0.6, joke: 0.4, meta: 0.2, dis: 0, gaming: 0, sarcasm: 0.05 },
  fragile: { known: 2, fragile: 5, prod: 1, unprod: 0.5, idk: 0.5, method: 0.2, joke: 0.2, meta: 0.3, dis: 0.2, gaming: 0, sarcasm: 0.1 },
  struggler: { known: 1, fragile: 1, prod: 2, unprod: 3, idk: 1.5, method: 0.1, joke: 0.1, meta: 0.6, dis: 0.4, gaming: 0.2, sarcasm: 0.3 },
  gamer: { known: 1, fragile: 1, prod: 0.5, unprod: 1, idk: 0.5, method: 0, joke: 0.3, meta: 0.2, dis: 0.3, gaming: 3, sarcasm: 0.3 },
  quiet: { known: 2, fragile: 1, prod: 0.5, unprod: 0.5, idk: 1, method: 0, joke: 0, meta: 0.1, dis: 3, gaming: 0, sarcasm: 0 },
  chatty: { known: 3, fragile: 1, prod: 1, unprod: 0.5, idk: 0.3, method: 1, joke: 1.5, meta: 0.3, dis: 0, gaming: 0, sarcasm: 0.2 },
  late: { known: 2, fragile: 2, prod: 1, unprod: 2, idk: 1, method: 0.2, joke: 0.1, meta: 1.5, dis: 1, gaming: 0.3, sarcasm: 0.2 },
  parent: { known: 6, fragile: 0.5, prod: 0.2, unprod: 0.2, idk: 0.2, method: 0, joke: 0, meta: 0, dis: 0, gaming: 0, sarcasm: 0 },
};

function weighted(R, w) {
  const tot = Object.values(w).reduce((a, b) => a + b, 0);
  let x = R() * tot;
  for (const [k, v] of Object.entries(w)) { if ((x -= v) <= 0) return k; }
  return Object.keys(w)[0];
}

export function buildES1({ seed = 1, nTraces = 400, heldOutP = 0.3 } = {}) {
  const R = rng(seed);
  const traces = [];
  for (let t = 0; t < nTraces; t++) {
    const lang = LANGS[t % 3], band = BANDS[Math.floor(t / 3) % 3];
    const persona = Object.keys(PERSONAS)[t % Object.keys(PERSONAS).length];
    const signalsOn = R() < 0.5;            // TB4 classify block on/off: the lexical fallback carries half the traces
    const turns = [];
    let minutes = persona === "late" ? 14 : 2;
    let itemN = 0;
    const say = (bank, vars, forceIn = false) => {
      const split = !forceIn && R() < heldOutP ? "out" : "in";
      let s = pick(R, B[bank][split][lang]);
      for (const [k, v] of Object.entries(vars)) s = s.replaceAll(`{${k}}`, v);
      return { text: s, split };
    };
    while (turns.length < 20) {
      itemN++;
      const keyNum = 2 + Math.floor(R() * 11);
      const item = { id: `t${t}-i${itemN}`, skillId: `t${t}-s${itemN % 3}`, form: "number", kitTerms: ["half", "numerator", "denominator", "fraction"], keyNum, expectsNumber: true };
      const a = surfaceNum(R, keyNum, lang);
      const wrong = () => { let w; do { w = 1 + Math.floor(R() * 14); } while (w === keyNum); return w; };
      const ep = weighted(R, PERSONAS[persona]);
      const push = (text, verdict, truth, extra = {}) => {
        minutes += 0.6 + R() * 0.6;
        turns.push({ input: { childText: text.text ?? text, verdict, item, band, minutes: Math.round(minutes * 10) / 10, teacherLast3: ["half and numerator", "compare the fraction"], ...extra }, truth: { split: text.split ?? "in", ep, epId: `${t}-${itemN}`, ...truth } });
      };
      const mastered = R() < 0.4;
      if (ep === "known") {
        const fh = R() < 0.08;
        push(fh ? say("falseHedge", { a }, true) : say("plain", { a }), "correct", { fragile: 0, plainCorrect: 1, advance: mastered ? "advanceOk" : null }, { ledger: { mastered } });
        if (mastered) push(say("plain", { a: surfaceNum(R, keyNum, lang) }), "correct", { fragile: 0, plainCorrect: 1, advance: "advanceOk" }, { ledger: { mastered } });
      } else if (ep === "fragile") {
        const expressed = R() < 0.7;
        push(expressed ? say("hedge", { a }) : say("plain", { a }), "correct", { fragile: 1, expressed: expressed ? 1 : 0, advance: mastered ? "consolidate" : null }, { ledger: { mastered } });
      } else if (ep === "prod") {
        // different wrong answers moving toward the key, maybe a think-aloud, then a self-repair or a plain correct
        let w1 = keyNum + (R() < 0.5 ? 4 : -4); if (w1 < 1) w1 = keyNum + 5;
        const w2 = keyNum + Math.sign(w1 - keyNum) * 2;
        push(say("plain", { a: String(w1) }), "not_yet", { step: "na" });
        if (R() < 0.5) push(say("think", { x: String(w2) }), "ungraded", { step: "stuck_productive", think: 1 }, { held: 1 });
        push(say("plain", { a: String(w2) }), "not_yet", { step: "stuck_productive" });
        const rep = R() < 0.45;
                // two not_yet then an unprompted correct: persistence (effort) is true either way; a self-repair adds its own cause
        push(rep ? say("repair", { w: String(w2 + Math.sign(w1 - keyNum)), a }) : say("plain", { a }), "correct", { win: rep ? "self_repair" : "effort", wins: rep ? ["self_repair", "effort"] : ["effort"], winAny: 1 });
      } else if (ep === "unprod") {
        const w = wrong();
        const ws = surfaceNum(R, w, lang);
        push(say("plain", { a: ws }), "not_yet", { step: "na" });
        push(say("plain", { a: ws }), "not_yet", { step: "stuck_unproductive" }, { hintRung: 2 });
        const s = say("stuck", {});
        push(s, "ungraded", { step: "stuck_unproductive" }, { hintRung: 2, cls: signalsOn ? { outcome: "no_evidence", signals: { act: s.text.includes("pata") || s.text.includes("know") ? "idk_not_known" : "frustration_words", personalShare: false, interest: "none", humour: false } } : null });
        push(say("plain", { a: ws }), "not_yet", { step: "stuck_unproductive" }, { hintRung: 3 });
        if (R() < 0.3) push(say("sarcasm", {}), "ungraded", { sarcasm: 1, winAny: 0 }, { hintRung: 3 });
      } else if (ep === "idk") {
        const cr = R() < 0.5;
        const s = say(cr ? "cantRecall" : "notKnown", {});
        push(s, "ungraded", { recall: cr ? "recallCue" : "teachFresh" }, { cls: signalsOn ? { outcome: "no_evidence", signals: { act: cr ? "idk_cant_recall" : "idk_not_known", personalShare: false, interest: "none", humour: false } } : null });
      } else if (ep === "method") {
        push(say("method", { x: String(Math.max(1, keyNum - 2)), a }), "correct", { win: "insight", winAny: 1 });
      } else if (ep === "joke") {
        push(say("plain", { a }), "correct", { plainCorrect: 1, fragile: 0 });
        push(say("joke", {}), "ungraded", { win: "child_joke", winAny: 1 });
      } else if (ep === "sarcasm") {
        push(say("plain", { a: String(wrong()) }), "not_yet", { step: "na" });
        push(say("plain", { a: String(wrong()) }), "not_yet", {});
        push(say("sarcasm", {}), "ungraded", { sarcasm: 1, winAny: 0 });
      } else if (ep === "meta") {
        const k = weighted(R, { slow: 1, repeat: 1, brk: 1, tired: 0.5 });
        if (k === "tired") push({ text: lang === "en" ? "I'm so sleepy now" : "main thak gayi hoon", split: "in" }, "ungraded", { pace: 0, brk: 1 }, { relSignals: { tiredSaid: true } });
        else push(say(k, {}), "ungraded", { pace: k === "slow" || k === "repeat" ? 1 : 0, brk: k === "brk" ? 1 : 0 });
      } else if (ep === "dis") {
        for (let i = 0; i < 3; i++) push(say("minimal", {}), "ungraded", { choice: i === 2 ? 1 : 0, dis: 1 });
      } else if (ep === "gaming") {
        push(say("ask", {}), "ungraded", { gaming: 0 });
        push(say("plain", { a: String(wrong()) }), "not_yet", {});
        push(say("ask", {}), "ungraded", { gaming: 1 });
      }
    }
    // D10 semantics (affect.js gaming()): two "just tell me" asks discount the WINDOW of the last 10 child turns, so every
    // turn while ≥ 2 asks sit in that window is a true tryFirst turn.
    const asks = [];
    turns.forEach((tt, k) => {
      if (tt.truth.ep === "gaming" && tt.input.verdict === "ungraded") asks.push(k);
      tt.truth.gamingWindow = asks.filter((a) => a > k - 10).length >= 2 ? 1 : 0;
    });
    traces.push({ id: `es1-${t}`, band, lang, persona, signalsOn, turns: turns.slice(0, 24) });
  }
  return traces;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const traces = buildES1();
  const out = new URL("./data/es1.jsonl", import.meta.url);
  fs.writeFileSync(out, traces.map((t) => JSON.stringify(t)).join("\n") + "\n");
  const n = traces.reduce((a, t) => a + t.turns.length, 0);
  console.log(`ES-1: ${traces.length} traces, ${n} turns → ${out.pathname}`);
}
