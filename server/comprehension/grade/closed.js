// Closed-label LLM grading (COMPREHENSION-ENGINE.md §4.2, CE5): one kit target per call, a closed label set, a quoted
// span that CODE checks against the child's transcript (E6). BLIND: the request carries the child's own words and the
// kit target only — never the teacher's turns, the child's name, confidence or earlier verdicts (EduFrameTrap
// sycophancy). Schema / parse failure → NA, never wrong. Azure Foundry Direct models only, through server/azure.js.
import { spanOk } from "./span.js";
import { EXP_LABELS, INST_LABELS, MIS_LABELS_NONE } from "./ops.js";

export const GRADER_VERSION = "closed-label-v1-2026-10-02";
/** Routing (§4.2): primary DeepSeek-V4-Pro, fallback gpt-5.6-sol (taxila-brain). Overridable per env. */
export const GRADE_MODELS = Object.freeze({
  get primary() { return process.env.DEPLOY_GRADE || "DeepSeek-V4-Pro"; },
  get fallback() { return process.env.DEPLOY_GRADE_FALLBACK || "taxila-brain"; },
});
const ALLOWED_KEYS = new Set(["op", "childSpan", "target", "labels", "lang"]);
const POSITIVE = new Set(["present", "partial", "valid_instance"]);

/**
 * Build (and validate) a blind request. Throws on any field beyond the contract: a teacher turn or a name in a
 * grader request is a bug (mutant VC3), not a tuning choice.
 * @param {{ op: 'R-EXP'|'R-MIS'|'R-INST', childSpan: string, target: { id: string, textEn: string, textHi?: string }, labels?: readonly string[], lang?: string }} r
 */
export function buildRequest(r) {
  for (const k of Object.keys(r)) if (!ALLOWED_KEYS.has(k)) throw new Error(`closed-label: field "${k}" is not allowed in a blind grader request`);
  if (!r.childSpan || typeof r.childSpan !== "string") throw new Error("closed-label: childSpan required");
  if (!r.target?.id || !r.target?.textEn) throw new Error("closed-label: target {id, textEn} required");
  const labels = r.labels ?? (r.op === "R-INST" ? INST_LABELS : r.op === "R-MIS" ? [r.target.id, MIS_LABELS_NONE] : EXP_LABELS);
  return { op: r.op, childSpan: r.childSpan.slice(0, 1200), target: { id: r.target.id, textEn: r.target.textEn, ...(r.target.textHi ? { textHi: r.target.textHi } : {}) },
    labels: [...labels], lang: r.lang ?? "en" };
}

const TASK = {
  "R-EXP": "Does the child's turn express the TARGET IDEA? present = the idea is stated or clearly used in the child's own words; partial = part of it, or vague but pointing at it; absent = not there (including restating the answer with no reason); contradicted = the child states the opposite or a wrong rule.",
  "R-INST": "Is the child's example a real instance of the TARGET CONCEPT? valid_instance = a correct example; invalid_misc = an example that shows a wrong idea of the concept; irrelevant = not an example of it.",
  "R-MIS": "Does the child's turn show the TARGET WRONG BELIEF? Use the belief's id if it clearly does, otherwise none_of_these.",
};

/** The grader messages (system = rubric shape, user = data). Exported so tests can assert blindness. */
export function messagesFor(req) {
  const sys = [
    "Role: a strict classifier of a school child's spoken turn. Output JSON only: {\"label\": <one of LABELS>, \"span\": <exact words copied from CHILD, or null>}.",
    `Task: ${TASK[req.op]}`,
    "Rules: judge meaning in English, Hindi or Hinglish alike; filler words (matlab, na, achha, like, umm) are not hedges; the language of the turn is never itself a fail; do not reward confidence or length; the span must be copied from CHILD verbatim and must be the words that justify a present / partial / valid label.",
  ].join("\n");
  const user = JSON.stringify({ LABELS: req.labels, TARGET: req.target.textEn, ...(req.target.textHi ? { TARGET_HI: req.target.textHi } : {}), CHILD: req.childSpan, CHILD_LANG: req.lang });
  return [{ role: "system", content: sys }, { role: "user", content: user }];
}

/** Pull the first JSON object out of a model reply. */
export function parseReply(text) {
  const s = String(text ?? "");
  const a = s.indexOf("{"), b = s.lastIndexOf("}");
  if (a < 0 || b <= a) return null;
  try { return JSON.parse(s.slice(a, b + 1)); } catch { return null; }
}

/** Apply the contract to a parsed reply: closed labels, E6 span check on positives. */
export function finalise(req, parsed, { model, ms }) {
  const base = { graderVersion: GRADER_VERSION, model, ms, op: req.op, targetId: req.target.id };
  if (!parsed || typeof parsed.label !== "string" || !req.labels.includes(parsed.label)) return { ...base, label: "NA", span: null, spanOk: false, raw: parsed?.label ?? null };
  const span = typeof parsed.span === "string" && parsed.span.trim() ? parsed.span.trim() : null;
  const ok = span ? spanOk(span, req.childSpan) : false;
  const positive = POSITIVE.has(parsed.label) || (req.op === "R-MIS" && parsed.label !== MIS_LABELS_NONE);
  if (positive && !ok) return { ...base, label: req.op === "R-INST" ? "irrelevant" : req.op === "R-MIS" ? MIS_LABELS_NONE : "absent", span, spanOk: false, demoted: parsed.label };
  return { ...base, label: parsed.label, span, spanOk: ok };
}

/**
 * Grade one request. `send(deployment, messages, opts) → { text }` defaults to server/azure.js chat (loaded lazily so
 * pure tests never touch the network). Tries the primary model, then the fallback; any failure → NA.
 */
export async function gradeClosed(r, { send, models = [GRADE_MODELS.primary, GRADE_MODELS.fallback], timeoutMs = 15_000 } = {}) {
  const req = buildRequest(r);
  const msgs = messagesFor(req);
  const go = send ?? (async (d, m, o) => (await import("../../azure.js")).chat(d, m, o));
  for (const model of models) {
    const t0 = Date.now();
    try {
      const out = await go(model, msgs, { maxTokens: 300, timeoutMs, retries: 0 });
      return finalise(req, parseReply(out?.text), { model, ms: Date.now() - t0 });
    } catch { /* next model */ }
  }
  return { graderVersion: GRADER_VERSION, model: null, ms: 0, op: req.op, targetId: req.target.id, label: "NA", span: null, spanOk: false };
}

/** The grade_audit row for a verdict (§4.2 calibration gate). */
export const auditRow = (res, { childId, sessionId, skillId, shapeId, lang }) => ({ child_id: childId, session_id: sessionId, skill_id: skillId,
  shape_id: shapeId ?? null, op: res.op, grader_version: res.graderVersion, model: res.model, target_id: res.targetId, label: res.label,
  span: res.span ? String(res.span).slice(0, 200) : null, span_ok: !!res.spanOk, lang: lang ?? null, ms: res.ms ?? null });
