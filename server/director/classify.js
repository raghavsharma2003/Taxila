// Evidence classifier: maps a child's utterance onto the ACTIVE item's key / acceptable forms /
// misconception options. It never free-grades (inherited law: a model never grades — it only says which
// listed option the reply matches; code turns that into an outcome). Deterministic paths run first
// (chips, module answers, exact key match, low ASR, lexical don't-know), so the model is only asked
// when the bytes cannot decide.
import { chat, DEPLOY } from "../azure.js";
import { readUtterance } from "../learner/affect.js";
import { scanSafety, wantsToStop } from "./safety.js";
import { whyKey, norm as normAnswer } from "./items.js";

/** Below this ASR confidence a transcript is not evidence (signal-fusion rule 3: never score it wrong). */
export const ASR_MIN = 0.5;
/** Below this classifier confidence the label is not evidence either; the move re-asks instead. */
export const CONFIDENCE_MIN = 0.5;
/** Teach-back passes when it covers this share of the kit's expectations with no misconception. */
export const TEACHBACK_PASS = 0.6;

const OPEN_KINDS = new Set(["why", "teachback"]);

/**
 * What the next utterance is classified against. `ideas` are the kit's key ideas: the key for a "why?"
 * and the yardstick for a reason the child volunteers alongside an answer.
 * @returns {{ mode: "item"|"why"|"teachback"|"none", item?: any, key?: string, also?: string[], ideas?: string[],
 *   misconceptions: { tag: string, id: string, belief: string, signs: string[] }[], options?: any[], expectations?: string[], open?: boolean }}
 */
export function targetFor(s, kit, item) {
  const misList = (list, first) => [...list].sort((a, b) => (b.id === first) - (a.id === first))
    .map((m, i) => ({ tag: `m${i + 1}`, id: m.id, belief: m.belief, signs: m.signs || [] }));
  if (s.phase === "teachback" && s.teachbackAsked) {
    const tb = kit.items.find((i) => i.kind === "teachback");
    const expectations = kit.expectations.length ? kit.expectations : tb ? [tb.answer] : [];
    return { mode: "teachback", expectations, misconceptions: misList(kit.misconceptions) };
  }
  // No keyed item: nothing is graded, but a known wrong belief voiced here is still a sign worth a verifying probe.
  if (!item || s.hintLevel >= 4) return { mode: "none", misconceptions: misList(kit.misconceptions) };
  const mis = misList(item.misconceptions ?? kit.misconceptions, item.targetsMisconception);
  const own = item.expectations ?? kit.expectations;
  const ideas = own.length ? own : [whyKey(kit, item.skillId)].filter(Boolean);
  if (s.pendingWhy === item.id) return { mode: "why", item, ideas, misconceptions: mis };
  return { mode: "item", item, key: item.answer, also: item.acceptable || [], ideas, misconceptions: mis, options: item.options, open: OPEN_KINDS.has(item.kind) };
}

/** Exact-match form: canonical fractions, punctuation and trailing filler stripped. */
const norm = (s) => normAnswer(s).replace(/[.\-]+/g, " ").replace(/\s+/g, " ").trim();

/** Map an option ("key" | "mN" | "other_wrong" …) to an outcome. */
function fromMatch(match, target) {
  if (match === "key") return { outcome: "correct" };
  const m = target.misconceptions.find((x) => x.tag === match);
  if (m) return { outcome: "misconception", misconceptionId: m.id };
  if (match === "partial") return { outcome: "partial" };
  if (match === "other_wrong") return { outcome: "incorrect" };
  return { outcome: "no_evidence" };
}

/** A diagnostic option posed to the child → its tag. */
const optionTag = (o, target) => (o.correct ? "key" : target.misconceptions.find((m) => m.id === o.misconceptionId)?.tag ?? "other_wrong");

function schemaFor(target) {
  const flags = { off_topic: { type: "boolean" }, distress: { type: "boolean" }, asks_for_answer: { type: "boolean" }, wants_to_stop: { type: "boolean" } };
  const obj = (properties) => ({ type: "object", additionalProperties: false, required: Object.keys(properties), properties });
  const tags = target.misconceptions.map((m) => m.tag);
  if (target.mode === "teachback") {
    return obj({
      covered: { type: "array", items: { type: "string", enum: target.expectations.map((_, i) => `e${i + 1}`) } },
      misconceptions: { type: "array", items: { type: "string", enum: tags.concat("none") } },
      confidence: { type: "number" }, ...flags,
    });
  }
  if (target.mode === "none") return obj({ ...(tags.length ? { belief: { type: "string", enum: ["none", ...tags] } } : {}), ...flags });
  const options = ["key", ...tags, ...(target.open ? ["partial"] : []), "other_wrong", "dont_know", "no_attempt"];
  const reason = target.mode === "item" && target.ideas.length ? { reason: { type: "string", enum: ["none", "right", ...tags] } } : {};
  return obj({ match: { type: "string", enum: options }, ...reason, confidence: { type: "number" }, ...flags });
}

