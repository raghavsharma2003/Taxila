// QA pass: the set-up journey, each screen shot, on phone and laptop. Writes the account to $QA_OUT/accounts.json.
import fs from "fs";
import { launch, open, PHONE, LAPTOP, shot, setup, dump, OUT, BASE } from "./qa-lib.mjs";
const browser = await launch();
const accounts = fs.existsSync(`${OUT}/accounts.json`) ? JSON.parse(fs.readFileSync(`${OUT}/accounts.json`, "utf8")) : {};
// QA_LABELS=p2,p3 makes more phone accounts (keys p2, p3); default: one phone and one laptop account
const base = process.env.QA_DEV === "laptop" ? LAPTOP : PHONE;
const runs = process.env.QA_LABELS ? process.env.QA_LABELS.split(",").map((l) => ({ ...base, name: l })) : [PHONE, LAPTOP];
for (const dev of runs) {
  const { ctx, page, log } = await open(browser, { ...dev, name: undefined });
  let n = 0;
  page.on("framenavigated", async (f) => { if (f === page.mainFrame()) { await page.waitForTimeout(600); await shot(page, `setup-${dev.name}-${String(++n).padStart(2, "0")}-${new URL(f.url()).pathname.replace(/\W+/g, "_")}`); } });
  const t0 = Date.now();
  try {
    const acc = await setup(page, { label: dev.name, child: process.env.QA_CHILD || "Riya", cls: process.env.QA_CLASS || "Class 4", board: process.env.QA_BOARD || "CBSE", lang: process.env.QA_LANG || "Hindi and English mix" });
    acc.ms = Date.now() - t0;
    accounts[dev.name] = acc;
    console.log(dev.name, JSON.stringify(acc));
    await page.waitForTimeout(4000);
    await shot(page, `setup-${dev.name}-99-landed`);
    fs.writeFileSync(`${OUT}/state-${dev.name}.json`, JSON.stringify(await ctx.storageState()));
  } catch (e) {
    console.log(dev.name, "SETUP FAILED", String(e).slice(0, 400), page.url());
    await shot(page, `setup-${dev.name}-FAIL`);
  }
  console.log(dev.name, JSON.stringify(dump(log, `setup-${dev.name}`)));
  await ctx.close();
}
await browser.close();
const merged = { ...(fs.existsSync(`${OUT}/accounts.json`) ? JSON.parse(fs.readFileSync(`${OUT}/accounts.json`, "utf8")) : {}), ...accounts };
fs.writeFileSync(`${OUT}/accounts.json`, JSON.stringify(merged, null, 1));
