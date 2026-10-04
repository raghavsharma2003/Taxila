// planner.mjs — PROTOTYPE of the expressive planner + per-engine compilers specified in HUMAN-VOICE.md §5-6.
// Measurement scaffold only (docs/, not server/): the production module is server/voice/expressive/*.js.
//
// plan(line)       -> DeliveryPlan   (LLM: taxila-fast, JSON; then validate() in code, fail-closed to plain)
// compile.<engine> -> engine input   (pure code)
//
// Laws carried in (rejected.md / INHERITANCE-MAP): no bracket or stage-direction text ever reaches a model
// that can speak it (`voice-prompt-labels-and-brackets`); fillers come from a closed inventory with a rate cap
// (`rj-static-filler-list`, recited-prompt); laughter only when the child laughed or joked, never near an error
// (shared-laughter rule); paralinguistic TAGS only on engines measured to render them silently (cap-probe).

const OAI = () => process.env.AZURE_OPENAI_ENDPOINT.replace(/\/+$/, "");
const KEY = () => process.env.AZURE_OPENAI_API_KEY;

export const EMOTIONS = ["neutral", "warm", "amused", "delighted", "surprised", "calm", "reassuring", "curious", "wonder", "thinking", "playful", "proud"];
export const NONVERBALS = ["none", "breath", "hum", "chuckle", "laugh", "sigh_relief"];
const FILLERS = { hi: ["हम्म", "अच्छा", "हाँ", "तो", "अरे", "ओहो", "चलो", "देखो", "उम्म", "मतलब"], en: ["hmm", "okay", "so", "well", "umm", "oh"] };
const HESITANT = new Set(["उम्म", "umm"]); // think_aloud only

// The planner brief is SHAPES, not lines: nothing here is a sentence the teacher could say.
const BRIEF = `You plan HOW a line is spoken, never WHAT is said. Input: the teacher's line (fixed), the moment, the child's last turn.
Output JSON only:
{"segments":[{"text":str,"emotion":enum,"intensity":0-1,"pace":"slow"|"normal"|"brisk","pause_before_ms":int,"nonverbal_before":enum,"emphasis":[word]}],"note":str}
Rules:
- segments, joined in order, are the original line with at most these changes: a filler from the closed list placed at a clause boundary; in think_aloud only, one restart of a number or word (say part, cut, say it whole).
- closed filler list: ${[...FILLERS.hi, ...FILLERS.en].join(", ")}. At most 1 filler per 10 words and at most 2 per line. umm/उम्म only in think_aloud. Zero fillers is often right.
- emotion enum: ${EMOTIONS.join(", ")}. nonverbal_before enum: ${NONVERBALS.join(", ")}.
- laugh or chuckle only when the child laughed or joked. Never near a mistake or a correction. sigh_relief never in a correction.
- hum only before thinking or curiosity. breath before a long or important sentence, or after excitement.
- pause_before_ms 0-1200: longer before the key idea and after a question; vary them, never all equal.
- emphasis: at most 1 word per segment, the word carrying the new idea.
- segment boundaries at clauses where delivery changes. 2-5 segments.
- never write brackets, stage directions, or any word describing a sound.`;

export async function plan(line, { model = process.env.DEPLOY_FAST || "taxila-fast", effort = process.env.PLAN_EFFORT || "low" } = {}) {
  const user = JSON.stringify({ line: line.text, intent: line.intent, moment: line.scene, child_last_turn: line.child, child_laughed: !!line.childLaughed, child_wrong: !!line.childWrong, class_band: line.band });
  const t0 = performance.now();
  const r = await fetch(`${OAI()}/chat/completions`, { method: "POST", headers: { "api-key": KEY(), "content-type": "application/json" },
    body: JSON.stringify({ model, messages: [{ role: "system", content: BRIEF }, { role: "user", content: user }], response_format: { type: "json_object" },
      ...(/^(taxila-|gpt-)/.test(model) ? { max_completion_tokens: 2500, reasoning_effort: effort } : { max_tokens: 1200 }) }) });
  const ms = Math.round(performance.now() - t0);
  const j = await r.json();
  if (!r.ok) return { plan: null, ms, error: JSON.stringify(j).slice(0, 200) };
  let p; try { p = JSON.parse(j.choices[0].message.content); } catch { return { plan: null, ms, error: "bad_json" }; }
  const v = validate(p, line);
  return { plan: v.ok ? v.plan : null, raw: p, ms, usage: j.usage, violations: v.violations };
}

const words = (s) => String(s).normalize("NFC").replace(/[^\p{L}\p{M}\p{N}\s]/gu, " ").split(/\s+/).filter(Boolean);
const BRACKETS = /[\[\]<>{}()*_]|laugh|breath|sigh|chuckl|pause|हँस|हंस|साँस|सांस/i;

