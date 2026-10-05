// Evidence classifier: maps a child's utterance onto the ACTIVE item's key / acceptable forms /
// misconception options. It never free-grades (inherited law: a model never grades — it only says which
// listed option the reply matches; code turns that into an outcome). Deterministic paths run first
// (chips, module answers, exact key match, low ASR, lexical don't-know), so the model is only asked
// when the bytes cannot decide.
import { chat, DEPLOY, isReasoningFamily, isContentFilter } from "../azure.js";
import { readUtterance } from "../learner/affect.js";
import { scanSafety, wantsToStop, scrubPii } from "./safety.js";
import { whyKey, norm as normAnswer, posesItem, revealsAnswer } from "./items.js";
import { INTEREST_IDS } from "../../shared/interests.js";

// ───────────── the signals block (W2-E BR2; TEACHER-BRAIN TB4, §14.2-14.3; owner of this block: W2-E) ─────────────
// Per-turn perception rides on the SAME classify call (no new model call on the turn): the dialogue act (with the IDK
// split: can't recall vs never learned), a personal share, an interest tag, humour. A HYPOTHESIS about this turn, never
// a stored trait (NM-3): the turn's consumers read it (affect counters, persona pace/humour, the Moment) and it is gone.
// The grading labels are unchanged (M2b: 30/30 labels with and without the block). Off unless TAXILA_CLASSIFY_SIGNALS=1
// until G-SIG passes on the full item set (label agreement ≥ 99%, acts ≥ 0.9 on a two-rater set). A malformed block
// drops the signals for the turn; the labels stand.
export const SIGNAL_ACTS = Object.freeze(["answer", "question_curious", "question_clarify", "chit_chat", "idk_not_known", "idk_cant_recall",
  "frustration_words", "pride_words", "meta_slow", "meta_break"]);
export const signalsOn = () => process.env.TAXILA_CLASSIFY_SIGNALS === "1";

/**
 * The deployment a failed classify call is retried on once (W2-E L5): TAXILA_CLASSIFY_FALLBACK, else taxila-fast (MODEL-
 * ROUTER §0's fallback for the production classifier), never the deployment that just failed. "0" turns it off.
 */
export function classifyFallback() {
  const v = process.env.TAXILA_CLASSIFY_FALLBACK;
  if (v === "0") return null;
  const fb = v || DEPLOY.fast;
  return fb && fb !== DEPLOY.classify ? fb : null;
}
const SIGNAL_PROPS = () => ({
  act: { type: "string", enum: [...SIGNAL_ACTS] }, personal_share: { type: "boolean" },
  interest: { type: "string", enum: [...INTEREST_IDS, "none"] }, humour: { type: "boolean" },
});
const SIGNALS_NOTE = [
  "signals (about THIS reply only; a guess, never a judgement of the child):",
  "- act: answer (attempts the question) | question_curious (asks something new out of interest) | question_clarify (asks what the question means) | chit_chat | idk_not_known (says they never learned it) | idk_cant_recall (knew it once, cannot remember now) | frustration_words | pride_words | meta_slow (asks her to go slower) | meta_break (asks for a break or to stop for now).",
  "- personal_share: they tell something about their own life. interest: a listed interest they name as theirs, else none (a thing merely mentioned is none). humour: they joke or laugh.",
].join("\n");

/** The signals block of a model reply → TurnSignals, or null when absent or malformed (the labels are unaffected). */
export function parseSignals(json) {
  if (!json || typeof json !== "object" || !SIGNAL_ACTS.includes(json.act)) return null;
  const interest = typeof json.interest === "string" && (INTEREST_IDS.includes(json.interest) || json.interest === "none") ? json.interest : "none";
  return { act: json.act, personalShare: json.personal_share === true, interest, humour: json.humour === true };
}

/**
 * The actionable part of the signals, as flags the affect machine reads (learner/affect.js nextAffect gets the flags as
 * its `read`): only the ones a consumer acts on, and only when true, so a turn without signals is byte-identical.
 */
