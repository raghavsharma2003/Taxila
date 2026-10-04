// Class 4 (young band) lesson: the voice-only dock. Tap Talk (fake mic), Done, help menu, pause, more menu, cc.
import { launch, ctxFor, watch, shot, textDump, probe, goto, save, sleep, api, BASE } from "./lib.mjs";
import fs from "fs";
const vp = process.argv[2] || "m"; const tag = "m4";
const acct = JSON.parse(fs.readFileSync(`${process.env.RA}/out/acct-${tag}.json`, "utf8"));
const b = await launch(); const ctx = await ctxFor(vp); const page = await ctx.newPage();
const log = { console: [], http: [] }; watch(page, log);
const T = `y-${vp}`; let i = 0; const steps = []; const resp = [];
page.on("response", async (r) => { const u = r.url(); if (/\/api\/lesson/.test(u) && r.request().method() !== "GET") { let j = null; try { j = await r.json(); } catch {} resp.push({ t: Date.now(), url: u.replace(BASE, ""), status: r.status(), body: j }); } });
const rec = async (label, extra = {}) => { const n = String(i++).padStart(2, "0"); await shot(page, `${T}-${n}-${label}`); steps.push({ n, label, text: (await textDump(page)).slice(0, 2000), ...extra }); };
const tid = (id) => page.getByTestId(id);
const clickT = async (id) => { if (await tid(id).first().isVisible().catch(() => false)) { await tid(id).first().click().catch(() => {}); return true; } return false; };
try {
  await goto(page, "/"); await api(page, "POST", "/api/auth/login", { email: acct.email, password: acct.pw });
  await api(page, "POST", "/api/parent/unlock", { pin: "1357" });
  await api(page, "POST", "/api/parent/controls", { childId: acct.cid, hoursStart: "00:00", hoursEnd: "23:59", dailyMinutes: 120 });
  await api(page, "POST", "/api/parent/lock", {});
  await goto(page, `/c/${acct.cid}`); await sleep(4000);
  await tid("start-lesson").or(tid("continue-lesson")).first().click(); await sleep(14000); await rec("start");
  await page.getByRole("button", { name: "OK" }).first().click().catch(() => {}); await sleep(500); await rec("coach-dismissed");
  // talk
  const mic = tid("mic"); console.log("mic", await mic.count());
  await mic.first().click().catch((e) => console.log("mic click", e.message.slice(0, 80))); await sleep(1200); await rec("talk-listening");
  await sleep(3000); await mic.first().click().catch(() => {}); await sleep(1000); await rec("talk-done-1s"); await sleep(8000); await rec("talk-done-9s");
  // help
  await clickT("help"); await sleep(800); await rec("help-menu");
  const items = await page.locator('[data-testid="help-menu"] button').allInnerTexts().catch(() => []); console.log("help items", items);
  await page.keyboard.press("Escape"); await clickT("help-menu-back"); await sleep(500);
  await clickT("more"); await sleep(800); await rec("more-menu"); console.log("more", await textDump(page).then((t) => t.slice(0, 600)));
  await page.keyboard.press("Escape"); await sleep(300);
  await clickT("cc"); await sleep(800); await rec("cc-on");
  await clickT("pause"); await sleep(1500); await rec("paused");
  const resume = page.getByRole("button", { name: /resume|continue|back/i }).first(); if (await resume.count()) { await resume.click().catch(() => {}); await sleep(3000); await rec("resumed"); }
  // laptop icon on the face
  const lap = page.locator('[data-testid="teacher-window"] button').first(); if (await lap.count()) { console.log("face button", await lap.getAttribute("aria-label")); await lap.click().catch(() => {}); await sleep(1500); await rec("face-button"); }
  // finish
  await clickT("finish"); await sleep(3000); await rec("finish");
} catch (e) { console.log("ERR", e.message.slice(0, 300)); await rec("error"); }
save(T, { steps, log, resp }); await b.close(); console.log("done");
