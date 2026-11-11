import fs from "fs";
import { launch, open, PHONE, BASE, sleep, shot } from "/home/user/Taxila/tests/e2e/qa-lib.mjs";
const Q = process.env.QA_OUT; const acc = JSON.parse(fs.readFileSync(Q + "/accounts.json")).phone;
const b = await launch();
for (let run = 0; run < 3; run++) {
  const { ctx, page, log } = await open(b, PHONE, { init: () => localStorage.setItem("taxila.child.aab3fb24-f6f0-44d4-b844-534d0dd56dd8.prefs", JSON.stringify({ hello: true })) });
  await ctx.addCookies(JSON.parse(fs.readFileSync(Q + "/state-phone.json")).cookies);
  const t0 = Date.now(); await page.goto(BASE + "/c/" + acc.cid + "/");
  let txt = ""; while (Date.now() - t0 < 20000) { txt = (await page.locator("body").innerText().catch(() => "")).replace(/\s+/g, " ").trim(); if (txt.length > 20) break; await sleep(100); }
  console.log("run", run, "content after", Date.now() - t0, "ms:", txt.slice(0, 120));
  await sleep(2000);
  const res = log.trace.filter((e) => e.kind === "net.res").map((e) => `${e.data.path.split("?")[0]} ${e.data.status} ${e.data.ms}ms`);
  console.log("  ", res.join(" | "), log.pageerror, log.http);
  await ctx.close();
}
await b.close();
