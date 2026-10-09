// Voice as a game verb (DESIGN.md §5): a CLOSED code grammar maps a short committed utterance in Hinglish, Hindi or English
// ("teen se todo", "4 by 4", "aadha", "ho gaya", "yahan", "phir se", "B zyada") to the same controls a finger presses. No
// model is involved and nothing is guessed: an utterance with any word outside the grammar, or longer than a command, is
// NOT an act (it stays an ordinary turn for the teacher, which the lesson always sends anyway: scanSafety and the model
// distress read run on every committed turn, whatever this parser does).
//
// Discrete acts only: speech partials arrive 1.4-2.6 s late (MODEL-STACK), so voice never drives a drag. "bas" is never a
// game word: it belongs to the lesson's stop check-in.
import type { Lang } from "../../../shared/play.ts";

export type VoiceIntent =
  | { verb: "number"; n: number }
  | { verb: "split"; n: number }
  | { verb: "cut"; n: number }
  | { verb: "fraction"; n: number; d: number }
  | { verb: "done" } | { verb: "undo" } | { verb: "here" } | { verb: "run" } | { verb: "open" }
  | { verb: "left" } | { verb: "right" } | { verb: "up" } | { verb: "down" }
  | { verb: "choose"; which: "A" | "B" | "same" | "different" }
  | { verb: "none" } | { verb: "canttell" };

/** The longest utterance that can be a command (tokens after normalisation). */
export const MAX_COMMAND_TOKENS = 6;

const NUM: Record<string, number> = {
  zero: 0, shunya: 0, ek: 1, one: 1, do: 2, two: 2, teen: 3, three: 3, char: 4, chaar: 4, four: 4, paanch: 5, panch: 5, five: 5,
  chhe: 6, chhah: 6, che: 6, six: 6, saat: 7, sat: 7, seven: 7, aath: 8, ath: 8, eight: 8, nau: 9, nine: 9, das: 10, dus: 10, ten: 10,
  gyarah: 11, eleven: 11, barah: 12, baarah: 12, twelve: 12, terah: 13, thirteen: 13, pandrah: 15, fifteen: 15, bees: 20, twenty: 20,
  "एक": 1, "दो": 2, "तीन": 3, "चार": 4, "पांच": 5, "पाँच": 5, "छह": 6, "छः": 6, "सात": 7, "आठ": 8, "नौ": 9, "दस": 10,
};
/** whole-word fractions ("aadha" = 1/2, "paav" = 1/4, "teen chauthai" = 3/4 is handled as a number + "chauthai") */
const FRAC: Record<string, [number, number]> = { aadha: [1, 2], adha: [1, 2], half: [1, 2], "आधा": [1, 2], paav: [1, 4], pav: [1, 4], quarter: [1, 4], "पाव": [1, 4], tihai: [1, 3], third: [1, 3] };
const DENOM: Record<string, number> = { chauthai: 4, quarters: 4, tihai: 3, thirds: 3, halves: 2, "चौथाई": 4 };
const VERB: Record<string, VoiceIntent["verb"]> = {
  todo: "split", tod: "split", todna: "split", split: "split", divide: "split", bhaag: "split", "तोड़ो": "split", "तोड़": "split",
  kaato: "cut", kaat: "cut", kato: "cut", cut: "cut", "काटो": "cut",
  yahan: "here", yaha: "here", yahin: "here", here: "here", "यहाँ": "here", "यहां": "here",
  chalao: "run", chala: "run", run: "run", start: "run", "चलाओ": "run",
  kholo: "open", khol: "open", open: "open", "खोलो": "open",
  wapas: "undo", undo: "undo", "वापस": "undo",
  left: "left", baayein: "left", right: "right", daayein: "right",
  upar: "up", up: "up", "ऊपर": "up", neeche: "down", niche: "down", down: "down", "नीचे": "down",
};
const FILLER = new Set(["please", "ji", "mam", "maam", "ma'am", "didi", "sir", "toh", "to", "na", "okay", "ok", "abhi", "isko", "ise", "yeh", "ye", "isse", "wala", "wali",
  "ko", "se", "mein", "me", "by", "into", "in", "the", "it", "a", "karo", "kar", "kardo", "de", "dijiye", "dena", "do_helper", "pe", "par", "ab", "chalo", "let's", "lets", "is", "one's"]);
/** words that make the utterance a NON-command whatever else it holds (the lesson's own words: stop, help, feelings) */
const NEVER = new Set(["bas", "stop", "ruko", "help", "madad", "dar", "dard", "rona", "nahi", "mat"]);

