// QA pass: a set-up child's Hello cards, home, and every child screen, then a lesson start. Uses the accounts
// qa-setup.mjs wrote. QA_DEV=phone|laptop.
import fs from "fs";
import { launch, open, PHONE, LAPTOP, shot, dump, OUT, BASE, sleep, traceOf } from "./qa-lib.mjs";
const DEV = process.env.QA_DEV === "laptop" ? LAPTOP : PHONE;
const acc = JSON.parse(fs.readFileSync(`${OUT}/accounts.json`, "utf8"))[DEV.name];
const browser = await launch();
const { ctx, page, log } = await open(browser, DEV);
await ctx.addCookies(JSON.parse(fs.readFileSync(`${OUT}/state-${DEV.name}.json`, "utf8")).cookies);
const tag = `child-${DEV.name}`;
const text = async () => (await page.locator("body").innerText().catch(() => "")).replace(/\s+/g, " ").slice(0, 600);
const step = async (name) => { await sleep(1500); await shot(page, `${tag}-${name}`); console.log(`[${name}] ${new URL(page.url()).pathname} :: ${await text()}`); };

await page.goto(`${BASE}/c/${acc.cid}/hello`); await step("01-hello");
for (let i = 0; i < 8 && page.url().includes("/hello"); i++) {
  const card = await page.locator("[data-testid=hello]").getAttribute("data-card").catch(() => null);
  console.log("card", card);
  if (card === "greet") {
    const hear = page.locator("[data-testid=hello-hear]");
    if (await hear.count() && await hear.isEnabled()) await hear.click();
    // her clip plays, then the card moves on by itself (or Next while it plays)
    for (let j = 0; j < 40 && (await page.locator("[data-testid=hello]").getAttribute("data-card")) === "greet"; j++) await sleep(250);
    if ((await page.locator("[data-testid=hello]").getAttribute("data-card")) === "greet") console.log("DEFECT? greet card did not move on in 10 s");
  }
  else if (card === "ai") await page.locator("[data-testid=hello-gotit]").click();
  else if (card === "picture") { await page.locator(".avatar-btn").first().click(); await page.locator("[data-testid=hello-thatsme]").click(); }
  else if (card === "likes") await page.locator("[data-testid=hello-right]").click();
  else if (card === "change") { await page.locator(".itile").first().click(); await page.locator("[data-testid=hello-done]").click(); }
  else if (card === "hi") await page.locator("[data-testid=hello-skip]").click();
  else break;
  await step(`02-hello-${i}-${card}`);
}
await step("03-after-hello");
for (const p of ["", "map", "notebook", "me", "teacher", "ask", "practice"]) {
  await page.goto(`${BASE}/c/${acc.cid}/${p}`); await step(`10-screen-${p || "home"}`);
}
console.log(JSON.stringify(dump(log, tag)));
console.log("trace kinds:", [...new Set(log.trace.map((e) => e.kind))].join(" "));
await browser.close();
