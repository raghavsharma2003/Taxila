// The teacher-name predicate (decision child-names-teacher): the child picks a look and voice and types a name;
// whether that name may be stored, compiled into the persona and shown on every surface is decided HERE, by code
// (inherited law: safety by predicate, not instruction). Never by a model, and never only in the client.
//
// Rules, in order (the first that fails is the reason):
//   shape        2-16 Latin letters, at most two single spaces or hyphens (shared/tutors.js TEACHER_NAME)
//   own_name     not the child's own first name (nor a word of it)
//   not_allowed  nothing that denies being an AI (a fixed pattern on the folded name, then the floor predicate on the
//                line she says under it), no slur or profanity, no romance or companion term, nothing that reads as
//                an instruction (name-denylist.json: profanity, slurs, romance, companion, not_a_name; words also
//                match glued to each other or to a fixed affix: gluedDeny)
//   public_figure no real public figure or celebrity (a small denylist of full names and distinctive surnames)
// The denylist entries are data; the matcher is fixed: 'contains' entries match inside the name with separators
// removed and letter runs collapsed (so "fuuuck" and "F u c k" are caught), 'word' entries match a whole word or
// the whole name only (so 'ass' never fires on Cassandra and 'love' never on Lovely), phrases match the whole name.
//
// AI disclosure does not depend on the name: the floor section of compile() is byte-identical whatever the child
// calls her (tests/teacher-name.test.mjs pins it), and the first lesson under a new name re-introduces her as an
// AI teacher (director/shapes.js greet).
import { readFileSync } from "fs";
import { normalizeTeacherName, teacherNameShape, teacherNameSuggestions } from "../../../shared/tutors.js";
import { floorViolations } from "../../director/safety.js";

const DENY = JSON.parse(readFileSync(new URL("./name-denylist.json", import.meta.url), "utf8"));

/** Lower case, letters only. */
const flat = (s) => String(s ?? "").toLowerCase().replace(/[^a-z]/g, "");
/** Letter runs collapsed to one ("fuuuck" → "fuck", "shiiit" → "shit"): for 'word' entries. */
const collapse = (s) => s.replace(/([a-z])\1+/g, "$1");
/**
 * A 'contains' entry as a pattern that admits stretched letters but never shrinks a doubled one: each run of k equal
 * letters must appear at least k times ("fuck" → f+u+c+k+ catches "fuuuck"; "gaand" → g+a{2,}n+d+ never fires on
 * "Gandhi"; "boob" never on "Bob").
 */
const stretchy = (entry) => new RegExp(entry.replace(/([a-z])\1*/g, (run, ch) => (run.length > 1 ? `${ch}{${run.length},}` : `${ch}+`)));
const words = (s) => String(s ?? "").toLowerCase().split(/[\s-]+/).filter(Boolean);

function compile(list = []) {
  return list.map((x) => flat(x)).filter((x) => x.length >= 2);
}
const SETS = {
  contains: [...compile(DENY.profanity?.contains), ...compile(DENY.slurs?.contains), ...compile(DENY.romance?.contains)].map((x) => ({ x, re: stretchy(x) })),
  notAllowedWords: new Set([...compile(DENY.profanity?.word), ...compile(DENY.slurs?.word), ...compile(DENY.romance?.word),
    ...compile(DENY.companion?.word), ...compile(DENY.not_a_name?.word)]),
  figurePhrases: new Set(compile(DENY.public_figures?.phrases)),
  figureWords: new Set(compile(DENY.public_figures?.word)),
};
/** Which list a not_allowed word came from (tests and the eval read it; the child only ever sees not_allowed). */
const CATEGORY = new Map();
for (const cat of ["profanity", "slurs", "romance", "companion", "not_a_name"]) {
  for (const w of [...(DENY[cat]?.word ?? []), ...(DENY[cat]?.contains ?? [])]) if (!CATEGORY.has(flat(w))) CATEGORY.set(flat(w), cat);
}

export const DENYLIST_REV = DENY.rev ?? 1;

/**
 * A name that says she is not an AI, read on the folded name (letters only, so "Not An Ai", "Notanai", "Im Not Ai",
 * "I-am-human" all fold the same). Anywhere: a negation glued to an AI word, or a word that claims a human. At the
 * start of a word: "no ai", "real…", "i am a girl". Measured against the ALLOWED corpus (0 false refusals).
 */
const AI_DENIAL_ANYWHERE = /(?:not|non|nahi|nahin|never)(?:a|an|the)?(?:ai|bot|robot|machine|computer|program)|human|insaa?n|manushya|person/;
const AI_DENIAL_AT_WORD = /^(?:(?:iam|im|i)?(?:no|not)(?:a|an)?(?:ai|bot|robot|machine)|(?:iam|im|i)?real|(?:iam|im)(?:a)?(?:girl|boy|woman|lady|alive|living))/;
function deniesAi(name) {
  const joined = flat(name);
  if (AI_DENIAL_ANYWHERE.test(joined)) return true;
  // every position where a word of the name starts, read to the end of the name (so "Im Not Ai" is read as "imnotai")
  let at = 0;
  for (const w of words(name)) {
    if (AI_DENIAL_AT_WORD.test(joined.slice(at))) return true;
    at += flat(w).length;
  }
  // the floor's own predicate on the line she says under this name (greet: "name yourself — <T>, their AI teacher")
  return [`I am ${name}, your AI teacher.`, `Main ${name} hoon, tumhari AI teacher.`].some((line) => floorViolations(line).includes("ai_denial"));
}

