// The Game Director's dress (round 4 G1; FEASIBILITY §3.2 steps 3-4, CORE-API §0). Code computes the level, the base
// dress and every rule; ONE taxila-fast call may change the dress through closed enums only:
//   - the schema is strict (closed enums, no free text): a model string can never reach the child;
//   - the answer is validated FIELD BY FIELD (validateDelta): a value outside its enum is dropped, never repaired;
//   - a deadline of 1.9 s from the request (DRESS_DEADLINE_MS): late, invalid, a 429 or any error = the base dress;
//   - dressFor applies the rules no model may override: the lesson's language, brisk only on a secure skill, music off for
//     classes 4-5 unless the child turned it on, the parent's verb.
// What the model sees is telegraphic (shapes, not lines): the engine, the topic, the class band, the lesson language, the
// child's interests as CLOSED tags, whether this is the child's first level here, whether a misconception is in focus.
// Never the child's name, words or any free text.
import { dressFor, validateDelta, DRESS_ENUMS, ENGINE_THEMES } from "../../src/play/engines/core3d/api.ts";
import { baseDress } from "../../src/play/engines/core3d/dress.ts";
import { engineFor } from "../../src/play/engines/registry.ts";

export const DRESS_DEADLINE_MS = 1900;
/** closed interest tags the dress may follow (a parent's free-text interests are mapped onto these, never sent raw) */
export const INTEREST_TAGS = Object.freeze({
  cricket: /cricket|ipl|bat(ting)?\b/i, football: /football|soccer/i, space: /space|rocket|planet|star|isro|astronaut/i,
  animals: /animal|dog|cat|bird|pet|zoo|wild/i, racing: /car|bike|racing|race|formula/i, music: /music|sing|song|guitar|piano|tabla/i,
  drawing: /draw|paint|art|sketch|colou?r/i, cooking: /cook|bak|food|recipe/i, dance: /danc/i, games: /game|minecraft|free ?fire|bgmi|ludo|chess/i,
  science: /science|experiment|robot|coding|lego/i, stories: /stor(y|ies)|book|read|comic/i,
});
export function interestTags(interests) {
  const text = Array.isArray(interests) ? interests.join(" ") : "";
  return Object.entries(INTEREST_TAGS).filter(([, re]) => re.test(text)).map(([k]) => k).slice(0, 4);
}

/** The parent's wording switch (O-G4): the child's parent control when set (child.play_verb, read by readVerb from
 *  child_controls; patch request 02 adds the column), else the operator default TAXILA_PLAY_VERB=scan|fire (default fire). */
export const verbFor = (child, env = process.env) => (child?.play_verb === "scan" || child?.play_verb === "fire" ? child.play_verb : env.TAXILA_PLAY_VERB === "scan" ? "scan" : "fire");
/** The child row with its parent's play verb attached (a missing column or row = the operator default). Never throws. */
export async function withVerb(child, q) {
  if (!q || !child?.id) return child;
  try { const [r] = await q("select play_verb from child_controls where child_id = $1", [child.id]); return r?.play_verb ? { ...child, play_verb: r.play_verb } : child; }
  catch { return child; }
}

/** The base DressedSpec for a session's current level (no model). null when no 3D engine renders this level. */
export function baseSpec(s, level, child, { childMusicOn = false } = {}) {
  if (process.env.TAXILA_PLAY_3D === "off") return null;
  const e = engineFor(level.family, level.mode, level.goal);
  if (!e) return null;
  const base = baseDress({ engine: e.id, key: s.key, n: s.n ?? 0, lang: s.lang, firstLevel: (s.n ?? 0) === 0 });
  return { engine: e.id, base, spec: dressFor({ engine: e.id, base, delta: null, classLevel: s.classLevel, secure: !!s.secure, childMusicOn, lessonLang: s.lang, verb: verbFor(child) }) };
}

function schemaFor(engine) {
  return {
    type: "object", additionalProperties: false, required: ["theme", "wrapper", "music", "pace", "teacherMove", "lang"],
    properties: {
      theme: { type: "string", enum: [...ENGINE_THEMES[engine]] }, wrapper: { type: "string", enum: [...DRESS_ENUMS.wrapper] },
      music: { type: "string", enum: [...DRESS_ENUMS.music] }, pace: { type: "string", enum: [...DRESS_ENUMS.pace] },
      teacherMove: { type: "string", enum: [...DRESS_ENUMS.teacherMove] }, lang: { type: "string", enum: [...DRESS_ENUMS.lang] },
    },
  };
}
// shapes, not lines; the rules that must fire go LAST (position is mechanism)
const SYSTEM = [
  "ROLE dress picker for a live lesson game; code built the level and owns every number and word",
  "OUT one JSON object; enums only",
  "FIT theme and wrapper to interest tags; any fit is fine when tags are empty",
  "lang = lesson_lang",
  "ghost-first only when first_level=true",
  "pace brisk only when secure=true",
  "NEVER pick anything to make the child play longer; never reward, compete or hurry",
].join("\n");

/**
 * → { spec, source: "model" | "base", ms, why } for the session's current level. Never throws. `chat` is injectable.
 * @param {{ s: any, level: any, child: any, topicTitle?: string, childMusicOn?: boolean }} o
 */
export async function dressSpecFor(o, deps = {}) {
  const t0 = Date.now();
  const b = baseSpec(o.s, o.level, o.child, { childMusicOn: !!o.childMusicOn });
  if (!b) return null;
  const env = deps.env ?? process.env;
  const base = { spec: b.spec, source: "base", ms: 0 };
  if (env.TAXILA_PLAY_DRESS === "off") return { ...base, why: "off" };
  const chat = deps.chat ?? (await import("../azure.js")).chat;
  const dep = deps.deployment ?? env.DEPLOY_FAST ?? "taxila-fast";
  const user = JSON.stringify({
    engine: b.engine, topic: String(o.topicTitle ?? o.level.topicId).slice(0, 60), class_band: o.s.classLevel <= 5 ? "4-5" : "6-7",
    lesson_lang: o.s.lang, interest_tags: interestTags(o.child?.interests), first_level: (o.s.n ?? 0) === 0, secure: !!o.s.secure, misconception_in_focus: !!o.s.focus,
  });
  let raw = null, why = "";
  const deadline = DRESS_DEADLINE_MS - (Date.now() - t0);
  try {
    const r = await Promise.race([
      chat(dep, [{ role: "system", content: SYSTEM }, { role: "user", content: user }], { schema: schemaFor(b.engine), schemaName: "dress", maxTokens: 120, effort: "none", timeoutMs: Math.max(200, deadline), retries: 0, quotaLane: "background" }),
      new Promise((res) => setTimeout(() => res("late"), Math.max(0, deadline))),
    ]);
    if (r === "late") why = "late"; else raw = r?.json ?? null;
  } catch (e) { why = String(e?.code ?? e?.status ?? "error").slice(0, 24); }
  const ms = Date.now() - t0;
  if (!raw || ms > DRESS_DEADLINE_MS) return { ...base, ms, why: why || (raw ? "late" : "empty") };
  const delta = validateDelta(b.engine, raw);
  const dropped = Object.keys(raw).filter((k) => !(k in delta));
  const spec = dressFor({ engine: b.engine, base: b.base, delta, classLevel: o.s.classLevel, secure: !!o.s.secure, childMusicOn: !!o.childMusicOn, lessonLang: o.s.lang, verb: verbFor(o.child, env) });
  return { spec, source: "model", ms, why: dropped.length ? `dropped:${dropped.join(",")}` : "" };
}
