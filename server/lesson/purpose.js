// Lesson purpose at start (BUILD-PLAN §4 W2 seam; W2-A #3, with the Director halves in W2-C #7). OWNED BY W2-A;
// call sites in server/routes/lesson.js start() owned by W2-E. Contract, binding on the owner:
//   - routeAsk: an Ask ("doubt") start with the child's first words (LessonStartRequest.firstText) → the matching topic
//     in the child's class (or an earlier class), titled by the question; or null (the topic is resolved as before:
//     the plan's next topic, and the Director answers the question there). It reads content indexes only — no model
//     call, no child id leaves the process — and never throws into the start (seamSafe guards the call site too).
//   - practiceSet: a practice start → the review-queue items for "Practice · n of 5" (≤ 5; no greeting, no hook), or
//     null (today's practice behaviour). Pure over what the start already read; no network.
import { getTopic, topicSequence, SUBJECT_ORDER } from "../content/curriculum.js";
import { readSkill, rank } from "../learner/kt/ledger.js";

/** Practice is a short set (V2 §3.6): at most this many items. */
export const PRACTICE_MAX = 5;

// ───────────────────────────── Ask routing (flows G11) ─────────────────────────────

const STOP = new Set(("a an the is are was were be to of in on at for and or but why what how which who when where do does did can could " +
  "should would will i me my you your it this that these those than then so if not no yes with from by as kya kyu kyun kyon kaise kaisa " +
  "kaun kab kahan hai hain tha thi the ka ki ke ko se mein me main par aur ya bhi to toh nahi na haan ek do please explain tell batao " +
  "bataiye samjhao samjha samajh nahin hota hoti hote karte karna kar raha rahi").split(" "));

/**
 * Hinglish / Hindi / child words → the concept words the syllabus uses. Small and explicit (a reviewed list, not a
 * model): each key is matched as a whole token, each value adds concept tokens to the question.
 */
const SYNONYMS = {
  bhinn: "fraction fractions", hissa: "fraction part", hisse: "fraction parts", aadha: "half fraction", adha: "half fraction", tihai: "third fraction",
  chauthai: "quarter fraction", pizza: "fraction", roti: "fraction", half: "fraction", quarter: "fraction", numerator: "fraction", denominator: "fraction",
  guna: "multiplication multiply", gunaa: "multiplication multiply", times: "multiplication multiply", table: "multiplication tables", pahada: "multiplication tables",
  bhaag: "division divide", bhag: "division divide", divide: "division", share: "division", jod: "addition add", jodna: "addition add", plus: "addition add", sum: "addition",
  ghata: "subtraction subtract", ghatana: "subtraction subtract", minus: "subtraction", difference: "subtraction", bada: "compare bigger greater", chhota: "compare smaller",
  bigger: "compare greater", smaller: "compare", greater: "compare", kshetrafal: "area", area: "area", parimaap: "perimeter", boundary: "perimeter", kon: "angle angles",
  angle: "angles", kona: "angle", trikon: "triangle", chakor: "square", vritt: "circle", gola: "circle", circle: "circles", shape: "shapes", aakar: "shapes",
  samay: "time clock", ghadi: "clock time", ghanta: "time hours", minute: "time", rupaye: "money", rupee: "money", paisa: "money", paise: "money",
  dashamlav: "decimal decimals", point: "decimal", pratishat: "percentage percent", lakh: "large numbers place value", crore: "large numbers place value",
  hazaar: "thousands numbers", thousand: "thousands numbers", place: "place value", ganit: "maths", length: "length measurement", lambai: "length measurement",
  wajan: "weight mass", weight: "weight mass", kilo: "weight mass", litre: "capacity volume", pattern: "patterns", factor: "factors multiples", multiple: "multiples factors",
  prime: "prime numbers factors", integer: "integers", negative: "integers", ratio: "ratio proportion", anupat: "ratio", equation: "equations algebra", variable: "algebra",
  ped: "plants plant", paudha: "plants plant", patti: "leaf leaves plants", leaf: "leaves plants", photosynthesis: "plants food leaves photosynthesis", khana: "food",
  pani: "water", water: "water", hawa: "air", sky: "light sky", aasman: "sky", suraj: "sun light", sun: "light sun", chand: "moon", moon: "moon",
  janwar: "animals", animal: "animals", pakshi: "birds", bird: "birds", sharir: "body", body: "body", daant: "teeth", magnet: "magnets", chumbak: "magnets",
  bijli: "electricity electric", electric: "electricity", current: "electricity", bulb: "electricity", light: "light", roshni: "light", shadow: "shadows light",
  parchai: "shadows light", heat: "heat temperature", garmi: "heat", acid: "acids bases", map: "maps", naksha: "maps", globe: "maps earth", earth: "earth",
  prithvi: "earth", desh: "country", noun: "nouns grammar", sangya: "nouns", verb: "verbs grammar", kriya: "verbs", adjective: "adjectives", visheshan: "adjectives",
  tense: "tense", poem: "poem", kavita: "poem", story: "story", kahani: "story",
};

