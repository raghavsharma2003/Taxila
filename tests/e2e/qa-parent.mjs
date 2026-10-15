// QA pass: the parent corner, every screen: the PIN gate (wrong PIN, right PIN), then each page, shot + text.
import fs from "fs";
import { launch, open, PHONE, LAPTOP, shot, dump, OUT, BASE, sleep, btn } from "./qa-lib.mjs";
const DEV = process.env.QA_DEV === "laptop" ? LAPTOP : PHONE;
const acc = JSON.parse(fs.readFileSync(`${OUT}/accounts.json`, "utf8"))[DEV.name];
const browser = await launch();
const { ctx, page, log } = await open(browser, DEV);
await ctx.addCookies(JSON.parse(fs.readFileSync(`${OUT}/state-${DEV.name}.json`, "utf8")).cookies);
const tag = `parent-${DEV.name}`;
const text = async () => (await page.locator("body").innerText().catch(() => "")).replace(/\s+/g, " ").slice(0, 700);
const step = async (name) => { await sleep(1800); await shot(page, `${tag}-${name}`); console.log(`[${name}] ${new URL(page.url()).pathname} :: ${await text()}`); };
await page.goto(`${BASE}/parent`); await step("00-gate");
for (const d of "1111") await btn(page, d).first().click().catch(() => {});
await btn(page, "OK").first().click().catch(() => {});
await step("01-wrong-pin");
for (const d of "2580") await btn(page, d).first().click().catch(() => {});
await btn(page, "OK").first().click().catch(() => {});
await step("02-in");
const spa = (path) => page.evaluate((p) => { history.pushState({}, "", p); dispatchEvent(new PopStateEvent("popstate")); }, path);
for (const p of (process.env.QA_PAGES || "progress,lessons,notes,controls,children,data,help,pin,more").split(",")) {
  await spa(`/parent/${p}`); await step(`10-${p}`);
}
fs.writeFileSync(`${OUT}/state-${DEV.name}.json`, JSON.stringify(await ctx.storageState()));
console.log(JSON.stringify(dump(log, tag)));
await browser.close();
