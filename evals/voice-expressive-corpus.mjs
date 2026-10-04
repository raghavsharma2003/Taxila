// The reply corpus for the expressive layer's CI gates (HV-1, HV-2): every child-facing sentence-shaped string in the
// verified teaching kits (data/kits/*.json: prompts in English and Hinglish, hints, explanations, expectations), plus
// reply shapes the guard writes (Roman Hinglish with numbers, helplines, ellipses, questions). Production replies
// (lesson_turns, scrubbed) are the spec's second source; they need a database read and are left to the nightly gate.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

export const REPLY_SHAPES = [
  "Chalo, 27 aur 35 jodte hain. Pehle tens: 20 aur 30, matlab 50. Phir 7 aur 5, 12. Toh total kya hua?",
  "Achha, yahan thoda rukte hain... Pizza ke 4 tukde hain, aur tumne 3 khaaye. Ek baar phir dekho?",
  "Bahut badhiya! Tumne pehle 30 banaya, phir baaki jod diya. Yeh smart tareeka hai.",
  "Haha, cold drink? Phir toh saare paudhe burp karte! Nahi, paudhe sirf paani peete hain, apni jadon se.",
  "Pata hai, suraj ki roshni humein 8 minute mein pahunchti hai! Socho, abhi isi waqt bhi.",
  "Main ek AI teacher hoon, insaan nahi. Agar tum pareshan ho, Childline 1098 pe call karo, ya Tele-MANAS 14416.",
  "Theek hai — ek baar phir se dekhte hain; is baar hum chhote steps lenge: pehle 1,50,000 ko padho.",
  "Rs. 250 mein 3 pencil aayi, toh 1 pencil kitne ki? Dr. Rao ne 2.5 kg aam khareede.",
  "Okay! Let's try 3/4 of 12. What do you get?",
  "Hmm... socho. 7 × 6 = ? Aaram se.",
];

/** Every sentence-shaped kit string (20-400 chars, has a space and a letter), de-duplicated, in a stable order. */
export function kitLines(limit = Infinity) {
  const dir = path.join(ROOT, "data", "kits");
  const out = new Set();
  const walk = (v, key) => {
    if (typeof v === "string") {
      if (v.length >= 20 && v.length <= 400 && v.includes(" ") && /\p{L}/u.test(v) && !/^c\d-/.test(v) && key !== "id") out.add(v.trim());
    } else if (Array.isArray(v)) v.forEach((x) => walk(x, key));
    else if (v && typeof v === "object") for (const [k, x] of Object.entries(v)) walk(x, k);
  };
  for (const f of fs.readdirSync(dir).filter((f) => f.endsWith(".json")).sort()) walk(JSON.parse(fs.readFileSync(path.join(dir, f), "utf8")), "");
  return [...out].slice(0, limit);
}

/** Moments covering every row (move × display × engagement), for a corpus sweep. */
export function momentsFor(i) {
  const moves = ["greet", "hook", "explain", "worked_example", "probe", "hint", "reteach", "celebrate", "wrap", "practice", "teachback", "repair", "break"];
  const displays = ["neutral_warm", "neutral_warm", "neutral_warm", "delight", "warm_pride", "playful", "gentle_concern", "calm_curious", "sheepish_own", "enthusiasm"];
  const verdicts = ["ungraded", "correct", "not_yet", "partial"];
  const bands = ["B1", "B2", "B3", "B4"];
  const langs = ["hinglish", "en", "hi"];
  return {
    move: moves[i % moves.length], verdict: verdicts[(i >> 2) % 4], engagement: i % 11 === 0 ? "strained" : "engaged",
    teacherAffect: { display: displays[(i >> 1) % displays.length], intensity: i % 5 === 0 ? 2 : 1, cause: "none", turn: i },
    bondStage: i % 3 === 0 ? "regular" : "first_sessions", safety: i % 17 === 0, childLaughed: i % 7 === 0, thinkAloud: moves[i % moves.length] === "worked_example",
    band: bands[(i >> 3) % 4], lang: langs[i % 3],
  };
}
