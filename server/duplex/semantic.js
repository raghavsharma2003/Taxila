// Stage A's semantic estimator (ARCHITECTURE.md v2 §2.5.2, §5.1): a fast Azure model reads the child's STABLE PREFIX in an
// open context (open_explanation, question_to_her, chit_chat) and returns typed numbers, never words:
//   { pComplete, pHoldWanted, asksHer, offTask }  each in [0, 1]
// The engine weighs it into the stage A combiner (engineRules.ts: weight decays over 1.5 s, zero once the text moved on);
// the governor's vetoes never depend on it (law 8: models estimate, code disposes).
//
// Payload: the context (exchange, beat, question type, the FORM of the expected answer — never the key), her last line's
// act, and the stable prefix. No child id, no name, nothing stored (`w2e-brain-trace`). Closed answers never call it:
// the code grammar (form.ts) decides those with zero silence.
// Primary grok-4-1-fast-non-reasoning (M-D5 p50 490 ms), fallback taxila-fast (more accurate, p50 963 ms) [T, M-D5, n=140].
import { chat } from "../azure.js";

export const SEMANTIC_PRIMARY = "grok-4-1-fast-non-reasoning";
export const SEMANTIC_FALLBACK = "taxila-fast";
export const SEMANTIC_EXCHANGES = new Set(["open_explanation", "question_to_her", "chit_chat"]);

// Instructions are notes and shapes, not lines (a classifier prompt; nothing here is ever spoken).
export const SEMANTIC_SYSTEM = [
  "Role: turn-taking estimator for a voice tutor. Speaker: a child in class 4-7, Hindi / English / Hinglish, either script.",
  "Input: the exchange type, the teaching beat, the tutor's last act, and the words recognised so far (the stable prefix; the child may still be speaking; recogniser punctuation is a guess).",
  "Estimate four probabilities:",
  "pComplete: the child has finished this contribution and expects the tutor now.",
  "pHoldWanted: the child is mid-thought and wants the floor kept (connective, postposition, filler, 'jab/agar' clause without its 'to', a list in progress, a word search, a self-correction under way, an explanation that has not reached its point).",
  "asksHer: the words are a question addressed to the tutor.",
  "offTask: the words have drifted away from the lesson.",
  "Children pause 1-3 s inside one thought; a pause alone is not an end. A complete answer to what was asked, a question to the tutor, 'pata nahi' / I don't know, or a closing tag ('na', 'bas') is an end.",
  'Output JSON only: {"pComplete":n,"pHoldWanted":n,"asksHer":n,"offTask":n} with each n in [0,1].',
].join("\n");

export const SEMANTIC_SCHEMA = {
  type: "object", additionalProperties: false, required: ["pComplete", "pHoldWanted", "asksHer", "offTask"],
  properties: { pComplete: { type: "number" }, pHoldWanted: { type: "number" }, asksHer: { type: "number" }, offTask: { type: "number" } },
};

const clamp01 = (x) => (Number.isFinite(Number(x)) ? Math.max(0, Math.min(1, Number(x))) : null);

/** The user message: closed fields only plus the prefix (truncated to the last 60 words). */
export function semanticUser({ text, context = {}, herAct = null }) {
  const words = String(text || "").split(/\s+/).filter(Boolean);
  const prefix = words.slice(-60).join(" ");
  return `exchange: ${context.exchange ?? "free"}; beat: ${context.beat ?? "none"}; question type: ${context.questionType ?? "open"}; tutor's last act: ${herAct ?? "asked"}; words so far: "${prefix}"`;
}

/** Parse a model reply into the typed estimate (null when unusable). */
export function parseSemantic(json) {
  if (!json || typeof json !== "object") return null;
  const pComplete = clamp01(json.pComplete);
  if (pComplete === null) return null;
  return { pComplete, pHoldWanted: clamp01(json.pHoldWanted), asksHer: clamp01(json.asksHer), offTask: clamp01(json.offTask) };
}

/**
 * One estimate. Returns { pComplete, pHoldWanted, asksHer, offTask, deployment, latMs } or null (the engine then runs on
 * code features alone). Never throws.
 */
export async function semanticEstimate({ text, context, herAct = null, deployment = SEMANTIC_PRIMARY, fallback = SEMANTIC_FALLBACK, timeoutMs = 1500 }) {
  if (!text || !SEMANTIC_EXCHANGES.has(context?.exchange)) return null;
  for (const dep of [deployment, fallback].filter(Boolean)) {
    const t0 = performance.now();
    try {
      const r = await chat(dep, [{ role: "system", content: SEMANTIC_SYSTEM }, { role: "user", content: semanticUser({ text, context, herAct }) }],
        { json: true, maxTokens: 60, effort: "none", timeoutMs });
      const est = parseSemantic(r.json);
      if (est) return { ...est, deployment: dep, latMs: Math.round(performance.now() - t0), usage: r.usage ?? null };
    } catch { /* fall through to the fallback deployment */ }
  }
  return null;
}
