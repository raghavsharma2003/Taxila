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
  // r8 tally (s1, "organise data using tally marks and a table"): keeping a tally in fives while the things pass, then
  // writing each row's total into the table, IS organising the data with tally marks and a table; reading a row of tallies
  // IS the other half of the same skill. Writing five as five standing lines, or reading a bundle as its four standing
  // lines, is the kit's tally-four ("reads a full tally bundle as 4", "writes five as five standing lines").
  R("c4-maths-ch14-t01", S, "tally", "keep", { "tally-four": "tally-four" }, {}),
  R("c4-maths-ch14-t01", S, "tally", "read", { "tally-four": "tally-four" }, {}),
  R("c4-maths-ch14-t02", S, "bars", "draw", { "scale-as-one": "count-squares", "half-ignored": "between-marks", "half-whole": "between-marks" }, { steps: [1, 2, 5], half: true }),
  R("c5-maths-ch15-t01", S, "picto", "draw", { "key-ignored": "ignore-scale", "half-whole": "round-up-pictures" }, { steps: [2, 5, 10], half: true }),
  R("c5-maths-ch15-t02", S, "bars", "draw", { "scale-as-one": "count-gridlines" }, { steps: [2, 5, 10], half: true }),
  // focusSteps (GAMES-01): at keys / scales of 5 and up no c6 data set fits one icon / crate per unit, so "ignores the key" /
  // "counts the squares" could never show. When the Director's focus is that belief the generator adds levels at these
  // smaller steps, each one the topic's own kit uses: key 2 (c6-maths-ch04-t02-i13, "1 picture = 2 kites", which targets
  // ignore-key) and key 4 (-i10 "1 picture = 4 laddoos", -rl-o2 "1 circle = 4 GB"); scale 4 (c6-maths-ch04-t03-rl-o1,
  // "each square represents 4 km", with a half square).
  R("c6-maths-ch04-t02", S, "picto", "draw", { "key-ignored": "ignore-key", "half-whole": "half-symbol" }, { steps: [5, 10, 50, 100], half: true, focusSteps: [2, 4] }),
  R("c6-maths-ch04-t03", S, "bars", "draw", { "scale-as-one": "count-units" }, { steps: [5, 10, 50, 100], half: true, focusSteps: [4] }),
  R("c6-maths-ch04-t03", S, "bars", "diff", { "scale-as-one": "count-units" }, { steps: [5, 10, 50, 100], half: true, focusSteps: [4] }),
];

export const ACTS = {
  "c4-maths-ch14-t01|draw": ["s3", "s2"],     // make a pictograph with half pictures; one picture stands for many
  "c4-maths-ch14-t01|keep": ["s1"],           // r8 tally: keep a tally in fives, then the table
  "c4-maths-ch14-t01|read": ["s1"],           // r8 tally: read a row of tallies
  "c4-maths-ch14-t02|draw": ["s1", "s3"],    // a bar's value is its height on the scale; scales in 2s / 5s, bars between marks
  "c5-maths-ch15-t01|draw": ["s3", "s2"],     // draw a pictograph with the key; half pictures
  "c5-maths-ch15-t02|draw": ["s2", "s1"],     // draw a bar graph on an equal-step scale from 0; read heights
  "c6-maths-ch04-t02|draw": ["s3", "s2"],     // draw a pictograph with the key; half symbols
  "c6-maths-ch04-t03|draw": ["s2", "s1"],     // draw bars on a chosen scale; read values with it
  "c6-maths-ch04-t03|diff": ["s3", "s1"],     // compare: how many more / fewer, read off the scale
};
