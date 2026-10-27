// QA pass: a second child added from the Parent corner, "who is this" with two children, switching child, sign out,
// sign in again, and the landing for a signed-in parent. Uses the "phone" account.
import fs from "fs";
import { launch, open, PHONE, LAPTOP, shot, dump, OUT, BASE, sleep, btn } from "./qa-lib.mjs";
const DEV = process.env.QA_DEV === "laptop" ? LAPTOP : PHONE;
const acc = JSON.parse(fs.readFileSync(`${OUT}/accounts.json`, "utf8"))[DEV.name];
const browser = await launch();
const { ctx, page, log } = await open(browser, DEV);
await ctx.addCookies(JSON.parse(fs.readFileSync(`${OUT}/state-${DEV.name}.json`, "utf8")).cookies);
const tag = `family-${DEV.name}`;
const text = async () => (await page.locator("body").innerText().catch(() => "")).replace(/\s+/g, " ").slice(0, 500);
const step = async (name) => { await sleep(1800); await shot(page, `${tag}-${name}`); console.log(`[${name}] ${new URL(page.url()).pathname}${new URL(page.url()).search} :: ${await text()}`); };
const pin = async () => { if (await btn(page, "OK").count()) { for (const d of "2580") await btn(page, d).first().click(); await btn(page, "OK").first().click(); await sleep(1500); } };
try {
  await page.goto(`${BASE}/parent/children`); await sleep(1500); await pin(); await step("01-children");
  const kids = await page.locator(".pa-child, [data-testid=child-row]").count();
  if (!(await page.getByText("Aarav", { exact: false }).count())) {
    await page.getByRole("button", { name: /Add a child/i }).or(page.getByRole("link", { name: /Add a child/i })).first().click(); await step("02-add");
    for (let g = 0; g < 12 && !/\/c\/|\/parent/.test(new URL(page.url()).pathname); g++) {
      const p = new URL(page.url()).pathname;
      if (p === "/start/class") { await btn(page, "Class 7").first().click(); await btn(page, "CBSE").first().click(); if (await btn(page, "Hindi and English mix").count()) await btn(page, "Hindi and English mix").first().click(); await btn(page, "Continue").first().click(); }
      else if (p === "/start/child") { await page.getByLabel(/first name/i).first().fill("Aarav"); await sleep(400); await step(`03-child-form`); const go = page.getByRole("button", { name: /Give the phone to Aarav|Continue|Save|Add/ }).first(); await go.click(); }
      else if (p === "/start/consent") { for (const n of ["Yes, remember", "Yes", "Only in the app"]) await btn(page, n).first().click().catch(() => {}); await btn(page, "Agree and continue").first().click(); }
      else if (p === "/start/controls") { await btn(page, "Looks good").first().click().catch(() => {}); }
      else await step(`03-unknown-${p.replace(/\W+/g, "_")}`);
      await sleep(1800);
    }
    await step("04-after-add");
  }
  await page.goto(`${BASE}/who`); await step("05-who");
  await page.locator(".profile-tile").filter({ hasText: "Aarav" }).first().click().catch((e) => console.log("no Aarav tile", String(e).slice(0, 80)));
  await sleep(600); await step("06-who-picked");
  await page.getByRole("button", { name: /^(Start|Go|Continue|That's me|Yes)/ }).first().click().catch((e) => console.log("no go", String(e).slice(0, 80)));
  await step("07-aarav-home");
  // sign out from the corner's More
  await page.goto(`${BASE}/parent/more`); await sleep(1500); await pin();
  await page.evaluate(() => { history.pushState({}, "", "/parent/more"); dispatchEvent(new PopStateEvent("popstate")); }); await sleep(1200);
  await page.getByRole("button", { name: "Sign out" }).or(page.getByRole("link", { name: "Sign out" })).first().click(); await step("08-signed-out");
  await page.goto(`${BASE}/who`); await step("09-who-signed-out");
  await page.goto(`${BASE}/c/${acc.cid}/`); await step("10-child-signed-out");
  await page.goto(`${BASE}/start/phone?login=1`); await step("11-signin");
  await page.getByLabel("Email").fill(acc.email); await page.getByLabel("Password", { exact: true }).fill("wrong-password-1"); await btn(page, "Sign in").first().click(); await step("12-wrong-pw");
  await page.getByLabel("Password", { exact: true }).fill(acc.password); await btn(page, "Sign in").first().click(); await step("13-signed-in");
  fs.writeFileSync(`${OUT}/state-${DEV.name}.json`, JSON.stringify(await ctx.storageState()));
} catch (e) { console.log("FAILED", String(e).split("\n")[0]); await shot(page, `${tag}-FAIL`); }
console.log(JSON.stringify(dump(log, tag)));
await browser.close();
