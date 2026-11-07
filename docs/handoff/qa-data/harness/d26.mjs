import fs from "fs";
import { launch, open, PHONE, BASE, sleep } from "/home/user/Taxila/tests/e2e/qa-lib.mjs";
const Q = process.env.QA_OUT; const acc = JSON.parse(fs.readFileSync(Q + "/accounts.json")).p6;
const b = await launch(); const { ctx, page, log } = await open(b, PHONE);
const cookies = JSON.parse(fs.readFileSync(Q + "/state-p6.json")).cookies;
await ctx.addCookies([...cookies.filter((c) => c.name !== "tx_in"), { ...cookies.find((c) => c.name === "tx_session"), name: "tx_in", value: "1", httpOnly: false }]);
await page.goto(BASE + "/c/" + acc.cid + "/"); await sleep(3000);
console.log((await page.locator("body").innerText()).replace(/\s+/g, " ").slice(0, 80), "| pageerror:", JSON.stringify(log.pageerror));
await b.close();
