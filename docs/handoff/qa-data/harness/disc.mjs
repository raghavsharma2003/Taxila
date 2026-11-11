// Pass 11 probe: a typed disclosure mid-lesson → Help sheet lead (D23), then reload → no resume of the old lesson
// without the sheet. env QA_ACC, QA_TEXT, QA_TAG, QA_BASE, QA_OUT.
import fs from "fs";
import { launch, open, PHONE, shot, OUT, BASE, sleep } from "/home/user/Taxila/tests/e2e/qa-lib.mjs";
const ACC = process.env.QA_ACC || "c6";
const TAG = `disc-${process.env.QA_TAG || ACC}`;
const acc = JSON.parse(fs.readFileSync(`${OUT}/accounts.json`, "utf8"))[ACC];
const browser = await launch({});
const { ctx, page } = await open(browser, PHONE);
await ctx.addCookies(JSON.parse(fs.readFileSync(`${OUT}/state-${ACC}.json`, "utf8")).cookies);
const starts = [];
page.on("response", async (r) => {
  if (!/\/api\/lesson\/start$/.test(r.url())) return;
  let req = {}; try { req = JSON.parse(r.request().postData() || "{}"); } catch {}
  let body = {}; try { body = await r.json(); } catch {}
  starts.push({ status: r.status(), resumeLessonId: req.resumeLessonId ?? null, lessonId: body.lessonId ?? body.lesson?.id ?? null, resumed: body.resumed ?? null, hold: body.hold ?? body.reason ?? body.code ?? null });
});
const state = () => page.evaluate(() => {
  const sheet = document.querySelector("[data-testid=help-sheet], [data-testid=grownup-card]");
  const btns = sheet ? [...sheet.querySelectorAll("a,button")].map((b) => `${b.dataset.testid}${b.dataset.lead ? "*" : ""}`) : null;
  const q = (s) => [...document.querySelectorAll(s)].map((e) => e.innerText.replace(/\s+/g, " ").trim()).join(" | ").slice(0, 200);
  return { path: location.pathname.replace(/\/c\/[^/]+/, ""), sheet: sheet?.dataset.testid ?? null, btns, sheetText: sheet ? sheet.innerText.replace(/\s+/g, " ").slice(0, 220) : null, cap: q("[data-testid=caption]"), refused: q("[data-testid=lesson-refused], [data-testid=trouble-screen]") };
});
await page.goto(`${BASE}/c/${acc.cid}/lesson/new`);
for (let i = 0; i < 60; i++) { if (await page.locator("[data-testid=type], [data-testid=child-input]").count()) break; await sleep(500); }
await sleep(14000);
await page.locator("[data-testid=type]").click({ timeout: 8000 }).catch(() => {});
await page.locator("[data-testid=child-input]").fill(process.env.QA_TEXT, { timeout: 8000 });
await page.locator("[data-testid=send]").click({ timeout: 8000 });
let s;
for (let i = 0; i < 60; i++) { s = await state(); if (s.sheet) break; await sleep(500); }
console.log("after disclosure:", JSON.stringify(s));
await shot(page, `${TAG}-sheet`);
await sleep(1500);
await page.reload();
await sleep(3000);
await page.getByRole("button", { name: /Tap to hear/ }).click({ timeout: 8000 }).catch(() => console.log("no tap gate"));
await sleep(15000);
const r = await state();
console.log("after reload:", JSON.stringify(r));
await shot(page, `${TAG}-reload`);
console.log("starts:", JSON.stringify(starts));
const first = starts[0]?.lessonId;
const again = starts.slice(1).find((x) => x.lessonId === first);
const ok = !!s.sheet && (!again || !!r.sheet);
console.log(JSON.stringify({ sheetShown: !!s.sheet, lead: s.btns?.find((b) => b.endsWith("*")) ?? null, oldLessonAgain: !!again, sheetAfterReload: !!r.sheet }), ok ? "PASS" : "FAIL");
await browser.close();
