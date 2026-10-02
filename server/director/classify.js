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
 * What the next utterance is classified against.
 * @returns {{ mode: "item"|"why"|"teachback"|"none", item?: any, key?: string, also?: string[],
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
  if (!item || s.hintLevel >= 4) return { mode: "none", misconceptions: [] };
  const mis = misList(item.misconceptions ?? kit.misconceptions, item.targetsMisconception);
  if (s.pendingWhy === item.id) return { mode: "why", item, key: whyKey(kit, item.skillId) || item.answer, also: [], misconceptions: mis, open: true };
  return { mode: "item", item, key: item.answer, also: item.acceptable || [], misconceptions: mis, options: item.options, open: OPEN_KINDS.has(item.kind) };
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
  if (target.mode === "teachback") {
    return obj({
      covered: { type: "array", items: { type: "string", enum: target.expectations.map((_, i) => `e${i + 1}`) } },
      misconceptions: { type: "array", items: { type: "string", enum: target.misconceptions.map((m) => m.tag).concat("none") } },
      confidence: { type: "number" }, ...flags,
    });
  }
  if (target.mode === "none") return obj(flags);
  const options = ["key", ...target.misconceptions.map((m) => m.tag), ...(target.open ? ["partial"] : []), "other_wrong", "dont_know", "no_attempt"];
  return obj({ match: { type: "string", enum: options }, confidence: { type: "number" }, ...flags });
}

function systemPrompt(target, classLevel) {
  const base = [
    `You label one reply from an Indian school child (class ${classLevel}) in a live lesson. You never grade freely and never judge quality: you only say which listed option the reply matches.`,
    "The child may speak Hindi, English or Hinglish, in Roman or Devanagari script. Number words count (aadha = 1/2, ek tihai = 1/3, teen = 3, 'teen wala' = the one with 3). Transcripts come from speech recognition and can have small errors.",
    "distress: true ONLY for signs the child is unsafe, hurt, abused, frightened, very sad, or may harm themself — never for ordinary frustration with a question.",
    "asks_for_answer: they ask to be told the answer. wants_to_stop: they say they want to stop or leave now. off_topic: the reply is about something unrelated to the lesson.",
  ];
  if (target.mode === "teachback") {
    base.push("The child is explaining the topic to a pretend younger learner. covered: the expected ideas the explanation contains, in any words or language. misconceptions: the listed wrong beliefs it expresses ('none' if none). confidence: 0-1.");
  } else if (target.mode !== "none") {
    base.push([
      "match rules:",
      "- key: the reply gives the KEY (any wording, language or equivalent form), even with extra words. If they give two answers, label the final one.",
      "- mN: the reply's answer or reason is what misconception mN predicts.",
      target.open ? "- partial: part of the key idea is there but not all of it." : "",
      "- other_wrong: any other attempted answer.",
      "- dont_know: says they don't know or are unsure, with no answer.",
      "- no_attempt: not an answer to this question (greeting, chit-chat, a question back, unrelated talk).",
      "confidence: 0-1, how sure you are of the label.",
    ].filter(Boolean).join("\n"));
  }
  return base.join("\n");
}

function userPrompt(target, childText) {
  const lines = [];
  const misLines = target.misconceptions.map((m) => `${m.tag}: ${m.belief}${m.signs.length ? ` (signs: ${m.signs.join("; ")})` : ""}`);
  if (target.mode === "teachback") {
    lines.push("EXPECTED IDEAS:", ...target.expectations.map((e, i) => `e${i + 1}: ${e}`));
  } else if (target.mode === "why") {
    lines.push(`The child answered this correctly: "${target.item.prompt_en}" (answer: ${target.item.answer}).`,
      "The teacher then asked: how did you know / why is that right?", `KEY IDEA: ${target.key}`);
  } else if (target.mode === "item") {
    lines.push(`QUESTION THE TEACHER ASKED: ${target.item.prompt_en} | ${target.item.prompt_hi}`,
      `KEY: ${target.key}${target.also.length ? `; also counts as key: ${target.also.join("; ")}` : ""}`);
    if (target.options?.length) lines.push("OPTIONS AS POSED:", ...target.options.map((o) => `"${o.text}" → ${optionTag(o, target)}`));
  }
  if (misLines.length) lines.push("MISCONCEPTIONS:", ...misLines);
  lines.push(`CHILD'S REPLY: ${childText}`);
  return lines.join("\n");
}

/**
 * Turn the model's JSON into a Classification. Pure, so it can be tested without the network.
 * @returns {{ outcome: string, misconceptionId?: string, confidence: number, covered?: string[], missing?: string[],
 *   modelFlags: { offTopic: boolean, distress: boolean, asksForAnswer: boolean, wantsToStop: boolean, dontKnow: boolean } }}
 */
export function parseClassification(json, target) {
  const modelFlags = {
    offTopic: !!json?.off_topic, distress: !!json?.distress, asksForAnswer: !!json?.asks_for_answer,
    wantsToStop: !!json?.wants_to_stop, dontKnow: json?.match === "dont_know",
  };
  const confidence = Math.max(0, Math.min(1, Number(json?.confidence ?? 1)));
  if (target.mode === "none") return { outcome: "no_evidence", confidence, modelFlags };
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
  const mapped = fromMatch(json?.match, target);
  if (confidence < CONFIDENCE_MIN) return { outcome: "no_evidence", confidence, modelFlags };
  return { ...mapped, confidence, modelFlags };
}

/**
 * Classify one child turn.
 * @param {{ target: ReturnType<typeof targetFor>, childText: string, asrConfidence?: number, typed?: boolean,
 *   chipId?: string, moduleAnswer?: { correct?: boolean } | null, classLevel: number, trace?: object[] }} args
 * @returns {Promise<{ outcome: string, misconceptionId?: string, confidence: number, source: string,
 *   covered?: string[], missing?: string[],
 *   flags: { dontKnow: boolean, asksForAnswer: boolean, minimal: boolean, offTopic: boolean, distress: boolean, distressKind: string|null, wantsToStop: boolean } }>}
 */
export async function classify({ target, childText, asrConfidence, typed, chipId, moduleAnswer, classLevel, trace }) {
  const text = String(childText || "").trim();
  const read = readUtterance(text);
  const safety = scanSafety(text);
  const flags = {
    dontKnow: read.dontKnow, asksForAnswer: read.asksForAnswer, minimal: read.minimal,
    offTopic: false, distress: safety.distress, distressKind: safety.kind, wantsToStop: wantsToStop(text),
  };
  const done = (outcome, source, extra = {}) => ({ outcome, confidence: 1, source, flags, ...extra });

  // Taps and module answers are machine truth: no model, no transcript.
  if (chipId && target.options && /^opt:\d+$/.test(chipId)) {
    const o = target.options[Number(chipId.slice(4))];
    if (o) { const m = fromMatch(optionTag(o, target), target); return done(m.outcome, "chip", m); }
  }
  if (chipId?.startsWith("why:") && target.mode === "why") {
    return chipId === "why:key" ? done("correct", "chip") : done("misconception", "chip", { misconceptionId: target.misconceptions[0]?.id });
  }
  if (moduleAnswer && typeof moduleAnswer.correct === "boolean" && target.mode === "item") {
    return done(moduleAnswer.correct ? "correct" : "incorrect", "module");
  }
  if (!text) return done("no_evidence", "empty");
  if (safety.distress) return done("no_evidence", "predicate");
  if (!typed && typeof asrConfidence === "number" && asrConfidence < ASR_MIN) return done("no_evidence", "asr");
  if (target.mode === "item" || target.mode === "why") {
    const t = norm(text);
    if ([target.key, ...(target.also || [])].some((k) => k && norm(k) === t)) return done("correct", "exact");
    const opt = target.options?.find((o) => norm(o.text) === t);
    if (opt) { const m = fromMatch(optionTag(opt, target), target); return done(m.outcome, "exact", m); }
    // A bare "pata nahi" / "just tell me" (no number, a few words) needs no model to read.
    if ((read.dontKnow && read.words <= 4 || read.asksForAnswer && read.words <= 8) && !/\d/.test(text)) return done("no_evidence", "lexical");
  }

  try {
    const { json } = await chat(DEPLOY.fast, [
      { role: "system", content: systemPrompt(target, classLevel) },
      { role: "user", content: userPrompt(target, text) },
    ], {
      schema: schemaFor(target), schemaName: `classify_${target.mode}`,
      effort: target.mode === "none" ? "none" : "low", maxTokens: target.mode === "none" ? 120 : 900, timeoutMs: 9000, trace,
    });
    const { modelFlags, ...label } = parseClassification(json, target);
    for (const k of Object.keys(modelFlags)) flags[k] = flags[k] || modelFlags[k];
    return { ...label, source: "model", flags };
  } catch (e) {
    // A classifier outage costs one turn of evidence, never the lesson.
    console.warn("[classify] model unavailable:", e.message);
    return done("no_evidence", "error");
  }
}
