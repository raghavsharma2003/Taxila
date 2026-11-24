// Play coverage rules for yantra/circuit (round 7 E6): wire a cell, a torch bulb and (sometimes) a switch on a board, then
// RUN. Authored: joining each bulb terminal to a different cell terminal in one loop IS building a closed circuit (t01 s2),
// and seeing the bulb glow only for the closed loop, with the current shown the same all round, IS "current flows only
// round a complete path, one way, not used up" (t01 s3). A switch that must break the only path IS "a switch only opens
// or closes the path" (t02 s3), and a level that asks for the switch AFTER the bulb IS predicting the effect of where a
// switch sits (t02 s4). Mal-rules map only to the topic's own kit misconceptions where the act is the belief:
//   one-wire              t01-m1  one wire from the cell to the bulb, then run
//   both-terminals-clash  t01-m3  both cell terminals wired to the SAME bulb terminal ("they meet in the bulb")
//   switch-before-only    t02-m2  asked for the switch after the bulb, puts it between + and the bulb
//   switch-source         t02-m1  the bulb wired in a loop with the switch only (the switch treated as the source)
import { R } from "../rule.mjs";

const Y = "yantra";
export const RULES = [
  R("c7-science-ch03-t01", Y, "circuit", "light", { "one-wire": "m1", "both-terminals-clash": "m3" }, {}),
  R("c7-science-ch03-t02", Y, "circuit", "switch", { "switch-before-only": "m2", "switch-source": "m1" }, {}),
];

export const ACTS = {
  "c7-science-ch03-t01|light": ["s2", "s3"],    // build a closed circuit; current flows only round a complete loop
  "c7-science-ch03-t02|switch": ["s3", "s4"],   // a switch only opens / closes the path; where the switch sits
};
