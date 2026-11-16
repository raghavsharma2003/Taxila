import fs from "fs";
import { launch, open, LAPTOP, BASE, sleep, shot } from "/home/user/Taxila/tests/e2e/qa-lib.mjs";
const Q = process.env.QA_OUT; const acc = JSON.parse(fs.readFileSync(Q + "/accounts.json")).aarav;
const b = await launch(); const { ctx, page, log } = await open(b, LAPTOP, { init: () => { try { localStorage.setItem("taxila.child.09230e6b-4638-43ea-bf89-2c89d888e458.prefs", JSON.stringify({ hello: true })); } catch {} } });
await ctx.addCookies(JSON.parse(fs.readFileSync(Q + "/state-aarav.json")).cookies);
await page.goto(BASE + "/c/" + acc.cid + "/ask"); await sleep(2500);
const t = async () => (await page.locator("body").innerText()).replace(/\s+/g, " ").slice(0, 300);
console.log("ask:", await t());
await page.locator("textarea, input[type=text]").first().fill("photosynthesis kya hota hai?");
await page.locator("[data-testid=ask-go]").click();
for (let i = 0; i < 40; i++) { await sleep(1000); const s = await page.evaluate(() => [...document.querySelectorAll("[data-testid=caption],[data-testid=question-card],[data-testid=state-word]")].map((e) => e.innerText.replace(/\s+/g, " ")).join(" | ")); if (i % 4 === 0) console.log(i, new URL(page.url()).pathname.replace(/\/c\/[^/]+/, ""), s.slice(0, 220)); }
await shot(page, "ask-answer");
console.log(JSON.stringify({ pageerror: log.pageerror, http: log.http }));
console.log(log.trace.filter((e) => e.kind === "tts.request").map((e) => e.data.text).join("\n"));
fs.writeFileSync(Q + "/ask-aarav.json", JSON.stringify(log));
await b.close();