function systemPrompt(target, classLevel) {
  const base = [
    `You label one reply from an Indian school child (class ${classLevel}) in a live lesson. You never grade freely and never judge quality: you only say which listed option the reply matches.`,
    "The child may speak Hindi, English or Hinglish, in Roman or Devanagari script. Number words count (aadha = 1/2, ek tihai = 1/3, teen = 3, 'teen wala' = the one with 3). Transcripts come from speech recognition and can have small errors.",
    "If what the teacher last said asked a DIFFERENT question from the one listed, and the reply answers that other question, label it no_attempt: it is not evidence about the listed question.",
    "distress: true ONLY for signs the child is unsafe, hurt, abused, frightened, very sad, or may harm themself — never for ordinary frustration with a question.",
    "asks_for_answer: they ask to be told the answer. wants_to_stop: they say they want to stop or leave now. off_topic: the reply is about something unrelated to the lesson.",
  ];
  if (target.mode === "none" && target.misconceptions.length) {
    base.push("belief: if the reply expresses one of the listed wrong beliefs (in any words or language), its tag; otherwise none.");
  }
  if (target.mode === "teachback") {
    base.push("The child is explaining the topic to a pretend younger learner. covered: the expected ideas the explanation contains, in any words or language. misconceptions: the listed wrong beliefs it expresses ('none' if none). confidence: 0-1.");
  } else if (target.mode !== "none") {
    base.push([
      "match rules:",
      target.mode === "why"
        ? "- key: the reply gives a REASON that matches ANY of the KEY IDEAS, in any words or language (a child's simple version counts). A bare answer, a fraction's name or a repeat of the question is not a reason: other_wrong."
        : "- key: the reply gives the KEY (any wording, language or equivalent form), even with extra words. If they give two answers, label the final one.",
      "- mN: the reply's answer or reason is what misconception mN predicts.",
      target.open ? "- partial: part of the key idea is there but not all of it." : "",
      "- other_wrong: any other attempted answer.",
      "- dont_know: says they don't know or are unsure, with no answer.",
      "- no_attempt: not an answer to this question (greeting, chit-chat, a question back, unrelated talk).",
      target.mode === "item" && target.ideas.length
        ? "reason: if the reply ALSO gives a reason or explanation — 'right' if it matches a KEY IDEA, 'mN' if it is what misconception mN predicts; otherwise 'none'."
        : "",
      "confidence: 0-1, how sure you are of the label.",
    ].filter(Boolean).join("\n"));
  }
  return base.join("\n");
}

function userPrompt(target, childText, heard) {
  const lines = [];
  const misLines = target.misconceptions.map((m) => `${m.tag}: ${m.belief}${m.signs.length ? ` (signs: ${m.signs.join("; ")})` : ""}`);
  if (target.mode === "teachback") {
    lines.push("EXPECTED IDEAS:", ...target.expectations.map((e, i) => `e${i + 1}: ${e}`));
  } else if (target.mode === "why") {
    lines.push(`The child answered this correctly: "${target.item.prompt_en}" (answer: ${target.item.answer}).`,
      "The teacher then asked how they knew / why it is right.", "KEY IDEAS:", ...target.ideas.map((e) => `- ${e}`));
  } else if (target.mode === "item") {
    lines.push(`QUESTION: ${target.item.prompt_en} | ${target.item.prompt_hi}`,
      `KEY: ${target.key}${target.also.length ? `; also counts as key: ${target.also.join("; ")}` : ""}`);
    if (target.options?.length) lines.push("OPTIONS AS POSED:", ...target.options.map((o) => `"${o.text}" → ${optionTag(o, target)}`));
    if (target.ideas.length) lines.push("KEY IDEAS (for a reason, if one is given):", ...target.ideas.map((e) => `- ${e}`));
  }
  if (misLines.length) lines.push("MISCONCEPTIONS:", ...misLines);
  if (heard) lines.push(`WHAT THE TEACHER LAST SAID: ${String(heard).slice(0, 500)}`);
  lines.push(`CHILD'S REPLY: ${childText}`);
  return lines.join("\n");
}

