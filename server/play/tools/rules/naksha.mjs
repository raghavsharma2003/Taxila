// Play coverage rules for the naksha family (round 7: maps and grids). Authored: dragging the rescue drone to the crossing
// of a ship's latitude and longitude IS locating a place from its coordinates; programming the rider's steps to the house
// at a grid reference IS naming a position and moving right / left / up / down (ponds make the order of moves matter);
// N / E / S / W buttons on a map whose north arrow may point anywhere IS using the four directions on a map; forward / left
// / right for a rider who faces down the page IS left and right for someone facing another way; filling exactly the fuel
// that stops the truck at the town IS finding the real distance (map cm × the scale); putting the pump where D km of fuel
// runs out IS finding the map length from a real distance; fencing a garden like the plan IS copying a shape on a dot grid.
// Mal-rules map only to the topic's own kit misconception where the belief is the same one:
//   swap-latlong → "latitude measures east-west" (c6 m1); map-is-real (fuel = the map's cm) → "ignores the scale bar"
//   (c6 m3) and "reports the map length as the real distance" (c5); add-scale → "adds the scale instead of multiplying";
//   straight-line → "the straight line is the distance you walk"; order-swap → "swaps across and up moves"; counts-start →
//   "counts the starting square as the first step"; own-left-right → "uses their own left / right for a person facing
//   another way" (c4) and "left and right stay the same whatever way you face" (c5: both mirror the turns made facing
//   down the page); east-west-swap → "mixes up east and west"; north-is-up → "north is always up"; count-dots → "counts
//   dots instead of the gaps". flip-ns and flip-ew (wrong hemisphere) are implemented but no kit here names them, so they
//   map nowhere. The builder checks every id against the kits.
// Not covered (no honest law here): c4-maths-ch01-t03 s2 / s3 (turned shapes, tile patterns), c5-maths-ch14-t01 s3 (real
// north from the sun), c6-sst-ch01-t01 s4 (time zones).
import { R } from "./rule.mjs";

export const family = "naksha";
const N = "naksha";
export const RULES = [
  R("c4-maths-ch01-t03", N, "shape", "copy", { "count-dots": "count-dots" }, { shapes: ["rect", "L"] }),
  R("c4-maths-ch02-t02", N, "route", "steps", { "order-swap": "order-swap", "counts-start": "counts-start" }, { cols: [5, 6], rows: [5, 5] }),
  R("c4-maths-ch02-t02", N, "route", "turns", { "own-left-right": "left-right-facing" }, { cols: [4, 5], rows: [5, 6] }),
  R("c5-maths-ch14-t01", N, "route", "compass", { "east-west-swap": "east-west-swap", "north-is-up": "north-is-up" }, { cols: [5, 7], rows: [5, 6] }),
  R("c5-maths-ch14-t01", N, "route", "turns", { "own-left-right": "left-right-fixed" }, { cols: [5, 6], rows: [5, 6] }),
  R("c5-maths-ch14-t02", N, "scale", "fuel", { "map-is-real": "map-is-real", "add-scale": "add-scale", "straight-line": "straight-line-route" }, { ks: [2, 5, 10], unit: "km", cap: 150 }),
  R("c5-maths-ch14-t02", N, "scale", "reach", { "map-is-real": "map-is-real", "add-scale": "add-scale" }, { ks: [2, 3, 4, 5], unit: "m", cap: 60 }),
  R("c6-sst-ch01-t01", N, "locate", "fix", { "swap-latlong": "m1" }, { step: 10 }),
  R("c6-sst-ch01-t01", N, "scale", "fuel", { "map-is-real": "m3" }, { ks: [4, 5, 10, 20], unit: "km", cap: 200 }),
];

export const ACTS = {
  "c4-maths-ch01-t03|copy": ["s1"],         // copy a shape on a dot grid by counting units along each side
  "c4-maths-ch02-t02|steps": ["s1", "s2"],  // name a position, move steps right / left / up / down; give path directions
  "c4-maths-ch02-t02|turns": ["s3"],        // left and right for someone facing a different direction
  "c5-maths-ch14-t01|compass": ["s1"],      // north, south, east and west on a map
  "c5-maths-ch14-t01|turns": ["s2"],        // route directions with turns
  "c5-maths-ch14-t02|fuel": ["s2", "s1"],   // real distance from the map length by multiplying; read the scale
  "c5-maths-ch14-t02|reach": ["s3"],        // the map length from a real distance
  "c6-sst-ch01-t01|fix": ["s3", "s2"],      // locate a place from its latitude and longitude; latitudes vs longitudes
  "c6-sst-ch01-t01|fuel": ["s1"],           // read a map using its scale
};
