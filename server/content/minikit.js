// On-the-fly MINI-KIT for a topic that has no usable verified kit yet: taxila-fast writes skills,
// 2 misconceptions and 8 items from the curriculum entry, an independent blind solve drops items whose
// key it can prove wrong, and the result is cached in asset_cache. It is always `verified: false`, which
// halves the evidence weight of everything learned from it (a model-written key is not a verified key).
import { one, q } from "../db.js";
import { chat, DEPLOY } from "../azure.js";
import { normalizeKit } from "./kits.js";

/** Bump when the prompt or schema changes: the version is part of the cache key. */
export const MINIKIT_VERSION = 1;
const KINDS = ["practice", "near_transfer", "far_transfer", "predict", "contrast", "why", "teachback", "retrieval", "error_spot", "translate_rep"];
/** Kinds whose answer is an idea rather than a value: the blind solver cannot check them. */
const OPEN_KINDS = new Set(["why", "teachback"]);

export const cacheKey = (topicId) => `kit:mini:v${MINIKIT_VERSION}:${DEPLOY.fast}:${topicId}`;

const S = (description) => ({ type: "string", description });
const A = (items, description) => ({ type: "array", items, description });
const O = (properties) => ({ type: "object", additionalProperties: false, required: Object.keys(properties), properties });

export const MINIKIT_SCHEMA = O({
  topicType: { type: "string", enum: ["T1", "T2", "T3", "T4", "T5"] },
  skills: A(O({ key: { type: "string", enum: ["s1", "s2", "s3"] }, title: S("fine-grained skill, ≤8 words") }), "2-3 skills"),
  expectations: A(S("one key idea a complete explanation contains"), "3-4 items"),
  misconceptions: A(O({
    key: { type: "string", enum: ["m1", "m2"] },
    belief: S("what the child wrongly believes"),
    signs: A(S("what a child holding it says or does"), "2-3"),
    diagnostic: O({
      prompt_en: S("a two- or three-option spoken question"), prompt_hi: S("same in natural Roman Hinglish"),
      options: A(O({ text: S("option as the child would say it"), misconception: { type: "string", enum: ["none", "m1", "m2"] }, correct: { type: "boolean" } }), "2-3 options, exactly one correct"),
    }),
    remediation: O({ representation: S("the alternate representation that breaks it"), moveShape: S("teacher move as a telegraphic shape, ≤14 words") }),
  }), "exactly 2"),
  items: A(O({
    skill: { type: "string", enum: ["s1", "s2", "s3"] },
    kind: { type: "string", enum: KINDS },
    difficulty: { type: "integer", enum: [1, 2, 3, 4, 5] },
    prompt_en: S("one spoken question, ≤25 words"), prompt_hi: S("same in natural Roman Hinglish"),
    answer: S("short canonical answer; for why/teachback the key idea"),
    acceptable: A(S("equivalent answer form"), "English, Hindi and Hinglish forms"),
    hints: A(S("rung shape, telegraphic, ≤14 words"), "exactly 4: pump, hint, prompt, assertion"),
    targetsMisconception: { type: "string", enum: ["none", "m1", "m2"] },
  }), "exactly 8"),
  workedExample: O({ problem: S("one problem"), steps: A(S("one short step"), "3-4"), fadedVersion: A(S("step with ___ blanks"), "same steps, key parts blanked") }),
  formats: O({ primary: { type: "string", enum: ["F1", "F2", "F3", "F4", "F5", "F6", "F7", "F8"] }, engineHints: A(S("manipulative or simulation kind, kebab-case"), "1-3") }),
  interestContexts: A(S("everyday Indian context"), "3-5"),
});

