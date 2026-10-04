// lines.mjs — v4 spoken-register rewrites of the five round-1/2 teacher lines, with a per-clause DeliveryPlan each,
// and the two compilers (DragonHD SSML, Nova 2 Sonic prompt) described in TALKING-RULES.md §2. 2026-10-04.
//
// THESE LINES ARE TEST STIMULI. They are sentence-shaped on purpose (they are what a listener hears) and they must
// NEVER be pasted into a prompt, a persona sheet, a move shape or a few-shot block (repo law `recited-prompt`).
//
// Plan fields per clause (TALKING-RULES §2.1):
//   t   text (exact words; Hindi in Devanagari, English in Latin, numbers as Hindi words, no digits, no "...")
//   role   what the clause does in the moment (echo, invite, step, work, result, reveal, self_repair, play, pivot, fact,
//          name_method, verdict, aside, uptake, image, invite_look, hook, build)
//   rate   % vs the voice default; DragonHD honours slow-downs only: 0 | -10 | -20  (persona normal = -10)
//   pitch  % ; DragonHD honours lowering only, and only from -8: 0 | -8
//   emph   the new / important word of the clause (must be in t; the writing rule puts it last in its clause)
//   pause  ms of silence after the clause: 0 (runs on) or >= 300 (DragonHD cannot make a pause shorter than ~300 ms)
//   style  engine style: neutral|warm|amused|playful|surprised|delighted|calm|curious|wonder|thinking
//   tune   final contour, carried by punctuation: rise (?) | fall (। !) | cont (,)
import fs from "node:fs";

const C = (t, role, o = {}) => ({ t, role, rate: o.rate ?? -10, pitch: o.pitch ?? 0, emph: o.emph ?? null, pause: o.pause ?? 0, style: o.style ?? "neutral",
  tune: /\?$/.test(t) ? "rise" : /[।!]$/.test(t) ? "fall" : "cont" });

export const SCENES = JSON.parse(fs.readFileSync(new URL("../v3/screen/scenes.json", import.meta.url), "utf8"));

