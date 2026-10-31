import fs from "fs";
import { launch, open, PHONE, shot, OUT, BASE, sleep } from "/home/user/Taxila/tests/e2e/qa-lib.mjs";
const browser = await launch();
const { ctx, page, log } = await open(browser, PHONE);
await ctx.addCookies(JSON.parse(fs.readFileSync(`${OUT}/state-phone.json`, "utf8")).cookies);
await page.goto(`${BASE}/parent/controls`); await sleep(3000);
console.log((await page.locator("body").innerText()).slice(0, 400)); await shot(page, "dbg"); console.log(log);
await browser.close();