/** Code-side law. Any violation is repaired if trivially safe, else the plan is rejected (caller speaks plain). */
export function validate(p, line) {
  const violations = [];
  if (!p || !Array.isArray(p.segments) || !p.segments.length) return { ok: false, violations: ["no_segments"] };
  const segs = p.segments.slice(0, 6).map((s) => ({
    text: String(s.text || "").trim(),
    emotion: EMOTIONS.includes(s.emotion) ? s.emotion : (violations.push(`emotion:${s.emotion}`), "neutral"),
    intensity: Math.max(0, Math.min(1, +s.intensity || 0.5)),
    pace: ["slow", "normal", "brisk"].includes(s.pace) ? s.pace : "normal",
    pause_before_ms: Math.max(0, Math.min(1200, Math.round(+s.pause_before_ms || 0))),
    nonverbal_before: NONVERBALS.includes(s.nonverbal_before) ? s.nonverbal_before : "none",
    emphasis: Array.isArray(s.emphasis) ? s.emphasis.slice(0, 1).map(String) : [],
  }));
  for (const s of segs) {
    if (BRACKETS.test(s.text)) { violations.push(`direction_text:${s.text.slice(0, 30)}`); return { ok: false, violations }; }
    if ((s.nonverbal_before === "laugh" || s.nonverbal_before === "chuckle") && (!line.childLaughed || line.childWrong)) { violations.push("laugh_not_licensed"); s.nonverbal_before = "none"; }
    if (s.nonverbal_before === "sigh_relief" && (line.childWrong || line.intent === "gentle_correction")) { violations.push("sigh_in_correction"); s.nonverbal_before = "none"; }
    if (s.nonverbal_before === "hum" && !["think_aloud", "wonder_hook"].includes(line.intent)) { violations.push("hum_not_licensed"); s.nonverbal_before = "none"; }
  }
  segs[0].pause_before_ms = 0; // the first segment never waits: latency belongs to the floor, not the voice
  // Content preservation: every original word must survive in order-insensitive multiset terms; new words only
  // from the filler list (or, in think_aloud, a repeated fragment of an original word = the restart).
  const orig = words(line.text), out = words(segs.map((s) => s.text).join(" "));
  const bag = new Map(); for (const w of orig) bag.set(w, (bag.get(w) || 0) + 1);
  const added = [];
  for (const w of out) { if (bag.get(w)) bag.set(w, bag.get(w) - 1); else added.push(w); }
  const missing = [...bag.entries()].filter(([, n]) => n > 0).map(([w]) => w);
  if (missing.length) { violations.push(`missing:${missing.join("|")}`); return { ok: false, violations }; }
  const allFill = new Set([...FILLERS.hi, ...FILLERS.en]);
  const fillers = added.filter((w) => allFill.has(w.toLowerCase()));
  const other = added.filter((w) => !allFill.has(w.toLowerCase()));
  const restartOk = line.intent === "think_aloud" && other.length <= 2 && other.every((w) => orig.some((o) => o.startsWith(w) || o === w));
  if (other.length && !restartOk) { violations.push(`new_words:${other.join("|")}`); return { ok: false, violations }; }
  if (fillers.some((f) => HESITANT.has(f.toLowerCase())) && line.intent !== "think_aloud") { violations.push("hesitant_filler_outside_think"); return { ok: false, violations }; }
  if (fillers.length > Math.min(2, Math.max(1, Math.floor(orig.length / 10)))) { violations.push(`filler_rate:${fillers.length}`); return { ok: false, violations }; }
  return { ok: true, plan: { segments: segs, fillers, note: String(p.note || "").slice(0, 200) }, violations };
}

// ───────────────────────────── compilers (pure) ─────────────────────────────
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const langTag = (s) => esc(s).replace(/[ऀ-ॿ][ऀ-ॿ\s,!?।.\-]*[ऀ-ॿ।!?]?/g, (m) => { const c = m.replace(/\s+$/, ""); return `<lang xml:lang="hi-IN">${c}</lang>` + m.slice(c.length); });

// Azure HD style-marker vocabulary chosen per emotion (bracket STYLE markers were consumed silently on DragonHD
// en-IN and Omni hi-IN in cap-probe; paralinguistic TAG words were SPOKEN on DragonHD en-IN and MAI).
const HD_STYLE = { neutral: null, warm: "appreciative", amused: "amused", delighted: "excited", surprised: "surprised", calm: "calm", reassuring: "reassuring", curious: "curious", wonder: "intrigued", thinking: "reflective", playful: "joking", proud: "proud" };
const MAI_STYLE = { neutral: null, warm: "hopeful", amused: "joyful", delighted: "joyful", surprised: "surprised", calm: "softvoice", reassuring: "softvoice", curious: "hopeful", wonder: "hopeful", thinking: null, playful: "joyful", proud: "happy" };
const OMNI_TAG = { breath: "[breathing]", laugh: "[laughter]", chuckle: "[laughter]", sigh_relief: "[sighing]", hum: null, none: null };

