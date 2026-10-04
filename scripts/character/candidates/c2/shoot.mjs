// c2 quick look: a few stills for iteration (not evidence). node scripts/character/candidates/c2/shoot.mjs <outDir> [tier]
import fs from "node:fs";
import path from "node:path";
import { openHarness } from "./harness.mjs";
const [out = "/tmp/c2shots", tier = "H"] = process.argv.slice(2);
fs.mkdirSync(out, { recursive: true });
const hx = await openHarness({ w: 600, h: 750 });
try {
  const st = await hx.page.evaluate((t) => TX.load("c2", t), tier);
  console.log(JSON.stringify(st));
  const shots = [
    ["bust", (y) => { TX.frame("bust", 0); TX.pose(TX.state("idle")); return TX.render(); }],
    ["face", () => { TX.frame("face", 0); TX.pose({}); return TX.render(); }],
    ["face34", () => { TX.frame("face", 35); TX.pose({}); return TX.render(); }],
    ["warm", () => { TX.frame("face", 0); TX.pose(TX.emotion("warm", 1)); return TX.render(); }],
    ["aa", () => { TX.frame("mouth", 0); TX.pose({ bs: { viseme_aa: 1 } }); return TX.render(); }],
    ["side", () => { TX.frame("bust", 90); TX.pose({}); return TX.render(); }],
    ["back", () => { TX.frame("bust", 180); TX.pose({}); return TX.render(); }],
  ];
  for (const [n, f] of shots) { await hx.page.evaluate(f); await hx.shot(path.join(out, `${tier}_${n}.png`)); }
  console.log(JSON.stringify(await hx.page.evaluate(() => TX.debug().box)));
} finally { if (hx.errors.length) console.log(hx.errors.slice(0, 8).join("\n")); await hx.close(); }
