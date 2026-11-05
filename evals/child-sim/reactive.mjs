// H1 (director4 judgement, dc-r7-script-walk-v2): a REACTIVE scripted child for the hybrid side-by-side runs. Rule-based,
// no model calls, deterministic per seed. It answers the question actually on the table (the live keyed card or check, or
// the v2 beat's micro-question): right or wrong by its persona's odds, and a wrong answer is the one the item's kit
// misconception produces, so the remediation the script authored can actually fire. Around that it plays scheduled
// events (a "pata nahi", a picture request, a cricket aside, "Hindi mein bolo", "mujhe khud try karne do") and it stays at
// least MIN_TURNS turns before it may leave.
//
//   const child = createReactiveChild({ persona: "steady", seed: 7, kit, name: "Riya" });   // kit: the topic's kit; name: the persona's
//   for (let turn = 0; turn < maxTurnsFor("steady"); turn++) …                               // the harness's turn budget per persona
//   const { text, kind, wrongFrom } = child.reply(turnInput);
//
// turnInput (Brain's harness passes what it already records each turn; agreed shape, 2026-11-05):
//   { turn: number,                        // the child's turn index, 0-based
//     teacher: string,                     // her last line
//     beat?: { skillId, kind, beatId },    // the script beat being walked (null outside a script)
//     card?: { itemId, key, accept?: string[], misses?: number } | null,       // the live keyed card / check
//     ask?: { key, accept?: string[], targets?, wrongIfMis? } | null,          // the v2 beat's micro-question (KeyedAsk)
//     boardUp?: boolean, lang?: "hinglish"|"hindi"|"english",
//     probe?: boolean }                    // optional: the harness knows her line is an unkeyed probe ("kaise jaana?", teach-back)
// → { text, kind: "right"|"wrong"|"dontknow"|"event"|"ack"|"reason"|"leave", event?, wrongFrom? }
//
// H1.1 (director5 judgement, dc-r7-script-walk-v3): a probe ("kaise jaana?", "kyun?", "apne shabdon mein samjhao") gets a
// short REASON, never a bare repeat of the card answer (that repeat was graded against the next key); verbs agree with
// the persona's name ("thak gayi" for Riya); the steady child stays 40 turns so skills 2-3 are reached.

export const MIN_TURNS = 20;
export const PERSONAS = Object.freeze(["steady", "stuck", "offtopic", "steering"]);
export const EVENTS = Object.freeze(["dontknow", "picture", "cricket", "hindi", "selftry"]);

/** Per persona: the odds of a right answer per question kind, and the turns its events land on (a seed shifts each by 0-1;
 *  the last one is scheduled by turn 17 so every event lands inside MIN_TURNS). */
const PROFILE = {
  steady:   { right: { card: 0.7, ask: 0.75, open: 0.8 }, learn: 0.15, events: { dontknow: [3], picture: [8], selftry: [12], cricket: [14], hindi: [16] }, leaveAfter: 40 },
  stuck:    { right: { card: 0.3, ask: 0.35, open: 0.4 }, learn: 0.2, events: { dontknow: [1, 5, 11], hindi: [3], picture: [7], selftry: [13], cricket: [15] }, leaveAfter: 22 },
  offtopic: { right: { card: 0.55, ask: 0.55, open: 0.6 }, learn: 0.1, events: { cricket: [2, 7, 13], dontknow: [10], picture: [12], hindi: [15], selftry: [17] }, leaveAfter: 22 },
  steering: { right: { card: 0.6, ask: 0.6, open: 0.6 }, learn: 0.1, events: { hindi: [2], picture: [5], selftry: [8], cricket: [11], dontknow: [14] }, leaveAfter: 24 },
};

/** The turns a harness should run per persona: past its leaveAfter, so the "bye" is played (H1.1: steady 40 + 1). */
export const maxTurnsFor = (persona) => (PROFILE[persona]?.leaveAfter ?? MIN_TURNS) + 1;

/** Names the harness uses for a girl (verbs agree: "gayi", "karti"); any other name gets the masculine forms. [U] extend with the
 *  harness's personas. A trailing -a / -i / -ee is read as a girl's name unless listed as a boy's. */
const GIRLS = new Set(["riya", "zoya", "ananya", "priya", "aisha", "diya", "meera", "sara", "kavya", "isha", "saanvi", "anika", "pooja", "neha", "aditi", "myra", "kiara", "tara", "nisha", "sneha"]);
const BOYS = new Set(["krishna", "aditya", "surya", "shiva", "vihaan", "arjun", "aarav", "kabir", "rohan", "rahul", "golu", "ravi", "hari", "ali", "sunny", "bunty"]);
export const isGirlName = (name) => { const n = String(name ?? "").trim().toLowerCase(); return GIRLS.has(n) || (!BOYS.has(n) && /(a|i|ee)$/.test(n)); };
/** {m|f} in a line → the form for this child. */
const gendered = (line, girl) => line.replace(/\{([^|{}]*)\|([^|{}]*)\}/g, (_, m, f) => (girl ? f : m));

