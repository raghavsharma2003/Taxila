// Iteration shots (not evidence): a few named poses of the merged look at H, one PNG each plus a labelled strip.
//   node scripts/character/bakeoff/merged/quick.mjs --out dir [--tier H] [--shots warm,delighted,yaw24,yaw90,mouth:delighted]
// shot syntax: <emotion> | yaw<deg> (neutral, face camera) | mouth:<emotion> | bust:<emotion> | state:<name> | json file
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { openHarness } from "./harness.mjs";
const argv = process.argv.slice(2);
const opt = (f, d) => (argv.includes(f) ? argv[argv.indexOf(f) + 1] : d);
const out = opt("--out", "/tmp/claude-0/char/bakeoff-merged/quick");
const tier = opt("--tier", "H"), look = opt("--look", "teal");
const shots = opt("--shots", "warm,encouraging,curious,thinking,listening,concerned,delighted,playful,surprised").split(",");
const extra = opt("--poses") ? JSON.parse(fs.readFileSync(opt("--poses"))) : {};
fs.mkdirSync(out, { recursive: true });
const hx = await openHarness({ w: 600, h: 750 });
const files = [];
try {
  await hx.page.evaluate(([l, t]) => TX.load(l, t), [look, tier]);
  for (const s of shots) {
    const f = path.join(out, `${s.replace(/[:/]/g, "_")}.png`);
    await hx.page.evaluate(([s, ex]) => {
      let cam = "face", yaw = 0, pose = { bs: {} };
      if (ex[s]) { pose = ex[s]; cam = ex[s].cam || "face"; yaw = ex[s].yaw || 0; }
      else if (/^yaw-?\d+/.test(s)) { yaw = +s.slice(3); }
      else if (/^byaw-?\d+/.test(s)) { yaw = +s.slice(4); cam = "bust"; }
      else if (/^pyaw-?\d+/.test(s)) { yaw = +s.slice(4); cam = "profile"; }
      else if (s === "nohair") { pose = { bs: {}, hide: ["hair", "cards"] }; }
      else if (s.includes(":")) { const [c, n] = s.split(":"); cam = c === "state" ? "bust" : c; pose = c === "state" ? TX.state(n) : (n === "rest" ? { bs: {} } : TX.emotion(n, 1)); }
      else if (s === "rest") { pose = { bs: {} }; }
      else pose = TX.emotion(s, 1);
      const hide = (pose.hide || []);
      for (const [n, m] of Object.entries(TX.rig.meshes)) m.visible = !hide.includes(n);
      TX.frame(cam, yaw); TX.pose(pose); TX.render();
    }, [s, extra]);
    await hx.shot(f);
    files.push(f);
  }
} finally { if (hx.errors.length) console.log(hx.errors.slice(0, 5).join("\n")); await hx.close(); }
execFileSync("python3", ["-c", `
import sys
from PIL import Image, ImageDraw
fs = sys.argv[2:]; ims = [Image.open(f).convert("RGB").resize((300, 375)) for f in fs]
n = len(ims); cols = min(n, 6); rows = (n + cols - 1) // cols
W = Image.new("RGB", (300 * cols, 395 * rows), (20, 20, 24)); d = ImageDraw.Draw(W)
for i, (im, f) in enumerate(zip(ims, fs)):
    x, y = 300 * (i % cols), 395 * (i // cols); W.paste(im, (x, y)); d.text((x + 4, y + 378), f.split("/")[-1][:-4], fill=(230, 220, 160))
W.save(sys.argv[1])`, path.join(out, "_strip.jpg"), ...files]);
console.log(path.join(out, "_strip.jpg"));
