// QA: the same child's lesson in two tabs (a parent's laptop and the child's phone, or a second tab). Tab A starts a
// lesson and reaches her turn; tab B opens the lesson too. What does each tab show, and does A keep working?
import fs from "fs";
import { launch, open, PHONE, shot, OUT, BASE, sleep } from "./qa-lib.mjs";
const acc = JSON.parse(fs.readFileSync(`${OUT}/accounts.json`, "utf8"))[process.env.QA_ACC || "p3"];
const cookies = JSON.parse(fs.readFileSync(`${OUT}/state-${process.env.QA_ACC || "p3"}.json`, "utf8")).cookies;
const browser = await launch();
const { ctx, page: a, log } = await open(browser, PHONE);
await ctx.addCookies(cookies);
const state = (p) => p.evaluate(() => { const q = (s) => [...document.querySelectorAll(s)].map((e) => e.innerText.replace(/\s+/g, " ").trim()).join(" | "); return `${location.pathname.replace(/\/c\/[^/]+/, "")} word=${q("[data-testid=state-word]")} card=${q("[data-testid=question-card]").slice(0, 80)} trouble=${q("[data-testid=trouble-strip], [data-testid=trouble-screen], [data-testid=lesson-refused]").slice(0, 160)}`; }).catch((e) => String(e).slice(0, 80));
await a.goto(`${BASE}/c/${acc.cid}/lesson/new`);
for (let i = 0; i < 60 && !/Your turn/.test(await state(a)); i++) await sleep(500);
console.log("A before B:", await state(a));
const b = await ctx.newPage();
await b.goto(`${BASE}/c/${acc.cid}/lesson/new`);
await sleep(15000);
console.log("A after B:", await state(a)); console.log("B:", await state(b));
await shot(a, "twotabs-A"); await shot(b, "twotabs-B");
await a.bringToFront(); await a.locator("[data-testid=mic]").click().catch(() => {}); await sleep(6000);
console.log("A after a tap on Talk:", await state(a));
console.log(JSON.stringify(log.http), JSON.stringify(log.pageerror));
const starts = log.trace.filter((e) => e.kind === "net.res" && /lesson\/(start|end)/.test(e.data?.path)).map((e) => `${e.data.path} ${e.data.status} ${JSON.stringify(e.data.body).slice(0, 80)}`);
console.log(starts.join("\n"));
await browser.close();
