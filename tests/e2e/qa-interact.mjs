// QA pass 3: interactions not covered by the page walks: a past lesson's Listen, change PIN (and back), "See {child}'s
// week", the child map → Hangar, the corner's Lock. Prints what each did and any errors.
import fs from "fs";
import { launch, open, PHONE, shot, OUT, BASE, sleep, btn, dump } from "./qa-lib.mjs";
const A = process.env.QA_ACC || "phone";
const acc = JSON.parse(fs.readFileSync(`${OUT}/accounts.json`, "utf8"))[A];
const browser = await launch();
const { ctx, page, log } = await open(browser, PHONE, { init: () => { try { localStorage.setItem(`taxila.child.${location.pathname.split("/")[2]}.prefs`, JSON.stringify({ hello: true })); } catch { /* */ } } });
await ctx.addCookies(JSON.parse(fs.readFileSync(`${OUT}/state-${A}.json`, "utf8")).cookies);
const text = async () => (await page.locator("body").innerText().catch(() => "")).replace(/\s+/g, " ").slice(0, 260);
const spa = (p) => page.evaluate((x) => { history.pushState({}, "", x); dispatchEvent(new PopStateEvent("popstate")); }, p);
const step = async (name, fn) => { try { await fn(); await sleep(1500); console.log(`[${name}] ${new URL(page.url()).pathname} :: ${await text()}`); await shot(page, `interact-${name}`); } catch (e) { console.log(`[${name}] FAILED ${String(e).split("\n")[0].slice(0, 160)}`); await shot(page, `interact-${name}-fail`); } };
await page.goto(`${BASE}/parent`); await sleep(2000);
for (const d of "2580") await btn(page, d).first().click(); await btn(page, "OK").first().click(); await sleep(2000);
await step("lessons-listen", async () => { await spa("/parent/lessons"); await sleep(1500); await page.getByRole("button", { name: /Listen/ }).first().click(); await sleep(3000); });
await step("lesson-card", async () => { await page.locator(".pa-row a, a[href*='/parent/lessons/']").first().click(); });
await step("see-week", async () => { await spa("/parent/children"); await sleep(1200); await page.getByRole("link", { name: /See .*week/ }).or(page.getByRole("button", { name: /See .*week/ })).first().click(); });
await step("change-pin-same", async () => { await spa("/parent/pin"); await sleep(1200); for (const d of "2580") await btn(page, d).first().click(); await btn(page, "Next").first().click(); await sleep(800); for (const d of "2580") await btn(page, d).first().click(); await btn(page, "OK").first().click().catch(() => btn(page, "Next").first().click()); });
await step("lock", async () => { await page.getByRole("button", { name: "Lock" }).first().click(); });
await step("map", async () => { await page.goto(`${BASE}/c/${acc.cid}/map`); await sleep(2000); });
await step("hangar", async () => { await page.getByRole("link", { name: /Hangar/ }).or(page.getByRole("button", { name: /Hangar/ })).first().click(); });
await step("hangar-back", async () => { await page.goBack(); });
console.log(JSON.stringify(dump(log, `interact-${A}`)));
await browser.close();
