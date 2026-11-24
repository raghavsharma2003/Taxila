// Round 7 face-stills-and-character-record: Asha's stills, rendered headless from the LIVE rig of each look (the same
// face the lesson draws), into public/assets/teacher/asha-stills/1/<look>-<pose>.webp, plus public/assets/teacher/asha-stills/1/index.json
// (id → url, the ledger the art loaders read; each row's `alias` is the look-free id teacherRecord uses, which the loader
// maps to the row of the look this page paints). Poses the rig can hold (expressions, gaze, the listening lean) are rendered; poses
// it cannot (a wave, props: reading, watering, telescope) map to the nearest rig still until painted pose stills land
// (`standIn` in the index; needs-live-check: Azure image generation).
//   node evals/face-puppet/build-harness.mjs && node evals/face-puppet/stills.mjs [--looks r8,lamp2]
import { chromium } from "playwright";
import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const arg = (n, d) => { const i = process.argv.indexOf(n); return i > 0 ? process.argv[i + 1] : d; };
const LOOKS = arg("--looks", "r8,lamp2").split(",");
const OUT = "public/assets/teacher/asha-stills/1"; // not assets/gen (the build drops gen/**, vite.config.ts artMasters); <name>/<rev>/<file> (tests/avatar-rig asset hygiene)
// pose → how the rig is set, the framing, and the size of the square crop (px, @1x)
export const POSES = {
  portrait: { framing: "close", affect: "neutral_warm", at: 1400 },
  smile: { framing: "close", emotion: ["warm", 2], at: 1000 },
  resting: { framing: "medium", affect: "neutral_warm", at: 1400 },
  listening: { framing: "medium", pose: "listen_lean", status: "listening", at: 2600 },
  thinking: { framing: "medium", pose: "thinking", status: "thinking", at: 2600 },
  curious: { framing: "close", emotion: ["curious", 1], at: 1000 },
  proud: { framing: "medium", emotion: ["proud", 1], at: 1000 },
};
// record keys the rig cannot do yet → the rig still that stands in
export const STAND_IN = { wave: "smile", reading: "thinking", watering: "resting", telescope: "curious" };

const srv = spawn(process.execPath, ["evals/face-puppet/serve.mjs", "4723"], { stdio: "ignore" });
await new Promise((r) => setTimeout(r, 600));
const browser = await chromium.launch({ args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
const index = { rev: 1, generatedBy: "evals/face-puppet/stills.mjs", date: new Date().toISOString().slice(0, 10), assets: [] };
try {
  for (const look of LOOKS) {
    const geom = JSON.parse(fs.readFileSync(`public/face-puppet/${look}/geom.json`, "utf8"));
    fs.mkdirSync(OUT, { recursive: true });
    for (const [pose, P] of Object.entries(POSES)) {
      const page = await browser.newPage({ viewport: { width: 1000, height: 1200 } });
      await page.goto(`http://127.0.0.1:4723/h/index.html?mode=capture&px=720&look=${look}`);
      await page.waitForFunction("window.H && (window.H.ready || window.H.error)", null, { timeout: 60000 });
      const err = await page.evaluate("window.H.error"); if (err) throw new Error(`${look} ${pose}: ${err}`);
      await page.evaluate(([fr]) => { const h = document.getElementById("host"); h.style.width = "720px"; h.style.height = "720px"; if (fr === "close") { window.H.stage.attach(h, "close"); } }, [P.framing]);
      await page.evaluate((P) => {
        window.H.at(300);
        if (P.status) window.H.status(P.status);
        if (P.pose) window.H.pose(P.pose, 320);
        if (P.affect) window.H.affect(P.affect);
        // an expression is driven on the driver directly (a Director affect only arms for her next speech onset)
        // (the policy arms an affect for her next speech onset; a still has no onset, so the armed affect is fired at once)
        if (P.emotion) { const d = window.H.stage.driver; d.affect(P.emotion[0], P.emotion[1], 330); d.run(d.policy.fireArmed(0.33), 0.33); }
      }, P);
      // eight frames 140 ms apart; keep the one with her eyes most open (never mid-blink): the brightest sclera in the
      // eye band, read in the page from the canvas
      const shots = [];
      for (let k = 0; k < 8; k++) shots.push(await page.evaluate((ms) => window.H.shot(ms, "image/png"), P.at + k * 140));
      const best = await page.evaluate(async ([shots, band]) => {
        const score = async (u) => {
          const im = new Image(); im.src = u; await im.decode();
          const c = document.createElement("canvas"); c.width = im.width; c.height = im.height;
          const g = c.getContext("2d"); g.drawImage(im, 0, 0);
          const y0 = Math.round(band[0] * im.height), y1 = Math.round(band[1] * im.height);
          const d = g.getImageData(Math.round(im.width * 0.25), y0, Math.round(im.width * 0.5), Math.max(1, y1 - y0)).data;
          const L = []; for (let i = 0; i < d.length; i += 4) L.push(0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2]);
          L.sort((a, b) => a - b); let n = 0; for (const v of L) if (v > 200) n++; return n;
        };
        const s = []; for (const u of shots) s.push(await score(u));
        return s.indexOf(Math.max(...s));
      }, [shots, P.framing === "close" ? [0.28, 0.5] : [0.18, 0.4]]);
      const png = path.join(OUT, `${look}-${pose}.png`);
      fs.writeFileSync(png, Buffer.from(shots[best].split(",")[1], "base64"));
      await page.close();
    }
    // encode square webp (top-anchored crop of the 720² canvas) and record the index rows
    const { execFileSync } = await import("node:child_process");
    for (const pose of Object.keys(POSES)) {
      const png = path.join(OUT, `${look}-${pose}.png`), webp = png.replace(/\.png$/, ".webp");
      execFileSync("python3", ["-c", `from PIL import Image\nim=Image.open(${JSON.stringify(png)}).convert("RGB").resize((480,480),Image.LANCZOS)\nim.save(${JSON.stringify(webp)},quality=84,method=6)`]);
      fs.rmSync(png);
      index.assets.push({ id: `teacher/asha/${look}/${pose}`, url: `/assets/teacher/asha-stills/1/${look}-${pose}.webp`, width: 480, height: 480, look, pose, alias: `teacher/asha/${pose}`, bytes: fs.statSync(webp).size });
    }
    for (const [pose, to] of Object.entries(STAND_IN)) index.assets.push({ id: `teacher/asha/${look}/${pose}`, url: `/assets/teacher/asha-stills/1/${look}-${to}.webp`, width: 480, height: 480, look, pose, alias: `teacher/asha/${pose}`, standIn: to });
    void geom;
  }
} finally {
  await browser.close();
  srv.kill();
}
fs.writeFileSync(`${OUT}/index.json`, JSON.stringify(index, null, 1) + "\n");
console.log(index.assets.filter((a) => a.bytes).map((a) => `${a.id} ${a.bytes} B`).join("\n"));
