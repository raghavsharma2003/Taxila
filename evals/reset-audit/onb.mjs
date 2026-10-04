// Walk onboarding through the real UI as a parent of a class-N child, at one viewport. Leaves the account (cid printed) for later flows.
import { launch, ctxFor, watch, shot, textDump, probe, goto, save, sleep, api, BASE } from "./lib.mjs";
import fs from "fs";
const vp = process.argv[2] || "m"; const CLS = Number(process.argv[3] || 4); const tag = `${vp}${CLS}`;
const b = await launch(); const ctx = await ctxFor(vp); const page = await ctx.newPage();
const log = { console: [], http: [] }; watch(page, log);
const st = Date.now(); const email = `reset-audit+${tag}${st}@taxila.test`, pw = `ra-pw-${st}-x9`;
const steps = []; let i = 0;
const rec = async (label, extra = {}) => {
  const n = String(i++).padStart(2, "0"); await sleep(900);
  await shot(page, `o-${tag}-${n}-${label}`);
  steps.push({ n, label, url: page.url().replace(BASE, ""), text: (await textDump(page)).slice(0, 3000), probe: await probe(page), ...extra, consoleSoFar: log.console.length, httpSoFar: [...log.http] });
};
const click = async (name, opts = {}) => { const l = page.getByRole(opts.role || "button", { name, exact: !!opts.exact }).first(); await l.click({ timeout: 8000 }); };
const timing = {};
try {
  await goto(page, "/"); await rec("landing");
  await page.getByRole("link", { name: /Start free set-up/i }).first().click(); await rec("class-empty");
  await click(`Class ${CLS}`, { role: "radio", exact: true }).catch(async () => click(`Class ${CLS}`, { exact: true }));
  await click("CBSE", { role: "radio" }).catch(async () => click("CBSE"));
  await rec("class-picked"); await click("Continue");
  await rec("meet");
  await click(/Hindi and English mix/, { role: "radio" }).catch(() => click(/Hindi and English mix/));
  await rec("meet-picked");
  const sp = page.getByRole("button", { name: /Hear/ }).first(); if (await sp.count()) { await sp.click(); await sleep(1500); await rec("meet-hear"); }
  await click("Continue"); await rec("after-meet");
  for (let guard = 0; guard < 22; guard++) {
    const path = new URL(page.url()).pathname;
    if (path.startsWith("/start/promises")) {
      const h = page.getByRole("button", { name: /Hold to continue/i }).first(); const bx = await h.boundingBox();
      if (bx) { await page.mouse.move(bx.x + bx.width / 2, bx.y + bx.height / 2); await page.mouse.down(); await sleep(1000); await rec("hold-mid"); await sleep(1600); await page.mouse.up(); }
      else await click(/Continue/i);
    }
    else if (path.startsWith("/start/phone")) {
      await page.getByLabel("Your name").fill("Audit Parent").catch(() => {});
      await page.getByLabel(/Mobile number/).fill("9876543210").catch(() => {});
      await page.getByLabel("Email").fill(email); await page.getByLabel("Password", { exact: true }).fill(pw).catch(async () => page.locator("input[type=password]").first().fill(pw));
      await rec("account-filled");
      const box = page.getByRole("checkbox"); for (const c of await box.all()) await c.check().catch(() => {});
      await click(/Create|Continue|Sign up/i);
    } else if (path.startsWith("/start/verify")) { await click(/Continue|Skip|Later|Verify/i); }
    else if (path.startsWith("/start/consent")) {
      for (const g of await page.getByRole("radiogroup").all()) { const r = g.getByRole("radio").first(); await r.click().catch(() => {}); }
      await rec("consent-filled"); await click(/Agree and continue/);
    } else if (path.startsWith("/start/child")) {
      await page.getByLabel(/first name/i).fill("Aarav");
      await click("Casual", { role: "radio" }).catch(() => {});
      await click("English", { role: "radio", exact: true }).catch(() => {});
      const likes = page.locator(".onb-like"); const n = await likes.count();
      for (let k = 0; k < Math.min(3, n); k++) await likes.nth([1, 4, 7][k] ?? k).click().catch(() => {});
      await rec("child-filled", { likes: await likes.allInnerTexts() });
      await click(/Continue|Next|Save/i);
    } else if (path.startsWith("/start/controls")) {
      await rec("controls-raw");
      // The owner's complaint: date and time could not be selected. Try what a person does: click the field, type.
      const hs = page.locator("#hs"), he = page.locator("#he");
      const t = { before: [await hs.inputValue().catch(() => null), await he.inputValue().catch(() => null)] };
      try { await hs.click(); await page.keyboard.type("0430PM"); t.typedStart = await hs.inputValue(); } catch (e) { t.errStart = e.message.slice(0, 120); }
      try { await he.click(); await page.keyboard.type("0815PM"); t.typedEnd = await he.inputValue(); } catch (e) { t.errEnd = e.message.slice(0, 120); }
      const box = await hs.boundingBox().catch(() => null); t.boxStart = box;
      t.pickerIndicator = await page.evaluate(() => { const e = document.querySelector("#hs"); return e ? getComputedStyle(e, "::-webkit-calendar-picker-indicator").display : null; });
      timing.controls = t; await rec("controls-typed", { t });
      // PIN pad
      for (let r = 0; r < 2; r++) { for (const d of ["1", "3", "5", "7"]) { await page.getByRole("button", { name: d, exact: true }).first().click().catch(() => {}); } await sleep(400); const ok = page.getByRole("button", { name: /^(Next|OK)$/ }); if (await ok.count()) await ok.first().click().catch(() => {}); await sleep(600); }
      await rec("controls-pin");
      await click(/Looks good/);
    } else if (path.startsWith("/start/check")) { await page.getByTestId("check-sound").click().catch(() => {}); await page.getByTestId("check-mic").click().catch(() => {}); await sleep(3500); await rec("check-tried"); await page.getByTestId("check-next").click(); }
    else if (path.startsWith("/start/summary")) { await click(/Continue|Done|Next|Hand|Start/i); }
    else if (path.startsWith("/start/handover")) { await rec("handover"); const bt = page.getByRole("button").filter({ hasText: /give the phone|start|begin|ready/i }).first(); const ln = page.getByRole("link").filter({ hasText: /give the phone|start|begin|ready/i }).first(); if (await bt.count()) await bt.click(); else await ln.click(); }
    else { break; }
    await page.waitForLoadState("load").catch(() => {}); await sleep(1500);
    await rec("at-" + new URL(page.url()).pathname.replace(/\//g, "_"));
  }
  await sleep(4000); await rec("end");
  const me = await api(page, "GET", "/api/me");
  fs.writeFileSync(`${process.env.RA}/out/acct-${tag}.json`, JSON.stringify({ email, pw, me: me.j }, null, 2));
} catch (e) { console.log("ERR", e.message.slice(0, 300)); await rec("error"); }
save(`onb-${tag}`, { email, steps, log, timing }); await b.close(); console.log("done", email);
