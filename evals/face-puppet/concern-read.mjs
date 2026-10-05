// Review v4 (2026-10-05): what does the puppet's CONCERN face read as, at the intensities the PRODUCT plays it?
// The blind judge grid (clip.mjs grid) emotes every preset at intensity 1.0; in a lesson the policy plays concern at
//   0.6 * 0.85 * band (intensity-1 affect: b2 0.46, b3 0.36), 1.0 * 0.85 * band (intensity 2: b2 0.77), and the duplex
//   calm_steady (SAFETY) pose at 0.35 on take 2. All 4 in-app judge runs read the grid's concern A as sad (sol) or angry /
//   irritated (grok); JUDGE-r9 found the same on r9 ("sad / disappointed", 4 of 4 cells).
// Step 1 (render, free):  node evals/face-puppet/concern-read.mjs render <tag>   → out/concern/<tag>-<cell>.jpg
// Step 2 (judge, Azure):  node evals/face-puppet/concern-read.mjs judge <tag>    → out/concern/<tag>-judge.json
// The judge question is blind (no intended label is given) and forced-choice; rest and warm are controls.
import { chromium } from "playwright";
import { spawn } from "node:child_process";
import fs from "node:fs";

const [cmd = "render", tag = "before"] = process.argv.slice(2);
const OUT = "evals/face-puppet/out/concern/";
fs.mkdirSync(OUT, { recursive: true });
// [cell, preset, variant, intensity]
const CELLS = [
  ["rest", null, 0, 0],
  ["warm-b2", "warm", 0, 0.54],
  ["concernA-grid", "concern", 0, 1.0],
  ["concernA-b2i1", "concern", 0, 0.46],
  ["concernA-b2i2", "concern", 0, 0.77],
  ["concernB-b2i1", "concern", 1, 0.46],
  ["concernC-b2i1", "concern", 2, 0.46],
  ["calm-steady", "concern", 2, 0.35],
  // TRIED AND REVERTED (tag tried-caring-floor): concern takes softened (brow lowerer <= 0.15, squint <= 0.08, press <= 0.12,
  // symmetric corners <= 0.22, eyes a touch wide) AND played at >= 0.75. Result: 0.75 still read "warm" 12/12, full A
  // still "disappointed" (grok 2/2). No measured gain over the judged face, so the judged presets stay.
  ["concernA-min", "concern", 0, 0.75],
  ["concernB-min", "concern", 1, 0.75],
  ["concernC-min", "concern", 2, 0.75],
];

if (cmd === "render") {
  const PORT = 4733;
  const srv = spawn(process.execPath, ["evals/face-puppet/serve.mjs", String(PORT)], { stdio: "ignore" });
  await new Promise((r) => setTimeout(r, 500));
  const browser = await chromium.launch({ args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
  try {
    const page = await browser.newPage({ viewport: { width: 560, height: 560 } });
    await page.goto(`http://127.0.0.1:${PORT}/h/index.html?mode=capture&px=512`);
    await page.waitForFunction("window.H && (window.H.ready || window.H.error)", null, { timeout: 120000 });
    const err = await page.evaluate("window.H.error");
    if (err) throw new Error(err);
    let t = 1400;
    await page.evaluate(`window.H.status("your_turn")`);
    for (const [cell, preset, variant, I] of CELLS) {
      if (preset) await page.evaluate(`window.H.stage.driver.evalEmote(${JSON.stringify(preset)}, ${t}, ${variant}, 30, ${I})`);
      t += 1200;
      const d = await page.evaluate(`window.H.shot(${t}, "image/jpeg")`);
      fs.writeFileSync(`${OUT}${tag}-${cell}.jpg`, Buffer.from(d.split(",")[1], "base64"));
      if (preset) await page.evaluate(`window.H.release()`);
      t += 1500;
      await page.evaluate(`window.H.at(${t})`);
    }
    console.log("rendered", CELLS.length, "cells →", OUT);
  } finally {
    await browser.close();
    srv.kill();
  }
} else if (cmd === "judge") {
  for (const line of fs.readFileSync(".env.local", "utf8").split("\n")) { const m = line.match(/^([A-Z0-9_]+)=(.*)$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, ""); }
  const E = process.env.AZURE_OPENAI_ENDPOINT.replace(/\/+$/, ""), K = process.env.AZURE_OPENAI_API_KEY;
  const P = `This is one frame of an animated cartoon teacher in a learning app for 9-13 year olds. What emotion does her FACE read as, to a child looking at it? Pick exactly ONE label from: "neutral", "warm", "caring-concern" (soft, engaged: "oh, are you okay?"), "sad", "disappointed", "angry-stern" (irritated, displeased, cross), "sceptical", "worried-anxious", "surprised", "other". Then rate how unkind or stern it would feel to a child, 0 (not at all) to 3 (clearly cross). Reply JSON only: {"label":"...","second":"...","stern":n,"why":"<= 20 words"}`;
  const models = (process.env.MODELS || "taxila-brain,grok-4-20-reasoning").split(",");
  const runs = +(process.env.RUNS || 1);
  const res = { date: new Date().toISOString().slice(0, 10), tag, method: "blind forced-choice emotion read of single production-stage frames (512 px, SwiftShader), concern at product intensities", prompt: P, cells: {} };
  for (const [cell] of CELLS) {
    const img = fs.readFileSync(`${OUT}${tag}-${cell}.jpg`).toString("base64");
    res.cells[cell] = [];
    for (const model of models) for (let r = 0; r < runs; r++) {
      const body = { model, max_completion_tokens: 4000, reasoning_effort: "low", response_format: { type: "json_object" }, messages: [{ role: "user", content: [{ type: "text", text: P }, { type: "image_url", image_url: { url: `data:image/jpeg;base64,${img}`, detail: "high" } }] }] };
      let out;
      try {
        const rr = await fetch(E + "/chat/completions", { method: "POST", headers: { "api-key": K, "content-type": "application/json" }, body: JSON.stringify(body) });
        const j = await rr.json();
        out = JSON.parse(j.choices?.[0]?.message?.content || "{}");
        if (!out.label) out = { error: JSON.stringify(j).slice(0, 300) };
      } catch (e) { out = { error: String(e).slice(0, 200) }; }
      res.cells[cell].push({ model, ...out });
      console.log(cell, model, out.label ?? out.error, out.stern ?? "");
    }
  }
  fs.writeFileSync(`${OUT}${tag}-judge.json`, JSON.stringify(res, null, 1));
}
