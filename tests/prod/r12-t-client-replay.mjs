// Release 12 · T-client, the replay proof (brief rule 4): on a scripted lesson (the REAL LessonRuntime on the Desk dev
// page's scripted Director, recorder installed as in the app, tier 2), Playwright screenshots the page at known moments;
// the rrweb recording of that same run is then rendered by scripts/trace-replay.mjs at those exact times, and the two
// images are compared pixel by pixel. Writes docs/design/round4/build/r12/t-client/replay-*.png, the side-by-sides and
// replay-proof.json. Whole-image difference alone is NOT the gate: the first run (before the replay used reduced
// motion) lost the caption and the answer chip at only 0.6 % of pixels. The gate is local: the image is cut into 32 px
// tiles and a tile is "different" when more than 10 % of its pixels differ; a missing word or chip makes several.
// Exit 1 if any pair has more than 4 different tiles (a moved focus ring, which the replayer does not reproduce, is 1-4).
//   PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers node tests/prod/r12-t-client-replay.mjs
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { chromium } from "playwright";
import { startVite } from "./r4-kaksha-inpage.mjs";
import { renderReplay } from "../../scripts/trace-replay.mjs";

const ROOT = new URL("../..", import.meta.url).pathname, PORT = 5204, ORIGIN = `http://localhost:${PORT}`;
const OUT = path.join(ROOT, "docs/design/round4/build/r12/t-client");
fs.mkdirSync(OUT, { recursive: true });
const stop = await startVite(ROOT, PORT);
const browser = await chromium.launch();
const moments = [], moments2 = [];
let events = [], events2 = [], boardEvents = [];
try {
  const p = await browser.newPage({ viewport: { width: 412, height: 915 }, deviceScaleFactor: 1, reducedMotion: "reduce" });
  await p.goto(`${ORIGIN}/src/trace/dev/lesson.html?class=7&live=1&look=volt&motion=reduced&tier=2`);
  await p.waitForSelector('[data-testid="rec-chip"]', { timeout: 60000 });
  const shot = async (label) => {
    await p.waitForTimeout(1200); // a still moment: nothing animating (reduced motion)
    const t = await p.evaluate(() => Date.now());
    const file = path.join(OUT, `shot-${label}.png`);
    await p.screenshot({ path: file });
    const text = await p.evaluate(() => document.body.innerText.replace(/\s+/g, " ").trim());
    moments.push({ label, t, shot: file, text });
  };
  for (let i = 0; i < 2; i++) {
    await p.waitForFunction(() => window.__k1?.floor === "your_turn", null, { timeout: 30000 });
    await shot(`turn${i + 1}-your-turn`);
    await p.evaluate((x) => window.__k1.send(x), i ? "two quarters" : "two");
    await p.waitForFunction(() => window.__k1?.floor !== "your_turn", null, { timeout: 10000 }).catch(() => {});
    await p.waitForTimeout(1800);
    await shot(`turn${i + 1}-after`);
  }
  await p.evaluate(() => window.__traceStop());
  await p.waitForTimeout(800);
  events = await p.evaluate(() => window.__rrweb);
  // scenario 2: a board page drawing in the tray (the Desk fixture "work-beat": the real StudioStage + whiteboard)
  const b = await browser.newPage({ viewport: { width: 412, height: 915 }, deviceScaleFactor: 1, reducedMotion: "reduce" });
  await b.goto(`${ORIGIN}/src/trace/dev/lesson.html?class=7&fixture=work-beat&look=volt&motion=reduced&tier=2`);
  await b.waitForSelector('[data-testid="studio-stage"] svg', { timeout: 60000 });
  await b.waitForTimeout(2500);
  const bt = await b.evaluate(() => Date.now());
  await b.screenshot({ path: path.join(OUT, "shot-board.png") });
  moments2.push({ label: "board", t: bt, shot: path.join(OUT, "shot-board.png") });
  await b.evaluate(() => window.__traceStop());
  await b.waitForTimeout(800);
  events2 = await b.evaluate(() => window.__rrweb);
  boardEvents = await b.evaluate(() => window.__traceEvents.filter((e) => /^ui\.render\.(stage|board)$/.test(e.kind)).map((e) => ({ kind: e.kind, data: e.data })));
} finally { await browser.close(); }
fs.writeFileSync(path.join(OUT, "replay-rrweb-events.json"), JSON.stringify(events));
let rendered = [];
try {
  rendered = await renderReplay({ events: [...events].sort((a, b) => a.timestamp - b.timestamp), at: moments.map((m) => m.t), out: OUT, base: ORIGIN });
  rendered.push(...await renderReplay({ events: [...events2].sort((a, b) => a.timestamp - b.timestamp), at: moments2.map((m) => m.t), out: OUT, base: ORIGIN }));
  moments.push(...moments2);
} finally { stop(); }
fs.writeFileSync(path.join(OUT, "board-trace-events.json"), JSON.stringify(boardEvents, null, 1));
const rows = moments.map((m, i) => {
  const rep = path.join(OUT, `replay-${m.label}.png`);
  fs.renameSync(rendered[i].file, rep);
  const cmp = JSON.parse(execFileSync("python3", ["-c", `
import sys, json
from PIL import Image, ImageChops
a = Image.open(sys.argv[1]).convert("RGB"); b = Image.open(sys.argv[2]).convert("RGB")
if a.size != b.size: b = b.resize(a.size)
d = ImageChops.difference(a, b).convert("L")
px = list(d.getdata()); n = len(px)
W, H = d.size; T = 32; bad = []
for ty in range(0, H, T):
    for tx in range(0, W, T):
        t = d.crop((tx, ty, min(W, tx + T), min(H, ty + T))); tp = list(t.getdata())
        if sum(1 for v in tp if v > 32) / len(tp) > 0.10: bad.append([tx, ty])
s = Image.new("RGB", (a.width * 2 + 12, a.height), (255, 0, 160)); s.paste(a, (0, 0)); s.paste(b, (a.width + 12, 0)); s.save(sys.argv[3])
print(json.dumps({"size": list(a.size), "differingPx": round(sum(1 for v in px if v > 32) / n * 100, 3), "meanDiff": round(sum(px) / n, 3), "differentTiles": len(bad), "tiles": bad[:12]}))
`, m.shot, rep, path.join(OUT, `pair-${m.label}.png`)], { encoding: "utf8" }));
  return { moment: m.label, at: new Date(m.t).toISOString(), screenshot: path.relative(ROOT, m.shot), replay: path.relative(ROOT, rep), ...cmp };
});
const ok = rows.every((r) => r.differentTiles <= 4);
fs.writeFileSync(path.join(OUT, "replay-proof.json"), JSON.stringify({ date: new Date().toISOString(), method: "scripted lesson (real LessonRuntime, scripted Director) on the vite dev server, recorder tier 2, Playwright Chromium 412x915 DPR 1, reduced motion; replay = scripts/trace-replay.mjs (rrweb Replayer) at the screenshot's Date.now(); differingPx = % of pixels whose grey difference > 32/255; differentTiles = 32 px tiles with > 10 % such pixels (the gate: <= 4)", events: events.length, rows, ok }, null, 1));
console.log(JSON.stringify(rows, null, 1));
process.exit(ok ? 0 : 1);
