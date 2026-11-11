// Back from a lesson entered from Home (real history), then Continue → the same lesson. env QA_ACC (default phone).
import fs from "fs";
import { launch, open, PHONE, BASE, sleep, shot } from "/home/user/Taxila/tests/e2e/qa-lib.mjs";
const Q = process.env.QA_OUT; const ACC = process.env.QA_ACC || "phone"; const acc = JSON.parse(fs.readFileSync(Q + "/accounts.json"))[ACC];
const b = await launch(); const { ctx, page, log } = await open(b, PHONE, { init: () => { try { localStorage.setItem(`taxila.child.${location.pathname.split("/")[2]}.prefs`, JSON.stringify({ hello: true })); } catch {} } });
await ctx.addCookies(JSON.parse(fs.readFileSync(`${Q}/state-${ACC}.json`)).cookies);
const starts = [];
page.on("response", async (r) => { if (/\/api\/lesson\/(start|end)$/.test(r.url())) { let q = {}; try { q = JSON.parse(r.request().postData() || "{}"); } catch {} let j = {}; try { j = await r.json(); } catch {} starts.push(`${r.url().split("/").pop()} ${r.status()} req=${q.resumeLessonId ?? q.lessonId ?? ""}${q.pagehide ? " pagehide" : ""} -> ${j.lessonId ?? ""}${j.resumed ? " resumed" : ""}${j.deferred ? " deferred" : ""}`); } });
const word = () => page.locator("[data-testid=state-word]").innerText().catch(() => "");
const home = () => page.evaluate(() => ({ path: location.pathname.replace(/\/c\/[^/]+/, ""), state: document.querySelector("[data-plan-state]")?.getAttribute("data-plan-state") ?? null, href: document.querySelector("[data-testid=start-lesson]")?.getAttribute("href")?.replace(/\/c\/[^/]+/, "") ?? null, cta: document.querySelector("[data-testid=start-lesson]")?.innerText.replace(/\s+/g, " ") ?? null }));
await page.goto(`${BASE}/c/${acc.cid}/`); await sleep(3000);
console.log("home:", JSON.stringify(await home()));
await page.locator("[data-testid=start-lesson]").click();
for (let i = 0; i < 200 && !/Your turn/.test(await word()); i++) await sleep(250);
await page.locator("[data-testid=mic]").click(); await sleep(4000); await page.locator("[data-testid=mic]").click(); // one (silent) spoken turn: Continue needs a child turn
for (let i = 0; i < 160 && !/Your turn/.test(await word()); i++) await sleep(250);
const lid = new URL(page.url()).pathname.split("/").pop();
console.log("in lesson:", lid, await word());
await page.goBack(); await sleep(Number(process.env.QA_WAIT || 3500));
const h = await home();
console.log("after Back:", JSON.stringify(h));
await shot(page, `back-${ACC}-home`);
await page.locator("[data-testid=start-lesson]").click(); await sleep(10000);
const lid2 = new URL(page.url()).pathname.split("/").pop();
console.log("after Continue:", lid2, (await page.locator("[data-testid=caption], [data-testid=question-card]").first().innerText().catch(() => "")).replace(/\s+/g, " ").slice(0, 100));
console.log("calls:", JSON.stringify(starts));
console.log("errors:", JSON.stringify({ pageerror: log.pageerror, http: log.http }).slice(0, 400));
console.log(JSON.stringify({ backLandsHome: h.path === "/" || h.path === "", continueOffered: h.state === "resume", sameLesson: lid2 === lid }), h.state === "resume" && lid2 === lid ? "PASS(rejoin)" : "NEW LESSON");
await b.close();
