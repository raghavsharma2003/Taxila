// The tutor cast (VOICE-TEACHER.md §6: Asha, Arjun, Uma) as a versioned static manifest, plus the pure
// eligibility / ordering rules of AVATAR.md §7.1 and tutor-selection-ux.md §4, §6.3. Plain JS so the server
// (plain ESM) and the client (TS, via tutors.d.ts) share ONE copy of the rules.
//
// What lives here is product copy and look data, never persona text: the style notes describe teaching, are
// ≤ 8 words, make no friendship claim and never frame by subject (tutor-selection-ux §4). The persona sheets
// stay in server/compiler/characters/*.js; a tutor is offered only where its sheet exists (server-side check).

/** Bumped when any look changes: the cache key for portraits and procedural heads (AVATAR §7.5 look.rev). */
export const CATALOGUE_REV = 1;

/** @type {import("./tutors.d.ts").TutorCharacter[]} */
export const TUTORS = [
  {
    id: "asha",
    status: "live",
    displayName: { roman: "Asha", deva: "आशा" },
    roleChips: ["didi"],
    styleChip: { english: "step by step", hindi: "कदम-कदम पर", hinglish: "step by step" },
    styleNote: {
      english: "goes step by step, with pictures",
      hindi: "चित्रों के साथ, कदम-कदम पर",
      hinglish: "pictures ke saath, step by step",
    },
    // offer: the persona sheet's own range (asha.js classes [1, 4]); wide: AVATAR §5.1 once the band layer
    // carries register (TAXILA_TUTOR_OFFER=wide).
    fit: { offerClasses: [1, 4], wideOfferClasses: [1, 6], serveClasses: [1, 7] },
    look: {
      rev: 1, presentedGender: "F", apparentAge: 24, mst: 6, signatureColor: "#3E7C74",
      skin: "#C99366", skinShade: "#B07E55", hair: "#2A1C14", hairStyle: "ponytail", glasses: "none",
      top: "#3E7C74", topShade: "#32665F", accent: "#F2D9A6", accentBorder: "#C2410C", attire: "kurti-jacket",
      iris: "#4A2E1C", lip: "#9A4E44",
    },
    faceStyle: { smile: 0.8, headGain: 1.1, browGain: 1.1 },
    voice: { cps: 13.5, speakerMeanHz: 220 },
  },
  {
    id: "arjun",
    status: "live",
    displayName: { roman: "Arjun", deva: "अर्जुन" },
    roleChips: ["bhaiya"],
    styleChip: { english: "guess, then check", hindi: "पहले अंदाज़ा, फिर जाँच", hinglish: "guess, phir check" },
    styleNote: {
      english: "loves puzzles: guess first, then check",
      hindi: "पहेलियाँ पसंद: पहले अंदाज़ा, फिर जाँच",
      hinglish: "puzzles pasand: pehle guess, phir check",
    },
    fit: { offerClasses: [5, 9], wideOfferClasses: [1, 9], serveClasses: [1, 9] },
    look: {
      rev: 1, presentedGender: "M", apparentAge: 26, mst: 7, signatureColor: "#44607F",
      skin: "#A9744A", skinShade: "#93633D", hair: "#1F1712", hairStyle: "curls", glasses: "round",
      top: "#44607F", topShade: "#384F69", accent: "#E9E4D8", accentBorder: "#2E4257", attire: "shirt-tee",
      iris: "#3A2416", lip: "#7E4636",
    },
    faceStyle: { smile: 0.7, headGain: 1.2, browGain: 1.0 },
    voice: { cps: 13.5, speakerMeanHz: 120 },
  },
  {
    id: "uma",
    // No persona sheet (server/compiler/characters/uma.js) and no voice probed yet (VOICE-TEACHER §6: "needs a
    // low-register arm"): shown only in dev previews until both exist. A character + voice + face are one unit.
    status: "draft",
    displayName: { roman: "Uma", deva: "उमा" },
    roleChips: ["maam"],
    styleChip: { english: "calm and clear", hindi: "शांत और साफ़", hinglish: "calm aur clear" },
    styleNote: {
      english: "calm and clear; recall first, then practice",
      hindi: "शांत और साफ़: पहले याद, फिर अभ्यास",
      hinglish: "calm aur clear: pehle yaad, phir practice",
    },
    fit: { offerClasses: [7, 9], wideOfferClasses: [7, 9], serveClasses: [7, 9] },
    look: {
      rev: 1, presentedGender: "F", apparentAge: 34, mst: 8, signatureColor: "#7A4A6E",
      skin: "#8A5634", skinShade: "#764829", hair: "#241812", hairStyle: "bun", glasses: "none",
      top: "#7A4A6E", topShade: "#653C5B", accent: "#EADFC8", accentBorder: "#C2410C", attire: "saree",
      iris: "#2E1C10", lip: "#6E3A30",
    },
    faceStyle: { smile: 0.55, headGain: 0.8, browGain: 1.2 },
    voice: { cps: 12.5, speakerMeanHz: 200 },
  },
];

export const tutorById = (id) => TUTORS.find((t) => t.id === id) ?? null;

/** Visual band from the class (never the content level; tutor-selection-ux §4). */
export function bandOfClass(cls) {
  const c = Number(cls) || 1;
  return c <= 2 ? "b1" : c <= 4 ? "b2" : c <= 7 ? "b3" : "b4";
}

