// Vibe-adaptive persona adapter (COMPREHENSION-ENGINE.md §6, CE10): bounded, closed-vocabulary knobs, moved by
// observable session signals (signals.js), compiled as ONE key=value VIBE row of shapes (never sentences) that sits
// after LESSON NOW and before PEDAGOGY NOW. Pace knobs go to the session config, not the prompt.
//
// Precedence (LM §6.6): invariants and safety → strain suppression → explicit preferences (parent ceiling, then the
// child within it) → session state → band defaults. Re-teach turns suppress humour, decoration and challenge.
// Isolation (VI-1): nothing here is an input to the belief, the mandatory probe set or the re-teach arm choice.

export const BAND_DEFAULTS = Object.freeze({
  B1: { turnWords: [10, 18], wait: 6, waitCap: 8, register: "playful", address: "name+beta", skin: "silly_puppet" },
  B2: { turnWords: [12, 18], wait: 5, waitCap: 8, register: "warm", address: "name+beta", skin: "curious_alien" },
  B3: { turnWords: [14, 25], wait: 4, waitCap: 6, register: "warm", address: "name", skin: "new_classmate" },
  B4: { turnWords: [16, 25], wait: 4, waitCap: 6, register: "warm", address: "name", skin: "new_classmate" },
});
export const VOCAB = Object.freeze({
  humour: ["off", "light"], register: ["playful", "warm", "matter_of_fact"], challenge: ["standard", "dare"], energy: ["calm", "warm"],
  length: ["short", "mid", "long"], childCallsTeacher: ["didi", "ma'am", "miss", "sir", "bhaiya", "teacher", "name"],
  teacherCallsChild: ["name", "name+beta"], skin: ["silly_puppet", "curious_alien", "new_classmate", "cricket_commentator", "robot_golu"],
});
const ENDPOINT_MS = 700;
const STEP_EVERY_MIN = 10, WINDOW_TURNS = 10;

/**
 * @param {{ band: 'B1'|'B2'|'B3'|'B4', classLevel: number, medium?: 'english'|'hindi'|'other', parentTile?: number,
 *   parentCeiling?: { humour?: 'off'|'light', challenge?: 'standard'|'dare', exampleDomain?: string|null } }} o
 */
export function newPersonaState({ band, classLevel, medium = "english", parentTile = 0.3, parentCeiling = {} }) {
  const d = BAND_DEFAULTS[band] ?? BAND_DEFAULTS.B3;
  return {
    band, classLevel, turn: 0, lastStepMin: -Infinity, parentCeiling, parentTile,
    knobs: { length: "mid", humour: "light", register: d.register, challenge: "standard", exampleDomain: null, waitExtra: 0, endpointBoostTurns: 0,
      childCallsTeacher: "teacher", teacherCallsChild: medium === "english" || classLevel > 6 ? "name" : d.address, mixObserved: parentTile },
    explicit: {}, pendingExplicit: null, log: [],
    harder: [],
  };
}

const push = (log, turn, key) => [...log.filter((e) => turn - e.turn < WINDOW_TURNS), { turn, key }];
const count = (log, key) => log.filter((e) => e.key === key).length;
const stepUp = (arr, v, dir) => arr[Math.max(0, Math.min(arr.length - 1, arr.indexOf(v) + dir))];

/**
 * One child turn's signals → the next persona state. `minute` = minutes into the session.
 * @param {ReturnType<typeof newPersonaState>} st @param {ReturnType<typeof import("./signals.js").turnSignals>} sig
 */
