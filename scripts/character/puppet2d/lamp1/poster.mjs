// The lamp1 rest poster (one 1024 x 1024 frame; src/face-puppet/assets.ts posterStyle() places it with the runtime's
// contain fit): the live rig at rest through harness.mjs (life still, behaviour's idle smile 0.045, no blink), WebP q88.
//   PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers node poster.mjs
import { execFileSync } from "node:child_process";
import fs from "node:fs";
const SCR = "/tmp/claude-0/-home-user/ecee9fc1-62f9-5f67-a47d-69ca79d9981a/scratchpad/r4-asha";
const PACK = "/home/user/Taxila/art/character/puppet2d/lamp1";
fs.writeFileSync(`${SCR}/poses-poster.json`, JSON.stringify([{ name: "rest", w: 1024, h: 1024, view: [0, 0, 1024], still: true, bs: { mouthSmileLeft: 0.045, mouthSmileRight: 0.045 } }]));
execFileSync("node", ["/home/user/Taxila/scripts/character/puppet2d/lamp1/harness.mjs", PACK, `${SCR}/poses-poster.json`, `${SCR}/poster`], { stdio: "inherit" });
execFileSync("ffmpeg", ["-v", "error", "-y", "-i", `${SCR}/poster/rest.png`, "-c:v", "libwebp", "-quality", "88", `${PACK}/rest.webp`]);
console.log("rest.webp", fs.statSync(`${PACK}/rest.webp`).size, "B");
