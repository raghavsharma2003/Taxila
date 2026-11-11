// Play coverage rules for the feeta family (round 7: length and distance, classes 4-5; never timed). Authored: cutting a
// ribbon as long as an object that lies from one mark to another of a (sometimes broken) ruler IS measuring with a ruler
// from its 0 mark (the spaces under the object, not the end number or the marks); cutting a rope ordered in m + cm off a
// tape marked in cm only IS converting with 1 m = 100 cm; putting lengths written in cm and in m on a rack shortest
// first, then rolling them out to one scale, IS comparing lengths in one unit; cutting a fence roll to go exactly round
// a garden (squares only, squares and some lengths, or some lengths only, the rest following from equal sides) IS the
// distance around a shape; setting a metre-only trip meter to a trip written in km + m IS converting with 1 km = 1000 m;
// racking routes written in km, m or km + m shortest first IS comparing distances in mixed units. Mal-rules map only to
// the topic's own kit misconceptions where the belief is the same one: the object's end number or the marks counted is
// "edge-start"; 1 m as 10 cm is "m-is-10cm"; bare numbers compared is "number-ignores-unit" / "ignore-units"; only the
// labelled sides added is "two-sides"; the squares inside is "area-confusion"; the squares along the edge is
// "border-squares"; 1 km as 100 m is "km-100m"; km and m joined side by side is "mixed-concat". Not admitted:
// c4-maths-ch06-t01-s3 (estimating a length and choosing cm or m), c5-maths-ch05-t01-s3 (choosing a unit) and
// c5-maths-ch05-t02-s3 (how much farther; the subtract-separately belief): no honest mechanic here yet. The
// c4 joined-units belief (2 m 8 cm as 28 cm) is the same set-up as 1 m = 10 cm on every rope, so it is never claimed.
import { R } from "./rule.mjs";

