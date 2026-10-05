// MomentPlan: the live delivery planner (HUMAN-VOICE §5.1, B2). Pure code, 0 ms: an LLM planner is ≥ 0.9 s on every
// form measured (hv-live-planner-is-code), which a 2.97 s turn cannot afford.
//
// INPUT IS THE BRAIN'S MOMENT ONLY (TEACHER-BRAIN TB6, server/brain/moment.js). Laws, each one a test
// (tests/voice-expressive-plan.test.mjs):
//   - the emotion ROW is chosen from the move, teacherAffect (RELATIONAL-OS appraise(), the one affect producer) and
//     engagement. The verdict NEVER picks a row (HV-17): flipping correct ↔ not_yet with teacherAffect fixed leaves the
//     arc unchanged, and no row is reachable from verdict = correct except by the move or affect that would pick it anyway;
//   - the verdict is a LICENCE only: after not_yet / partial there is no laugh, no sigh and no filler;
//   - safety turns bypass everything (§5.10): calm 0.3, slow, fixed 300 ms between sentences, no filler, no non-verbal,
//     no marker but [calm] (HV-3);
//   - intensity is capped by Band4 (B1 0.8 … B4 0.5: older children get less animation, human-likeness §0.6);
//   - never a whispering / affectionate / secretive / sad style (intimacy and attachment risk for minors): the
//     Emotion union has none, and nothing here can produce one.
// Values are bands, never prose: nothing in this file is text a model or a child ever reads.

/** @typedef {import("../../../shared/brain").Moment} Moment */
/** @typedef {import("../../../shared/contracts").Emotion} Emotion */
/** @typedef {import("../../../shared/contracts").NonVerbal} NonVerbal */

export const BAND_CAP = Object.freeze({ B1: 0.8, B2: 0.7, B3: 0.6, B4: 0.5 });

/**
 * One row per moment family (HUMAN-VOICE §5.1 table). arc: emotion by clause position [first, middle, last];
 * pace: [first, rest]; sentencePause: ms range between sentences; commaPause: ms range at a comma (0 = the engine's
 * own); lastPause: ms range before the LAST clause (the reveal / the look-again / the fact after a laugh), when set;
 * askPause: ms before a clause that asks (ends with "?"); licence: non-verbals this row may carry (the governor and
 * the engine still decide); fillers: the inventory key, or null (no inserted word on this row).
 */
export const ROWS = Object.freeze({
  greet: { arc: ["warm", "warm", "curious"], pace: ["normal", "normal"], sentencePause: [200, 320], commaPause: [0, 0], licence: ["breath"], fillers: null, base: 0.55 },
  hook: { arc: ["wonder", "wonder", "delighted"], pace: ["slow", "normal"], sentencePause: [300, 450], commaPause: [0, 0], lastPause: [450, 700], licence: ["breath", "hum"], fillers: "hook", base: 0.6 },
  explain: { arc: ["calm", "warm", "warm"], pace: ["normal", "normal"], sentencePause: [250, 450], commaPause: [0, 0], licence: ["breath"], fillers: "explain", base: 0.5 },
  think_aloud: { arc: ["thinking", "thinking", "proud"], pace: ["slow", "slow"], lastPace: "brisk", sentencePause: [150, 500], commaPause: [150, 350], lastPause: [300, 450], licence: ["hum", "breath"], fillers: "think", base: 0.5 },
  pose: { arc: ["curious", "curious", "curious"], pace: ["normal", "normal"], sentencePause: [220, 360], commaPause: [0, 0], askPause: 300, licence: [], fillers: "pose", base: 0.5 },
  affirm: { arc: ["warm", "warm", "warm"], pace: ["brisk", "normal"], sentencePause: [180, 280], commaPause: [0, 0], licence: [], fillers: null, base: 0.45 },
  insight: { arc: ["curious", "delighted", "warm"], pace: ["normal", "normal"], sentencePause: [250, 400], commaPause: [0, 0], licence: ["breath"], fillers: null, base: 0.6 },
  effort: { arc: ["warm", "proud", "proud"], pace: ["normal", "slow"], sentencePause: [220, 360], commaPause: [0, 0], licence: ["sigh_relief"], fillers: null, base: 0.55 },
  correct: { arc: ["calm", "reassuring", "curious"], pace: ["slow", "slow"], sentencePause: [350, 500], commaPause: [0, 0], lastPause: [400, 650], licence: [], fillers: null, base: 0.45, pitch: -6 },
  laughter: { arc: ["amused", "playful", "warm"], pace: ["brisk", "normal"], sentencePause: [220, 360], commaPause: [0, 0], lastPause: [300, 550], licence: ["chuckle", "laugh"], fillers: "laugh", base: 0.6 },
  comfort: { arc: ["calm", "calm", "calm"], pace: ["slow", "slow"], sentencePause: [400, 600], commaPause: [0, 0], licence: ["breath"], fillers: null, base: 0.4, cap: 0.4, pitch: -6 },
  own_slip: { arc: ["warm", "warm", "warm"], pace: ["normal", "normal"], sentencePause: [220, 320], commaPause: [0, 0], licence: [], fillers: null, base: 0.4 },
  wrap: { arc: ["warm", "warm", "proud"], pace: ["normal", "normal"], sentencePause: [250, 400], commaPause: [0, 0], licence: [], fillers: "wrap", base: 0.5 },
  safety: { arc: ["calm", "calm", "calm"], pace: ["slow", "slow"], sentencePause: [300, 300], commaPause: [0, 0], licence: [], fillers: null, base: 0.3, cap: 0.3 },
});