/** [min, max] options shown per band (AVATAR §7.1). */
export const CHOICE = { b1: [2, 2], b2: [2, 3], b3: [2, 4], b4: [2, 4] };

/** A stable 32-bit seed from the child id (FNV-1a): the per-child shuffle with no stored column. */
export function seedOf(id) {
  let h = 0x811c9dc5;
  for (const ch of String(id)) h = Math.imul(h ^ ch.charCodeAt(0), 0x01000193) >>> 0;
  return h >>> 0;
}

/** mulberry32: small, seedable, good enough for a shuffle. */
export function rng32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function seededShuffle(list, seed) {
  const r = rng32(seed), out = [...list];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/**
 * Take up to `max` from an already-shuffled list while covering ≥ 1 per presented gender and ≥ 1 at MST ≥ 6
 * when the pool has them (AVATAR §5.1 roster rules). Order of the result keeps the shuffle order.
 */
export function pickCovering(shuffled, max) {
  if (shuffled.length <= max) return shuffled;
  const chosen = new Set();
  const need = [
    (t) => t.look.presentedGender === "F",
    (t) => t.look.presentedGender === "M",
    (t) => t.look.mst >= 6,
  ];
  for (const ok of need) {
    if (chosen.size >= max) break;
    if ([...chosen].some(ok)) continue;
    const hit = shuffled.find((t) => ok(t) && !chosen.has(t));
    if (hit) chosen.add(hit);
  }
  for (const t of shuffled) if (chosen.size < max) chosen.add(t);
  return shuffled.filter((t) => chosen.has(t));
}

/**
 * Who the picker offers this child. No device-tier term, ever (tutor-selection-ux G-3.1: it can empty the
 * picker). `hasSheet(id)` is the server's "a persona sheet and voice exist" check; `offer` picks the range set.
 * Returns mode "picker" (≥ min eligible), "single" (exactly one: skip the picker, no fake one-tile choice), or
 * "none" (fallback to the class default).
 */
export function eligibleTutors(child, { catalogue = TUTORS, hasSheet = () => true, allow = null, offer = "sheet", includeDraft = false } = {}) {
  const cls = Number(child.class_level) || 1;
  const band = bandOfClass(cls);
  const [min, max] = CHOICE[band];
  const range = (t) => (offer === "wide" ? t.fit.wideOfferClasses : t.fit.offerClasses);
  const el = catalogue.filter((t) => (t.status === "live" || (includeDraft && t.status === "draft"))
    && (includeDraft || hasSheet(t.id))
    && cls >= range(t)[0] && cls <= range(t)[1]
    && (allow == null || allow.includes(t.id)));
  if (el.length === 0) return { mode: "none", band, tutors: [] };
  if (el.length < min) return { mode: "single", band, tutors: el };
  return { mode: "picker", band, tutors: pickCovering(seededShuffle(el, seedOf(child.id)), max) };
}

/** The class default when nothing was chosen (matches server teacherFor's rule). */
export const defaultTutorFor = (child) => (Number(child.class_level) <= 4 ? "asha" : "arjun");

// ───────────── the child names the teacher (decision child-names-teacher) ─────────────
// The SHAPE half of the name predicate, shared so the picker can answer instantly; the server's
// server/compiler/characters/naming.js checkTeacherName() adds the denylists (slurs, profanity, romance and
// companion terms, public figures) and the child's own name, and is the only authority. The DB check
// (011_teacher_name.sql child_teacher_name_shape) is the same shape, so a write that skipped the predicate still
// cannot store markup or a long string.

/** 2-16 characters: Latin letters, with at most two single spaces or hyphens between letters. */
export const TEACHER_NAME = Object.freeze({ min: 2, max: 16, re: /^[A-Za-z]+(?:[ -][A-Za-z]+){0,2}$/ });

/** The names the picker offers (owner: "Asha, Arjun and Uma are suggestions"). Never a default the child must keep. */
export const NAME_SUGGESTIONS = Object.freeze(["Asha", "Arjun", "Uma"]);

/** Typed text → the name as it would be stored: trimmed, inner whitespace collapsed, each word capitalised. */
export function normalizeTeacherName(raw) {
  const s = String(raw ?? "").normalize("NFC").replace(/\s+/g, " ").trim();
  return s.replace(/[A-Za-z]+/g, (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
}

/** The shape rule alone: null when the shape is fine, else "empty" | "length" | "charset". */
export function teacherNameShape(name) {
  const s = normalizeTeacherName(name);
  if (!s) return "empty";
  if (s.length < TEACHER_NAME.min || s.length > TEACHER_NAME.max) return "length";
  return TEACHER_NAME.re.test(s) ? null : "charset";
}

/**
 * Suggestions for this child: the look's own name first, then the others; never the child's own first name (a
 * teacher with the child's name is the own-name rule) and never `exclude` (the name just refused).
 * @param {string | null | undefined} characterId  @param {{ childFirstName?: string, exclude?: string | null }} [opts]
 */
export function teacherNameSuggestions(characterId, { childFirstName = "", exclude = null } = {}) {
  const own = tutorById(characterId)?.displayName.roman;
  const fold = (x) => String(x ?? "").toLowerCase().replace(/[^a-z]/g, "");
  const kid = fold(String(childFirstName).split(/\s+/)[0]);
  const refused = String(exclude ?? "").trim().toLowerCase();
  return [...new Set([own, ...NAME_SUGGESTIONS].filter(Boolean))].filter((n) => fold(n) !== kid && n.toLowerCase() !== refused);
}
