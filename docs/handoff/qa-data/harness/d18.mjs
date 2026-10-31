import { launch, open, PHONE, BASE, sleep } from "/home/user/Taxila/tests/e2e/qa-lib.mjs";
const b = await launch(); const { page } = await open(b, PHONE);
await page.goto(`${BASE}/`); await page.evaluate(() => localStorage.setItem("tx.lastChild", JSON.stringify("x")));
const keys = await page.evaluate(() => Object.keys(localStorage)); console.log("keys", keys);
await page.goto(`${BASE}/who`); await sleep(2500); console.log("with a remembered child:", new URL(page.url()).pathname + new URL(page.url()).search);
await page.evaluate(() => localStorage.clear()); await page.goto(`${BASE}/who`); await sleep(2500); console.log("fresh phone:", new URL(page.url()).pathname);
await b.close();
