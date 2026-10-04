// Child first run: handover -> hello cards -> (lesson or resting). Uses an existing account.
import { launch, ctxFor, watch, shot, textDump, probe, goto, save, sleep, api, BASE } from "./lib.mjs";
import fs from "fs";
const vp = process.argv[2] || "m"; const tag = process.argv[3] || "m4"; const openHours = process.argv.includes("--open");
const acct = JSON.parse(fs.readFileSync(`${process.env.RA}/out/acct-${tag}.json`, "utf8"));
const b = await launch(); const ctx = await ctxFor(vp); const page = await ctx.newPage();
const log = { console: [], http: [] }; watch(page, log);
const steps = []; let i = 0; const T = `h-${tag}-${vp}${openHours ? "-open" : ""}`;
const rec = async (label, extra = {}) => { const n = String(i++).padStart(2, "0"); await sleep(1200); await shot(page, `${T}-${n}-${label}`); steps.push({ n, label, url: page.url().replace(BASE, ""), text: (await textDump(page)).slice(0, 2500), probe: await probe(page), ...extra }); };
const tid = (id) => page.getByTestId(id);
try {
  await goto(page, "/");
  const lg = await api(page, "POST", "/api/auth/login", { email: acct.email, password: acct.pw }); console.log("login", lg.s);
  const me = await api(page, "GET", "/api/me"); const child = (me.j.children || me.j.me?.children || [])[0]; const cid = child?.id; console.log("cid", cid, JSON.stringify(me.j).slice(0, 300));
  acct.cid = cid; fs.writeFileSync(`${process.env.RA}/out/acct-${tag}.json`, JSON.stringify(acct, null, 2));
  if (openHours) console.log("controls", (await api(page, "POST", "/api/parent/controls", { childId: cid, hoursStart: "00:00", hoursEnd: "23:59", dailyMinutes: 120 })).s);
  await goto(page, `/c/${cid}/hello`); await sleep(3000); await rec("hello-greet");
  if (await tid("hello-hear").count()) { await tid("hello-hear").click(); await sleep(1500); await rec("hear-playing"); await sleep(9000); await rec("hear-done"); }
  let named = false;
  for (let k = 0; k < 16; k++) {
    if (!new URL(page.url()).pathname.endsWith("/hello")) break;
    const card = await page.locator('[data-testid="hello"]').getAttribute("data-card").catch(() => null);
    if (card === "picture") { const av = page.locator('[data-testid="hello"] button[aria-pressed], [data-testid="hello"] [role=radio]').first(); if (await av.count()) await av.click().catch(() => {}); await rec("picture-picked"); await tid("hello-thatsme").click().catch(() => {}); }
    else if (card === "name" && !named) {
      named = true; const inp = page.locator('[data-testid="hello"] input').first();
      await rec("name-card");
      if (await inp.count()) {
        for (const nm of ["Ironman", "Babu", "Zara"]) { await inp.fill(nm); await rec("name-" + nm + "-typed"); const go = page.locator('[data-testid="hello"] button').filter({ hasText: /use|save|call|that|ok|next|done/i }).last(); await go.click().catch(() => {}); await sleep(2500); await rec("name-" + nm + "-result"); if (!new URL(page.url()).pathname.endsWith("/hello")) break; }
      }
    } else {
      const ids = ["hello-next", "hello-gotit", "hello-right", "hello-done", "hello-thatsme"]; let did = false;
      for (const id of ids) if (await tid(id).isVisible().catch(() => false)) { await tid(id).click().catch(() => {}); did = true; break; }
      if (!did) { const ch = page.locator('[data-testid="hello"] button').filter({ hasText: /choose for me|keep|next|continue|start/i }).first(); if (await ch.count()) { await ch.click().catch(() => {}); did = true; } }
      if (!did) { await rec("stuck-" + card); break; }
    }
    await sleep(900); await rec("card-" + k + "-" + (await page.locator('[data-testid="hello"]').getAttribute("data-card").catch(() => "gone")));
  }
  await sleep(6000); await rec("landing-after-hello");
  await sleep(8000); await rec("landing-after-hello-14s");
} catch (e) { console.log("ERR", e.message.slice(0, 300)); await rec("error"); }
save(T, { steps, log }); await b.close(); console.log("done");
