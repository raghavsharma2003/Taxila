// Does a Studio page stay when the next turn's response carries no studioSlot? picture ask → board; then a typed answer.
import fs from "fs";
import { launch, open, PHONE, BASE, sleep, shot } from "/home/user/Taxila/tests/e2e/qa-lib.mjs";
const Q = process.env.QA_OUT; const ACC = process.env.QA_ACC; const acc = JSON.parse(fs.readFileSync(Q + "/accounts.json"))[ACC];
const b = await launch(); const { ctx, page } = await open(b, PHONE, { init: () => { try { localStorage.setItem(`taxila.child.${location.pathname.split("/")[2]}.prefs`, JSON.stringify({ hello: true })); } catch {} } });
await ctx.addCookies(JSON.parse(fs.readFileSync(`${Q}/state-${ACC}.json`)).cookies);
const turns = []; let T0 = Date.now();
page.on("response", async (r) => { if (/\/api\/lesson\/turn$/.test(r.url())) { let j = {}; try { j = await r.json(); } catch {} turns.push({ ms: Date.now() - T0, tray: j.ui?.tray ?? null, slot: j.ui?.studioSlot ? j.ui.studioSlot.state : null, reply: (j.teacherReply ?? "").slice(0, 110) }); } });
const word = () => page.locator("[data-testid=state-word]").innerText().catch(() => "");
const tray = () => page.evaluate(() => { const t = document.querySelector("[data-testid=tray]"); return t ? `${t.getAttribute("data-kind")}:${!!t.querySelector("iframe,canvas,svg,img")}` : "none"; });
const waitTurn = async () => { for (let k = 0; k < 240 && !/Your turn/.test(await word()); k++) await sleep(250); };
const type = async (t) => { await page.locator("[data-testid=type]").click({ timeout: 8000 }).catch(() => {}); await page.locator("[data-testid=child-input]").fill(t); await page.locator("[data-testid=send]").click(); };
await page.goto(`${BASE}/c/${acc.cid}/lesson/new`); await waitTurn(); await sleep(800);
const lesson = new URL(page.url()).pathname.split("/").pop();
T0 = Date.now(); await type("picture dikhao"); await sleep(3000); await waitTurn(); await sleep(1500);
// QA_PAUSE (ms): let a slow board finish drawing (planning → revealed) before the answer, so t2 tests keeping it
if (process.env.QA_PAUSE) await sleep(Number(process.env.QA_PAUSE));
const before = await tray();
await type(process.env.QA_ANSWER || "160 metre"); const tl = [];
const t1 = Date.now(); while (Date.now() - t1 < 25000) { tl.push(`${Date.now() - t1}:${await tray()}`); if (Date.now() - t1 > 6000 && /Your turn/.test(await word())) break; await sleep(500); }
// QA_ANSWER2: a third turn, so a board revealed on t2 (reveals are turn-driven) faces the keep rule on t3
if (process.env.QA_ANSWER2) { await waitTurn(); await sleep(1500); await type(process.env.QA_ANSWER2); await sleep(3000); await waitTurn(); await sleep(1500); }
await shot(page, `stay-${ACC}-${process.env.QA_TAG || ""}`);
const after = await tray();
const cardText = () => page.locator("[data-testid=question-card]").innerText().then((t) => t.replace(/\s+/g, " ").slice(0, 160), () => "");
const boardText = () => page.evaluate(() => { const t = document.querySelector("[data-testid=tray]"); const f = t?.querySelector("iframe"); let txt = t?.innerText ?? ""; try { txt += " " + (f?.contentDocument?.body?.innerText ?? ""); } catch {} return (t ? t.getAttribute("data-kind") + ": " : "none ") + txt.replace(/\s+/g, " ").slice(0, 200); });
const res = { lesson, before, after, cardAfter: await cardText(), turns, trayTimeline: [...new Set(tl.map((x) => x.split(":").slice(1).join(":")))] };
if (process.env.QA_RELOAD) {
  await page.reload(); await sleep(3000);
  await page.getByRole("button", { name: /Tap to hear/ }).click({ timeout: 8000 }).catch(() => {});
  for (let k = 0; k < 160 && !/Your turn/.test(await word()); k++) await sleep(250);
  await sleep(2500);
  res.afterReload = { tray: await tray(), card: await cardText(), board: await boardText() };
  await shot(page, `stay-${ACC}-${process.env.QA_TAG || ""}-reload`);
}
console.log(JSON.stringify(res));
await b.close();
