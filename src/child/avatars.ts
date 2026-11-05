// The child's picture sets (pure data; importable by the unit tests). pictos.tsx draws them.
export const AVATARS = [
  "red-panda", "tiger-cub", "elephant-calf", "river-dolphin", "hornbill", "peacock", "turtle", "butterfly", "squirrel",
  "camel", "rhino", "snow-leopard", "kite", "rocket", "football", "cricket-bat", "mango", "sunflower", "mountain",
  "sailboat", "auto-rickshaw", "bicycle", "telescope", "paintbrush",
] as const;

/** r7 (9-15 onboarding sweep; gap app-identity-avatars): the older family's identity set, line emblems drawn in pictos.tsx. */
export const EMBLEMS = [
  "em-orbit", "em-comet", "em-bolt", "em-prism", "em-wave", "em-peak", "em-atom", "em-delta", "em-nova", "em-helix", "em-grid", "em-flare",
] as const;

/** OWNER DECISION (OWNER.md §1 row 6, "volt-emblem avatars", parked): the older family's picture set. Built and on as
 *  "emblems"; set "animals" to revert (one line). Young always picks the painted animals; a picture a child already chose
 *  renders either way. */
export type OlderAvatarSet = "emblems" | "animals";
export const OLDER_AVATAR_SET: OlderAvatarSet = "emblems";

/** The identity set offered to a family (the second argument is for tests). */
export const avatarsFor = (family: "young" | "older", older: OlderAvatarSet = OLDER_AVATAR_SET): readonly string[] =>
  (family === "older" && older === "emblems" ? EMBLEMS : AVATARS);