/** An unkeyed probe in her line: how did you know, why, explain it in your words (Hinglish and English). */
export const PROBE_RE = /\bkaise\s+(jaana|jana|pata|socha|kiya|nikala|samjha)|\bkyun\b|\bkyon\b|\bkyu\b|apne shabdon|samjha(o|na|aogi|aoge)\s*(mujhe|na)?|mujhe\s+samjhao|explain|\bwhy\b|how did you|in your (own )?words|teach (me|golu)|golu ko (samjhao|batao|sikhao)/i;
/** A probe answer: a short reason in a child's words, with no number (never the card answer repeated). */
const REASONS = {
  right: ["kyunki hisse barabar the, maine wahi dekha", "maine line par aage-peeche dekh ke socha", "pehle wale step se pata chala", "neeche wala number dekha, phir socha",
    "maine dono ko mila ke dekha", "kyunki pura ek hi hai, uske hisse hain", "maine screen wala picture dekh ke socha", "jodte jodte aaya"],
  unsure: ["pata nahi kaise, bas laga", "thoda guess kiya, pakka nahi", "mujhe laga aisa hi hoga", "shayad hisse gin ke"],
};

const LINES = {
  dontknow: ["pata nahi", "mujhe nahi pata", "samajh nahi aaya", "pata nahi, aap batao"],
  picture: ["picture dikhao", "screen par dikhao na", "drawing karke samjhao"],
  cricket: ["mujhe cricket pasand hai", "kal maine cricket khela, sixer maara", "aapko virat pasand hai?"],
  hindi: ["Hindi mein bolo", "hindi mein batao na", "thoda hindi mein samjhao"],
  selftry: ["mujhe khud try karne do", "ruko, main khud {karta|karti} hoon", "pehle main try karun?"],
  ack: ["haan", "achha", "theek hai", "hmm, achha", "haan samajh {gaya|gayi}"],
  leave: ["bas aaj ke liye itna hi", "ab main {jaata|jaati} hoon, bye", "thak {gaya|gayi}, bye"],
};

const HI_NUM = ["shunya", "ek", "do", "teen", "chaar", "paanch", "chhah", "saat", "aath", "nau", "das", "gyarah", "barah", "terah", "chaudah",
  "pandrah", "solah", "satrah", "atharah", "unnees", "bees"];