/**
 * Turn the model's JSON into a Classification. Pure, so it can be tested without the network.
 * `reason` is set only when the child volunteered one with a correct answer: "right", or the
 * misconception it expresses (`reasonMisconceptionId`) — the correct-answer trap, caught without asking.
 * `voiced` is a known wrong belief stated where no keyed item was active: a flag, never graded evidence.
 * @returns {{ outcome: string, misconceptionId?: string, reason?: "right"|"misconception", reasonMisconceptionId?: string, voiced?: string,
 *   confidence: number, covered?: string[], missing?: string[],
 *   modelFlags: { offTopic: boolean, distress: boolean, asksForAnswer: boolean, wantsToStop: boolean, dontKnow: boolean } }}
 */
export function parseClassification(json, target) {
  const modelFlags = {
    offTopic: !!json?.off_topic, distress: !!json?.distress, asksForAnswer: !!json?.asks_for_answer,
    wantsToStop: !!json?.wants_to_stop, dontKnow: json?.match === "dont_know",
  };
  const confidence = Math.max(0, Math.min(1, Number(json?.confidence ?? 1)));
  if (target.mode === "none") {
    const voiced = target.misconceptions.find((m) => m.tag === json?.belief);
    return { outcome: "no_evidence", ...(voiced && confidence >= CONFIDENCE_MIN ? { voiced: voiced.id } : {}), confidence, modelFlags };
  }
  if (target.mode === "teachback") {
    const idx = new Set((json?.covered || []).map((e) => Number(String(e).slice(1)) - 1).filter((i) => i >= 0 && i < target.expectations.length));
    const covered = target.expectations.filter((_, i) => idx.has(i));
    const missing = target.expectations.filter((_, i) => !idx.has(i));
    const mis = (json?.misconceptions || []).map((t) => target.misconceptions.find((m) => m.tag === t)).find(Boolean);
    let outcome = "incorrect";
    if (mis) outcome = "misconception";
    else if (target.expectations.length && covered.length >= Math.ceil(TEACHBACK_PASS * target.expectations.length)) outcome = "correct";
    else if (covered.length) outcome = "partial";
    if (!target.expectations.length || confidence < CONFIDENCE_MIN) outcome = "no_evidence";
    return { outcome, ...(mis && outcome !== "no_evidence" ? { misconceptionId: mis.id } : {}), confidence, covered, missing, modelFlags };
  }
  if (confidence < CONFIDENCE_MIN) return { outcome: "no_evidence", confidence, modelFlags };
  const mapped = fromMatch(json?.match, target);
  if (mapped.outcome === "correct" && json?.reason && json.reason !== "none") {
    const m = target.misconceptions.find((x) => x.tag === json.reason);
    Object.assign(mapped, m ? { reason: "misconception", reasonMisconceptionId: m.id } : json.reason === "right" ? { reason: "right" } : {});
  }
  return { ...mapped, confidence, modelFlags };
}

const DISTRESS_SCHEMA = { type: "object", additionalProperties: false, required: ["distress"], properties: { distress: { type: "boolean" } } };

/**
 * The model's distress read alone, for turns the full classifier does not see (a low-confidence transcript)
 * or could not label (it failed): the predicate is the floor, this is its backup. One retry-free small call;
 * if it fails too, the predicate's verdict stands.
 */
async function distressCheck(text, classLevel, trace) {
  try {
    const { json } = await chat(DEPLOY.classify, [
      { role: "system", content: `A reply from an Indian school child (class ${classLevel}) in a lesson, in Hindi, English or Hinglish; the transcript may be misheard. distress: true ONLY for signs the child is unsafe, hurt, abused, frightened, very sad, or may harm themself — never for ordinary frustration with a question.` },
      { role: "user", content: text },
    ], { schema: DISTRESS_SCHEMA, schemaName: "distress", effort: "none", maxTokens: 40, timeoutMs: 4000, retries: 0, trace });
    return !!json?.distress;
  } catch (e) {
    console.warn("[classify] distress check unavailable:", e.message);
    return false;
  }
}

