// The in-process seam between the brain's /turn (server/brain/turn.js) and the duplex server slices (routes.js), added by
// safety-robust (2026-10-05): the Director's model distress read on a committed turn reaches that lesson's PartialSafety as
// a model note. routes.js installs sliceFor when the duplex routes are created; until then every lookup is null.
export const duplexRegistry = {
  /** @type {(lessonId: string) => (import("./slice.js").DuplexSlice | null)} */
  sliceFor: () => null,
};