/**
 * A 'word' entry glued to other entries or to a fixed affix (Mybaby, Babylove, Friends, Mummyji, Iloveyou, Kissme):
 * the folded text segments as LEAD* (WORD TRAIL?)+ with at least one denylist word of 3+ letters. Short entries
 * (ma, bc, gf) match only as a whole word, so Uma, Mcarthy and Bfirst are never split into them; gf/bf alone are also
 * refused as a prefix ("Gfasha"). Returns the matched entry or null.
 */
const LEAD = ["my", "ur", "your", "mera", "meri", "mere", "iam", "im", "i", "the"];
const TRAIL = ["s", "es", "u", "ji", "ie", "me", "you"];
const GLUE_MIN = 3;
const PREFIX_ONLY = ["gf", "bf"];
function gluedDeny(str) {
  if (!str) return null;
  const pre = PREFIX_ONLY.find((p) => str.startsWith(p) && str.length > p.length);
  if (pre) return pre;
  const n = str.length;
  // best[i][phase]: the denylist entry that reached position i (phase 0: only leads so far; 1: a word seen)
  const seen = new Map();
  const go = (i, phase) => {
    if (i === n) return phase === 1 ? "" : null;
    const key = i * 2 + phase;
    if (seen.has(key)) return seen.get(key);
    seen.set(key, null);
    let hit = null;
    if (phase === 0) for (const l of LEAD) if (!hit && str.startsWith(l, i)) hit = go(i + l.length, 0);
    if (!hit && phase === 1) for (const t of TRAIL) if (hit === null && str.startsWith(t, i)) { const r = go(i + t.length, 1); if (r !== null) hit = r; }
    if (hit === null || hit === undefined) {
      for (let j = n; j - i >= GLUE_MIN && hit === null; j--) {
        const w = str.slice(i, j);
        if (SETS.notAllowedWords.has(w)) { const r = go(j, 1); if (r !== null) hit = r || w; }
      }
    }
    seen.set(key, hit);
    return hit;
  };
  const r = go(0, 0);
  return r || null;
}

/**
 * @param {string} raw  what the child typed (or tapped)
 * @param {{ childFirstName?: string, characterId?: string }} [ctx]
 * @returns {{ ok: true, name: string } | { ok: false, reason: "shape" | "own_name" | "not_allowed" | "public_figure",
 *   detail: string, suggestions: string[] }}  detail: the rule family (never the name); the child sees `reason` only
 */
export function checkTeacherName(raw, { childFirstName = "", characterId = null } = {}) {
  const name = normalizeTeacherName(raw);
  const no = (reason, detail) => ({ ok: false, reason, detail,
    suggestions: teacherNameSuggestions(characterId, { childFirstName, exclude: name }) });
  const shape = teacherNameShape(name);
  if (shape) return no("shape", shape);
  const ws = words(name).map(flat);
  const joined = flat(name);
  // the child's own name: the whole name, or any word of it, equal to any word of the child's first name
  const kid = words(childFirstName).map(flat).filter((w) => w.length >= 2);
  if (kid.length && (kid.includes(joined) || ws.some((w) => kid.includes(w)) || kid.join("") === joined)) return no("own_name", "own_name");
  if (deniesAi(name)) return no("not_allowed", "not_a_name");
  for (const { x, re } of SETS.contains) {
    if (re.test(joined)) return no("not_allowed", CATEGORY.get(x) ?? "profanity");
  }
  for (const w of [...ws, joined, ...ws.map(collapse)]) {
    if (SETS.notAllowedWords.has(w)) return no("not_allowed", CATEGORY.get(w) ?? "not_a_name");
  }
  for (const w of [...ws, joined]) {
    const g = gluedDeny(w) ?? gluedDeny(collapse(w));
    if (g) return no("not_allowed", CATEGORY.get(g) ?? (PREFIX_ONLY.includes(g) ? "romance" : "not_a_name"));
  }
  if (SETS.figurePhrases.has(joined) || ws.some((w) => SETS.figureWords.has(w)) || SETS.figureWords.has(joined)) return no("public_figure", "public_figure");
  return { ok: true, name };
}

/** The name a character answers to for this child: the child's own pick when it still passes, else the sheet's. */
export function effectiveTeacherName(character, child) {
  const custom = child?.teacher_name;
  if (!custom) return character.name;
  // Re-checked on every read: a denylist entry added later retires a stored name without a data migration.
  const r = checkTeacherName(custom, { childFirstName: child.first_name, characterId: character.id });
  return r.ok ? r.name : character.name;
}