function generatorPrompt(topic) {
  return [
    `Write a small teaching kit for ONE topic of the Indian NCERT syllabus, class ${topic.classLevel} ${topic.subject} (${topic.book}).`,
    `Chapter: ${topic.chapter.title}. Topic: ${topic.title}.`,
    `Learning outcomes: ${topic.outcomes.join("; ") || "(none listed)"}.`,
    `Known misconceptions (use these as m1, m2 where given): ${topic.misconceptions.join("; ") || "(none listed — use the two most common for this topic)"}.`,
    `Hooks: ${topic.hooks.join("; ") || "(none)"}.`,
    "",
    "Requirements:",
    "- 2-3 fine-grained skills (s1 first, prerequisites before what builds on them).",
    "- exactly 2 misconceptions; each diagnostic has 2-3 options with exactly one correct, and each wrong option names the misconception it comes from.",
    "- exactly 8 items: 3 practice (difficulty 1-2), 1 contrast or predict that targets m1, 1 near_transfer, 1 why, 1 error_spot (the teacher shows a worked answer with one planted mistake; the answer is the corrected result), 1 teachback (answer = the key idea to explain).",
    "- Every item is ONE question a teacher says aloud to a child on a voice call: no 'look at the picture', no drawing, no multi-part questions. Non-why items have exactly one unambiguous short answer.",
    "- Answer keys must be correct. Re-check every number before you write it.",
    "- acceptable: the same answer in other forms a child might say (digits, words, Hindi/Hinglish words, e.g. 'half', 'aadha', 'one by two').",
    "- hints: exactly 4 rungs written as SHAPES for the teacher, not lines to read: pump (a nudge question focus, no new info) → hint (point at the relevant idea) → prompt (a fill-in-the-blank with the key step) → assertion (the answer with a one-line reason). Only the assertion may contain the answer.",
    "- prompt_hi is natural spoken Hinglish in Roman script, the way an Indian teacher talks to a child of this class.",
    "- workedExample: one problem, 3-4 short steps, and a faded version with ___ blanks.",
    "- formats.primary: F3 for spatial or quantitative ideas, F1 otherwise; engineHints like fraction-bars, number-line, place-value-blocks.",
  ].join("\n");
}

/** Plain-value comparison for the blind check: digits, fractions, decimals and a few number words. */
const WORD_VALUES = { half: 0.5, aadha: 0.5, adha: 0.5, quarter: 0.25, paav: 0.25, pav: 0.25, "one third": 1 / 3, tihai: 1 / 3 };
function valueOf(s) {
  const t = String(s).toLowerCase().replace(/[^a-z0-9./\s-]/g, " ").replace(/\s+/g, " ").trim();
  const frac = t.match(/^(\d+)\s*\/\s*(\d+)$/);
  if (frac && +frac[2] !== 0) return +frac[1] / +frac[2];
  if (/^-?\d+(\.\d+)?$/.test(t)) return +t;
  return WORD_VALUES[t] ?? null;
}
/** "same" | "different" | "unclear" — only a provable numeric disagreement counts as "different". */
export function compareAnswers(key, acceptable, solver) {
  const norm = (s) => String(s).toLowerCase().replace(/\s+/g, " ").trim();
  const forms = [key, ...acceptable];
  if (forms.some((f) => norm(f) === norm(solver))) return "same";
  const sv = valueOf(solver), kv = valueOf(key);
  if (sv === null || kv === null) return "unclear";
  return Math.abs(sv - kv) < 1e-9 ? "same" : "different";
}

async function blindSolve(topic, items, trace) {
  const checkable = items.map((it, i) => ({ i, it })).filter(({ it }) => !OPEN_KINDS.has(it.kind));
  const { json } = await chat(DEPLOY.fast, [
    { role: "system", content: `You are solving questions from a class ${topic.classLevel} ${topic.subject} lesson on "${topic.title}". Give only the final answer to each, as short as possible (a number, fraction or a few words).` },
    { role: "user", content: checkable.map(({ i, it }) => `${i}. ${it.prompt_en}`).join("\n") },
  ], {
    schema: O({ answers: A(O({ i: { type: "integer" }, answer: { type: "string" } }), "one per question") }),
    schemaName: "solutions", effort: "low", maxTokens: 2500, timeoutMs: 45_000, trace,
  });
  return new Map((json.answers || []).map((a) => [a.i, a.answer]));
}