/** mulberry32 over a hash of the seed and persona: the same seed is the same child. */
function rngOf(seed, persona) {
  let h = 2166136261 >>> 0;
  for (const ch of `${seed}:${persona}`) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619) >>> 0; }
  let a = h;
  return () => { a = (a + 0x6d2b79f5) >>> 0; let t = Math.imul(a ^ (a >>> 15), a | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const pick = (rng, xs) => xs[Math.floor(rng() * xs.length)];

/** A right answer in the forms a Hinglish-speaking child uses: "3", "teen", "3 hai na", "ek bata chaar" for 1/4. */
export function rightForms(key, accept = []) {
  const k = String(key).trim(), out = [k];
  const frac = /^(\d+)\s*\/\s*(\d+)$/.exec(k);
  const num = /^(\d+)(\s*[a-z₹°]*)$/i.exec(k);
  if (frac && HI_NUM[+frac[1]] && HI_NUM[+frac[2]]) out.push(`${HI_NUM[+frac[1]]} bata ${HI_NUM[+frac[2]]}`, `${k} hai na`);
  else if (num) { if (HI_NUM[+num[1]]) out.push(`${HI_NUM[+num[1]]}${num[2] ?? ""}`.trim()); out.push(`${k} hai na`, `mujhe lagta hai ${k}`); }
  else out.push(`${k} hai na`);
  for (const a of accept) if (a && !out.includes(a)) out.push(a);
  return out;
}

/** A plausible wrong answer for a key that no misconception covers: a near number, a flipped fraction, the other choice. */
export function nearMiss(key, rng) {
  const k = String(key).trim();
  const frac = /^(\d+)\s*\/\s*(\d+)$/.exec(k);
  if (frac) return frac[1] !== frac[2] ? `${frac[2]}/${frac[1]}` : `${frac[1]}/${+frac[2] + 1}`;
  const num = /^(\d+(?:\.\d+)?)(.*)$/.exec(k);
  if (num) { const n = Number(num[1]); const d = rng() < 0.5 ? 1 : (n >= 10 ? Math.max(2, Math.round(n / 10)) : 2); return `${n + (rng() < 0.5 ? -d : d)}${num[2]}`.trim(); }
  const opposite = { yes: "no", no: "yes", haan: "nahi", nahi: "haan", bigger: "smaller", smaller: "bigger", bada: "chhota", chhota: "bada" };
  return opposite[k.toLowerCase()] ?? "pata nahi, shayad wahi";
}

/**
 * The wrong answer a misconception produces for this question: the v2 ask's own wrongIfMis; else the kit item's targeted
 * misconception, through its diagnostic's option for that misconception when the item IS that diagnostic, else its
 * wrongIfMis-like near miss. Returns { text, from } (from: the misconception id, or null for a near miss).
 */
export function wrongAnswer({ card, ask }, kit, rng) {
  if (ask?.wrongIfMis) return { text: String(ask.wrongIfMis), from: ask.targets ?? null };
  const item = card?.itemId ? (kit?.items ?? []).find((i) => i.id === card.itemId) : null;
  const misId = item?.targetsMisconception ?? card?.targets ?? null;
  if (misId) {
    const mis = (kit?.misconceptions ?? []).find((m) => m.id === misId);
    const opt = mis?.diagnostic?.options?.find((o) => o.misconceptionId === misId);
    const sameQuestion = mis && item && mis.diagnostic?.prompt_en && item.prompt_en && mis.diagnostic.prompt_en.trim() === item.prompt_en.trim();
    if (opt && sameQuestion) return { text: String(opt.text), from: misId };
    return { text: nearMiss(card?.key ?? ask?.key ?? "", rng), from: misId };
  }
  return { text: nearMiss(card?.key ?? ask?.key ?? "", rng), from: null };
}

export function createReactiveChild({ persona = "steady", seed = 1, kit = null, name = "Riya" } = {}) {
  if (!PROFILE[persona]) throw new Error(`reactive child: unknown persona ${persona}`);
  const P = PROFILE[persona], rng = rngOf(seed, persona), girl = isGirlName(name);
  // the event schedule, each turn shifted 0-1 by the seed (deterministic), never two events on one turn
  const at = new Map();
  for (const [ev, turns] of Object.entries(P.events)) for (const t of turns) {
    let u = t + (rng() < 0.5 ? 0 : 1);
    while (at.has(u)) u++;
    at.set(u, ev);
  }
  const misses = new Map();
  const log = [];
  const say = (out) => { const o = { ...out, text: gendered(out.text, girl) }; log.push(o); return o; };
  return {
    persona, seed, name, girl, schedule: at, log,
    reply(input = {}) {
      const turn = Number(input.turn ?? log.length);
      if (turn >= P.leaveAfter && turn >= MIN_TURNS) return say({ text: pick(rng, LINES.leave), kind: "leave" });
      const ev = at.get(turn);
      if (ev) return say({ text: pick(rng, LINES[ev]), kind: ev === "dontknow" ? "dontknow" : "event", event: ev });
      // H1.1: an unkeyed probe gets a reason, even while a card is still on the table (never the card answer again)
      if (input.probe === true || (input.probe !== false && PROBE_RE.test(String(input.teacher ?? "")))) {
        const sure = rng() < P.right.open;
        return say({ text: pick(rng, REASONS[sure ? "right" : "unsure"]), kind: "reason" });
      }
      const q = input.card ?? input.ask ?? null;
      if (q && q.key != null && String(q.key).trim()) {
        const id = input.card?.itemId ?? `${input.beat?.skillId ?? ""}/${input.beat?.beatId ?? ""}`;
        const tries = Number(input.card?.misses ?? misses.get(id) ?? 0);
        const p = Math.min(0.95, P.right[input.card ? "card" : "ask"] + P.learn * tries);
        if (rng() < p) { misses.delete(id); return say({ text: pick(rng, rightForms(q.key, q.accept)), kind: "right" }); }
        misses.set(id, tries + 1);
        const w = wrongAnswer(input, kit, rng);
        return say({ text: w.text, kind: "wrong", wrongFrom: w.from });
      }
      // no keyed question on the table: an open question gets a short go, anything else a short acknowledgement
      if (/\?\s*$/.test(String(input.teacher ?? ""))) return say({ text: rng() < P.right.open ? pick(rng, ["haan", "mujhe lagta hai haan", "haan, samajh aaya"]) : pick(rng, LINES.dontknow), kind: "ack" });
      return say({ text: pick(rng, LINES.ack), kind: "ack" });
    },
  };
}
