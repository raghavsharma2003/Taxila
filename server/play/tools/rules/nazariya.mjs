// r4-khand · the coverage rules for Nazariya (F8) as the Khand block world. Authored like build-coverage's RULES: a person
// decided that the mode's act IS the topic skill's idea, reading the kit's skills and misconceptions beside the generator;
// build-coverage checks every id against the kits. misMap: family mal-rule → kit slug (the part after "-m-").
// ACTS: `${topicId}|${goal}` → the kit skills the act exercises (the first is the entry's own).
const R = (topicId, family, mode, goal, misMap = {}, grammar = {}, arts = undefined) => ({ topicId, family, mode, goal, misMap, grammar, arts });
const N = "nazariya";
/** G1's S0.3 per-family loader (server/play/tools/rules/index.mjs on claude/r4-games-core) reads `family`, RULES and ACTS. */
export const family = N;

export const RULES = [
  // views: build the structure whose top / front / side views are given; or a different build with one same view
  R("c4-maths-ch02-t01", N, "views", "build3", {}, {}, ["kagaz", "blueprint"]),
  R("c4-maths-ch02-t01", N, "views", "same", { "copy-same": "different-objects-different-views" }, { views: ["front", "side", "top"] }, ["kagaz", "blueprint"]),
  // arrays: r rows of c fill the pit (the product); the turned array holds the same count
  R("c4-maths-ch09-t01", N, "array", "fill", {}, { max: 9 }, ["kagaz", "chalk"]),
  R("c4-maths-ch09-t01", N, "array", "turn", { "order-changes": "order-changes" }, { max: 9 }, ["kagaz", "chalk"]),
  // floor and fence: area as tiles, perimeter as the fence round them
  R("c5-maths-ch11-t01", N, "floor", "area", { "area-perimeter": "area-perimeter" }, {}, ["kagaz", "chalk"]),
  R("c5-maths-ch11-t02", N, "floor", "perimeter", { "l-plus-b": "once-only", "area-for-perimeter": "area-for-perimeter", "border-squares": "count-border-squares" }, {}, ["kagaz", "chalk"]),
  R("c5-maths-ch11-t03", N, "floor", "min", { "same-area-perimeter": "same-area-same-perimeter" }, {}, ["kagaz", "chalk"]),
  R("c6-maths-ch06-t01", N, "floor", "perimeter", { "l-plus-b": "l-plus-b", "area-for-perimeter": "area-perimeter" }, { plot: [12, 9] }),
  R("c6-maths-ch06-t02", N, "floor", "area", { "area-perimeter": "add-for-area" }, { plot: [12, 9] }),
  R("c6-maths-ch06-t02", N, "floor", "max", { "same-perimeter-area": "same-perimeter-area" }, { plot: [12, 9] }),
  // square and cube numbers: say the next term, then build it
  R("c6-maths-ch01-t01", N, "powers", "square", { "square-double": "square-double" }),
  R("c6-maths-ch01-t01", N, "powers", "cube", { "square-double": "square-double" }),
  // symmetry: complete the build across the glass
  R("c4-maths-ch11-t02", N, "mirror", "complete", { "copy-no-flip": "copy-no-flip", "distance-off": "distance-not-kept", "wrong-direction": "wrong-direction" }, { axes: ["x", "z"], hmax: 2 }, ["kagaz", "chalk"]),
  R("c5-maths-ch10-t02", N, "mirror", "complete", { "copy-no-flip": "copy-not-flip" }, { axes: ["x"] }, ["kagaz", "chalk"]),
  R("c6-maths-ch09-t01", N, "mirror", "complete", { "wrong-axis": "vertical-only" }, { axes: ["z", "x"] }),
];

export const ACTS = {
  "c4-maths-ch02-t01|build3": ["s2", "s1"],      // match a build to its front and side views, and to its top view
  "c4-maths-ch02-t01|same": ["s2"],              // one view, two different objects (never s3: naming from a set)
  "c4-maths-ch09-t01|fill": ["s1"],              // r × c as the array that fills the pit (facts to 10 × 10)
  "c4-maths-ch09-t01|turn": ["s2"],              // changing the order: the turned array holds the same count
  "c5-maths-ch11-t01|area": ["s1", "s3"],        // area by counting unit squares; area is not the fence
  "c5-maths-ch11-t02|perimeter": ["s1", "s2"],   // the fence round all the sides; 2 × (l + b)
  "c5-maths-ch11-t03|min": ["s2", "s3"],         // same area, different fences
  "c6-maths-ch06-t01|perimeter": ["s2", "s1"],
  "c6-maths-ch06-t02|area": ["s1"],
  "c6-maths-ch06-t02|max": ["s3"],               // same fence, different floor
  "c6-maths-ch01-t01|square": ["s2"],            // extend the square numbers
  "c6-maths-ch01-t01|cube": ["s3"],              // the cube numbers
  "c4-maths-ch11-t02|complete": ["s1", "s2", "s3"], // flip across a standing line; keep the distance; a lying line
  "c5-maths-ch10-t02|complete": ["s1"],          // complete a design across a mirror line
  "c6-maths-ch09-t01|complete": ["s3"],          // complete a figure symmetric about a line
};
