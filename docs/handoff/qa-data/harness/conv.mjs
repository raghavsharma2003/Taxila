// Tiered-safeguard break-it (TEST ONLY): a typed conversation, one line per turn (QA_LINES "||"). Per turn: move, Help
// sheet, board, chips, whether a helpline number shows (reply / board / sheet), her reply. A line "@chip:N" taps chip N.
import fs from "fs";
import { launch, open, PHONE, BASE, sleep, shot } from "/home/user/Taxila/tests/e2e/qa-lib.mjs";
if (!/127\.0\.0\.1|localhost/.test(BASE)) throw new Error("TEST (local) only");
const Q = process.env.QA_OUT; const ACC = process.env.QA_ACC; const acc = JSON.parse(fs.readFileSync(Q + "/accounts.json"))[ACC];
const TAG = process.env.QA_TAG || ACC;
const b = await launch(); const { ctx, page, log } = await open(b, PHONE, { init: () => { try { localStorage.setItem(`taxila.child.${location.pathname.split("/")[2]}.prefs`, JSON.stringify({ hello: true })); } catch {} } });
await ctx.addCookies(JSON.parse(fs.readFileSync(`${Q}/state-${ACC}.json`)).cookies);
let last = null; let start = null;
page.on("response", async (r) => {
  if (/\/api\/lesson\/start$/.test(r.url())) { try { const j = await r.json(); start = { lessonId: j.lessonId, topic: j.topic?.title, opening: (j.teacherOpening ?? "").slice(0, 160) }; } catch {} }
  if (/\/api\/lesson\/turn$/.test(r.url())) { try { const j = await r.json(); last = { move: j.move?.kind ?? null, beat: j.ui?.beat?.type ?? null, verdict: j.ui?.verdict ?? null, wb: j.ui?.whiteboard?.value ?? null, chipsSrv: (j.ui?.chips ?? []).map((c) => c.id), helpLead: j.helpLead ?? null, reply: j.teacherReply ?? "", topic: j.ui?.shortTitle ?? null }; } catch {} }
});
const word = () => page.locator("[data-testid=state-word]").innerText().catch(() => "");
const sheetOpen = () => page.locator("[data-testid=help-sheet], [data-testid=grownup-card]").count();
const waitTurn = async () => { for (let k = 0; k < 280 && !/Your turn/.test(await word()); k++) { if (await sheetOpen()) return; await sleep(250); } };
const view = () => page.evaluate(() => ({
  sheet: !!document.querySelector("[data-testid=help-sheet], [data-testid=grownup-card]"),
  chips: [...document.querySelectorAll("[data-testid=choices] button")].map((e) => e.innerText.replace(/\s+/g, " ").trim()),
  board: [...document.querySelectorAll("[data-testid=board]")].map((e) => e.innerText.replace(/\s+/g, " ").trim()).join(" "),
  hint: !!document.querySelector("[data-testid=hint], [data-testid=help]"),
  canType: !!document.querySelector("[data-testid=type], [data-testid=child-input]"),
  tray: (() => { const t = document.querySelector("[data-testid=tray]"); return t ? `${t.getAttribute("data-kind")}${t.querySelector("iframe,canvas,svg,img") ? "+visual" : ""}` : "none"; })(),
}));
const closeSheet = async () => {
  if (!(await sheetOpen())) return null;
  const back = page.getByText("Back to the lesson").first();
  for (let k = 0; k < 80 && !(await back.count()); k++) await sleep(250);
  if (await back.count()) { await back.click(); await sleep(1200); for (let k = 0; k < 280 && !/Your turn/.test(await word()); k++) await sleep(250); return "closed"; }
  return "no back";
};
await page.goto(`${BASE}/c/${acc.cid}/lesson/new${process.env.QA_TOPIC ? `?topic=${process.env.QA_TOPIC}` : ""}`); await waitTurn(); await sleep(1000);
const turns = [];
for (const [i, line] of process.env.QA_LINES.split("||").entries()) {
  await closeSheet();
  last = null;
  try {
    if (/^@chip:\d/.test(line)) await page.locator("[data-testid=choices] button").nth(Number(line.split(":")[1]) - 1).click({ timeout: 8000 });
    else {
      if (!(await page.locator("[data-testid=type], [data-testid=child-input]").count()) && await page.locator("[data-testid=choices] button").count()) {
        // prefer a carry-on chip; the last chip on a break offer is the stop ("Aaj ke liye bas")
        last = null; const cs = page.locator("[data-testid=choices] button"); const go = cs.filter({ hasText: /aage|carry|continue|chalo|chaliye|padh|keep|jaari|lesson/i });
        await ((await go.count()) ? go.first() : cs.first()).click(); for (let k = 0; k < 160 && !last; k++) await sleep(250);
        turns.push({ i: `${i + 1}a`, line: "@chip:last", move: last?.move, sheet: false, helpline: /1098|14416/.test(last?.reply ?? ""), board: "", chips: [], reply: (last?.reply ?? "").slice(0, 200) });
        await sleep(1200); await waitTurn(); await sleep(1000); last = null;
      }
      await page.locator("[data-testid=type]").click({ timeout: 6000 }).catch(() => {}); await page.locator("[data-testid=child-input]").fill(line, { timeout: 8000 }); await page.locator("[data-testid=send]").click(); }
  } catch (e) { const v = await view(); turns.push({ i: i + 1, line, error: "could not answer: " + String(e.message).slice(0, 60), ui: v }); continue; }
  for (let k = 0; k < 160 && !last; k++) await sleep(250);
  await sleep(1200); await waitTurn(); await sleep(1200);
  const v = await view();
  const helpline = /1098|14416/.test((last?.reply ?? "") + " " + v.board + " " + (last?.wb ?? "")) || v.sheet;
  turns.push({ i: i + 1, line, move: last?.move, beat: last?.beat, verdict: last?.verdict, sheet: v.sheet, helpline, board: v.board || last?.wb || "", chips: v.chips, tray: v.tray, topic: last?.topic, reply: (last?.reply ?? "").slice(0, 260) });
  if (helpline || v.sheet) await shot(page, `conv-${TAG}-${i + 1}`);
}
console.log(JSON.stringify({ tag: TAG, start, turns, errors: { pageerror: log.pageerror.slice(0, 3), http: log.http.slice(0, 5) } }));
await b.close();
