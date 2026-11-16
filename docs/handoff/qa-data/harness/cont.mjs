import fs from "fs";
import { launch, open, PHONE, BASE, sleep } from "/home/user/Taxila/tests/e2e/qa-lib.mjs";
const Q = process.env.QA_OUT; const acc = JSON.parse(fs.readFileSync(Q + "/accounts.json")).phone;
const b = await launch(); const { ctx, page } = await open(b, PHONE, { init: () => { try { localStorage.setItem(`taxila.child.${location.pathname.split("/")[2]}.prefs`, JSON.stringify({ hello: true })); } catch {} } });
await ctx.addCookies(JSON.parse(fs.readFileSync(Q + "/state-phone.json")).cookies);
await page.goto(`${BASE}/c/${acc.cid}/lesson/new`);
for (let i = 0; i < 160 && !/Your turn/.test(await page.locator("[data-testid=state-word]").innerText().catch(() => "")); i++) await sleep(250);
await page.locator("[data-testid=mic]").click(); await sleep(4000); await page.locator("[data-testid=mic]").click(); // a (silent) spoken turn
for (let i = 0; i < 120 && !/Your turn/.test(await page.locator("[data-testid=state-word]").innerText().catch(() => "")); i++) await sleep(250);
const lid = new URL(page.url()).pathname.split("/").pop();
await page.goto(`${BASE}/c/${acc.cid}/`); await sleep(3000);
const s = await page.evaluate(() => ({ state: document.querySelector("[data-plan-state]")?.getAttribute("data-plan-state"), href: document.querySelector("[data-testid=start-lesson]")?.getAttribute("href"), text: document.body.innerText.replace(/\s+/g, " ").slice(0, 120) }));
console.log("lesson", lid, JSON.stringify(s));
await page.locator("[data-testid=start-lesson]").click(); await sleep(9000);
console.log("after Start:", new URL(page.url()).pathname.split("/").pop(), (await page.locator("[data-testid=question-card]").innerText().catch(() => "")).replace(/\s+/g, " ").slice(0, 100));
await b.close();
