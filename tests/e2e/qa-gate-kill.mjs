// QA repro D03: unlock the Parent corner, kill the browser (no pagehide → no lock beacon), reopen /parent in a fresh
// browser with the same session cookie within UNLOCK_MIN. Expected: the PIN pad. Prints PASS/FAIL.
import fs from "fs";
import { launch, open, PHONE, OUT, BASE, sleep, btn, shot } from "./qa-lib.mjs";
const cookies = JSON.parse(fs.readFileSync(`${OUT}/state-phone.json`, "utf8")).cookies;
let b = await launch(); let { ctx, page } = await open(b, PHONE); await ctx.addCookies(cookies);
await page.goto(`${BASE}/parent`); await sleep(2000);
for (const d of "2580") await btn(page, d).first().click(); await btn(page, "OK").first().click(); await sleep(2000);
const inside = await page.getByText("PARENT CORNER", { exact: false }).count();
await b.close(); // killed: no pagehide beacon reaches the server
b = await launch(); ({ ctx, page } = await open(b, PHONE)); await ctx.addCookies(cookies);
await page.goto(`${BASE}/parent/controls`); await sleep(2500);
const pad = await btn(page, "OK").count(), corner = await page.getByText("Controls for", { exact: false }).count();
await shot(page, "gate-kill-reopen");
console.log(JSON.stringify({ unlockedFirst: inside > 0, reopenShowsPad: pad > 0, reopenShowsControls: corner > 0 }), pad > 0 && !corner ? "PASS" : "FAIL");
await b.close();