/**
 * The deterministic part of classify(): chips, module answers, empty, the safety predicate, exact key or option
 * matches and a lexical don't-know. Returns the label when the bytes decide, or null when classify() must ask
 * the model (or, for a low-ASR transcript, run its distress backup) — which is what lets the turn route start
 * the teacher's reply speculatively alongside that model call (server/routes/lesson.js).
 * @returns {{ result: Awaited<ReturnType<typeof classify>> | null, flags: object, text: string }}
 */
export function classifyFast({ target, childText, asrConfidence, typed, chipId, moduleAnswer }) {
  const text = String(childText || "").trim();
  const read = readUtterance(text);
  const safety = scanSafety(text);
  const flags = {
    dontKnow: read.dontKnow, asksForAnswer: read.asksForAnswer, minimal: read.minimal,
    offTopic: false, distress: safety.distress, distressKind: safety.kind, wantsToStop: wantsToStop(text),
  };
  const done = (outcome, source, extra = {}) => ({ result: { outcome, confidence: 1, source, flags, ...extra }, flags, text });

  // Taps and module answers are machine truth: no model, no transcript.
  if (chipId && target.options && /^opt:\d+$/.test(chipId)) {
    const o = target.options[Number(chipId.slice(4))];
    if (o) { const m = fromMatch(optionTag(o, target), target); return done(m.outcome, "chip", m); }
  }
  if (moduleAnswer && typeof moduleAnswer.correct === "boolean" && target.mode === "item") {
    return done(moduleAnswer.correct ? "correct" : "incorrect", "module");
  }
  if (!text) return done("no_evidence", "empty");
  if (safety.distress) return done("no_evidence", "predicate");
  if (!typed && typeof asrConfidence === "number" && asrConfidence < ASR_MIN) return { result: null, flags, text, lowAsr: true };
  if (target.mode === "item") {
    const t = norm(text);
    if ([target.key, ...(target.also || [])].some((k) => k && norm(k) === t)) return done("correct", "exact");
    const opt = target.options?.find((o) => norm(o.text) === t);
    if (opt) { const m = fromMatch(optionTag(opt, target), target); return done(m.outcome, "exact", m); }
  }
  // A bare "pata nahi" / "just tell me" (no number, a few words) needs no model to read.
  if ((target.mode === "item" || target.mode === "why") && !/\d/.test(text)
    && (read.dontKnow && read.words <= 4 || read.asksForAnswer && read.words <= 8)) return done("no_evidence", "lexical");
  return { result: null, flags, text };
}

/**
 * Classify one child turn.
 * `heard` is what the teacher last said: it lets the classifier refuse evidence for a question nobody asked.
 * @param {{ target: ReturnType<typeof targetFor>, childText: string, asrConfidence?: number, typed?: boolean,
 *   chipId?: string, moduleAnswer?: { correct?: boolean } | null, heard?: string, classLevel: number, trace?: object[] }} args
 * @returns {Promise<{ outcome: string, misconceptionId?: string, confidence: number, source: string,
 *   covered?: string[], missing?: string[],
 *   flags: { dontKnow: boolean, asksForAnswer: boolean, minimal: boolean, offTopic: boolean, distress: boolean, distressKind: string|null, wantsToStop: boolean } }>}
 */
export async function classify(args) {
  const { target, heard, classLevel, trace } = args;
  const fast = classifyFast(args);
  if (fast.result) return fast.result;
  const { flags, text } = fast;
  const done = (outcome, source, extra = {}) => ({ outcome, confidence: 1, source, flags, ...extra });
  if (fast.lowAsr) {
    flags.distress = await distressCheck(text, classLevel, trace);
    return done("no_evidence", "asr");
  }

  try {
    const { json } = await chat(DEPLOY.classify, [
      { role: "system", content: systemPrompt(target, classLevel) },
      { role: "user", content: userPrompt(target, text, heard) },
    ], {
      schema: schemaFor(target), schemaName: `classify_${target.mode}`,
      effort: target.mode === "none" ? "none" : "low", maxTokens: target.mode === "none" ? 120 : 900, timeoutMs: 7000, trace,
    });
    const { modelFlags, ...label } = parseClassification(json, target);
    for (const k of Object.keys(modelFlags)) flags[k] = flags[k] || modelFlags[k];
    return { ...label, source: "model", flags };
  } catch (e) {
    // A classifier outage costs one turn of evidence, never the lesson.
    console.warn("[classify] model unavailable:", e.message);
    flags.distress = await distressCheck(text, classLevel, trace);
    return done("no_evidence", "error");
  }
}