export const family = "feeta";
const F = "feeta";
export const RULES = [
  R("c4-maths-ch06-t01", F, "measure", "ribbon", { "end-number": "edge-start", "count-marks": "edge-start" }, {}),
  R("c4-maths-ch06-t01", F, "measure", "rope", { "m-is-10": "m-is-10cm" }, {}),
  R("c4-maths-ch06-t01", F, "compare", "order", { "ignore-units": "number-ignores-unit" }, { u: "m", forms: ["big", "small"] }),
  R("c4-maths-ch06-t02", F, "fence", "fence", { "labelled-only": "two-sides", area: "area-confusion", "border-squares": "border-squares" }, { shapes: ["rect", "square", "L"] }),
  R("c5-maths-ch05-t01", F, "trip", "odo", { "km-100": "km-100m", concat: "mixed-concat" }, {}),
  R("c5-maths-ch05-t02", F, "compare", "order", { "ignore-units": "ignore-units", concat: "mixed-concat" }, { u: "km", forms: ["big", "small", "mixed"] }),
  // r7 naap (science measuring, class 6; src/play/families/feeta/naap.logic.ts). Authored: pressing a thread that does not
  // stretch at the start, every bend and the end of a curve, straightening it onto a scale from 0 and setting its reading
  // IS measuring a curved line with a thread (c6-science-ch05-t02 s1); the same on a map road, the thread's cm turned into
  // km with the map's "1 cm = 10 km" (or 20 km) IS using a map scale (s3). Mal-rules, the kit's own beliefs: only the
  // straight stretch measured with the ruler, the bends given up, is m1 (curved lines cannot be measured); the thread or the
  // ruler straight from start to end is m2 (the straight distance equals the curve); the rubber band laid along the curve,
  // its shrunk length read, is m3 (a stretchy band works as well as a thread). Not admitted: s2 (a tape round a bottle or
  // a trunk): no honest mechanic here yet.
  R("c6-science-ch05-t02", F, "thread", "curve", { "curve-cannot": "m1", chord: "m2", band: "m3" }, {}),
  R("c6-science-ch05-t02", F, "thread", "map", { "curve-cannot": "m1", chord: "m2", band: "m3" }, { scales: [10, 20] }),
  // Putting each job on the clinical (about 35-42 °C) or the lab thermometer (−10 to 110 °C) and dipping them IS knowing the
  // range and use of each (c6-science-ch07-t02 s1); boiling water or hot chai given to the clinical one is m1. Dipping a lab
  // thermometer (1 °C a small division, numbered every 10), waiting for the column and setting its reading while it is in
  // the water IS reading the scale by its smallest division and reading it in the liquid (s2, s3); taken out, then read, is
  // m2. Reading children's clinical thermometers (0.1 °C a small division) and putting each on "normal" or "fever" IS
  // reading a clinical scale (s2); every child above 37.0 °C on the fever bench is m3 (normal is exactly 37.0 for everyone).
  R("c6-science-ch07-t02", F, "thermo", "jobs", { "clinical-hot": "m1" }, {}),
  R("c6-science-ch07-t02", F, "thermo", "read", { "read-out": "m2" }, {}),
  R("c6-science-ch07-t02", F, "thermo", "fever", { "exact-37": "m3" }, {}),
  // Sliding an eraser to a full mark (the 0, or a broken ruler's first clear mark, then subtracting), the eye moved above its
  // far end, and setting the length IS measuring correctly with a scale (c6-science-ch05-t01 s2); lined up with the ruler's
  // edge and the end mark read is m1; read with the eye to one side (the sightline meets the scale a mark away) is m3.
  // Setting how many whole 30 cm foot-rulers lie along a cloth of whole metres, then laying them, IS the metre against the
  // foot (s1: standard units, the kit's "1 metre is about 3.3 feet"); one foot-ruler a metre is m2. Not admitted: s3
  // (converting mm, cm, m, km): feeta's rope and trip already do that for maths, no science mechanic beyond them here.
  R("c6-science-ch05-t01", F, "scale", "ruler", { "edge-start": "m1", "side-eye": "m3" }, {}),
  R("c6-science-ch05-t01", F, "scale", "foot", { "metre-foot": "m2" }, {}),
  // Feeling things with a hand (it says what it feels), putting them on a warmth shelf, then letting a thermometer on each
  // order the shelf IS touch against temperature (c6-science-ch07-t01 s1, s3): a steel and a wooden thing from one room on
  // different steps, steel colder, is m1; the bucket of warm water warmer than the cup of hot chai is m2 (heat taken for
  // temperature); the bowl both hands are in put where one hand's feeling says is m3. Not admitted: s2 (temperature in °C).
  R("c6-science-ch07-t01", F, "touch", "feel", { "metal-colder": "m1", "heat-temp": "m2", "touch-trust": "m3" }, { kinds: ["room", "chai", "bowls"] }),
];

export const ACTS = {
  "c4-maths-ch06-t01|ribbon": ["s1"],               // measure with a ruler from its 0 mark (count the spaces)
  "c4-maths-ch06-t01|rope": ["s2"],                 // m + cm into cm with 1 m = 100 cm
  "c4-maths-ch06-t01|order": ["s2"],                // cm against m: one unit first, then compare
  "c4-maths-ch06-t02|fence": ["s1", "s2", "s3"],    // every side added; equal sides of rectangles and squares; around, not inside
  "c5-maths-ch05-t01|odo": ["s1", "s2"],            // 1 km = 1000 m; km + m into m
  "c5-maths-ch05-t02|order": ["s1", "s2"],          // one unit before comparing; order three or four mixed distances
  "c6-science-ch05-t02|curve": ["s1"],              // lay, mark, straighten, measure
  "c6-science-ch05-t02|map": ["s3"],                // a thread's cm × the map scale
  "c6-science-ch07-t02|jobs": ["s1"],               // range and use of the two thermometers
  "c6-science-ch07-t02|read": ["s2", "s3"],         // the smallest division; read while in the liquid
  "c6-science-ch07-t02|fever": ["s2"],              // a clinical scale read in tenths
  "c6-science-ch05-t01|ruler": ["s2"],              // from a full mark, eye directly above
  "c6-science-ch05-t01|foot": ["s1"],               // the metre, a standard unit, against the foot
  "c6-science-ch07-t01|feel": ["s1", "s3"],         // touch misleads; metal feels colder; heat is not temperature
};
