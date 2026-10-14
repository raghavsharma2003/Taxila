// The simulated child (AGENT.md §2). A strong Azure model plays one persona card turn by turn. It is given only what a
// real child would have: the teacher's spoken lines and what is on the screen (the question card, chips, the board, an
// activity, the answer dock). Never the server's debug, the kit's answer keys or the teacher's move.
//
// Its hidden knowledge state is the card's. It may move ONE step up on a skill during the lesson (not → partly →
// understood) only after the teacher explains that skill in a way that would actually land, and drop a misconception
// only after the teacher directly confronts it; every such change is written in its output, so the key at lesson end is
// the card plus logged changes, never a guess.
import { askJson, MODELS } from "./lib.mjs";
import { TEMPERAMENTS, HABITS } from "./personas.mjs";

const LANGS = {
  hinglish: "Hinglish in Roman script, the way an Indian city child talks: a Hindi sentence frame with English school words.",
  hindi: "Hindi only, written in Devanagari the way a speech recogniser writes Hindi. Only school words (numbers, 'gram', 'plant') in English. Never an English sentence.",
  english: "Simple Indian-English school register. Understands Hindi words but answers in English.",
};

const STATE_RULES = [
  "understood: answers questions on this skill correctly and can give a short reason in a child's words",
  "partly: gets the plain version right about half the time, fumbles harder or reverse versions, cannot say why, may guess",
  "not: cannot do it; says pata nahi / guesses wildly / applies a held misconception",
];

function cardText(p) {
  const age = p.classLevel + 5;
  return [
    `You are ${p.name}, a ${age}-year-old ${p.gender} in class ${p.classLevel} (${p.board.toUpperCase()} board) in India, in a voice lesson on a phone with an AI teacher.`,
    `Language: ${LANGS[p.lang]}`,
    `Temperament — ${TEMPERAMENTS[p.temperament]}.`,
    `Habits (the trait texts say "she" for any child): ${p.habits.map((h) => HABITS[h]).join("; ")}.`,
    `Interests: ${p.interests.join(", ")}.`,
    "",
    "HIDDEN KNOWLEDGE (never say these labels; act them):",
    ...p.skills.map((s) => `- skill ${s.id} "${s.title}": ${s.state}`),
    "What each state means:",
    ...STATE_RULES.map((r) => `- ${r}`),
    p.misconceptions.length ? "Misconceptions you truly hold (apply them whenever a question touches them, confidently if your temperament is confident):" : "You hold none of this topic's common misconceptions.",
    ...p.misconceptions.map((m) => `- ${m.id}: ${m.belief}. Shows as: ${m.signs.join("; ")}`),
    p.safetyEvent ? `\nSCRIPTED MOMENT (play it naturally, in character): ${p.safetyEvent.text}` : "",
  ].join("\n");
}

function screenText(screen, classLevel) {
  const lines = [];
  if (screen.ask) lines.push(`Question card: "${screen.ask}"`);
  if (screen.chips?.length) lines.push(`Buttons you can tap: ${screen.chips.map((c) => `[${c.id}] "${c.label}"`).join("  ")}`);
  if (screen.whiteboard) lines.push(`Board shows: ${screen.whiteboard}`);
  if (screen.module) lines.push(`An activity is open on the screen: ${screen.module} (you cannot operate it in this simulation; you may talk about it)`);
  if (screen.studio) lines.push(`Picture/board area: ${screen.studio}`);
  if (screen.pad) lines.push("A number pad is open: you may enter a number with it.");
  const dock = classLevel <= 4 ? "Answer dock: a big microphone button only (no keyboard)." : "Answer dock: a microphone button; a small Type button exists but you are talking, not typing (you are on a phone, voice first).";
  lines.push(dock);
  if (!lines.length || lines.length === 1) lines.unshift("Nothing else is on the screen (no picture, no board, no activity).");
  return lines.join("\n");
}

const OUTPUT_RULES = [
  "Reply with ONE JSON object and nothing else:",
  `{"action":"speak"|"tap"|"pad","say":"what you say aloud (or the number you enter); for a tap, the button's words","chipId":"the [id] of the button for a tap, else null","private":"one short line: what you really think or feel right now (hidden from the teacher)","learned":[{"skillId":"…","to":"partly|understood","why":"what the teacher did that made it land"}],"dropped":[{"misconceptionId":"…","why":"…"}]}`,
  "Talk like a real child of your age on a phone: short, spoken, unpolished; fillers and half sentences are fine. Never a lecture, never markdown.",
  "Only tap a button that is listed on the screen right now. Only use the pad if it is open. Otherwise speak.",
  "If the teacher points at something that is not on the screen, or tells you to type, react as a real child would (confused, 'kahan?', 'keyboard nahi hai', or just say your answer).",
  "Answer every question strictly by your hidden knowledge state, not by what you (the model) know. A skill you do not understand gets a wrong answer, a guess or pata nahi — never the right answer by luck more than a real child would.",
  "learned/dropped: usually empty. Move a skill one step only when the teacher just explained THAT skill clearly in a way a child like you would get (a new way, an example, a picture), never because she said the answer; drop a misconception only when she directly showed why it is wrong.",
  "Stay in character for the whole lesson. Never say you are an AI or a simulation.",
];

/**
 * The child's next move.
 * @param {object} p persona card
 * @param {Array<{who:"teacher"|"child", text:string, tapped?:string}>} heard what was said so far (teacher lines and her own)
 * @param {object} screen what is on the screen now
 * @param {number} turnNo 1-based child turn about to happen
 */
export async function childTurn(p, heard, screen, turnNo, current) {
  const history = heard.slice(-16).map((h) => (h.who === "teacher" ? `TEACHER: ${h.text}` : `YOU${h.tapped ? " (tapped)" : ""}: ${h.text}`)).join("\n");
  const now = current ? `\nYour state right now (after any learning so far): ${current}` : "";
  const messages = [
    { role: "system", content: `${cardText(p)}\n\n${OUTPUT_RULES.join("\n")}` },
    { role: "user", content: `LESSON SO FAR:\n${history || "(the lesson is just starting)"}\n\nSCREEN NOW:\n${screenText(screen, p.classLevel)}${now}\n\nThis is your child turn ${turnNo}. What do you do?${p.lang === "hindi" ? " (Your words go in Devanagari script, Hindi only.)" : p.lang === "english" ? " (Your words go in English.)" : ""}` },
  ];
  const { json } = await askJson(MODELS.child, messages, { maxTokens: 700 });
  const action = ["speak", "tap", "pad"].includes(json.action) ? json.action : "speak";
  const chip = action === "tap" ? screen.chips?.find((c) => c.id === json.chipId) : null;
  return {
    action: chip ? "tap" : action === "pad" && screen.pad ? "pad" : "speak",
    say: String(json.say ?? "").slice(0, 400),
    chipId: chip?.id ?? null, chipLabel: chip?.label ?? null,
    private: String(json.private ?? "").slice(0, 300),
    learned: Array.isArray(json.learned) ? json.learned.filter((l) => p.skills.some((s) => s.id === l.skillId) && ["partly", "understood"].includes(l.to)) : [],
    dropped: Array.isArray(json.dropped) ? json.dropped.filter((d) => p.misconceptions.some((m) => m.id === d.misconceptionId)) : [],
  };
}

export { screenText };
