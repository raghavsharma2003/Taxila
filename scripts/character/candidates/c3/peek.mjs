// c3 quick look: front / 3/4 face + bust at H (development aid, not an evidence render).
//   node scripts/character/candidates/c3/peek.mjs <outDir> [tier]
import path from "node:path";
import fs from "node:fs";
import { openHarness } from "./harness.mjs";
const [out = "/tmp/claude-0/char/c3/peek", tier = "H"] = process.argv.slice(2);
fs.mkdirSync(out, { recursive: true });
const hx = await openHarness({ w: 600, h: 750 });
try {
  console.log(JSON.stringify(await hx.page.evaluate((t) => TX.load("c3", t), tier)));
  const shots = [["bust", "bust", 0, "idle"], ["face", "face", 0, null], ["q3", "face", 35, null], ["warm", "face", 0, "warm"], ["mouth_aa", "mouth", 0, "aa"], ["profile", "bust", 90, null]];
  for (const [n, fr, yaw, st] of shots) {
    await hx.page.evaluate(([fr, yaw, st]) => { TX.frame(fr, yaw); TX.pose(st === "idle" ? TX.state("idle") : st === "aa" ? { bs: { viseme_aa: 1 } } : st ? TX.emotion(st, 1) : {}); TX.render(); }, [fr, yaw, st]);
    await hx.shot(path.join(out, `${n}.png`));
  }
} finally { if (hx.errors.length) console.log(hx.errors.slice(0, 8).join("\n")); await hx.close(); }
