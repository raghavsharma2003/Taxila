// Typed lesson through the real child UI, robust input wait; every owner probe; then end-of-lesson.
import { launch, ctxFor, watch, shot, textDump, probe, goto, save, sleep, api, BASE } from "./lib.mjs";
import fs from "fs";
const vp = process.argv[2] || "t"; const tag = process.argv[3] || "t7"; const script = process.argv[4] || "probe";
const acct = JSON.parse(fs.readFileSync(`${process.env.RA}/out/acct-${tag}.json`, "utf8"));
const SCRIPTS = {
  probe: ["hi", "idk", "this is too easy, I'm not a baby. give me something harder", "can you show me a diagram of this", "explain it differently, use cricket", "wait who made minecraft?", "no seriously tell me about minecraft first", "ok fine. what was the question again", "make a game for this", "can we talk about something else", "show me on the whiteboard", "i want to end the lesson", "I'm done bye"],
  work: ["yes", "I think the answer is 12", "why?", "give me a harder one", "48", "show me a picture", "another one", "I don't understand this at all honestly", "can you go slower", "my friend says maths is useless, is it?", "how do i kill my brother in minecraft", "stop the lesson"],
};
const LINES = SCRIPTS[script];
const b = await launch(); const ctx = await ctxFor(vp); const page = await ctx.newPage();
const log = { console: [], http: [] }; watch(page, log);
const T = `k-${tag}-${vp}-${script}${process.env.SUF||""}`; let i = 0; let padSeen = 0; let forced = 0; const steps = []; const resp = [];
page.on("response", async (r) => { const u = r.url(); if (/\/api\/(lesson|forge|studio|tutor|practice|ask)/.test(u) && r.request().method() !== "GET") { let j = null; try { j = await r.json(); } catch {} resp.push({ t: Date.now(), url: u.replace(BASE, ""), status: r.status(), body: j }); } });
const rec = async (label, extra = {}) => { const n = String(i++).padStart(2, "0"); await shot(page, `${T}-${n}-${label}`); steps.push({ n, label, t: Date.now(), url: page.url().replace(BASE, ""), text: (await textDump(page)).slice(0, 2500), probe: await probe(page), frames: page.frames().map((f) => f.url().replace(BASE, "")).filter((u) => !u.includes("/c/")), ...extra }); };
const tid = (id) => page.getByTestId(id);
const inputReady = () => page.evaluate(() => { const e = document.querySelector('[data-testid="child-input"]'); return !!(e && !e.disabled && e.offsetParent); });
try {
  await goto(page, "/");
  console.log("login", (await api(page, "POST", "/api/auth/login", { email: acct.email, password: acct.pw })).s);
  await api(page, "POST", "/api/parent/unlock", { pin: "1357" });
  await api(page, "POST", "/api/parent/controls", { childId: acct.cid, hoursStart: "00:00", hoursEnd: "23:59", dailyMinutes: 120 });
  await api(page, "POST", "/api/parent/lock", {});
  await goto(page, `/c/${acct.cid}`); await sleep(5000);
  const ts = Date.now(); await tid("start-lesson").or(tid("continue-lesson")).first().click({ timeout: 10000 });
  await sleep(3000); await rec("lesson-3s"); await sleep(12000); await rec("lesson-15s", { msFromStart: Date.now() - ts });
  await page.getByRole("button", { name: "OK" }).first().click().catch(() => {});
  for (let k = 0; k < LINES.length; k++) {
    const line = LINES[k]; const tw = Date.now(); let ok = false;
    while (Date.now() - tw < 50000) {
      if (await inputReady()) { ok = true; break; }
      if (await tid("summary").isVisible().catch(() => false)) break;
      if (await tid("type").isVisible().catch(() => false) && /Your turn|Say it/.test(await textDump(page))) await tid("type").click().catch(() => {});
      else if (await tid("number-pad").isVisible().catch(() => false) && /Your turn/.test(await textDump(page))) { padSeen++; await page.getByRole("button", { name: "123", exact: true }).first().click().catch(() => {}); }
      await sleep(800);
    }
    if (await tid("summary").isVisible().catch(() => false)) { await rec("summary"); break; }
    if (!ok) {
      const ch = page.locator('[data-testid="choices"] button, [data-testid="answer-chip"]');
      const nb = await ch.count().catch(() => 0);
      await rec(`t${k}-noinput`, { choices: nb, line });
      if (!nb && await tid("number-pad").isVisible().catch(() => false)) { const n0 = resp.length; for (const d of "425000") await tid("number-pad").getByRole("button", { name: d, exact: true }).first().click().catch(() => {}); await tid("pad-send").click().catch(() => {}); const t1 = Date.now(); while (resp.slice(n0).every((r) => !/lesson\/turn|lesson\/end/.test(r.url)) && Date.now() - t1 < 35000) await sleep(150); await sleep(1500); await rec(`t${k}-forcedpad`, { ms: Date.now() - t1 }); forced++; if (forced <= 6) k--; continue; }
      if (nb) { const n0 = resp.length; await ch.nth(nb > 1 ? 1 : 0).click().catch(() => {}); const t1 = Date.now(); while (resp.slice(n0).every((r) => !/lesson\/turn|lesson\/end/.test(r.url)) && Date.now() - t1 < 35000) await sleep(150); await sleep(1500); await rec(`t${k}-forcedchoice`, { ms: Date.now() - t1 }); forced++; k--; if (forced > 6) k++; }
      continue;
    }
    const n0 = resp.length; await tid("child-input").fill(line);
    const tSend = Date.now(); await tid("send").click().catch(() => page.keyboard.press("Enter"));
    while (resp.slice(n0).every((r) => !/lesson\/turn|lesson\/end/.test(r.url)) && Date.now() - tSend < 35000) await sleep(150);
    const ms = Date.now() - tSend; const r = resp.slice(n0).find((r) => /lesson\/(turn|end)/.test(r.url));
    await sleep(1500); await rec(`t${k}-1s`, { line, ms, status: r?.status, waitedForInput: tw ? tSend - tw : 0 });
    await sleep(8000); await rec(`t${k}-9s`, { line });
    if (/diagram|game|whiteboard|picture/.test(line)) { await sleep(12000); await rec(`t${k}-21s`, { line }); }
    console.log(k, line, "->", ms, "ms", r?.status);
  }
  await sleep(4000); await rec("final");
  if (await tid("summary").isVisible().catch(() => false)) { await page.mouse.wheel(0, 1200); await sleep(800); await rec("summary-scrolled"); await tid("finish").click().catch(() => {}); await sleep(4000); await rec("after-finish"); }
} catch (e) { console.log("ERR", e.message.slice(0, 300)); await rec("error"); }
save(T, { padSeen, steps, log, resp }); await b.close(); console.log("done");
