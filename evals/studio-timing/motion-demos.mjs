// round 7 (C1 motion ops, M1): three hand-built boards that show the new motion ops on the real Player — a protractor arm
// turning to 60° (rotate), an area filling row by row (sweep), a water droplet travelling the water cycle (follow) — each
// with the line she would say. Used by tests/r7-motion-ops.test.mjs (gated) and for the recordings
// (node evals/studio-timing/motion-demos.mjs <outdir> writes <name>.json for record-split.mjs).
import { normalizeScript } from "../../shared/whiteboard.js";
import fs from "node:fs";

const env = (id, ops, durationMs) => ({ v: 1, scriptId: id, line: { lessonId: "demo" }, anchor: "line_audio_start", board: { w: 400, h: 300, ground: "chalk" }, mode: "fresh", durationMs, ops });
const op = (id, kind, t0, t1, rest) => ({ id, op: kind, startMs: t0, endMs: t1, ...rest });

export function angleDemo() {
  const O = [130, 220];
  const arcPts = Array.from({ length: 13 }, (_, i) => { const a = (-i * 5 * Math.PI) / 180; return [O[0] + 60 * Math.cos(a), O[1] + 60 * Math.sin(a)]; });
  return {
    line: "Ek arm ko 60° ghumao: yeh angle 60° ka hai.",
    script: env("demo-angle", [
      op("base", "line", 0, 600, { from: O, to: [330, 220], weight: 3 }),
      op("arm", "line", 700, 1200, { from: O, to: [330, 220], weight: 3, ink: "accent" }),
      op("turn", "rotate", 1500, 3300, { target: "arm", deg: -60, about: O }),
      op("arc", "stroke", 3400, 4000, { points: arcPts, ink: "mark" }),
      op("deg", "text", 4100, 4600, { at: [222, 192], text: "60°", size: "m", ink: "mark" }),
    ], 5000),
  };
}

export function areaDemo() {
  const x0 = 100, y0 = 70, u = 40, cols = 5, rows = 3;
  const ops = [op("frame", "rect", 0, 700, { at: [x0, y0], w: cols * u, h: rows * u, weight: 2 })];
  for (let c = 1; c < cols; c++) ops.push(op(`v${c}`, "line", 600 + c * 180, 780 + c * 180, { from: [x0 + c * u, y0], to: [x0 + c * u, y0 + rows * u], weight: 1, ink: "soft" }));
  for (let r = 1; r < rows; r++) ops.push(op(`h${r}`, "line", 1350 + r * 180, 1530 + r * 180, { from: [x0, y0 + r * u], to: [x0 + cols * u, y0 + r * u], weight: 1, ink: "soft" }));
  for (let r = 0; r < rows; r++) {
    const t = 1800 + r * 1000;
    ops.push(op(`row${r}`, "rect", t, t + 200, { at: [x0, y0 + r * u], w: cols * u, h: u, weight: 1, ink: "accent", fill: "accent" }));
    ops.push(op(`fill${r}`, "sweep", t + 100, t + 900, { target: `row${r}`, dir: "right" }));
  }
  ops.push(op("sum", "text", 4900, 5500, { at: [200, 250], text: "5 × 3 = 15", size: "m", ink: "mark" }));
  return { line: "Har row mein 5 squares, aur 3 rows: 5 × 3 = 15 squares.", script: env("demo-area", ops, 6000) };
}

export function cycleDemo() {
  return {
    line: "Sea ka paani evaporation se upar cloud banta hai, phir rain banke wapas sea mein aata hai.",
    script: env("demo-cycle", [
      op("sea", "ellipse", 0, 600, { c: [200, 255], rx: 150, ry: 22, ink: "accent", fill: "accent" }),
      op("seaT", "text", 600, 900, { at: [200, 262], text: "sea", size: "s" }),
      op("cloud", "ellipse", 900, 1500, { c: [200, 62], rx: 70, ry: 26, ink: "chalk", fill: "chalk" }),
      op("cloudT", "text", 1500, 1800, { at: [200, 108], text: "cloud", size: "s" }),
      op("up", "arrow", 1900, 2400, { from: [118, 228], to: [150, 86], ink: "soft" }),
      op("upT", "text", 2400, 2700, { at: [124, 150], text: "evaporation", size: "s", ink: "soft", align: "end" }),
      op("down", "arrow", 2800, 3300, { from: [265, 85], to: [310, 225], ink: "soft" }),
      op("downT", "text", 3300, 3600, { at: [340, 150], text: "rain", size: "s", ink: "soft" }),
      op("drop", "circle", 3700, 3900, { c: [120, 230], r: 6, ink: "accent", fill: "accent" }),
      op("trip", "follow", 4000, 7600, { target: "drop", path: [[30, -140], [90, -168], [145, -150], [190, -8]] }),
    ], 8000),
  };
}

if (process.argv[1] && process.argv[1].endsWith("motion-demos.mjs") && process.argv[2]) {
  for (const [name, d] of [["motion-angle", angleDemo()], ["motion-area", areaDemo()], ["motion-cycle", cycleDemo()]]) {
    const n = normalizeScript(d.script, { strict: true });
    if (!n.ok) { console.error(name, n.errors); process.exitCode = 1; continue; }
    fs.writeFileSync(`${process.argv[2]}/${name}.json`, JSON.stringify({ script: n.script, predicted: d.line, title: name, topicId: name }));
    console.log("wrote", name);
  }
}
