// K1 latency, client side (deterministic): does the Kaksha skin delay the turn on the CHILD'S DEVICE? The live-model run
// (r4-kaksha-latency.mjs) cannot resolve that: its end→POST spread is the conversation's own turn-taking (content-driven,
// bimodal). Here the REAL lesson runtime (LessonRuntime, outbox, floor, signals) runs on the Desk dev page's scripted
// Director and clock link, so every arm sees the same lesson, and we time on the page clock:
//   sendToTurn   the child's answer is sent (a.send, as the dock's Send does) → the turn call leaves the client
//   replyToPaint the turn's answer lands → the next frame after it is painted (the Desk re-renders under the skin)
// Arms: skin kaksha / none × face live (the puppet) / plate, Older (class 6), 360x800 DPR 2, CPU ×4 throttled
// (a G35-class PROXY, not a phone). Interleaved, n ≥ 30 turns per arm.
//   node tests/prod/r4-kaksha-latency-client.mjs [turnsPerArm=30]  → docs/design/round4/build/kaksha/latency-k1-client.json
import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";
import { startVite } from "./r4-kaksha-inpage.mjs";

const ROOT = new URL("../..", import.meta.url).pathname;
const N = Number(process.argv[2] || 30);
const PORT = 5196;
const ARMS = [
  { id: "kaksha-puppet", skin: "kaksha", face: "live" }, { id: "classic-puppet", skin: "none", face: "live" },
  { id: "kaksha-still", skin: "kaksha", face: "plate" }, { id: "classic-still", skin: "none", face: "plate" },
];
const rows = Object.fromEntries(ARMS.map((a) => [a.id, []]));
const stopVite = await startVite(ROOT, PORT);
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM ?? "/opt/pw-browsers/chromium", args: ["--autoplay-policy=no-user-gesture-required"] });
const ANSWERS = ["one half", "two", "two", "3/3", "1/2"];
try {
  for (let round = 0; ARMS.some((a) => rows[a.id].length < N) && round < 20; round++) {
    for (const arm of ARMS.map((_, i) => ARMS[(i + round) % ARMS.length])) {
      if (rows[arm.id].length >= N) continue;
      const ctx = await browser.newContext({ viewport: { width: 360, height: 800 }, deviceScaleFactor: 2 });
      const p = await ctx.newPage();
      const cdp = await ctx.newCDPSession(p);
      await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
      await p.goto(`http://localhost:${PORT}/src/ui-v3/kaksha/dev/desk.html?class=6&live=1&skin=${arm.skin}&face=${arm.face}`);
      await p.waitForSelector('[data-testid="lesson"]');
      // the opening plays (clock speech), then each turn: wait for YOUR TURN, send, wait for the answer to be painted
      for (let t = 0; t < ANSWERS.length && rows[arm.id].length < N; t++) {
        const ok = await p.waitForFunction(() => window.__k1?.floor === "your_turn", null, { timeout: 30_000 }).then(() => true, () => false);
        if (!ok) break;
        await p.waitForTimeout(300);
        const r = await p.evaluate(async (text) => {
          const k = window.__k1; const n = k.turnAt.length; const t0 = performance.now();
          k.send(text);
          const wait = (f) => new Promise((res) => { const g = () => (f() ? res() : setTimeout(g, 5)); g(); });
          await wait(() => k.turnAt.length > n);
          await wait(() => k.paintAt.length > n);
          return { sendToTurn: k.turnAt[n] - t0, replyToPaint: k.paintAt[n] - k.replyAt[n] };
        }, ANSWERS[t]);
        rows[arm.id].push({ round, t, sendToTurn: Math.round(r.sendToTurn * 10) / 10, replyToPaint: Math.round(r.replyToPaint * 10) / 10 });
      }
      const skinned = await p.evaluate(() => document.querySelector('[data-testid="lesson"]')?.getAttribute("data-skin") ?? null);
      if ((skinned === "kaksha") !== (arm.skin === "kaksha")) throw new Error(`arm ${arm.id}: skin=${skinned}`);
      await ctx.close();
      console.log(`round ${round} ${arm.id}: ${rows[arm.id].length}/${N}`);
    }
  }
} finally { await browser.close(); stopVite(); }
const q = (xs, pc) => { const s = [...xs].sort((a, b) => a - b); return s.length ? s[Math.min(s.length - 1, Math.floor(pc * (s.length - 1) + 0.5))] : null; };
const summary = Object.fromEntries(ARMS.map((a) => {
  const r = rows[a.id];
  return [a.id, { n: r.length, sendToTurn: { p50: q(r.map((x) => x.sendToTurn), 0.5), p90: q(r.map((x) => x.sendToTurn), 0.9) }, replyToPaint: { p50: q(r.map((x) => x.replyToPaint), 0.5), p90: q(r.map((x) => x.replyToPaint), 0.9) } }];
}));
fs.writeFileSync(path.join(ROOT, "docs/design/round4/build/kaksha/latency-k1-client.json"), JSON.stringify({ date: new Date().toISOString().slice(0, 10), method: "real LessonRuntime on the Desk dev page's scripted Director + clock link; Playwright Chromium (SwiftShader) 360x800 DPR 2, CPU x4 throttle: a G35-class PROXY, not a phone; arms interleaved by round", summary, rows }, null, 1));
console.log(JSON.stringify(summary, null, 1));