export function signalFlags(sig) {
  if (!sig) return {};
  return {
    ...(sig.act === "frustration_words" ? { frustrationWords: true } : {}), ...(sig.act === "meta_break" ? { metaBreak: true } : {}),
    ...(sig.act === "meta_slow" ? { metaSlow: true } : {}), ...(sig.act === "idk_cant_recall" ? { idkCantRecall: true } : {}),
    ...(sig.act === "idk_not_known" ? { idkNotKnown: true } : {}), ...(sig.humour ? { humour: true } : {}),
  };
}

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
  // "Show me choices" tiles offered for THIS item (state.js offerChoices): a tap on one is graded in code.
  const offered = s.offered?.itemId === item.id && Array.isArray(s.offered.options) ? s.offered.options : undefined;
  return { mode: "item", item, key: item.answer, also: item.acceptable || [], ideas, misconceptions: mis, options: item.options, open: OPEN_KINDS.has(item.kind),
    ...(offered ? { offered } : {}) };
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
  const flags = { off_topic: { type: "boolean" }, distress: { type: "boolean" }, asks_for_answer: { type: "boolean" }, wants_to_stop: { type: "boolean" },
    ...(signalsOn() ? SIGNAL_PROPS() : {}) };
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
    "asks_for_answer: they ask to be told the answer. wants_to_stop: they say they want to stop or leave now (NOT a request to change topic, explain differently, go slower or take a break). off_topic: the reply is about something unrelated to the lesson.",
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
  if (signalsOn()) base.push(SIGNALS_NOTE);
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

/**
 * When a classifier call has not answered after this long, a second identical request goes out and the first
 * answer wins (the other is ignored). The classifier is on the reply path of every model-classified turn,
 * and a fast non-reasoning model's tail is not its median: grok-4-1-fast-non-reasoning answered in ~0.6 s
 * p50 but 2 of ~60 calls hung to the 4 s / 7 s timeouts (evals/cascade-latency.mjs, 2026-10-02).
 * TAXILA_CLASSIFY_HEDGE_MS overrides; 0 = off. Off by default for reasoning-family deployments, whose normal
 * spread (taxila-fast 0.9-2.9 s) would duplicate a third of the calls.
 */
export const classifyHedgeMs = (deployment = DEPLOY.classify) => {
  const v = process.env.TAXILA_CLASSIFY_HEDGE_MS;
  if (v !== undefined && v !== "") return Math.max(0, Number(v) || 0);
  return isReasoningFamily(deployment) ? 0 : 1500;
};

/**
 * `fn()` now, and once more after `ms` if it has not settled; the first to fulfil wins. A first call that
 * fails before the hedge fires fails the whole (its own retry has already run, in azure.js); once both are
 * out, it fails only when both have. Exported for tests.
 */
export function hedged(fn, ms) {
  if (!(ms > 0)) return fn();
  return new Promise((resolve, reject) => {
    let pending = 0, settled = false;
    const finish = (ok, v) => { if (settled) return; settled = true; clearTimeout(timer); (ok ? resolve : reject)(v); };
    const run = () => {
      pending += 1;
      // A content-filter block on EITHER request decides at once (fails closed): the duplicate answering
      // "not distress" a moment later must never overrule the filter's read of the same child turn.
      fn().then((v) => finish(true, v), (e) => { pending -= 1; if (isContentFilter(e) || !pending) finish(false, e); });
    };
    const timer = setTimeout(() => { if (!settled) run(); }, ms);
    run();
  });
}

/**
 * The classify hedge onto the FALLBACK deployment (W2-E fixer; BUILD-PLAN W2-E failure drill): `primary()` now; if it has
 * not settled after `ms`, or fails before that, `backup()` (another deployment, so a hung or overloaded classify
 * deployment is never asked twice); the first to fulfil wins. A content-filter block on EITHER decides at once (fails
 * closed). Rejects only when both have failed (with the primary's error). `backup` null = the same-deployment hedge.
 * Resolves to { value, backup: boolean } so the caller can trace which deployment answered. Exported for tests.
 */