/** Filler inventories (HUMAN-VOICE §5.2): closed, per language. Hesitant ones (umm) only in think-aloud. */
export const FILLERS = Object.freeze({
  hi: Object.freeze({ explain: ["तो", "देखो", "अच्छा"], hook: ["अच्छा", "देखो"], think: ["हम्म", "उम्म"], pose: ["अच्छा", "तो"], laugh: ["अरे"], wrap: ["चलो"] }),
  // Roman fillers for Roman-script Hinglish replies: read by the same en-IN voice, no single-word <lang hi-IN> switch
  // mid-sentence (fixer 2026-10-05, w2g-hinglish-roman-fillers; still on the owner's HV-9 blind page).
  hinglish: Object.freeze({ explain: ["toh", "dekho", "achha"], hook: ["achha", "dekho"], think: ["hmm", "umm"], pose: ["achha", "toh"], laugh: ["arre"], wrap: ["chalo"] }),
  en: Object.freeze({ explain: ["so", "okay"], hook: ["so", "well"], think: ["hmm", "umm"], pose: ["okay", "so"], laugh: ["oh"], wrap: ["okay"] }),
});

const MOVE_ROW = Object.freeze({
  greet: "greet", hook: "hook", explain: "explain", show_module: "explain", worked_example: "think_aloud",
  retrieval: "pose", probe: "pose", practice: "pose", teachback: "pose", repair: "pose",
  hint: "correct", reteach: "correct", celebrate: "affirm", break: "comfort", wrap: "wrap", safeguard: "safety",
});
const DISPLAY_ROW = Object.freeze({
  delight: "insight", warm_pride: "effort", playful: "laughter", gentle_concern: "comfort", calm_steady: "comfort",
  sheepish_own: "own_slip", enthusiasm: "hook", calm_curious: "pose",
});

/**
 * The row for a Moment. Reads move, teacherAffect.display, engagement and safety, NEVER the verdict (HV-17).
 * @param {Moment} m
 */
export function rowOf(m) {
  if (!m || m.safety) return "safety";
  const d = m.teacherAffect?.display;
  if (d && DISPLAY_ROW[d]) return DISPLAY_ROW[d];
  if (m.engagement === "strained") return "comfort";
  return MOVE_ROW[m.move] ?? "explain";
}

const NEGATIVE = new Set(["not_yet", "partial"]);

/**
 * momentPlan(moment) → the plan skeleton the aligner fits to the reply's clauses.
 * @param {Moment} m
 * @returns {{ row: string, arc: Emotion[], pace: string[], lastPace?: string, intensity: number, pitch: number,
 *   licence: NonVerbal[], fillerKey: string | null, register: "normal" | "safety", lang: "hi" | "hinglish" | "en",
 *   sentencePause: number[], commaPause: number[], lastPause?: number[], askPause?: number }}
 */
export function momentPlan(m) {
  const rowName = rowOf(m);
  const row = ROWS[rowName];
  const safety = rowName === "safety";
  const band = m?.band && BAND_CAP[m.band] ? m.band : "B3";
  // intensity: the row's base, lifted by the affect's intensity (2 = a stronger display), warmed by at most +0.1 from
  // stage `regular` on (RELATIONAL-OS: stages carry warmth, never usage), then capped by band and row.
  let intensity = row.base + (m?.teacherAffect?.intensity === 2 ? 0.15 : 0);
  if (!safety && (m?.bondStage === "regular" || m?.bondStage === "long_haul")) intensity += 0.1;
  intensity = Math.min(intensity, BAND_CAP[band], row.cap ?? 1);
  if (safety) intensity = 0.3;
  // licences: the row's, then the vetoes (verdict as licence only; affect; band; the child's own laugh)
  let licence = [...row.licence];
  const neg = NEGATIVE.has(m?.verdict);
  if (neg) licence = licence.filter((k) => k !== "laugh" && k !== "chuckle" && k !== "sigh_relief");
  if (m?.engagement === "strained" || m?.teacherAffect?.display === "gentle_concern") licence = licence.filter((k) => k !== "laugh" && k !== "chuckle");
  if (!m?.childLaughed) licence = licence.filter((k) => k !== "laugh" && k !== "chuckle");
  if (rowName === "hook" && !m?.childLaughed) { /* hum stays: a wonder hook may open with one (§5.6) */ }
  if (safety) licence = [];
  const fillerKey = safety || neg ? null : row.fillers;
  return {
    row: rowName, arc: [...row.arc], pace: [...row.pace], ...(row.lastPace ? { lastPace: row.lastPace } : {}),
    intensity: Math.round(intensity * 100) / 100, pitch: row.pitch ?? 0, licence, fillerKey,
    register: safety ? "safety" : "normal", lang: m?.lang === "en" || m?.lang === "hi" ? m.lang : "hinglish",
    sentencePause: [...row.sentencePause], commaPause: [...row.commaPause],
    ...(row.lastPause ? { lastPause: [...row.lastPause] } : {}), ...(row.askPause ? { askPause: row.askPause } : {}),
  };
}

/** The filler inventory for a plan (null = none on this row): Devanagari for Hindi, Roman for Hinglish, English for English. */
export function fillersFor(plan) {
  if (!plan?.fillerKey) return [];
  return [...(FILLERS[plan.lang === "en" ? "en" : plan.lang === "hi" ? "hi" : "hinglish"][plan.fillerKey] ?? [])];
}
