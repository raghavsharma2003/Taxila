import fs from "fs";
import { launch, open, PHONE, BASE, sleep } from "/home/user/Taxila/tests/e2e/qa-lib.mjs";
const Q = process.env.QA_OUT; const acc = JSON.parse(fs.readFileSync(Q + "/accounts.json")).phone;
const b = await launch(); const { ctx, page, log } = await open(b, PHONE);
await ctx.addCookies(JSON.parse(fs.readFileSync(Q + "/state-phone.json")).cookies);
const reqs = []; page.on("request", (r) => { if (/\.(mp3|wav|ogg|m4a|webm)|tts|voice/.test(r.url())) reqs.push(r.url().replace(BASE, "")); });
page.on("response", (r) => { if (/\.(mp3|wav|ogg|m4a)/.test(r.url())) reqs.push(`  -> ${r.status()} ${r.headers()["content-length"] ?? ""}`); });
await page.goto(BASE + "/c/" + acc.cid + "/hello"); await sleep(2000);
await page.evaluate(() => { const o = HTMLMediaElement.prototype.play; HTMLMediaElement.prototype.play = function () { window.__plays = (window.__plays || []).push(this.currentSrc || this.src); return o.apply(this); }; });
const t0 = Date.now(); await page.locator("[data-testid=hello-hear]").click();
for (let i = 0; i < 30; i++) { const s = await page.evaluate(() => ({ card: document.querySelector("[data-testid=hello]")?.getAttribute("data-card"), btn: document.querySelector("[data-testid=hello-hear]")?.innerText, audios: [...document.querySelectorAll("audio")].map((a) => ({ src: a.currentSrc.slice(-40), paused: a.paused, t: a.currentTime.toFixed(1), d: a.duration })) })); if (i % 2 === 0) console.log(((Date.now() - t0) / 1000).toFixed(1), JSON.stringify(s)); if (s.card !== "greet") break; await sleep(1000); }
console.log(reqs.join("\n")); console.log(JSON.stringify({ pageerror: log.pageerror, console: log.console.slice(0, 5) }));
await b.close();