export function personaStep(st, sig, { minute = 0 } = {}) {
  const turn = st.turn + 1;
  let log = st.log, k = { ...st.knobs }, explicit = { ...st.explicit }, pendingExplicit = null, lastStepMin = st.lastStepMin;
  // Explicit removals apply the same turn; an explicit addition after a one-turn confirm (the next turn not contrary).
  if (sig.noJokes) { explicit.humour = "off"; }
  if (st.pendingExplicit === "moreJokes" && !sig.noJokes) explicit.humour = "light";
  if (sig.moreJokes && !sig.noJokes) pendingExplicit = "moreJokes";

  const add = (key) => { log = push(log, turn, key); };
  if (sig.bargeIn || sig.shorter) add("len-");
  if (sig.tellMore || sig.chatty) add("len+");
  if (sig.laughter || sig.builtOnHumour) add("hum+");
  if (sig.terse) add("reg-"); if (sig.laughter || sig.chatty) add("reg+");
  if (sig.slowOnset || sig.slowerPace) add("wait+");
  if (sig.address) add(`addr:${sig.address}`);
  for (const i of sig.interests ?? []) add(`int:${i}`);
  const harder = [...st.harder, ...(sig.acceptedHarder ? [1] : sig.declinedHarder ? [0] : [])].slice(-5);

  // Session knobs: one step after 2 consistent signals within 10 turns, ≤ one non-explicit step per 10 minutes,
  // revert toward the default on 2 contrary signals.
  const canStep = minute - lastStepMin >= STEP_EVERY_MIN;
  const tryStep = (fn) => { if (canStep && fn()) { lastStepMin = minute; return true; } return false; };
  tryStep(() => {
    if (count(log, "len-") >= 2 && count(log, "len-") > count(log, "len+")) { const n = stepUp(VOCAB.length, k.length, -1); if (n !== k.length) { k.length = n; return true; } }
    if (count(log, "len+") >= 2 && count(log, "len+") > count(log, "len-")) { const n = stepUp(VOCAB.length, k.length, 1); if (n !== k.length) { k.length = n; return true; } }
    if (count(log, "wait+") >= 2) { const cap = (BAND_DEFAULTS[st.band].waitCap - BAND_DEFAULTS[st.band].wait); if (k.waitExtra < cap) { k.waitExtra += 1; return true; } }
    const regOrder = ["matter_of_fact", "warm", "playful"];
    if (count(log, "reg-") >= 2 && count(log, "reg+") === 0 && !["B1", "B2"].includes(st.band)) { const n = stepUp(regOrder, k.register, -1); if (n !== k.register) { k.register = n; return true; } }
    if (count(log, "reg+") >= 2 && count(log, "reg-") === 0) { const n = stepUp(regOrder, k.register, 1); if (n !== k.register) { k.register = n; return true; } }
    return false;
  });
  // Address: the child's own usage, 2 consistent turns (not a "step": it mirrors, it does not adapt a style).
  const addr = (log.filter((e) => e.key.startsWith("addr:")).map((e) => e.key.slice(5)));
  if (addr.length >= 2 && addr.slice(-2)[0] === addr.slice(-2)[1]) k.childCallsTeacher = addr.at(-1) === "maam" || addr.at(-1) === "mam" ? "ma'am" : addr.at(-1);
  // Interest: said twice in 10 turns this session (tier-A, session-scoped).
  const ints = {};
  for (const e of log) if (e.key.startsWith("int:")) ints[e.key.slice(4)] = (ints[e.key.slice(4)] ?? 0) + 1;
  const topInt = Object.entries(ints).filter(([, n]) => n >= 2).sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1))[0];
  if (topInt) k.exampleDomain = topInt[0];
  k.challenge = ["B3", "B4"].includes(st.band) && harder.filter((x) => x === 1).length >= 3 ? "dare" : "standard";
  if (sig.slowerPace) k.endpointBoostTurns = 6; else k.endpointBoostTurns = Math.max(0, k.endpointBoostTurns - 1);
  k.mixObserved = 0.7 * k.mixObserved + 0.3 * (sig.hindiShare ?? 0);
  return { ...st, turn, knobs: k, explicit, pendingExplicit, log, lastStepMin, harder };
}

/**
 * The VibeDirective for the next teacher turn (§6.4).
 * @param {ReturnType<typeof newPersonaState>} st
 * @param {{ reteach?: boolean, strained?: boolean, transferProbe?: boolean, turnsSinceError?: number, firstReteachOfMisconception?: boolean, armAllowsInterest?: boolean }} [ctx]
 */