export function hedgedFallback(primary, backup, ms) {
  if (!backup) return hedged(primary, ms).then((value) => ({ value, backup: false }));
  return new Promise((resolve, reject) => {
    let settled = false, pending = 0, firstErr = null, backupStarted = false, timer = null;
    const finish = (ok, v) => { if (settled) return; settled = true; clearTimeout(timer); (ok ? resolve : reject)(v); };
    const fail = (e) => {
      if (isContentFilter(e)) return finish(false, e);
      firstErr ??= e;
      pending -= 1;
      if (!backupStarted) return startBackup();
      if (!pending) finish(false, firstErr);
    };
    const startBackup = () => {
      if (backupStarted || settled) return;
      backupStarted = true;
      pending += 1;
      backup().then((v) => finish(true, { value: v, backup: true }), fail);
    };
    pending += 1;
    primary().then((v) => finish(true, { value: v, backup: false }), fail);
    // never unref'd: the hedge must fire even when nothing else holds the event loop; it is cleared on the first answer
    timer = setTimeout(startBackup, ms > 0 ? ms : 0x7fffffff);
  });
}

/**
 * Drill only (W2-E failure drill): TAXILA_DRILL_HANG_DEPLOY names a deployment whose classify calls hang until their own
 * timeout, like a dead deployment that accepts the connection and never answers. Unset in every real deployment.
 */
function classifyChat(deployment, messages, opts) {
  const hang = process.env.TAXILA_DRILL_HANG_DEPLOY;
  if (hang && hang === deployment) {
    return new Promise((_, reject) => { const t = setTimeout(() => reject(Object.assign(new Error(`chat ${deployment} timed out after ${opts.timeoutMs} ms (drill)`), { code: "timeout", status: 0 })), opts.timeoutMs ?? 7000); t.unref?.(); });
  }
  return chat(deployment, messages, opts);
}

const DISTRESS_SCHEMA = { type: "object", additionalProperties: false, required: ["distress"], properties: { distress: { type: "boolean" } } };

/**
 * The model's distress read alone, for turns the full classifier does not see (a low-confidence transcript)
 * or could not label (it failed): the predicate is the floor, this is its backup. One retry-free small call;
 * if it fails too, the predicate's verdict stands.
 */