/** Lower-case word tokens (Latin + Devanagari) with light plural stripping; numbers kept. */
export function tokens(text) {
  const out = [];
  for (const raw of String(text ?? "").toLowerCase().match(/[\p{L}\p{M}]+|\d+(?:[./]\d+)?/gu) ?? []) {
    let w = raw;
    if (/^[a-z]+$/.test(w) && w.length > 4 && w.endsWith("es") && !w.endsWith("ses")) w = w.slice(0, -2);
    else if (/^[a-z]+$/.test(w) && w.length > 3 && w.endsWith("s") && !w.endsWith("ss")) w = w.slice(0, -1);
    out.push(w);
  }
  return out;
}

/** The question's concept tokens: its content words, their synonyms, and number shapes (1/2 → fraction, 3.5 → decimal). */
export function conceptTokens(text) {
  const raw = String(text ?? "");
  const set = new Set();
  for (const t of tokens(raw)) {
    if (STOP.has(t)) continue;
    if (/^\d+\/\d+$/.test(t)) { set.add("fraction"); continue; }
    if (/^\d+\.\d+$/.test(t)) { set.add("decimal"); continue; }
    if (/^\d+$/.test(t)) { if (t.length >= 5) set.add("large"); continue; }
    if (t.length >= 3) set.add(t);
    for (const s of (SYNONYMS[t] ?? "").split(" ")) if (s) for (const x of tokens(s)) set.add(x);
  }
  if (/\d\s*[x×*]\s*\d/.test(raw)) set.add("multiplication");
  if (/\d\s*÷\s*\d/.test(raw)) set.add("division");
  if (/%/.test(raw)) set.add("percent");
  return set;
}

let TOPIC_INDEX = null;
/** class → [{ id, subject, title tokens, chapter tokens, body tokens }] (built once from the curriculum files). */
function topicIndex() {
  if (TOPIC_INDEX) return TOPIC_INDEX;
  TOPIC_INDEX = new Map();
  for (let cl = 1; cl <= 9; cl++) {
    const list = [];
    for (const subject of SUBJECT_ORDER) {
      for (const id of topicSequence(cl, subject)) {
        const t = getTopic(id);
        const set = (s) => new Set(tokens(s).filter((x) => !STOP.has(x) && x.length >= 3));
        list.push({ id, subject, title: set(t.title), chapter: set(t.chapter.title), body: set([...t.outcomes, ...t.misconceptions, ...t.hooks].join(" ")) });
      }
    }
    TOPIC_INDEX.set(cl, list);
  }
  return TOPIC_INDEX;
}

/**
 * PURE. The best topic for a question in the child's class (or up to two classes below, weighted down), or null when
 * nothing matches clearly (score < 3, or a tie between two subjects). Title words weigh 3, chapter 2, the topic's
 * outcomes / mix-ups / hooks 1.
 * @returns {{ topicId: string, score: number } | null}
 */
