// S1 DESIGN (FACTORY.md §3.1, §3.9): taxila-brain turns a child-free gap brief into a MechanicDesign under a strict
// schema. Q0 then checks the design in code before any build spend: id shape, archetype echo, strings table through
// the local safety predicates (the full Q8 with Content Safety runs on the final strings in the gate).
// Prompt structure: role → archetype facts → brief → output contract → binding rules LAST. No example lines.
import { checkStringsLocal } from "./safety.js";

const SCHEMA = {
  type: "object", additionalProperties: false,
  required: ["id", "title", "verb", "concept", "scene", "feedback", "strings"],
  properties: {
    id: { type: "string", description: "kebab-case mechanic name + @1, e.g. <noun>-<verb>@1" },
    title: { type: "object", additionalProperties: false, required: ["en", "hi", "hi_latn"], properties: { en: { type: "string" }, hi: { type: "string" }, hi_latn: { type: "string" } } },
    verb: { type: "string", description: "the one action word of the mechanic" },
    concept: { type: "string", description: "≤ 400 chars: what the child does and why it practises the skill" },
    scene: { type: "string", description: "≤ 400 chars: layout in the 360×400 world with shapes only" },
    feedback: { type: "string", description: "≤ 200 chars: what moves on a right and on a wrong commit" },
    strings: { type: "array", description: "1-6 short labels the world shows", items: { type: "object", additionalProperties: false, required: ["key", "en", "hi", "hi_latn"],
      properties: { key: { type: "string" }, en: { type: "string" }, hi: { type: "string" }, hi_latn: { type: "string" } } } },
  },
};

const ARCHETYPE_FACTS = {
  choice: "choice: each item has 2-4 options (the key + distractors); the child picks one; the kit labels each option with its value and grades the pick.",
  build: "build: each item asks for a number; the child adds/removes unit pieces (tens, ones) and confirms; the kit counts the pieces and grades the total.",
};

export function designMessages(brief) {
  return [
    { role: "developer", content: [
      "Role: game designer for a learning-game kit used by Indian children (classes 1-9), Hindi/English/Hinglish.",
      `Archetype: ${ARCHETYPE_FACTS[brief.archetype]}`,
      "Kit facts: 360x400 world drawn with rect/circle/line/polygon in 12 colour tokens; words only from the strings table; the kit draws the question, the option labels, buttons, progress and right/wrong feedback.",
      "Output: one MechanicDesign (schema).",
      "Rules: strings are short labels (≤ 24 chars), no digits, no numbers in words, no names of people, no brand names, no questions, no praise lines; Hindi in Devanagari, hi_latn in Roman Hindi; no points, coins, scores, streaks, timers or lives; no violence; one verb; the mechanic must make the skill the action (remove-the-learning test: without the skill the child cannot win).",
    ].join("\n") },
    { role: "user", content: JSON.stringify({ archetype: brief.archetype, subject: brief.subject, classLevel: brief.classLevel, ageBand: brief.ageBand,
      skills: brief.skills, misconceptions: brief.misconceptions.map((m) => m.belief) }) },
  ];
}

/** Q0 for a design. → { ok, errors } */
export function checkDesign(d, archetype) {
  const errors = [];
  if (!/^[a-z][a-z0-9-]{2,30}@1$/.test(d?.id || "")) errors.push(`id ${d?.id}`);
  for (const f of ["concept", "scene"]) if (String(d?.[f] || "").length > 600) errors.push(`${f} too long`);
  if (!Array.isArray(d?.strings) || d.strings.length < 1 || d.strings.length > 6) errors.push("strings count");
  const s = checkStringsLocal(d);
  for (const f of s.findings) errors.push(`string ${f.key}/${f.lang}: ${f.codes.join(",")}`);
  return { ok: errors.length === 0, errors, design: d ? { ...d, archetype } : d };
}

/** Normalise model output that is nearly right (keys snake_case, id suffix) — code, never another model call. */
export function normaliseDesign(d) {
  if (!d) return d;
  const id = String(d.id || "").toLowerCase().replace(/@.*$/, "").replace(/[^a-z0-9-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 30) || "mechanic";
  const strings = (d.strings || []).map((r, i) => ({ ...r, key: (String(r.key || `s${i}`).toLowerCase().replace(/[^a-z0-9_]+/g, "_").replace(/^[^a-z]+/, "") || `s${i}`).slice(0, 24) }));
  return { ...d, id: `${/^[a-z]/.test(id) ? id : "m-" + id}@1`, strings };
}

/**
 * @param {object} brief
 * @param {(deployment: string, messages: object[], opts: object) => Promise<{json: any, usage: object}>} chat
 * @returns {Promise<{ ok: boolean, design?: object, errors?: string[], usage: object[] }>}
 */
export async function designMechanic(brief, chat, { deployment = process.env.DEPLOY_BRAIN || "taxila-brain", attempts = 3, q8 = null } = {}) {
  const usage = [];
  let last = [];
  for (let a = 0; a < attempts; a++) {
    const msgs = designMessages(brief);
    if (a > 0 && last.length) msgs.push({ role: "user", content: `Previous design failed checks: ${last.join("; ").slice(0, 600)}. Return a corrected design.` });
    const out = await chat(deployment, msgs, { schema: SCHEMA, schemaName: "mechanic_design", maxTokens: 4000, effort: "medium", timeoutMs: 120_000 });
    usage.push({ deployment, usage: out.usage });
    const c = checkDesign(normaliseDesign(out.json), brief.archetype);
    if (c.ok && q8) {
      // the full Q8 (Content Safety + Hindi classifier) BEFORE any build spend (§3.1 S1 gate): a flagged string costs a
      // redesign, not a whole build (measured: 2/8 builds were lost at the final Q8 when it ran only after the build)
      const r = await q8(c.design);
      for (const u of r.usage || []) usage.push(u);
      usage.q8Calls = (usage.q8Calls || 0) + (r.calls?.contentSafety || 0);
      if (!r.ok) { last = r.findings.map((f) => `string ${f.key}/${f.lang} flagged (${f.codes.join(",")}): replace that word`); continue; }
    }
    if (c.ok) return { ok: true, design: c.design, usage };
    last = c.errors;
  }
  return { ok: false, errors: last, usage };
}
