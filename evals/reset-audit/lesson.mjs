// A full lesson through the real child UI: home -> start -> typed turns (owner probes woven in) -> end.
import { launch, ctxFor, watch, shot, textDump, probe, goto, save, sleep, api, BASE } from "./lib.mjs";
import fs from "fs";
const vp = process.argv[2] || "m"; const tag = process.argv[3] || "m4"; const script = process.argv[4] || "owner";
const acct = JSON.parse(fs.readFileSync(`${process.env.RA}/out/acct-${tag}.json`, "utf8"));
const SCRIPTS = {
  owner: ["", "hi", "idk", "this is too easy, I'm not a baby", "can you show me a diagram of this", "explain it differently, use cricket", "wait who made minecraft?", "no seriously tell me about minecraft first", "ok fine. what was the question again", "make a game for this", "can we talk about something else", "end the lesson", "I'm done bye"],
  answer: ["", "yes", "I think it's 12", "why?", "ok I get it", "give me a harder one", "48", "show me on the whiteboard", "another one", "I don't understand fractions at all honestly", "can you go slower", "stop"],
};
const LINES = SCRIPTS[script];
const b = await launch(); const ctx = await ctxFor(vp); const page = await ctx.newPage();
const log = { console: [], http: [] }; watch(page, log);
const T = `l-${tag}-${vp}-${script}`; let i = 0; const steps = []; const resp = [];
page.on("response", async (r) => { const u = r.url(); if (/\/api\/(lesson|forge|studio|tutor|practice|ask)/.test(u) && r.request().method() !== "GET") { let j = null; try { j = await r.json(); } catch {} resp.push({ t: Date.now(), url: u.replace(BASE, ""), status: r.status(), body: j }); } });
page.on("websocket", (ws) => log.console.push(`ws open ${ws.url().replace(BASE, "")}`));
const rec = async (label, extra = {}) => { const n = String(i++).padStart(2, "0"); await shot(page, `${T}-${n}-${label}`); steps.push({ n, label, t: Date.now(), url: page.url().replace(BASE, ""), text: (await textDump(page)).slice(0, 2500), probe: await probe(page), frames: page.frames().map((f) => f.url().replace(BASE, "")).filter((u) => u !== page.url().replace(BASE, "")), ...extra }); };
const tid = (id) => page.getByTestId(id);
try {
  await goto(page, "/");
  console.log("login", (await api(page, "POST", "/api/auth/login", { email: acct.email, password: acct.pw })).s);
  const cid = acct.cid;
  console.log("unlock", (await api(page, "POST", "/api/parent/unlock", { pin: "1357" })).s);
  console.log("controls", (await api(page, "POST", "/api/parent/controls", { childId: cid, hoursStart: "00:00", hoursEnd: "23:59", dailyMinutes: 120 })).s);
  const t0 = Date.now(); await goto(page, `/c/${cid}`); await sleep(5000); await rec("home", { ms: Date.now() - t0 });
  await page.mouse.wheel(0, 900); await sleep(800); await rec("home-scrolled"); await page.mouse.wheel(0, -2000);
  const start = tid("start-lesson").or(tid("continue-lesson")).first();
  const ts = Date.now(); await start.click({ timeout: 10000 });
  await sleep(2500); await rec("lesson-2s"); await sleep(6000); await rec("lesson-8s"); await sleep(8000); await rec("lesson-16s", { msFromStart: Date.now() - ts });
  for (let k = 1; k < LINES.length; k++) {
    const line = LINES[k];
    let inp = tid("child-input");
    if (!(await inp.isVisible().catch(() => false))) { if (await tid("type").isVisible().catch(() => false)) await tid("type").click().catch(() => {}); await sleep(600); }
    try { await page.waitForFunction(() => { const e = document.querySelector('[data-testid="child-input"]'); return e && !e.disabled; }, null, { timeout: 40000 }); }
    catch { await rec(`t${k}-noinput`); continue; }
    const n0 = resp.length; await inp.fill(line); await rec(`t${k}-typed`);
    const tSend = Date.now(); await tid("send").click().catch(() => page.keyboard.press("Enter"));
    while (resp.slice(n0).every((r) => !/lesson\/turn|lesson\/end/.test(r.url)) && Date.now() - tSend < 30000) await sleep(150);
    const ms = Date.now() - tSend; await sleep(1500); await rec(`t${k}-1s`, { line, ms });
    await sleep(7000); await rec(`t${k}-8s`, { line });
    if (/diagram|game|whiteboard/.test(line)) { await sleep(10000); await rec(`t${k}-18s`, { line }); }
    if (/lesson\/end/.test(page.url()) || (await tid("summary").isVisible().catch(() => false))) { await rec("summary"); break; }
  }
  await sleep(3000); await rec("final");
  if (await tid("summary").isVisible().catch(() => false)) { await page.mouse.wheel(0, 900); await sleep(600); await rec("summary-scrolled"); }
} catch (e) { console.log("ERR", e.message.slice(0, 300)); await rec("error"); }
save(T, { steps, log, resp }); await b.close(); console.log("done");