export function normalise(text: string): string[] {
  return String(text ?? "").toLowerCase().normalize("NFC")
    .replace(/(\d)\s*\/\s*(\d)/g, "$1/$2")
    .replace(/[“”"'!?.,;:()[\]{}]/g, " ")
    .split(/\s+/).filter(Boolean);
}

/** PURE. A short utterance → one intent, or null (not a command). */
export function parseVoice(text: string, _lang: Lang = "hinglish"): VoiceIntent | null {
  const raw = normalise(text);
  if (!raw.length || raw.length > MAX_COMMAND_TOKENS) return null;
  // phrases first
  const j = raw.join(" ");
  if (/^(ho gaya|ho gya|hogaya|done|finished|khatam|हो गया)( (ji|mam|maam|didi))?$/.test(j)) return { verb: "done" };
  if (/^(phir se|fir se|undo|wapas|वापस|फिर से)( (karo|kar do|lo))?$/.test(j)) return { verb: "undo" };
  if (/^(koi farak nahi|no difference|कोई फ़र्क नहीं|koi fark nahi)$/.test(j)) return { verb: "none" };
  if (/^(pata nahi chal sakta|can'?t tell|cant tell|पता नहीं चल सकता)$/.test(j)) return { verb: "canttell" };
  if (/^(barabar|same|dono same|dono barabar|equal|बराबर|dono ek jaise)$/.test(j)) return { verb: "choose", which: "same" };
  if (/^(alag|different|अलग)( hain| hai)?$/.test(j)) return { verb: "choose", which: "different" };
  // "nahi" is in NEVER on purpose (only the two fixed phrases above may contain it)
  if (raw.some((t) => NEVER.has(t))) return null;
  let n: number | null = null, d: number | null = null, verb: VoiceIntent["verb"] | null = null, which: "A" | "B" | null = null, more = false;
  for (let i = 0; i < raw.length; i++) {
    const t = raw[i], prev = i ? raw[i - 1] : "";
    const frac = /^(\d{1,3})\/(\d{1,3})$/.exec(t);
    if (frac) { n = Number(frac[1]); d = Number(frac[2]); continue; }
    if (FRAC[t]) { [n, d] = FRAC[t]; if (n !== null && i > 0 && NUM[prev] !== undefined) n = NUM[prev] * (FRAC[t][0]); continue; }
    if (DENOM[t] !== undefined && n !== null) { d = DENOM[t]; continue; }
    if (/^\d{1,4}$/.test(t)) { if (n === null) n = Number(t); else if (d === null && ["by", "upon"].includes(prev)) d = Number(t); else return null; continue; }
    // "do" right after a verb is the helper ("kaat do", "tod do"), never the number two
    if (t === "do" && verb !== null && n !== null) continue;
    if (t === "do" && verb !== null && i === raw.length - 1) continue;
    if (NUM[t] !== undefined) { if (n === null) n = NUM[t]; else if (d === null && ["by", "upon", "बटा"].includes(prev)) d = NUM[t]; else if (d === null) return null; continue; }
    if (t === "a" && raw.length <= 3 && (raw[i + 1] === "zyada" || raw[i + 1] === "more" || i === raw.length - 1)) { which = "A"; continue; }
    if (t === "b") { which = "B"; continue; }
    if (t === "zyada" || t === "more" || t === "pehle" || t === "first" || t === "chhota" || t === "smaller") { more = true; continue; }
    if (VERB[t]) { verb = VERB[t]; continue; }
    if (t === "upon" || t === "बटा") continue;
    if (FILLER.has(t)) continue;
    return null;                                                            // a word outside the grammar: not a command
  }
  if (which) return more || (!verb && n === null) ? { verb: "choose", which } : null;
  if (n !== null && d !== null) return d > 0 && d <= 24 && n >= 0 && n <= 48 ? { verb: "fraction", n, d } : null;
  if (verb === "split" || verb === "cut") return n !== null && n >= 2 && n <= 99 ? { verb, n } : null;
  if (verb) return n === null ? ({ verb } as VoiceIntent) : null;
  if (n !== null) return { verb: "number", n };
  return null;
}

/**
 * PURE. The control presses that carry an intent out on the controls on screen now (ids from the family views), or null
 * when the intent has no control here (the utterance then stays a plain turn). A spoken act is the same press a finger
 * makes, so it is graded the same way and undo is free.
 */
export function pressesFor(intent: VoiceIntent, controls: { id: string; disabled?: boolean }[]): string[] | null {
  const on = new Set(controls.filter((c) => !c.disabled).map((c) => c.id));
  const first = (...ids: string[]) => { const id = ids.find((x) => on.has(x)); return id ? [id] : null; };
  const digits = (n: number) => String(n).split("").map((ch) => `k${ch}`);
  const typed = (keys: string[], go: string[]) => { if (!keys.every((k) => on.has(k) || controls.some((c) => c.id === k))) return null; const g = go.find((x) => controls.some((c) => c.id === x)); return g ? [...keys, g] : null; };
  switch (intent.verb) {
    case "done": return first("done");
    case "undo": return first("undo", "back");
    case "here": return first("commit");
    case "run": return first("run");
    case "open": return first("open");
    case "left": return first("nudge-left");
    case "right": return first("nudge-right");
    case "none": return first("conclude-none");
    case "canttell": return first("conclude-cant");
    case "up": case "down": {
      const r = controls.filter((c) => c.id.startsWith("round-") && !c.disabled);
      if (r.length !== 2) return null;
      const [lo, hi] = [...r].sort((a, b) => Number(a.id.slice(6)) - Number(b.id.slice(6)));
      return [intent.verb === "up" ? hi.id : lo.id];
    }
    case "choose": {
      if (intent.which === "same") return first("predict-same", "choose-same", "order-same", "same");
      if (intent.which === "different") return first("diff");
      return intent.which === "A" ? first("predict-A", "choose-0", "order-0") : first("predict-B", "choose-1", "order-1");
    }
    case "cut": return first(`cut-${intent.n}`);
    case "split": return typed(digits(intent.n), ["split"]);
    case "number": return typed(digits(intent.n), ["split", "name", "go"]);
    case "fraction": return typed([...digits(intent.n), "kslash", ...digits(intent.d)], ["name"]);
  }
  return null;
}
