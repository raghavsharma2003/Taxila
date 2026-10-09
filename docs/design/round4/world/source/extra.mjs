// Extra proof: the Harder door (360) solved by a child's path, and the laptop "Phone" preview switch.
import { browser, page, measure, URL0 } from "./shoot.mjs";
import { mkdirSync } from "node:fs";
const OUT = new URL("./shots/flow", import.meta.url).pathname; mkdirSync(OUT, { recursive: true });
const b = await browser();
{
  const vp = { id: "360x800", w: 360, h: 800, dpr: 2 }, p = await page(b, vp);
  await p.goto(URL0 + "#game"); await p.waitForTimeout(3000);
  await p.click('.door[data-n="360"]'); await p.waitForTimeout(900);
  // a natural path: 360 → 6 × 60, 60 → 6 × 10, each 6 → 2 × 3, 10 → 2 × 5
  const pick = (v) => p.evaluate((v) => { const s = TX.Screens.game; const n = s.nodes.find((x) => x.v === v && x.state === "whole"); if (n) s.select(n); return !!n; }, v);
  const cut = async (d) => { await p.click(`#gChisel button[data-d="${d}"]`); await p.waitForTimeout(800); };
  await pick(360); await cut(6);
  await pick(60); await cut(6);
  await pick(6); await cut(2);
  await pick(6); await cut(3);
  await pick(10); await cut(2);
  await p.waitForTimeout(500);
  await p.screenshot({ path: `${OUT}/game-h-harder360-built-360x800.png` }); console.log("harder built", JSON.stringify(await p.evaluate(measure)));
  await p.click("#gDone"); await p.waitForTimeout(3600);
  await p.screenshot({ path: `${OUT}/game-i-harder360-solved-360x800.png` });
  console.log("solved title:", await p.evaluate(() => document.querySelector("#gFinH").textContent));
  await p.context().close();
}
{
  const vp = { id: "1366x768", w: 1366, h: 768, dpr: 1 }, p = await page(b, vp);
  await p.goto(URL0 + "#home&phone"); await p.waitForTimeout(4000);
  await p.screenshot({ path: `${OUT}/laptop-phone-preview-home-1366x768.png` }); console.log("phone preview", JSON.stringify(await p.evaluate(measure)));
  await p.click('.db-tab[data-s="lesson"]'); await p.waitForTimeout(9000);
  await p.screenshot({ path: `${OUT}/laptop-phone-preview-lesson-1366x768.png` });
  await p.context().close();
}
await b.close();