export const LINES = [
  { id: "L1-think", v: "A", clauses: [
    C("सत्ताईस और पैंतीस,", "echo", { pause: 300, style: "thinking" }),
    C("चलो, साथ में करते हैं।", "invite", { rate: 0, pause: 400, style: "warm" }),
    C("पहले tens,", "step", { emph: "tens", style: "thinking" }),
    C("बीस और तीस,", "work", { rate: -20, pause: 300, style: "thinking" }),
    C("पचास।", "result", { emph: "पचास", pause: 400, style: "thinking" }),
    C("फिर सात और पाँच,", "work", { rate: -20, pause: 300, style: "thinking" }),
    C("बारह।", "result", { emph: "बारह", pause: 400, style: "thinking" }),
    C("तो पचास और बारह,", "work", { pause: 300, style: "thinking" }),
    C("बासठ!", "reveal", { rate: 0, emph: "बासठ", style: "delighted" }),
  ] },
  { id: "L1-think", v: "B", clauses: [
    C("अच्छा, सत्ताईस और पैंतीस।", "echo", { pause: 400, style: "thinking" }),
    C("पहले सात और पाँच,", "work", { style: "thinking" }),
    C("नहीं नहीं, पहले tens करते हैं।", "self_repair", { rate: 0, emph: "tens", pause: 400, style: "thinking" }),
    C("बीस और तीस, पचास।", "work", { rate: -20, emph: "पचास", pause: 500, style: "thinking" }),
    C("अब सात और पाँच, बारह।", "work", { rate: -20, emph: "बारह", pause: 500, style: "thinking" }),
    C("पचास और बारह, मतलब,", "work", { pause: 300, style: "thinking" }),
    C("बासठ!", "reveal", { rate: 0, emph: "बासठ", style: "delighted" }),
  ] },
  { id: "L2-laugh", v: "A", clauses: [
    C("Cold drink?", "echo", { rate: 0, pause: 300, style: "amused" }),
    C("सोचो ज़रा, फिर तो सारे पौधे गमले में burp करते!", "play", { rate: 0, emph: "burp", pause: 300, style: "playful" }),
    C("एक के बाद एक!", "play", { rate: 0, pause: 600, style: "playful" }),
    C("पर नहीं, पौधे सिर्फ़ पानी पीते हैं,", "pivot", { emph: "पानी", style: "warm" }),
    C("अपनी जड़ों से।", "fact", { emph: "जड़ों", style: "warm" }),
  ] },
  { id: "L2-laugh", v: "B", clauses: [
    C("पौधे और cold drink?", "echo", { rate: 0, pause: 300, style: "amused" }),
    C("फिर तो हर गमले से burp की आवाज़ आती!", "play", { rate: 0, emph: "burp", pause: 600, style: "playful" }),
    C("सच में तो, पौधे सिर्फ़ पानी पीते हैं,", "pivot", { emph: "पानी", style: "warm" }),
    C("वो भी अपनी जड़ों से।", "fact", { emph: "जड़ों", style: "warm" }),
  ] },
  { id: "L3-surprise", v: "A", clauses: [
    C("अरे!", "surprise", { rate: 0, pause: 300, style: "surprised" }),
    C("पहली बार में ही?", "echo", { rate: 0, pause: 500, style: "surprised" }),
    C("मतलब, तुमने ऊपर और नीचे, दोनों को,", "name_method", { emph: "दोनों", style: "warm" }),
    C("चार से divide किया।", "name_method", { emph: "चार", pause: 400, style: "warm" }),
    C("बिल्कुल सही!", "verdict", { rate: 0, pause: 400, style: "delighted" }),
    C("ये वाला तो बहुत लोग गलत करते हैं।", "aside", { pitch: -8, style: "warm" }),
  ] },
  { id: "L3-surprise", v: "B", clauses: [
    C("अरे, पहली बार में ही?", "echo", { rate: 0, pause: 500, style: "surprised" }),
    C("ऊपर भी चार से, नीचे भी चार से, divide!", "name_method", { emph: "चार", pause: 400, style: "warm" }),
    C("बिल्कुल सही।", "verdict", { rate: 0, pause: 400, style: "delighted" }),
    C("ये वाला सच में tricky होता है।", "aside", { pitch: -8, style: "warm" }),
  ] },
  { id: "L4-correct", v: "A", clauses: [
    C("अच्छा, चलो इसे साथ में देखते हैं।", "uptake", { pitch: -8, pause: 400, style: "curious" }),
    C("तीन बटा चार,", "step", { rate: -20, pause: 300, style: "calm" }),
    C("मतलब चार हिस्से, और हम लेते हैं तीन।", "step", { rate: -20, emph: "तीन", pause: 400, style: "calm" }),
    C("सोचो, लगभग पूरा pizza!", "image", { emph: "पूरा", pause: 600, style: "curious" }),
    C("अब दो बटा तीन को देखो।", "invite_look", { emph: "दो", style: "curious" }),
  ] },
  { id: "L4-correct", v: "B", clauses: [
    C("अच्छा, एक second, ज़रा ध्यान से देखते हैं।", "uptake", { pitch: -8, pause: 400, style: "calm" }),
    C("तीन बटा चार में, चार में से तीन हिस्से हमारे,", "step", { rate: -20, emph: "तीन", pause: 300, style: "calm" }),
    C("यानी, pizza लगभग पूरा ही।", "image", { rate: -20, emph: "पूरा", pause: 600, style: "curious" }),
    C("अब दो बटा तीन को देखो।", "invite_look", { emph: "दो", style: "curious" }),
  ] },
  { id: "L5-wonder", v: "A", clauses: [
    C("पता है,", "hook", { rate: -20, pitch: -8, pause: 400, style: "wonder" }),
    C("तुम्हारा सारा खून, पूरे शरीर का एक चक्कर लगा लेता है,", "fact", { rate: -20, pitch: -8, pause: 400, style: "wonder" }),
    C("लगभग एक मिनट में!", "build", { emph: "मिनट", pause: 500, style: "delighted" }),
    C("एक मिनट!", "build", { emph: "एक", pause: 500, style: "delighted" }),
    C("सोचो, अभी, इसी वक़्त भी।", "invite", { rate: 0, emph: "अभी", style: "delighted" }),
  ] },
  { id: "L5-wonder", v: "B", clauses: [
    C("एक मज़ेदार बात बताऊँ?", "hook", { rate: -20, pitch: -8, pause: 500, style: "wonder" }),
    C("तुम्हारे शरीर का सारा खून,", "fact", { rate: -20, pitch: -8, pause: 300, style: "wonder" }),
    C("लगभग एक मिनट में, पूरे शरीर का एक चक्कर लगा लेता है।", "build", { emph: "मिनट", pause: 500, style: "delighted" }),
    C("और ये अभी भी हो रहा है, इसी वक़्त!", "invite", { rate: 0, emph: "अभी", style: "delighted" }),
  ] },
];

export const textOf = (l) => l.clauses.map((c) => c.t).join(" ");

