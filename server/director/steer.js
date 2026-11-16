// round 7 (PIPELINE.md A6/A7, contracts: shared/contracts.ts SteerId / SteerChip / LaterEntryUi): a tap on the steer row or
// on a Later entry is the same request the child's words would make. PURE.
//
// The requests are the ones decide() → requestMove already acts on (state.js); a steer id with no move yet maps to null
// and the turn takes its ordinary path (never an error, never graded: classify.js reads a steer chip as no evidence).

/** @type {Readonly<Record<string, object | null>>} SteerId → the request (without `whole`, added below) */
const STEER = Object.freeze({
  "steer:replay": { type: "repeat" },
  "steer:slower": { type: "slower" },
  "steer:another": { type: "another" },
  "steer:example": { type: "example" },
  "steer:story": { type: "story" },
  "steer:picture": { type: "visual", kind: "diagram" },
  "steer:animation": { type: "visual", kind: "animation" },
  "steer:game": { type: "visual", kind: "game" },
  "steer:hindi": { type: "language", lang: "hindi" },
  "steer:english": { type: "language", lang: "english" },
  "steer:harder": { type: "harder" },
  "steer:easier": { type: "easier" },
  "steer:skip": { type: "skip" },
  "steer:else": { type: "change_topic" },
  "steer:break": { type: "break" },
  "steer:stop": { type: "stop" },
  // decision D5 "wrap up in 2": the move is not built yet (PIPELINE A9); until it is, an ordinary turn
  "steer:wrap2": null,
});

/** Is `chipId` a steer chip id (whether or not it has a move yet)? */
export const isSteerChip = (chipId) => typeof chipId === "string" && Object.hasOwn(STEER, chipId);

/** The request a steer chip makes, or null (not a steer chip, or no move for it yet). Never graded, always whole. */
export function steerRequest(chipId) {
  const r = isSteerChip(chipId) ? STEER[chipId] : null;
  return r ? { ...r, whole: true, src: "steer" } : null;
}

/** A tap on a Later entry ("later:<id>"): the child asks for that parked thing now. → its id, or null. */
export const laterChipId = (chipId) => (typeof chipId === "string" && /^later:[\w-]{1,40}$/.test(chipId) ? chipId.slice(6) : null);