export function matchTopic(question, classLevel) {
  const q = conceptTokens(question);
  if (!q.size) return null;
  const scored = [];
  for (let d = 0; d <= 2; d++) {
    const cl = Number(classLevel) - d;
    if (cl < 1) break;
    for (const t of topicIndex().get(cl) ?? []) {
      let s = 0;
      for (const w of q) s += (t.title.has(w) ? 3 : 0) + (t.chapter.has(w) ? 2 : 0) + (t.body.has(w) ? 1 : 0);
      if (s) scored.push({ topicId: t.id, subject: t.subject, score: s - d * 0.5 });
    }
  }
  scored.sort((a, b) => b.score - a.score || (a.topicId < b.topicId ? -1 : 1));
  const best = scored[0];
  if (!best || best.score < 3) return null;
  const rival = scored.find((x) => x.subject !== best.subject);
  if (rival && rival.score === best.score) return null;
  return { topicId: best.topicId, score: best.score };
}

/** The lesson's title from the question (≤ 60 chars on a word boundary, first letter up, ending "?"), or null. */
export function questionTitle(text) {
  const s = String(text ?? "").replace(/\s+/g, " ").trim();
  if (s.length < 3) return null;
  let t = s.length > 60 ? s.slice(0, 60).replace(/\s+\S*$/, "") + "…" : s;
  t = t[0].toUpperCase() + t.slice(1);
  return t;
}

// ───────────────────────────── the practice set (flows G10) ─────────────────────────────

/**
 * PURE. Up to PRACTICE_MAX kit items from the review queue (STUDENT-FLOW §6.1): skills whose review is due or that
 * need a refresh first, then recently missed skills, then the rest of the kit's tried skills — never a skill the child
 * has not met (practice is retrieval, not teaching), and only kit items with a verified key (never a teach-back).
 * Deterministic: the same ledger and kit give the same set.
 * @returns {{ itemIds: string[], count: number } | null}
 */
export function buildPracticeSet({ kit, ledger, now }) {
  const items = (kit?.items ?? []).filter((i) => i && i.id && i.kind !== "teachback" && i.skillId);
  if (!items.length) return null;
  const at = new Date(now).toISOString();
  const skills = [...new Set(items.map((i) => i.skillId))].map((id) => ({ id, s: readSkill(ledger?.skills?.[id], now) })).filter((x) => x.s);
  if (!skills.length) return null;
  const missed = (s) => (s.recent ?? []).slice(-3).filter((x) => x === 0).length;
  const prio = (x) => {
    const s = x.s;
    const learned = rank(s.display) >= rank("learned_today");
    if (learned && (s.refresh || (s.nextReviewAt && s.nextReviewAt <= at))) return 0;
    if (missed(s) > 0) return 1;
    return 2;
  };
  skills.sort((a, b) => prio(a) - prio(b) || a.s.retention - b.s.retention || (a.id < b.id ? -1 : 1));
  // round-robin over the ordered skills so one skill does not fill the whole set
  const pools = skills.map((x) => items.filter((i) => i.skillId === x.id));
  const out = [];
  for (let k = 0; out.length < PRACTICE_MAX && pools.some((p) => p.length > k); k++) {
    for (const p of pools) if (p[k] && out.length < PRACTICE_MAX) out.push(p[k].id);
  }
  return out.length ? { itemIds: out, count: out.length } : null;
}

export const purposeSeam = {
  /**
   * @param {{ child: { id: string, class_level: number, language_pref?: string }, purpose: "lesson" | "practice" | "doubt", firstText?: string, topicId?: string }} req
   * @returns {Promise<{ topicId: string, title?: string } | null>}
   */
  async routeAsk(req) {
    if (req?.purpose !== "doubt" || !req.firstText) return null;
    const m = matchTopic(req.firstText, req.child?.class_level ?? 5);
    if (!m) return null;
    const title = questionTitle(req.firstText);
    return { topicId: m.topicId, ...(title ? { title } : {}) };
  },

  /**
   * @param {{ child: { id: string, class_level: number }, purpose: "lesson" | "practice" | "doubt", kit: object, ledger: object, now: number }} ctx
   * @returns {{ itemIds: string[], count: number } | null}
   */
  practiceSet(ctx) {
    if (ctx?.purpose !== "practice") return null;
    return buildPracticeSet(ctx);
  },
};
