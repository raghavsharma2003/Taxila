// Review v4 (2026-10-05): what a Face <-> Work layout switch costs the face. TeacherWindow (medium) and SpeechRow (close)
// are two different <Teacher> mounts, so every switch disposes the live puppet and builds a new PuppetStage (new WebGL
// context, rig load from the HTTP cache, warm); until the new stage reveals, the child sees the still rest poster. The
// stage reveals in her silence, or after 2.5 s if she keeps talking. This measures, in Chromium (SwiftShader, NOT a phone):
// init ms of a re-mount with the pack cached, and ms from mount to reveal while the floor says she is speaking.
//   node evals/face-puppet/remount.mjs
import { chromium } from "playwright";
import { spawn } from "node:child_process";
import fs from "node:fs";
const PORT = 4734;
const srv = spawn(process.execPath, ["evals/face-puppet/serve.mjs", String(PORT)], { stdio: "ignore" });
await new Promise((r) => setTimeout(r, 500));
const browser = await chromium.launch({ args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--autoplay-policy=no-user-gesture-required"] });
try {
  const page = await browser.newPage({ viewport: { width: 800, height: 800 } });
  await page.goto(`http://127.0.0.1:${PORT}/h/index.html?mode=rt&line=00&px=360`);
  await page.waitForFunction("window.H && (window.H.ready || window.H.error)", null, { timeout: 120000 });
  const rows = await page.evaluate(async () => {
    const S = window.H.stage.constructor;
    const lines = await Promise.all(["00", "05", "09", "14", "21"].map((id) => fetch(`/diya/${id}.json`).then((r) => r.json())));
    const out = [];
    for (const [i, status] of [[0, "speaking"], [1, "speaking"], [2, "your_turn"], [3, "speaking"], [4, "your_turn"]]) {
      const host = document.createElement("div");
      host.style.cssText = "position:relative;width:240px;height:240px";
      document.body.appendChild(host);
      const t0 = performance.now();
      let reveal = null;
      const s = new S(host, { band: "b2", sources: [], framing: i % 2 ? "close" : "medium", onEvent: (e) => { if (e.type === "reveal") reveal = performance.now() - t0; } });
      await s.init();
      const init = performance.now() - t0;
      // the floor says she is speaking and her viseme track is sounding (no tap here): a talking mouth
      s.set({ status });
      // mounted 0.6 s into one of Diya's real lines (her own viseme track): the switch lands mid-sentence
      if (status === "speaking") s.driver.visemes.push(0, performance.now() - 600, lines[i].visemes, lines[i].words, performance.now());
      s.start();
      const tEnd = performance.now() + 4000;
      while (reveal === null && performance.now() < tEnd) await new Promise((r) => setTimeout(r, 20));
      out.push({ i, framing: i % 2 ? "close" : "medium", status, initMs: Math.round(init), revealMs: reveal === null ? null : Math.round(reveal) });
      s.dispose();
      host.remove();
    }
    return out;
  });
  const res = { date: new Date().toISOString().slice(0, 10), method: "Chromium headless SwiftShader, 240 px host, pack in HTTP cache; PuppetStage built 5x in one page (as a Face<->Work layout switch does); status speaking = one of Diya's real viseme tracks, mounted 0.6 s into the line", rows };
  fs.writeFileSync("evals/face-puppet/out/remount.json", JSON.stringify(res, null, 1));
  console.table(rows);
} finally {
  await browser.close();
  srv.kill();
}
