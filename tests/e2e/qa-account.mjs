// QA: Data and privacy on a throwaway account (QA_ACC, default p6): download everything (password again), then delete the
// account (password, 2 s hold), then what the child URL and the corner show afterwards.
import fs from "fs";
import { launch, open, PHONE, shot, OUT, BASE, sleep, btn, dump } from "./qa-lib.mjs";
const A = process.env.QA_ACC || "p6";
const acc = JSON.parse(fs.readFileSync(`${OUT}/accounts.json`, "utf8"))[A];
const browser = await launch();
const { ctx, page, log } = await open(browser, PHONE);
await ctx.addCookies(JSON.parse(fs.readFileSync(`${OUT}/state-${A}.json`, "utf8")).cookies);
const text = async () => (await page.locator("body").innerText().catch(() => "")).replace(/\s+/g, " ").slice(0, 300);
await page.goto(`${BASE}/parent/data`); await sleep(2000);
for (const d of "2580") await btn(page, d).first().click(); await btn(page, "OK").first().click(); await sleep(1500);
await page.evaluate(() => { history.pushState({}, "", "/parent/data"); dispatchEvent(new PopStateEvent("popstate")); }); await sleep(1500);
// download
await page.getByRole("button", { name: "Download everything" }).click();
await page.locator("#pw-download").click(); await page.locator("#pw-download").fill(acc.password);
const dl = page.waitForEvent("download", { timeout: 30000 }).catch((e) => null);
await btn(page, "Download").first().click();
const d = await dl;
if (d) { const f = `${OUT}/export-${A}.json`; await d.saveAs(f); const j = JSON.parse(fs.readFileSync(f, "utf8")); console.log("download:", d.suggestedFilename(), fs.statSync(f).size, "B, keys:", Object.keys(j).join(",").slice(0, 200)); }
else console.log("DOWNLOAD FAILED:", await text());
// delete
await page.getByRole("button", { name: "Delete my account" }).click(); await sleep(500);
await page.locator("#delete-account input[type=password]").click(); await page.locator("#delete-account input[type=password]").fill(acc.password);
await btn(page, "Continue").first().click(); await sleep(1200);
const hold = page.getByRole("button", { name: /Hold to delete my account/ });
const bb = await hold.boundingBox(); await page.mouse.move(bb.x + bb.width / 2, bb.y + bb.height / 2); await page.mouse.down(); await sleep(2400); await page.mouse.up();
await sleep(4000); await shot(page, "account-deleted");
console.log("after delete:", new URL(page.url()).pathname, "::", await text());
await page.goto(`${BASE}/c/${acc.cid}/`); await sleep(2500); console.log("child url after delete:", new URL(page.url()).pathname, "::", await text());
const r = await page.request.post(`${BASE}/api/auth/login`, { data: { email: acc.email, password: acc.password } }).catch(() => null);
console.log("sign in with the deleted account:", r?.status());
console.log(JSON.stringify(dump(log, `account-${A}`)));
await browser.close();