/** Turn the model's keyed output into a raw kit (ids are derived from the topic id, never invented). */
function toRawKit(topic, g, solved) {
  const sid = (k) => `${topic.id}-${k}`;
  const items = [];
  g.items.forEach((it, i) => {
    const raw = {
      id: `${topic.id}-mk${i + 1}`, skillId: sid(it.skill), kind: it.kind, difficulty: it.difficulty,
      prompt_en: it.prompt_en, prompt_hi: it.prompt_hi, answer: it.answer, acceptable: it.acceptable, hints: it.hints,
      ...(it.targetsMisconception !== "none" ? { targetsMisconception: sid(it.targetsMisconception) } : {}),
    };
    const solverAnswer = solved.get(i);
    if (solverAnswer !== undefined) {
      const verdict = compareAnswers(it.answer, it.acceptable, solverAnswer);
      if (verdict !== "unclear") raw.verified = { solverAnswer, agrees: verdict === "same", note: "mini-kit blind solve" };
    }
    items.push(raw);
  });
  // Skills an item names but the skill list forgot still need a row, or normalizeKit drops their items.
  const skills = [...g.skills];
  for (const it of g.items) if (!skills.some((s) => s.key === it.skill)) skills.push({ key: it.skill, title: topic.title });
  return {
    topicId: topic.id, topicType: g.topicType,
    // The generator is asked to list prerequisites first, so each skill builds on the one before it.
    skills: skills.map((s, i) => ({ id: sid(s.key), title: s.title, prereqSkillIds: i ? [sid(skills[i - 1].key)] : [] })),
    expectations: g.expectations,
    misconceptions: g.misconceptions.map((m) => ({
      id: sid(m.key), belief: m.belief, signs: m.signs,
      diagnostic: { prompt_en: m.diagnostic.prompt_en, prompt_hi: m.diagnostic.prompt_hi,
        options: m.diagnostic.options.map((o) => ({ text: o.text, misconceptionId: o.misconception === "none" ? null : sid(o.misconception), correct: o.correct })) },
      remediation: m.remediation,
    })),
    items, workedExample: g.workedExample,
    formats: { primary: g.formats.primary, secondary: [], engineHints: g.formats.engineHints },
    interestContexts: g.interestContexts,
  };
}

/** Cached mini-kit for a topic, or null. */
export async function cachedMiniKit(topic) {
  const row = await one("select body from asset_cache where key = $1", [cacheKey(topic.id)]);
  return row?.body ? normalizeKit(row.body, { topicId: topic.id, verified: false }) : null;
}

const inflight = new Map();

/** Generate, blind-check, cache and return a mini-kit. Concurrent callers share one generation. */
export function buildMiniKit(topic, { trace } = {}) {
  if (inflight.has(topic.id)) return inflight.get(topic.id);
  const p = (async () => {
    const { json: g } = await chat(DEPLOY.fast, [
      { role: "system", content: "You write verified-quality teaching content for Indian primary and middle school. Output only the JSON the schema asks for." },
      { role: "user", content: generatorPrompt(topic) },
    ], { schema: MINIKIT_SCHEMA, schemaName: "mini_kit", effort: "medium", maxTokens: 9000, timeoutMs: 120_000, trace });
    const raw = toRawKit(topic, g, await blindSolve(topic, g.items, trace));
    const kit = normalizeKit(raw, { topicId: topic.id, verified: false });
    if (!kit) throw new Error(`mini-kit for ${topic.id} failed validation (too few items survived the blind check)`);
    const rows = await q(
      "insert into asset_cache(key, kind, body) values ($1, 'kit', $2) on conflict (key) do update set body = excluded.body, created_at = now() returning key",
      [cacheKey(topic.id), raw]);
    if (rows.length !== 1) throw new Error("asset_cache write did not land");
    return kit;
  })().finally(() => inflight.delete(topic.id));
  inflight.set(topic.id, p);
  return p;
}
