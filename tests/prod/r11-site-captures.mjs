// Release 11 · stream 2: the landing's product captures, taken from the REAL app screens (Kaksha's dev fixture pages, the
// Desk under the Kaksha skin, Volt night) at a phone viewport, written as phone-sized webp to public/site/. Run when the
// app's look changes; the landing never shows a screen the app does not draw.
//   node tests/prod/r11-site-captures.mjs        (needs ffmpeg for the game still, cwebp-free: Pillow writes the webp)
// The game still is a frame of the games harness's own recording of Antariksh (games-core/media/video), not a mock-up.
import { chromium } from "playwright";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { startVite } from "./r4-kaksha-inpage.mjs";

const ROOT = new URL("../..", import.meta.url).pathname;
const OUT = path.join(ROOT, "public", "site");
const TMP = fs.mkdtempSync(path.join(process.env.TMPDIR ?? "/tmp", "r11-cap-"));
fs.mkdirSync(OUT, { recursive: true });
const PORT = 5199;
const HOST = `http://localhost:${PORT}/src/ui-v3/kaksha/dev`;
const SHOTS = [
  ["home", `index.html?screen=home&state=start&theme=night&look=volt&motion=reduced`],
  ["world", `index.html?screen=world&theme=night&look=volt&motion=reduced`],
  ["desk", `desk.html?class=7&fixture=work-beat&look=volt&motion=reduced`],
  ["turn", `desk.html?class=7&fixture=work-your_turn&look=volt&motion=reduced`],
];
const stop = await startVite(ROOT, PORT);
const browser = await chromium.launch();
try {
  for (const [name, url] of SHOTS) {
    const p = await browser.newPage({ viewport: { width: 412, height: 915 }, deviceScaleFactor: 2, reducedMotion: "reduce" });
    await p.goto(`${HOST}/${url}`, { waitUntil: "networkidle" });
    await p.waitForTimeout(2500);
    const png = path.join(TMP, `${name}.png`);
    await p.screenshot({ path: png });
    await p.close();
    console.log("captured", name);
  }
} finally { await browser.close(); stop(); }
execFileSync("ffmpeg", ["-loglevel", "error", "-y", "-ss", "3", "-i", path.join(ROOT, "docs/design/round4/build/games-core/media/video/antariksh-neela-nebula-412.webm"), "-frames:v", "1", path.join(TMP, "game.png")]);
// phone-sized webp: 412 CSS px at 2x is 824 px wide; the landing shows them at ≤ 300 CSS px, so 600 px wide is enough
execFileSync("python3", ["-c", `
import sys
from PIL import Image
tmp, out = sys.argv[1], sys.argv[2]
for n in ["home", "world", "desk", "turn", "game"]:
    im = Image.open(f"{tmp}/{n}.png").convert("RGB")
    w = 600; h = round(im.height * w / im.width)
    im.resize((w, h), Image.LANCZOS).save(f"{out}/{n}.webp", "WEBP", quality=78, method=6)
    print(n, w, h)
`, TMP, OUT], { stdio: "inherit" });