// ── validator (fail closed: an invalid plan is spoken plain) ──
export function validate(l) {
  const errs = [];
  l.clauses.forEach((c, i) => {
    const last = i === l.clauses.length - 1;
    if (/\d/.test(c.t)) errs.push(`${i}: digits`);
    if (/\.\.\.|…|[\[\]<>{}"“”]/.test(c.t)) errs.push(`${i}: ellipsis/markup/quotes`);
    if (![0, -10, -20].includes(c.rate)) errs.push(`${i}: rate ${c.rate} not in {0,-10,-20}`);
    if (![0, -8].includes(c.pitch)) errs.push(`${i}: pitch ${c.pitch} not in {0,-8}`);
    if (c.emph && !c.t.includes(c.emph)) errs.push(`${i}: emph not in text`);
    if (c.pause && c.pause < 300) errs.push(`${i}: pause < 300 not renderable`);
    if (!last && c.tune !== "cont" && c.pause < 300) errs.push(`${i}: sentence end without a >=300 ms pause (DragonHD default is ~70 ms)`);
  });
  const emphs = l.clauses.filter((c) => c.emph).length;
  if (emphs > Math.ceil(l.clauses.length * 0.75)) errs.push("too many emphasised clauses (emphasis everywhere is emphasis nowhere)");
  return errs;
}

// ── DragonHD compiler (only features verified honoured in probe/caps: <break>, <prosody rate> <= 0, pitch -8%) ──
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const hiRuns = (s) => esc(s).replace(/[ऀ-ॿ][ऀ-ॿ\s,!?।\-]*[ऀ-ॿ।!?]?/g, (m) => { const c = m.replace(/\s+$/, ""); return `<lang xml:lang="hi-IN">${c}</lang>` + m.slice(c.length); });
const hiAll = (s) => `<lang xml:lang="hi-IN">${esc(s)}</lang>`;
/** pause ms → <break> ms. Measured: any <break> yields >= ~300 ms of silence, and ~X+200 ms above that. */
export const breakFor = (ms) => (!ms ? "" : `<break time="${Math.max(50, ms - 200)}ms"/>`);
export function compileDragonHD(l, { voice = "en-IN-Diya:DragonHDLatestNeural", langWrap = "runs", emphBreak = false } = {}) {
  let body = "";
  l.clauses.forEach((c, i) => {
    let t = langWrap === "all" ? hiAll(c.t) : hiRuns(c.t);
    // optional: a break right before the emphasised word of the REVEAL clause only (pitch reset seen in micro_300)
    if (emphBreak && c.role === "reveal" && c.emph && c.t.trim() !== c.emph) t = t.replace(esc(c.emph), `<break time="50ms"/>${esc(c.emph)}`);
    const attrs = [c.rate ? `rate="${c.rate}%"` : "", c.pitch ? `pitch="${c.pitch}%"` : ""].filter(Boolean).join(" ");
    body += attrs ? `<prosody ${attrs}>${t}</prosody>` : t;
    body += i < l.clauses.length - 1 ? (breakFor(c.pause) || " ") : "";
  });
  return `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xmlns:mstts="https://www.w3.org/2001/mstts" xml:lang="en-IN"><voice name="${voice}">${body}</voice></speak>`;
}
/** The same text with no plan at all (separates the text lever from the delivery lever). */
export function plainDragonHD(l, { voice = "en-IN-Diya:DragonHDLatestNeural" } = {}) {
  return `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xmlns:mstts="https://www.w3.org/2001/mstts" xml:lang="en-IN"><voice name="${voice}">${hiRuns(textOf(l))}</voice></speak>`;
}

// ── Nova 2 Sonic compiler: the plan becomes a shape note in the system prompt; the text goes as the user turn ──
const ROLE = {
  echo: "echo of the child's own words, light", invite: "inviting, together", step: "naming the step", work: "working it out, thinking while saying it",
  result: "small landing, pleased", reveal: "the answer arrives, delighted", self_repair: "a quick self-correction, unbothered",
  play: "playing along with the joke, smiling, enjoying it", pivot: "still smiling, turning gently back to the real thing", fact: "plain and warm",
  surprise: "genuinely surprised", name_method: "slower, pointing at exactly what they did", verdict: "delighted, short", aside: "softer, confiding",
  uptake: "calm, curious, no disappointment", image: "a picture to imagine", invite_look: "curious invitation to look", hook: "quiet, drawing them in",
  build: "the wonder grows",
};
const PACE = { 0: "a little quicker", "-10": "conversational", "-20": "slower" };
export const NOVA_READER = "This is a voice rendering task. When the user sends text, say exactly that text aloud, word for word, in the same language mix. Add nothing, omit nothing, no greeting, no comment.";
export const NOVA_BAND = "Delivery: a warm Indian teacher talking to one child of about nine, one native Indian accent for Hindi and English words alike, talking, never reading; the feeling carries through the whole line, not only its start.";
export function compileNova(l, scene) {
  const plan = l.clauses.map((c, i) => `${i + 1}. ${ROLE[c.role] ?? c.role}; ${PACE[c.rate]}${c.pitch ? ", lower and softer" : ""}${c.emph ? `; lean on ${c.emph}` : ""}${c.pause >= 500 ? "; a clear pause after" : c.pause ? "; a short beat after" : "; run straight on"}`).join("\n");
  return { system: `${NOVA_READER}\n${NOVA_BAND}\nThe moment: ${scene}\nThe line in ${l.clauses.length} parts, in order:\n${plan}`, text: textOf(l) };
}

if (process.argv[1] && process.argv[1].endsWith("lines.mjs")) {
  for (const l of LINES) {
    const e = validate(l);
    console.log(`${l.id} ${l.v} ${e.length ? "INVALID " + e.join("; ") : "ok"} | ${textOf(l)}`);
  }
}