export function personaKnobs(st, ctx = {}) {
  const d = BAND_DEFAULTS[st.band] ?? BAND_DEFAULTS.B3;
  const k = st.knobs;
  const [lo, hi] = d.turnWords, third = Math.round((hi - lo) / 3);
  let turnWords = k.length === "short" ? [lo, lo + third] : k.length === "long" ? [hi - third, hi] : [lo, hi];
  // explicit: parent ceiling first, then the child within it
  let humour = st.explicit.humour ?? k.humour;
  if (st.parentCeiling.humour === "off") humour = "off";
  let challenge = st.parentCeiling.challenge === "standard" ? "standard" : k.challenge;
  let exampleDomain = st.parentCeiling.exampleDomain === null ? null : k.exampleDomain;
  let energy = "warm", register = k.register;
  if (["B1", "B2"].includes(st.band) && register === "matter_of_fact") register = "warm";
  // strain suppression beats an explicit "more jokes" (VI-5)
  if (ctx.strained) { humour = "off"; challenge = "standard"; energy = "calm"; }
  if ((ctx.turnsSinceError ?? 99) <= 2) humour = "off";                           // VI-3
  if (ctx.transferProbe) exampleDomain = null;                                      // faded before transfer
  const suppressed = !!ctx.reteach;
  if (suppressed) {                                                                 // §6.5
    humour = "off"; challenge = "standard"; energy = "calm"; turnWords = [lo, lo + third];
    if (ctx.firstReteachOfMisconception || !ctx.armAllowsInterest) exampleDomain = null;
  }
  const skin = register === "playful" ? (st.band === "B1" ? "silly_puppet" : "curious_alien") : d.skin;
  const mix = Math.max(0, Math.min(1, Math.max(st.parentTile - 0.2, Math.min(st.parentTile + 0.2, k.mixObserved))));
  return {
    waitNudgeSec: d.wait + k.waitExtra, endpointSilenceMs: Math.round(ENDPOINT_MS * (k.endpointBoostTurns > 0 ? 1.2 : 1)),
    turnWords, humour, register, address: { childCallsTeacher: k.childCallsTeacher, teacherCallsChild: k.teacherCallsChild },
    exampleDomain, challenge, energy, probeSkin: skin, languageMix: Math.round(mix * 10) / 10, suppressed,
  };
}

/** The compiled VIBE row: ONE line of key=value shapes, closed vocabulary, never sentences (VI-4). */
export function vibeRow(v) {
  const parts = [`turn ${v.turnWords[0]}-${v.turnWords[1]} words`, `humour ${v.humour}`, `register ${v.register}`,
    `address ${v.address.teacherCallsChild}`, `called ${v.address.childCallsTeacher}`];
  if (v.exampleDomain) parts.push(`examples ${v.exampleDomain}`);
  parts.push(`challenge ${v.challenge}`, `energy ${v.energy}`, `hindi-mix ${v.languageMix}`);
  if (v.suppressed) parts.push("reteach plain");
  return `VIBE ${parts.join(" · ")}`;
}

/** VI-4 check: every value in the row is from the closed vocabulary (or a number / interest id). Returns problems. */
export function checkVibeRow(row, interests) {
  const out = [];
  if (row.includes("\n")) out.push("multi-line");
  if (/[.!?]/.test(row.replace(/\d\.\d/g, ""))) out.push("sentence punctuation");
  const body = row.replace(/^VIBE /, "").split(" · ");
  for (const p of body) {
    const [key, ...rest] = p.split(" ");
    const val = rest.join(" ");
    const ok = key === "turn" ? /^\d+-\d+ words$/.test(val) : key === "humour" ? VOCAB.humour.includes(val) : key === "register" ? VOCAB.register.includes(val)
      : key === "address" ? VOCAB.teacherCallsChild.includes(val) : key === "called" ? VOCAB.childCallsTeacher.includes(val)
      : key === "examples" ? Object.keys(interests).includes(val) : key === "challenge" ? VOCAB.challenge.includes(val) : key === "energy" ? VOCAB.energy.includes(val)
      : key === "hindi-mix" ? /^(0|1|0\.\d)$/.test(val) : key === "reteach" ? val === "plain" : false;
    if (!ok) out.push(`bad ${p}`);
  }
  return out;
}
