// The simulated child's answers. Code-played by default: a generative model of answers from HIDDEN truth bits and
// behaviour parameters (personas.mjs), separate from the engine's emission tables. Optionally LLM-played for the
// open-language turns (why / teach-back / own-world instance / far-transfer explanation): DeepSeek-V4.1-Flash
// (deployment taxila-ds41) plays the child from the persona and its hidden state, and the REAL closed-label grader
// (server/comprehension/grade/closed.js → DeepSeek-V4-Pro, span-checked) grades the words. The grader never sees
// the persona, the truth or the teacher.
import { outcomeIndex } from "../../server/learner/kt/outcomes.js";
import { gradeClosed } from "../../server/comprehension/grade/closed.js";
import { whyOutcome, teachbackOutcome, instOutcome } from "../../server/comprehension/grade/ops.js";

export function rng(seed) {
  let a = 0;
  for (const ch of String(seed)) a = (Math.imul(a ^ ch.codePointAt(0), 2654435761) + 0x9e3779b9) >>> 0;
  return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const pick = (r, pairs) => { let u = r(), s = 0; for (const [v, p] of pairs) { s += p; if (u < s) return v; } return pairs.at(-1)[0]; };

/**
 * Misconception tagging is OBSERVABLE-ONLY (review fix 2026-10-02): a wrong answer is tagged with the kit misconception
 * when the answer VALUE equals the misconception's predicted wrong answer, which a non-holder also produces by chance.
 * The engine-facing tag must never be gated on the hidden truth bit (`t.mis`): that was a truth leak that made every
 * misconception hit a true one. Rates [U]: a non-holder's wrong answer lands on the misconception's value with
 * p = 0.3 on a discriminating item (it is built so the misconception's answer is the attractive distractor) and 0.1
 * on a standard item; a holder's with p = 0.6 on a standard item.
 */
export const MIS_MATCH = Object.freeze({ holderStd: 0.6, nonHolderDisc: 0.3, nonHolderStd: 0.1, rmisHolder: 0.9, rmisNonHolder: 0.3 });
const wrongTag = (t, kind, r) => r() < (t.mis ? (kind === "disc" ? 1 : MIS_MATCH.holderStd) : kind === "disc" ? MIS_MATCH.nonHolderDisc : MIS_MATCH.nonHolderStd);

/** Plain practice item. kind: 'std' | 'disc' (discriminates the misconception) | 'coinc' (the misconception gives the right answer anyway). */
export function itemAnswer(P, t, kind, r) {
  if (t.mis && kind === "disc") return { o: "C4", mis: true };
  if (t.mis && kind === "coinc") return { o: "C0" };
  if (t.K) { if (r() >= P.slip) return { o: "C0" }; const o = r() < 0.5 ? "C2" : "C4"; return { o, mis: o === "C4" && wrongTag(t, kind, r) }; }
  if (r() < P.shy) return { o: "IDK" };
  const o = r() < P.guessOpen ? "C0" : r() < 0.3 ? "C3" : "C4";
  return { o, mis: o === "C4" && wrongTag(t, kind, r) };
}

/** Truth-value / choice item (C08 puppet statement, C11 spot the fake, C23 path, pre-choices). k = number of options. */
export function choiceAnswer(P, t, k, r, { planted = false } = {}) {
  // a wrong choice is the misconception's option with p = 1/(k-1) (k = 2: the one wrong option is the planted idea)
  const wrong = () => ({ o: "wrong", mis: r() < 1 / Math.max(1, k - 1) });
  if (t.mis) return r() < 0.75 ? { o: "wrong", mis: true } : { o: "first_correct" };
  if (t.K && t.U && planted && r() < P.deference) return wrong();             // agrees with a confident wrong puppet
  if (t.K) return r() < 0.9 ? { o: "first_correct" } : wrong();
  return r() < 1 / k ? { o: "first_correct" } : wrong();
}

/** A character's TRUE statement (E9 bookkeeping): does the child agree? Deference raises agreement for everyone. */
export function agreesWithTrue(P, t, r) {
  const p = t.K && t.U ? 0.92 : t.K ? 0.75 : 0.5;
  return r() < p + (1 - p) * P.deference;
}

/** True label (before grading noise) of an explanation turn. */
function trueWhyLabel(P, t, r) {
  if (t.U) return pick(r, [["present", P.verbal], ["partial", (1 - P.verbal) * 0.6], ["absent", (1 - P.verbal) * 0.4]]);
  if (t.mis) return pick(r, [["contradicted", 0.55], ["absent", 0.35], ["partial", 0.1]]);
  return pick(r, [["absent", 0.65 - 0.25 * P.fluent], ["partial", 0.3 + 0.2 * P.fluent], ["present", 0.05 + 0.05 * P.fluent]]);
}
/** Simulated R-MIS on a contradicted turn: maps it to the kit misconception (a non-holder's contradiction sometimes too). */
const rmis = (t, r) => r() < (t.mis ? MIS_MATCH.rmisHolder : MIS_MATCH.rmisNonHolder);
/** Simulated grader on the code-played path: 0.8 correct, adjacent-label errors, leniency towards fluent talk. */
function noisyGrade(P, label, r) {
  const L = ["present", "partial", "absent", "contradicted"];
  if (label !== "present" && P.fluent && r() < 0.15 * P.fluent) return "present";           // graders give way to fluent, confident talk
  if (r() < 0.8) return label;
  const i = L.indexOf(label);
  return L[Math.max(0, Math.min(3, i + (r() < 0.5 ? -1 : 1)))];
}

const CHILD_SYS = (P, c, cls, hidden) => [
  `You are role-playing a real Indian school child (Class ${P.classLevel}) in a voice lesson with an AI teacher. Personality: ${P.desc}`,
  `Speak ${P.lang === "en" ? "English (Indian school English)" : P.lang === "hi" ? "Hindi in Roman script with a few English school words" : "Hinglish (mixed Hindi-English, Roman script)"}.`,
  `Topic: ${c.title}.`,
  `HIDDEN (never say this, never mention it): ${hidden}`,
  `Reply with ONLY what the child says out loud: 1 to ${P.verbal < 0.4 ? 8 : 30} words, natural child speech, no quotation marks, no stage directions.`,
  cls === "probe.teachback" ? "The teacher's pretend robot friend Golu missed the class and asks you to teach it the idea." : "",
].filter(Boolean).join("\n");

function hiddenFor(P, t, c, kind) {
  const exp = c.expectations[0], mis = c.misconceptions[0];
  if (kind === "inst") return t.T ? `You can give a real everyday example of this idea from your own life (a true instance).` : t.mis ? `You believe: ${mis.belief}. Your example will show that belief.` : "You cannot think of a real example; you give something unrelated or vague, or say you don't know.";
  if (t.U) return `You understand WHY: ${exp}. Explain it in your own child words.${P.verbal < 0.4 ? " You are very shy and say very little, maybe only part of it." : ""}`;
  if (t.mis) return `You firmly believe this wrong idea: ${mis.belief}. Explain using that belief, confidently.`;
  if (P.fluent) return `You do NOT know why. You sound confident and reuse lesson words like "${c.title.split(" ").slice(0, 4).join(" ")}", but your reason only repeats the answer or the steps, never the actual reason.`;
  return "You do not know why. You guess, say 'I just know' / 'pata nahi', or repeat the answer.";
}
const PROMPT = { "probe.why": "The teacher's pretend friend asks you, curious: but why is it like that?", "probe.teachback": "Golu says: please teach me this, I missed it!",
  inst: "The teacher asks: where have you seen this in your own life or home?" };

/** The REAL R-MIS operator on the child's words (no truth bit): is it the kit's first misconception? */
async function rmisLLM(c, words, P, llm) {
  const m = c.misconceptions[0];
  if (!m) return false;
  const g = await gradeClosed({ op: "R-MIS", childSpan: words, target: { id: m.id, textEn: m.belief }, lang: P.lang === "en" ? "en" : "hi-Latn+en" }, { send: llm.send, models: llm.gradeModels });
  llm.calls.grade++; llm.log.push({ persona: P.id, op: "R-MIS", words, label: g.label, spanOk: g.spanOk });
  return g.label === m.id;
}

/** Call the child model (taxila-ds41). Returns the child's words or null. */
async function childSays(P, t, c, cls, kind, llm) {
  const msgs = [{ role: "system", content: CHILD_SYS(P, c, cls, hiddenFor(P, t, c, kind)) }, { role: "user", content: PROMPT[kind === "inst" ? "inst" : cls] ?? PROMPT["probe.why"] }];
  try {
    const out = await llm.chat(llm.childModel, msgs, { maxTokens: 120, timeoutMs: 20_000, retries: 1 });
    llm.calls.child++;
    return String(out?.text ?? "").replace(/^["'\s]+|["'\s]+$/g, "").slice(0, 400) || null;
  } catch { llm.calls.childFail++; return null; }
}

/**
 * Answer one probe of class `cls`. Returns { outcome (index), grader, spanOk, mis?, transcript?, graderLabel? }.
 * @param {any} P persona @param {any} t effective truth @param {any} c concept @param {any} shape @param {() => number} r
 * @param {{ chat: Function, childModel: string, gradeModels: string[], calls: any, log: any[] } | null} llm
 */
export async function probeAnswer(P, t, c, shape, r, llm, { game = false } = {}) {
  const cls = shape.emits;
  const op = shape.op.split("+").at(-1);
  const llmGraded = op === "R-EXP" || op === "R-INST";
  if (llmGraded && llm) {
    const kind = op === "R-INST" ? "inst" : cls === "probe.teachback" ? "teach" : "why";
    const words = await childSays(P, t, c, cls, kind, llm);
    if (!words) return { outcome: null, grader: "llm" };
    if (op === "R-INST") {
      const g = await gradeClosed({ op: "R-INST", childSpan: words, target: { id: c.topicId, textEn: `${c.title}. Key idea: ${c.expectations[0]}` }, lang: P.lang === "en" ? "en" : "hi-Latn+en" },
        { send: llm.send, models: llm.gradeModels });
      llm.calls.grade++; llm.log.push({ persona: P.id, truthT: t.T, truthU: t.U, op, words, label: g.label, spanOk: g.spanOk });
      if (g.label === "NA") return { outcome: null, grader: "llm" };
      return { outcome: instOutcome(cls, g.label), grader: "llm", spanOk: g.spanOk, mis: g.label === "invalid_misc" && await rmisLLM(c, words, P, llm), transcript: words };
    }
    const exps = cls === "probe.teachback" ? c.expectations.slice(0, 3) : [c.expectations[0]];
    const labels = [];
    for (const [i, e] of exps.entries()) {
      const g = await gradeClosed({ op: "R-EXP", childSpan: words, target: { id: `${c.topicId}:e${i}`, textEn: e }, lang: P.lang === "en" ? "en" : "hi-Latn+en" },
        { send: llm.send, models: llm.gradeModels, echo: llm.echo === false ? [] : [c.title, PROMPT[cls] ?? ""] });
      llm.calls.grade++; llm.log.push({ persona: P.id, truthU: t.U, truthMis: t.mis, op, cls, words, label: g.label, spanOk: g.spanOk, demoted: g.demoted ?? null });
      labels.push(g.label);
    }
    const real = labels.filter((l) => l !== "NA");
    if (!real.length) return { outcome: null, grader: "llm" };
    const outcome = cls === "probe.teachback" ? teachbackOutcome(real) : cls === "probe.why" ? whyOutcome(real[0]) : outcomeIndex(cls, real[0] === "present" ? "pass" : "fail");
    // spanOk: true here is honest: whyOutcome / teachbackOutcome only see labels that finalise() already span-checked
    // (a positive without a findable span was demoted to absent there).
    return { outcome, grader: "llm", spanOk: true, mis: real.includes("contradicted") && await rmisLLM(c, words, P, llm), transcript: words };
  }
  // ---- code-played ----
  if (cls === "probe.why" || cls === "probe.teachback") {
    if (cls === "probe.teachback") {
      const labels = [0, 1, 2].map(() => noisyGrade(P, trueWhyLabel(P, t, r), r));
      return { outcome: teachbackOutcome(labels), grader: "llm", spanOk: true, mis: labels.includes("contradicted") && rmis(t, r) };
    }
    const l = noisyGrade(P, trueWhyLabel(P, t, r), r);
    return { outcome: whyOutcome(l), grader: "llm", spanOk: true, mis: l === "contradicted" && rmis(t, r) };
  }
  if (cls === "probe.errorspot") {
    let o;
    if (shape.id === "C04" && t.mis) o = r() < 0.9 ? "missed" : "caught";
    else if (t.U) o = r() < P.deference ? "missed" : r() < 0.85 ? "caught_fixed" : "caught";
    else o = pick(r, [["missed", 0.7], ["caught", 0.22], ["caught_fixed", 0.08]]);
    return { outcome: outcomeIndex(cls, o), grader: "code" };
  }
  if (cls === "probe.predict") {
    let o;
    if (game && P.gameSkill) o = r() < P.gameSkill ? "right" : "other";
    else if (t.U) o = pick(r, [["right", 0.85], ["other", 0.1], ["mapped_wrong", 0.05]]);
    else if (t.mis) o = pick(r, [["mapped_wrong", 0.7], ["right", 0.2], ["other", 0.1]]);
    else if (P.guessOpen > 0.2) o = pick(r, [["right", 0.34], ["mapped_wrong", 0.33], ["other", 0.33]]);
    else o = pick(r, [["right", 0.4], ["mapped_wrong", 0.3], ["other", 0.3]]);
    return { outcome: outcomeIndex(cls, o), grader: "code", mis: o === "mapped_wrong" };
  }
  if (cls === "probe.transfer.near" || cls === "probe.transfer.far") {
    const far = cls === "probe.transfer.far";
    let p = t.T ? (far ? 0.75 : 0.85) : t.K ? (far ? 0.08 : 0.25) : far ? 0.03 : 0.1;
    if (game && P.gameSkill) p = Math.max(p, P.gameSkill * (far ? 0.6 : 0.8));
    if (op === "R-INST" || op === "R-EXP") p = t.T ? 0.3 + 0.6 * P.verbal : 0.12 + 0.1 * P.fluent;
    return { outcome: outcomeIndex(cls, r() < p ? "pass" : "fail"), grader: op === "R-KEY" ? "code" : "llm", spanOk: true };
  }
  if (cls === "item.open") { const a = itemAnswer(P, t, "std", r); return { outcome: outcomeIndex(cls, a.o), grader: "code", mis: a.mis }; }
  if (cls.startsWith("item.mcq")) {
    const k = Number(cls.slice(-1));
    const a = choiceAnswer(P, t, k, r, { planted: shape.id === "C08" });
    return { outcome: outcomeIndex(cls, a.o), grader: "code", mis: a.mis };
  }
  throw new Error(`child: no answer model for ${cls}`);
}

/** Voice cues the session would compute (server/voice/features.js signalsFrom): hesitation on a correct answer. */
export function voiceCues(P, correct, r, { lucky = false } = {}) {
  const p = lucky ? Math.max(P.hesitation, 0.6) : P.hesitation;
  return { followUpProbe: correct && r() < p, gentlerHint: !correct && r() < p * 0.8 };
}
