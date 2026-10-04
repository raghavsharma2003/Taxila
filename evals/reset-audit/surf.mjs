// Child surfaces (map, notebook, ask, practice, me, teacher) + parent corner (every page) at one viewport.
import { launch, ctxFor, watch, shot, textDump, probe, goto, save, sleep, api, BASE } from "./lib.mjs";
import fs from "fs";
const vp = process.argv[2] || "m"; const tag = process.argv[3] || "m4"; const part = process.argv[4] || "all";
const acct = JSON.parse(fs.readFileSync(`${process.env.RA}/out/acct-${tag}.json`, "utf8"));
const b = await launch(); const ctx = await ctxFor(vp); const page = await ctx.newPage();
const log = { console: [], http: [] }; watch(page, log);
const T = `s-${tag}-${vp}`; let i = 0; const steps = []; const resp = [];
page.on("response", async (r) => { const u = r.url(); if (/\/api\//.test(u) && r.request().method() !== "GET") { let j = null; try { j = await r.json(); } catch {} resp.push({ t: Date.now(), url: u.replace(BASE, ""), status: r.status(), body: JSON.stringify(j)?.slice(0, 3000) }); } });
const rec = async (label, extra = {}) => { const n = String(i++).padStart(2, "0"); await shot(page, `${T}-${n}-${label}`); steps.push({ n, label, url: page.url().replace(BASE, ""), text: (await textDump(page)).slice(0, 3500), probe: await probe(page), ...extra }); };
const recFull = async (label) => { const n = String(i++).padStart(2, "0"); await shot(page, `${T}-${n}-${label}-full`, { full: true }); };
const tid = (id) => page.getByTestId(id);
const cid = acct.cid;
const visit = async (path, label, wait = 4500) => { const t0 = Date.now(); await goto(page, path); await sleep(wait); await rec(label, { ms: Date.now() - t0 }); };
try {
  await goto(page, "/");
  console.log("login", (await api(page, "POST", "/api/auth/login", { email: acct.email, password: acct.pw })).s);
  if (part === "all" || part === "child") {
    await api(page, "POST", "/api/parent/lock", {});
    await visit(`/c/${cid}`, "home"); await recFull("home");
    await visit(`/c/${cid}/map`, "map"); await recFull("map");
    const sk = page.locator("button, a").filter({ hasText: /./ }).nth(3);
    await visit(`/c/${cid}/notebook`, "notebook"); await recFull("notebook");
    await visit(`/c/${cid}/me`, "me"); await recFull("me");
    await visit(`/c/${cid}/teacher`, "teacher"); await recFull("teacher");
    // ask
    await visit(`/c/${cid}/ask`, "ask");
    const box = page.locator("textarea, input[type=text]").first();
    if (await box.count()) {
      await box.fill("why is the sky blue but sunsets are orange?"); await rec("ask-typed");
      const go = tid("ask-go"); if (await go.count()) await go.first().click().catch(() => {}); else await page.keyboard.press("Enter");
      await sleep(2500); await rec("ask-2s"); await sleep(9000); await rec("ask-11s"); await recFull("ask-answer");
      // follow-up
      const box2 = page.locator("textarea, input[type=text]").first();
      if (await box2.isVisible().catch(() => false)) { await box2.fill("can you draw it?"); await page.keyboard.press("Enter"); await sleep(10000); await rec("ask-followup"); }
    }
    await visit(`/c/${cid}/ask?homework=1`, "ask-homework");
    // practice
    await visit(`/c/${cid}/practice`, "practice", 7000); await recFull("practice");
    for (let k = 0; k < 4; k++) {
      const inp = tid("child-input");
      const chip = tid("answer-chip").first();
      if (await chip.isVisible().catch(() => false)) { await chip.click().catch(() => {}); }
      else if (await inp.isVisible().catch(() => false)) { await inp.fill(k % 2 ? "I don't know" : "12"); await tid("send").click().catch(() => page.keyboard.press("Enter")); }
      else if (await tid("type").isVisible().catch(() => false)) { await tid("type").click(); await sleep(500); continue; }
      else if (await tid("number-pad").isVisible().catch(() => false)) { await page.getByRole("button", { name: "1", exact: true }).first().click().catch(() => {}); await tid("pad-send").click().catch(() => {}); }
      await sleep(6000); await rec(`practice-a${k}`);
    }
  }
  if (part === "all" || part === "parent") {
    await api(page, "POST", "/api/parent/lock", {});
    await visit(`/parent`, "parent-gate", 3500);
    // enter PIN like a parent: pad buttons
    for (const d of "1357") { const btn = page.getByRole("button", { name: d, exact: true }).first(); if (await btn.count()) await btn.click().catch(() => {}); else await page.keyboard.type(d); await sleep(150); }
    await sleep(3500); await rec("parent-after-pin");
    if (/pin|gate/i.test(await textDump(page)) && !/Home|Progress/i.test(await textDump(page))) { await api(page, "POST", "/api/parent/unlock", { pin: "1357" }); }
    const P = ["", "/progress", "/lessons", "/notes", "/controls", "/children", "/data", "/help", "/pin", "/more"];
    for (const p of P) { await visit(`/parent${p}?c=${cid}`, `parent${p.replace("/", "-") || "-home"}`); await recFull(`parent${p.replace("/", "-") || "-home"}`); }
    // lesson card + evidence + note if any
    await goto(page, `/parent/lessons?c=${cid}`); await sleep(3500);
    const l = page.locator('a[href*="/parent/lessons/"]').first(); if (await l.count()) { await l.click(); await sleep(4000); await rec("parent-lesson-card"); await recFull("parent-lesson-card"); }
    await goto(page, `/parent/progress?c=${cid}`); await sleep(3500);
    const ev = page.locator('a[href*="/parent/evidence/"]').first(); if (await ev.count()) { await ev.click(); await sleep(4000); await rec("parent-evidence"); }
    // controls: time + date pickers as a real parent would
    await goto(page, `/parent/controls?c=${cid}`); await sleep(4000);
    const times = page.locator('input[type=time]'); const nt = await times.count(); console.log("time inputs", nt);
    const dates = page.locator('input[type=date]'); console.log("date inputs", await dates.count());
    const btns = await page.locator("button").allInnerTexts(); console.log("controls buttons", btns.join(" | ").slice(0, 600));
    // try to open "add a day off" type affordance
    const add = page.getByRole("button", { name: /day off|holiday|exam|break|add/i }).first();
    if (await add.count()) { await add.click().catch(() => {}); await sleep(1200); await rec("controls-add-dayoff"); }
    const d2 = page.locator('input[type=date]');
    if (await d2.count()) {
      const box = await d2.first().boundingBox(); console.log("date box", JSON.stringify(box));
      await d2.first().click({ position: { x: (box?.width ?? 100) / 2, y: (box?.height ?? 20) / 2 } }).catch((e) => console.log("dclick", e.message.slice(0, 80)));
      await sleep(600); await page.keyboard.type("15102026"); await sleep(400);
      console.log("date value after typing 15102026:", await d2.first().inputValue());
      await rec("controls-date-typed");
    }
    if (nt) {
      const box = await times.first().boundingBox(); console.log("time box", JSON.stringify(box));
      await times.first().click({ position: { x: (box?.width ?? 100) / 2, y: (box?.height ?? 20) / 2 } }); await sleep(300); await page.keyboard.type("0430PM");
      console.log("time value after centre tap + 0430PM:", await times.first().inputValue()); await rec("controls-time-typed");
    }
    await page.mouse.wheel(0, 1500); await sleep(600); await rec("controls-scrolled");
  }
} catch (e) { console.log("ERR", e.message.slice(0, 300)); await rec("error"); }
save(T, { steps, log, resp }); await b.close(); console.log("done");