/** DragonHD (en-IN personas): one SSML document; nonverbals become exact-length <break> GAPS that the splicer fills
 *  with same-persona clips from the bank (the tag itself would be spoken). Returns { ssml, gaps:[{kind, ms}] }. */
export function compileDragonHD(plan, voice, { clipMs = {} } = {}) {
  const gaps = []; let body = "";
  for (const s of plan.segments) {
    if (s.pause_before_ms) body += `<break time="${s.pause_before_ms}ms"/>`;
    if (s.nonverbal_before !== "none" && clipMs[s.nonverbal_before]) {
      const ms = clipMs[s.nonverbal_before] + 120; gaps.push({ kind: s.nonverbal_before, ms });
      body += `<break time="${ms}ms"/>`;
    }
    const st = HD_STYLE[s.emotion];
    body += `${st ? `[${st}] ` : "[Neutral] "}${langTag(s.text)} `;
  }
  return { ssml: `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xmlns:mstts="https://www.w3.org/2001/mstts" xml:lang="en-IN"><voice name="${voice}">${body.trim()}</voice></speak>`, gaps };
}

/** DragonHD Omni (hi-IN personas): native paralinguistic tags + style markers, no <break> (unsupported). */
export function compileOmni(plan, voice) {
  let body = "";
  for (const s of plan.segments) {
    const tag = OMNI_TAG[s.nonverbal_before];
    const st = HD_STYLE[s.emotion];
    body += `${tag ? tag + " " : ""}${st ? `[${st}] ` : "[Neutral] "}${esc(s.text)}${s.pause_before_ms > 500 ? " ..." : ""} `;
  }
  return { ssml: `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xmlns:mstts="https://www.w3.org/2001/mstts" xml:lang="hi-IN"><voice name="${voice}">${body.trim()}</voice></speak>` };
}

/** MAI-Voice-2.1(-Flash): express-as per segment from the voice's own StyleList, <break> for pauses, no nonverbals. */
export function compileMAI(plan, voice, styleList) {
  let body = "";
  for (const s of plan.segments) {
    if (s.pause_before_ms) body += `<break time="${s.pause_before_ms}ms"/>`;
    const st = MAI_STYLE[s.emotion];
    body += st && styleList.includes(st) ? `<mstts:express-as style="${st}">${esc(s.text)}</mstts:express-as>` : esc(s.text);
    body += " ";
  }
  return { ssml: `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xmlns:mstts="https://www.w3.org/2001/mstts" xml:lang="hi-IN"><voice name="${voice}">${body.trim()}</voice></speak>` };
}

const PACE = { slow: "a little slower than conversation", normal: "conversational pace", brisk: "a little quicker, light" };
const NV_WORDS = { chuckle: "begin with a short, soft, genuine chuckle", laugh: "begin with a brief light laugh", breath: "take a small audible breath first", hum: "begin with a soft closed-mouth thinking hum", sigh_relief: "begin with a soft relieved exhale" };
/** gpt-4o-mini-tts: one request per segment; delivery in `instructions` (prose, never in the input text). */
export function compileMiniTTS(plan, accentNote) {
  return plan.segments.map((s) => ({
    input: s.text,
    pause_before_ms: s.pause_before_ms,
    instructions: [accentNote, `Feeling: ${s.emotion}, intensity ${s.intensity.toFixed(1)}. Pace: ${PACE[s.pace]}.`,
      s.emphasis[0] ? `Lean on the word "${s.emphasis[0]}".` : "", NV_WORDS[s.nonverbal_before] ? `${NV_WORDS[s.nonverbal_before]}, then speak.` : ""].filter(Boolean).join("\n"),
  }));
}

/** Realtime (S2S) lane: the whole line + a prose delivery note in the response instructions (no clips possible). */
export function compileRealtime(plan, accentNote) {
  const steps = plan.segments.map((s, i) => `${i + 1}) ${s.emotion}${s.intensity > 0.6 ? " (strong)" : ""}, ${PACE[s.pace]}${s.pause_before_ms > 300 ? `, a real pause before it` : ""}${NV_WORDS[s.nonverbal_before] ? `, ${NV_WORDS[s.nonverbal_before]}` : ""}`).join("; ");
  return { text: plan.segments.map((s) => s.text).join(" "), note: `${accentNote}\nDelivery, clause by clause: ${steps}. Never say these directions aloud.` };
}
