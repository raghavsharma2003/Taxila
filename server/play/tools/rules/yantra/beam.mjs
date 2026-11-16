// yantra/beam: mirrors route a beam. Turning a mirror until the beam lands IS the equal-angles rule of reflection
// (c7-science-ch11-t03 s3); two parallel mirrors carrying the beam over a wall IS the periscope (c7-science-ch11-t04 s2).
import { R } from "../rule.mjs";

export const RULES = [
  R("c7-science-ch11-t03", "yantra", "beam", "route", {}, { mirrors: [1, 2] }),
  R("c7-science-ch11-t04", "yantra", "beam", "periscope", {}, {}),
];
export const ACTS = {
  "c7-science-ch11-t03|route": ["s3"],
  "c7-science-ch11-t04|periscope": ["s2"],
};
