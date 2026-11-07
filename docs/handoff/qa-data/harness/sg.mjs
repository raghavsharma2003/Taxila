// Pass 13 — TEST ONLY. A distress line typed mid-lesson (a model-opened safeguard), then a follow-up line; per step: the
// move, the Help sheet, chips, Hint/Help, board, her reply. A carried check-in at the start is recorded and carried on.
// env QA_ACC, QA_LINE, QA_FOLLOW, QA_BASE (local), QA_OUT.
import fs from "fs";
import { launch, open, PHONE, BASE, sleep, shot } from "/home/user/Taxila/tests/e2e/qa-lib.mjs";
if (!/127\.0\.0\.1|localhost/.test(BASE)) throw new Error("sg.mjs writes safeguarding incidents: TEST (local) only");
const Q = process.env.QA_OUT; const ACC = process.env.QA_ACC; const acc = JSON.parse(fs.readFileSync(Q + "/accounts.json"))[ACC];
const TAG = process.env.QA_TAG || ACC;
const b = await launch(); const { ctx, page, log } = await open(b, PHONE, { init: () => { try { localStorage.setItem(`taxila.child.${location.pathname.split("/")[2]}.prefs`, JSON.stringify({ hello: true })); } catch {} } });
await ctx.addCookies(JSON.parse(fs.readFileSync(`${Q}/state-${ACC}.json`)).cookies);
let last = null; const starts = [];
page.on("response", async (r) => {
  if (/\/api\/lesson\/turn$/.test(r.url())) { try { const j = await r.json(); last = { move: j.move?.kind ?? null, reply: j.teacherReply ?? "", chips: (j.ui?.chips ?? []).map((c) => `${c.id}:${c.label}`), helpLead: j.helpLead ?? null, beat: j.ui?.beat?.type ?? null, wb: j.ui?.whiteboard?.value ?? null }; } catch {} }
  if (/\/api\/lesson\/start$/.test(r.url())) { try { const j = await r.json(); starts.push({ lessonId: j.lessonId, opening: (j.teacherOpening ?? "").slice(0, 200), chips: (j.ui?.chips ?? []).map((c) => `${c.id}:${c.label}`), wb: j.ui?.whiteboard?.value ?? null, helpLead: j.helpLead ?? null }); } catch {} }
});
const word = () => page.locator("[data-testid=state-word]").innerText().catch(() => "");
const view = () => page.evaluate(() => ({
  sheet: document.querySelector("[data-testid=help-sheet], [data-testid=grownup-card]")?.dataset.testid ?? null,
  chips: [...document.querySelectorAll("[data-testid=choices] button")].map((e) => e.innerText.replace(/\s+/g, " ").trim()),
  hint: !!document.querySelector("[data-testid=hint], [data-testid=help]"),
  board: [...document.querySelectorAll("[data-testid=board]")].map((e) => e.innerText.replace(/\s+/g, " ").trim()).join(" "),
  type: !!document.querySelector("[data-testid=type], [data-testid=child-input]"),
}));
const waitTurn = async (n = 240) => { for (let k = 0; k < n && !/Your turn/.test(await word()); k++) { if (await page.locator("[data-testid=help-sheet], [data-testid=grownup-card]").count()) break; await sleep(250); } };
const type = async (t) => { await page.locator("[data-testid=type]").click({ timeout: 8000 }).catch(() => {}); await page.locator("[data-testid=child-input]").fill(t, { timeout: 10000 }); await page.locator("[data-testid=send]").click(); };
const out = { steps: [] };
await page.goto(`${BASE}/c/${acc.cid}/lesson/new`); await waitTurn(); await sleep(1500);
const v0 = await view();
out.start = { ...starts.at(-1), ui: v0 };
if (v0.chips.some((c) => /carry|aage|आगे/i.test(c)) || starts.at(-1)?.chips.some((c) => /^safe:/.test(c))) {
  await shot(page, `sg-${TAG}-0-checkin`);
  await page.locator("[data-testid=choices] button").first().click(); await sleep(1500); await waitTurn(); await sleep(1500);
  out.afterCarry = { ...last, ui: await view() };
}
for (const [i, line] of [process.env.QA_LINE, process.env.QA_FOLLOW].filter(Boolean).entries()) {
  last = null;
  // close a Help sheet that is open (the child goes back to the lesson)
  if (await page.locator("[data-testid=help-sheet], [data-testid=grownup-card]").count()) {
    const back = page.getByText("Back to the lesson").first(); const tb = Date.now(); for (let k = 0; k < 80 && !(await back.count()); k++) await sleep(250); out.backAfterMs = Date.now() - tb;
    out.steps.push({ closeSheet: await back.count() ? (await back.click().then(() => "closed", () => "click failed")) : "no back button" }); await sleep(1500);
    const tw = Date.now(); for (let k = 0; k < 240 && !/Your turn/.test(await word()); k++) await sleep(250); out.yourTurnAfterBackMs = Date.now() - tw; out.atYourTurn = await view();
  }
  try { await type(line); } catch (e) {
    out.steps.push({ line, couldNotType: true, ui: await view(), dock: await page.locator("[data-testid=dock], .dk-dock").first().innerText().catch(() => null), last });
    await shot(page, `sg-${TAG}-${i + 1}-notype`); break;
  }
  for (let k = 0; k < 120 && !last; k++) await sleep(250);
  await sleep(1500); await waitTurn(); await sleep(1500);
  out.steps.push({ line, ...last, ui: await view() });
  await shot(page, `sg-${TAG}-${i + 1}`);
}
out.errors = { pageerror: log.pageerror.slice(0, 3), http: log.http.slice(0, 5) };
console.log(JSON.stringify(out, null, 1));
await b.close();
