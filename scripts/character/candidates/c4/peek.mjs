// c1 quick look while iterating: a few stills from OUR viewer (same harness as render.mjs).
//   node scripts/character/candidates/c4/peek.mjs <outDir> [tier]
import fs from "node:fs";
import path from "node:path";
import { openHarness } from "./harness.mjs";
const [out = "/tmp/claude-0/char/c4/peek", tier = "H"] = process.argv.slice(2);
fs.mkdirSync(out, { recursive: true });
const hx = await openHarness({ w: 600, h: 750 });
try {
  console.log(JSON.stringify(await hx.page.evaluate((t) => TX.load("c4", t), tier)));
  const shots = [
    ["bust", 0, "idle"], ["face", 0, "neutral"], ["face", 35, "neutral"], ["face", 0, "warm"], ["face", 0, "delighted"],
    ["mouth", 0, "aa"], ["bust", 90, "idle"], ["bust", 180, "idle"],
  ];
  for (const [fr, yaw, what] of shots) {
    await hx.page.evaluate(([fr, yaw, what]) => {
      TX.frame(fr, yaw);
      if (what === "idle") TX.pose(TX.state("idle"));
      else if (what === "neutral") TX.pose({ bs: {} });
      else if (what === "aa") TX.pose({ bs: { viseme_aa: 1 } });
      else TX.pose(TX.emotion(what, 1));
      TX.render();
    }, [fr, yaw, what]);
    await hx.shot(path.join(out, `${fr}_${yaw}_${what}.png`));
  }
} finally { if (hx.errors.length) console.log(hx.errors.slice(0, 8).join("\n")); await hx.close(); }
