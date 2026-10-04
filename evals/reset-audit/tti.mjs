import { launch, ctxFor, goto, sleep, api } from "./lib.mjs";
import fs from "fs";
const b = await launch(); const out = [];
for (const [vp, tag] of [["m", "m4"], ["d", "d6"], ["t", "t7"]]) {
  const acct = JSON.parse(fs.readFileSync(`${process.env.RA}/out/acct-${tag}.json`, "utf8"));
  for (let k = 0; k < 3; k++) {
    const ctx = await ctxFor(vp); const page = await ctx.newPage();
    await goto(page, "/"); await api(page, "POST", "/api/auth/login", { email: acct.email, password: acct.pw });
    const t0 = Date.now(); await page.goto(`https://taxila.dev/c/${acct.cid}`, { waitUntil: "commit" });
    let tStart = null, tSkel = null;
    while (Date.now() - t0 < 30000) {
      const st = await page.evaluate(() => ({ start: !!document.querySelector('[data-testid="start-lesson"],[data-testid="continue-lesson"]'), skel: /Getting today ready/.test(document.body?.innerText || "") })).catch(() => ({}));
      if (st.skel && tSkel === null) tSkel = Date.now() - t0;
      if (st.start) { tStart = Date.now() - t0; break; }
      await sleep(100);
    }
    out.push({ vp, k, tStartMs: tStart, sawSkeletonAtMs: tSkel }); console.log(vp, k, tStart, tSkel);
    await ctx.close();
  }
}
fs.writeFileSync(`${process.env.RA}/out/tti.json`, JSON.stringify(out, null, 2)); await b.close();
