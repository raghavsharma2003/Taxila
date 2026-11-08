// Play coverage rules for the gati family (round 7: motion, classes 6 and 7; never timed: the clock moves only when the child
// taps it). Authored:
// - Watching one thing from each reference in turn while stepping the clock (the scene drawn as seen from the reference: the
//   thing's trail stays one dot or spreads) and saying "at rest" or "moving" from each IS using a reference point to decide
//   whether something is at rest or in motion (c6-science-ch05-t03 s1); the same verdict from every reference is m1.
// - Stepping the clock until each light's path shows (a straight line, all the way round, or back over its own arc) and
//   putting each thing on linear, circular or oscillatory IS classifying motion (s2); every to-and-fro thing put on circular
//   (an arc taken for a circle) is m2.
// - Watching a rolling bicycle wheel or a merry-go-round horse from the ground and riding along, and ticking every type of
//   motion each thing shows, IS recognising more than one type at once (s3); one type ticked for each (the bicycle only
//   straight ahead) is m3.
// - Flagging the faster of two movers that went different distances in different times, with the clock leaving a mark on
//   each lane at every interval, IS comparing speeds (c7-science-ch08-t02 s3); flagging the one that went farther (unequal
//   times) is m1. Setting the speedometer from a trip stepped to its end on a marked track IS speed = distance ÷ time and,
//   at look 3, average speed = total distance ÷ total time (s1, s2); the trip's distance set is m2, distance × time is m3
//   (time ÷ distance is never a whole number on the speedometer, so the multiplying half of the belief is the one served).
//   Stepping a car one second at a time on a track in metres under a km/h speedometer and setting its m/s IS the kit's
//   1 km/h = 5/18 m/s (s4); no kit misconception is served there.
// - Stepping the clock so a chalk mark drops at each mover every interval, then putting each on uniform or non-uniform, IS
//   deciding from position marks whether a motion is uniform (c7-science-ch08-t03 s1, s2); uniform-exactly-when-it-never-
//   stops is m1, the uneven mover with a uniform one's total distance in the same total time put on uniform is m2, the fast
//   uniform mover put on non-uniform is m3. Not admitted: s3 (everyday motion and average speed): the average speed is
//   raftaar's look 3 for ch08-t02, no separate mechanic here.
import { R } from "./rule.mjs";

export const family = "gati";
const F = "gati";
export const RULES = [
  R("c6-science-ch05-t03", F, "drishti", "sandarbh", { "no-reference": "m1" }, {}),
  R("c6-science-ch05-t03", F, "drishti", "prakaar", { "curve-circular": "m2" }, {}),
  R("c6-science-ch05-t03", F, "drishti", "do-gati", { "one-type": "m3" }, {}),
  R("c7-science-ch08-t02", F, "raftaar", "aage", { "farther-faster": "m1" }, {}),
  R("c7-science-ch08-t02", F, "raftaar", "nikaalo", { "speed-distance": "m2", multiply: "m3" }, {}),
  R("c7-science-ch08-t02", F, "raftaar", "badlo", {}, {}),
  R("c7-science-ch08-t03", F, "nishaan", "ek-saa", { "keeps-moving": "m1", "same-totals": "m2", "uniform-slow": "m3" }, {}),
];

export const ACTS = {
  "c6-science-ch05-t03|sandarbh": ["s1"],        // at rest or moving, compared with each reference
  "c6-science-ch05-t03|prakaar": ["s2"],         // linear, circular, oscillatory from the path
  "c6-science-ch05-t03|do-gati": ["s3"],         // more than one type at once
  "c7-science-ch08-t02|aage": ["s3"],            // compare speeds: distance in the same time
  "c7-science-ch08-t02|nikaalo": ["s2", "s1"],   // speed = distance ÷ time (average speed at look 3), its units
  "c7-science-ch08-t02|badlo": ["s4"],           // km/h to m/s (1 km/h = 5/18 m/s), read a speedometer
  "c7-science-ch08-t03|ek-saa": ["s2", "s1"],    // uniform or not, from position marks at equal intervals
};
