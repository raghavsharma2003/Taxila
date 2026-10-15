// D24 e2e (r5 QA): a reload at her turn rejoins the SAME lesson. Start a lesson, answer once (typed), reload at her next
// turn; expected: the URL names the lesson, the second POST /api/lesson/start answers the same lessonId with
// resumed: true, she says her last line again, and an answer after the reload gets a new reply (not a replay).
// QA_ACC must be an older child (typing). Prints PASS/FAIL.
import fs from "fs";
import { launch, open, PHONE, OUT, BASE, sleep } from "./qa-lib.mjs";
const A = process.env.QA_ACC || "c6";
const acc = JSON.parse(fs.readFileSync(`${OUT}/accounts.json`, "utf8"))[A];
const b = await launch();
const { ctx, page, log } = await open(b, PHONE, { init: () => { try { localStorage.setItem(`taxila.child.${location.pathname.split("/")[2]}.prefs`, JSON.stringify({ hello: true })); } catch { /* sandboxed frame */ } } });
await ctx.addCookies(JSON.parse(fs.readFileSync(`${OUT}/state-${A}.json`, "utf8")).cookies);
const word = () => page.locator("[data-testid=state-word]").innerText().catch(() => "");
const yourTurn = async (ms = 45000) => { const t = Date.now(); while (Date.now() - t < ms) { if (/Your turn/.test(await word())) return true; await sleep(250); } return false; };
const type = async (text) => { await page.locator("[data-testid=type]").click({ timeout: 8000 }).catch(() => {}); await page.locator("[data-testid=child-input]").fill(text); await page.locator("[data-testid=send]").click(); };
await page.goto(`${BASE}/c/${acc.cid}/lesson/new`);
await yourTurn(); await type("pata nahi"); await sleep(1500); await yourTurn();
const urlBefore = new URL(page.url()).pathname;
await page.reload(); await sleep(2000);
const hear = page.locator("[data-testid=tap-to-hear]"); if (await hear.count()) await hear.click().catch(() => {});
await yourTurn(); await type("haan"); await sleep(1500); await yourTurn();
await sleep(2500); // the recorder flushes
const starts = log.trace.filter((e) => e.kind === "net.res" && /\/api\/lesson\/start$/.test(e.data?.path)).map((e) => e.data.body);
const lines = log.trace.filter((e) => e.kind === "tts.request").map((e) => e.data.text);
const turns = log.trace.filter((e) => e.kind === "net.res" && /\/api\/lesson\/turn$/.test(e.data?.path));
const r = {
  urlNamesLesson: /\/lesson\/[0-9a-f-]{36}$/.test(urlBefore) && urlBefore.endsWith(starts[0]?.lessonId ?? "x"),
  sameLesson: starts.length === 2 && starts[0].lessonId === starts[1].lessonId,
  resumed: starts[1]?.resumed === true,
  lastLineAgain: lines.length >= 3 && lines[2] === lines[1],
  freshReplyAfter: turns.length >= 2 && turns.at(-1).data.status === 200 && lines.length >= 4 && lines.at(-1) !== lines[1],
};
console.log(JSON.stringify(r), Object.values(r).every(Boolean) ? "PASS" : "FAIL");
await b.close();
