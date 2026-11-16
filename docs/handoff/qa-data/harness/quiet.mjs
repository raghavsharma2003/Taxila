// Pass 12 (14.2) — TEST ONLY. Typed lines, each in its own fresh lesson: does the safeguard fire?
// env QA_ACC, QA_LINES ("||"-separated), QA_BASE (local), QA_OUT.
import fs from "fs";
import { launch, open, PHONE, BASE, sleep, shot } from "/home/user/Taxila/tests/e2e/qa-lib.mjs";
if (!/127\.0\.0\.1|localhost/.test(BASE)) throw new Error("quiet.mjs may write safeguarding incidents: TEST (local) only");
const Q = process.env.QA_OUT; const ACC = process.env.QA_ACC; const acc = JSON.parse(fs.readFileSync(Q + "/accounts.json"))[ACC];
const b = await launch(); const { ctx, page } = await open(b, PHONE, { init: () => { try { localStorage.setItem(`taxila.child.${location.pathname.split("/")[2]}.prefs`, JSON.stringify({ hello: true })); } catch {} } });
await ctx.addCookies(JSON.parse(fs.readFileSync(`${Q}/state-${ACC}.json`)).cookies);
let turnBody = null;
page.on("response", async (r) => { if (/\/api\/lesson\/turn$/.test(r.url())) { try { turnBody = await r.json(); } catch {} } });
const word = () => page.locator("[data-testid=state-word]").innerText().catch(() => "");
const results = [];
for (const [i, line] of process.env.QA_LINES.split("||").entries()) {
  await page.goto(`${BASE}/c/${acc.cid}/lesson/new`);
  for (let k = 0; k < 200 && !/Your turn/.test(await word()); k++) await sleep(250);
  await sleep(1000);
  turnBody = null;
  await page.locator("[data-testid=type]").click({ timeout: 8000 }).catch(() => {});
  await page.locator("[data-testid=child-input]").fill(line);
  await page.locator("[data-testid=send]").click();
  let sheet = null;
  for (let k = 0; k < 100; k++) {
    sheet = await page.locator("[data-testid=help-sheet], [data-testid=grownup-card]").count() ? "help-sheet" : null;
    if (sheet || (turnBody && /Your turn/.test(await word()))) break;
    await sleep(300);
  }
  await sleep(1500);
  const cap = (await page.locator("[data-testid=caption], [data-testid=question-card]").allInnerTexts().catch(() => [])).join(" | ").replace(/\s+/g, " ").slice(0, 220);
  const move = turnBody?.move?.kind ?? turnBody?.debug?.move?.kind ?? null;
  results.push({ line, safeguard: !!sheet || move === "safeguard", sheet, move, reply: turnBody?.teacherReply?.slice?.(0, 200) ?? cap, lesson: new URL(page.url()).pathname.split("/").pop() });
  await shot(page, `quiet-${ACC}-${i}`);
  // leave the lesson by End so the next line starts clean
  await page.getByRole("button", { name: /Pause/ }).first().click().catch(() => {}); await sleep(800);
  await page.locator("[data-testid=pause-end]").click().catch(() => {}); await sleep(600);
  await page.getByRole("button", { name: "End lesson", exact: true }).last().click().catch(() => {}); await sleep(3000);
}
for (const r of results) console.log(JSON.stringify(r));
await b.close();