async function distressCheck(text, classLevel, trace) {
  try {
    const messages = [
      { role: "system", content: `A reply from an Indian school child (class ${classLevel}) in a lesson, in Hindi, English or Hinglish; the transcript may be misheard. distress: true ONLY for signs the child is unsafe, hurt, abused, frightened, very sad, or may harm themself — never for ordinary frustration with a question.` },
      // direct identifiers masked before the child's words reach the model (decision scrub-pii-cued)
      { role: "user", content: scrubPii(text).text },
    ];
    const opts = { schema: DISTRESS_SCHEMA, schemaName: "distress", effort: "none", maxTokens: 40, timeoutMs: 4000, retries: 0, trace, quotaLane: "hot" };
    // W2-E fixer: in an outage the backup must not fail open to the predicate alone (MODEL-ROUTER §0: passive-ideation
    // phrasings rest on the model), so it hedges onto the fallback deployment like the classifier does.
    const fb = classifyFallback();
    const { value: { json } } = await hedgedFallback(() => classifyChat(DEPLOY.classify, messages, opts),
      fb ? () => classifyChat(fb, messages, opts) : null, classifyHedgeMs());
    return !!json?.distress;
  } catch (e) {
    // The content filter blocking a child's words is itself a strong distress signal: fail CLOSED.
    if (isContentFilter(e)) { console.warn("[classify] distress check blocked by the content filter: treated as distress"); return true; }
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
/**
 * Did the teacher's last turn ask some OTHER question than the item's? Only then can an exact key match be an answer
 * to that other question: "36" to an improvised "5 ka square?" matched the key of "26 or 36, which is a square?",
 * and "25" to "what comes after 25?" was taken as right (audit #13, "Bilkul"). Such a turn goes to the model, whose
 * rule labels a reply to a different question no_attempt. A turn that poses the item, or asks nothing, is unchanged.
 */
export function askedOther(heard, item, lang) {
  if (!heard || !item || !/[?？]/.test(heard)) return false;
  // A line that gives away THIS item's key is a leak about this item, not a different question: the reply is graded
  // against the item and lesson.js marks it hintsUsed 4 (worth nothing), never dropped as an echo of "another" question.
  if (revealsAnswer(heard, item)) return false;
  const lastQ = (String(heard).match(/[^.!?।]*[?？]/g) ?? []).at(-1) ?? "";
  return !posesItem(heard, item, lang) && !posesItem(lastQ, item, lang);
}

/** Does a question offer two or more numbers as alternatives ("25 hai ya 30", "26 or 36", "25, 30 ya 35")? */
export const isChoiceQuestion = (q) =>
  /\d[\d,]*(?:[./]\d+)?\s*(?:hai|he|h|hoga|is|aayega)?\s*(?:,|ya\s+phir|ya|or|या|athva|athwa|vs\.?|versus)\s*[^?？]*?\d/iu.test(String(q ?? "").replace(/(\d),(?=\d)/g, "$1"));

/**
 * The child's help requests (the Hint sheet and the Young Help menu, src/child/lesson/useDesk.ts REQUESTS): a tap on
 * one sends a fixed label with this chip id. They are client ACTIONS, never the child's words (audit flows G3: "Choices
 * dikhao" ×13 in the parent transcript, quoted as "In Aarav's words"; G6: "Skip for now" read as "I want to stop").
 * chip id → the request the Director acts on (state.js decide).
 */
export const HELP_REQUESTS = Object.freeze({
  hint: "hint", why: "why", know: "know", another: "another", slower: "slower", skip: "skip",
  choices: "choices", help_choices: "choices", how: "how", help_how: "how",
});
/** @returns {string | null} the help request a chip id names */
export const helpOf = (chipId) => (typeof chipId === "string" && Object.hasOwn(HELP_REQUESTS, chipId) ? HELP_REQUESTS[chipId] : null);

export function classifyFast({ target, childText, asrConfidence, typed, chipId, moduleAnswer, heard, lang }) {
  const text = String(childText || "").trim();
  // A help request is never graded and never read for stop words or a don't-know (no evidence, no flags) — unless
  // the words that came with it trip the safety predicate, which always decides first.
  const help = helpOf(chipId);
  if (help && !scanSafety(text).distress) {
    const none = { dontKnow: false, asksForAnswer: false, minimal: false, offTopic: false, distress: false, distressKind: null, wantsToStop: false };
    return { result: { outcome: "no_evidence", confidence: 1, source: "help", help, flags: none }, flags: none, text };
  }
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
  if (chipId && target.offered && /^pick:\d+$/.test(chipId)) {
    const picked = target.offered[Number(chipId.slice(5))];
    if (typeof picked === "string") {
      const right = [target.key, ...(target.also || [])].some((k) => k && norm(k) === norm(picked));
      return done(right ? "correct" : "incorrect", "chip");
    }
  }
  if (moduleAnswer && typeof moduleAnswer.correct === "boolean" && target.mode === "item") {
    return done(moduleAnswer.correct ? "correct" : "incorrect", "module");
  }
  if (!text) return done("no_evidence", "empty");
  if (safety.distress) return done("no_evidence", "predicate");
  if (!typed && typeof asrConfidence === "number" && asrConfidence < ASR_MIN) return { result: null, flags, text, lowAsr: true };
  const other = target.mode === "item" && askedOther(heard, target.item, lang);
  // An echo: the reply is only a number the teacher's OTHER question itself stated ("25" to "what comes after 25?").
  // It answers neither question, so it is no evidence — never the item's key matched by accident (audit #13).
  if (other && /^\s*[-−]?[\d,]+(?:[./]\d+)?\s*[.!?]?\s*$/.test(text)) {
    const lastQ = (String(heard).match(/[^.!?।]*[?？]/g) ?? []).at(-1) ?? "";
    const nums = (t) => (String(t).match(/\d[\d,]*(?:[./]\d+)?/g) ?? []).map((x) => x.replace(/,/g, ""));
    const [n] = nums(text);
    // A choice question ("Kya yeh 25 hai ya 30?", "26 or 36?") offers the number as an ANSWER, not as its subject:
    // picking one is a real answer, so it goes to the model (no exact match after another question).
    if (n && nums(lastQ).includes(n) && !isChoiceQuestion(lastQ)) return done("no_evidence", "echo");
  }
  if (target.mode === "item" && !other) {
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
    flags.distress = flags.distress || await distressCheck(text, classLevel, trace);
    if (flags.distress) flags.distressKind ??= "model";
    return done("no_evidence", "asr");
  }

  const messages = [
    { role: "system", content: systemPrompt(target, classLevel) },
    // the bytes decided nothing (classifyFast); the model gets the child's words with direct identifiers masked
    { role: "user", content: userPrompt(target, scrubPii(text).text, heard) },
  ];
  const opts = { schema: schemaFor(target), schemaName: `classify_${target.mode}`,
    effort: target.mode === "none" ? "none" : "low", maxTokens: target.mode === "none" ? 120 : 900, timeoutMs: 7000, trace, quotaLane: "hot" };
  const labelled = (json, viaFallback = false) => {
    const { modelFlags, ...label } = parseClassification(json, target);
    for (const k of Object.keys(modelFlags)) flags[k] = flags[k] || modelFlags[k];
    const signals = signalsOn() ? parseSignals(json) : null;
    if (signals) Object.assign(flags, signalFlags(signals));
    // `fallback`: the fallback deployment answered (brain_trace cls_source.fallback); the label is a model label either way
    return { ...label, source: "model", flags, ...(signals ? { signals } : {}), ...(viaFallback ? { fallback: true } : {}) };
  };
  const filtered = () => {
    console.warn("[classify] blocked by the content filter: routed to safeguarding");
    flags.distress = true;
    flags.distressKind ??= "content_filter";
    return done("no_evidence", "content_filter");
  };
  // W2-E fixer (failure drill, real outage shapes): the hedge goes to the FALLBACK deployment (MODEL-ROUTER §0: taxila-fast,
  // the OpenAI family), not a second request to the same one. A hung, 5xx or 429ing classify deployment used to cost the
  // child ~15-21 s (7 s timeout + one retry + the same-deployment hedge, then the 6 s fallback); now the fallback starts at
  // the hedge (1.5 s) or at once when the primary fails fast, and neither call retries (the other is the retry).
  const fb = classifyFallback();
  try {
    const { value: { json }, backup } = await hedgedFallback(() => classifyChat(DEPLOY.classify, messages, fb ? { ...opts, retries: 0 } : opts),
      fb ? () => classifyChat(fb, messages, { ...opts, timeoutMs: 6000, retries: 0 }) : null, classifyHedgeMs());
    return labelled(json, backup);
  } catch (e) {
    // The content filter blocked the child's turn: fail CLOSED to the safeguarding protocol (never "safe",
    // never a normal reply). No second model call — the same words would be blocked again.
    if (isContentFilter(e)) return filtered();
    console.warn("[classify] model unavailable (classify and fallback):", e.message);
    // A classifier outage costs one turn of evidence, never the lesson.
    flags.distress = flags.distress || await distressCheck(text, classLevel, trace);
    if (flags.distress) flags.distressKind ??= "model";
    return done("no_evidence", "error");
  }
}
