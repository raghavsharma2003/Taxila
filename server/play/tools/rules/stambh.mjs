// Play coverage rules for the stambh family (round 7: bar graphs and pictographs, built crate by crate / icon by icon).
// Authored: stacking crates against a scale IS drawing a bar graph with that scale (each crate one step, a half crate a
// bar ending between marks), stacking icons against a key IS drawing a pictograph with that key, and building the third
// bar "N more / fewer than X" off the scale IS reading and comparing a bar graph (c6). Mal-rules map only to the topic's
// own kit misconceptions where the belief is the same one: building one crate per unit is the build side of "counts the
// squares / grid lines / units and ignores the scale"; one icon per item is "ignores the key"; a half step rounded down or
// up is "leaves the half picture out / counts it as a whole / draws an extra whole picture". gridline-count (one step too
// tall) is implemented but no kit here names it, so it maps nowhere. The builder checks every id against the kits.
import { R } from "./rule.mjs";

export const family = "stambh";
const S = "stambh";
export const RULES = [
  R("c4-maths-ch14-t01", S, "picto", "draw", { "key-ignored": "count-pictures", "half-ignored": "half-picture", "half-whole": "half-picture" }, { steps: [2, 5], half: true }),
  R("c4-maths-ch14-t02", S, "bars", "draw", { "scale-as-one": "count-squares", "half-ignored": "between-marks", "half-whole": "between-marks" }, { steps: [1, 2, 5], half: true }),
  R("c5-maths-ch15-t01", S, "picto", "draw", { "key-ignored": "ignore-scale", "half-whole": "round-up-pictures" }, { steps: [2, 5, 10], half: true }),
  R("c5-maths-ch15-t02", S, "bars", "draw", { "scale-as-one": "count-gridlines" }, { steps: [2, 5, 10], half: true }),
  R("c6-maths-ch04-t02", S, "picto", "draw", { "key-ignored": "ignore-key", "half-whole": "half-symbol" }, { steps: [5, 10, 50, 100], half: true }),
  R("c6-maths-ch04-t03", S, "bars", "draw", { "scale-as-one": "count-units" }, { steps: [5, 10, 50, 100], half: true }),
  R("c6-maths-ch04-t03", S, "bars", "diff", { "scale-as-one": "count-units" }, { steps: [5, 10, 50, 100], half: true }),
];

export const ACTS = {
  "c4-maths-ch14-t01|draw": ["s3", "s2"],     // make a pictograph with half pictures; one picture stands for many
  "c4-maths-ch14-t02|draw": ["s1", "s3"],     // a bar's value is its height on the scale; scales in 2s / 5s, bars between marks
  "c5-maths-ch15-t01|draw": ["s3", "s2"],     // draw a pictograph with the key; half pictures
  "c5-maths-ch15-t02|draw": ["s2", "s1"],     // draw a bar graph on an equal-step scale from 0; read heights
  "c6-maths-ch04-t02|draw": ["s3", "s2"],     // draw a pictograph with the key; half symbols
  "c6-maths-ch04-t03|draw": ["s2", "s1"],     // draw bars on a chosen scale; read values with it
  "c6-maths-ch04-t03|diff": ["s3", "s1"],     // compare: how many more / fewer, read off the scale
};
