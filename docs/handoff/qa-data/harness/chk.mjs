// Pass 12 (14.2) — TEST DB ONLY. Disclosure → Back → Continue: resume refused, the fresh lesson opens on the check-in;
// Carry on → lesson; a second new lesson opens normally; a NEW disclosure checks in again.
// env QA_ACC, QA_TEXT (typed disclosure) or QA_WAV (spoken, young child), QA_TEXT2 (second disclosure), QA_BASE, QA_OUT.
import fs from "fs";
import { launch, open, PHONE, LAPTOP, BASE, sleep, shot } from "/home/user/Taxila/tests/e2e/qa-lib.mjs";
if (!/127\.0\.0\.1|localhost/.test(BASE)) throw new Error("chk.mjs writes safeguarding incidents: TEST (local) only");
const Q = process.env.QA_OUT; const ACC = process.env.QA_ACC; const acc = JSON.parse(fs.readFileSync(Q + "/accounts.json"))[ACC];
const DEV = process.env.QA_DEV === "laptop" ? LAPTOP : PHONE;
const TAG = `chk-${ACC}-${DEV.name}`;
const b = await launch({ wav: process.env.QA_WAV });
const { ctx, page, log } = await open(b, DEV, { init: () => { try { localStorage.setItem(`taxila.child.${location.pathname.split("/")[2]}.prefs`, JSON.stringify({ hello: true })); } catch {} } });
await ctx.addCookies(JSON.parse(fs.readFileSync(`${Q}/state-${ACC}.json`)).cookies);
const calls = [];
page.on("response", async (r) => {
  if (!/\/api\/lesson\/(start|end)$/.test(r.url())) return;
  let q = {}; try { q = JSON.parse(r.request().postData() || "{}"); } catch {}
  let j = {}; try { j = await r.json(); } catch {}
  calls.push({ at: r.url().split("/").pop(), status: r.status(), req: q.resumeLessonId ?? q.lessonId ?? null, lessonId: j.lessonId ?? null, resumed: !!j.resumed, helpLead: j.helpLead ?? null, opening: j.teacherOpening ?? null, deferred: !!j.deferred, mods: JSON.stringify(j.moduleCommands ?? []).slice(0, 400), ui: JSON.stringify(j.ui ?? {}).slice(0, 400) });
});
const word = () => page.locator("[data-testid=state-word]").innerText().catch(() => "");
const waitTurn = async (n = 200) => { for (let i = 0; i < n && !/Your turn/.test(await word()); i++) await sleep(250); };
const view = () => page.evaluate(() => {
  const q = (s) => [...document.querySelectorAll(s)].map((e) => e.innerText.replace(/\s+/g, " ").trim()).filter(Boolean);
  const sheet = document.querySelector("[data-testid=help-sheet], [data-testid=grownup-card]");
  return { path: location.pathname.replace(/\/c\/[^/]+/, ""), cap: q("[data-testid=caption]").join(" | ").slice(0, 300), card: q("[data-testid=question-card]").join(" ").slice(0, 200),
    hint: !!document.querySelector("[data-testid=hint], [data-testid=help]"), board: q("[data-testid=board]").join(" ").slice(0, 300), chips: q("[data-testid=choices] button"), sheet: sheet?.dataset.testid ?? null,
    lead: sheet ? [...sheet.querySelectorAll("[data-lead]")].map((e) => e.dataset.testid)[0] ?? null : null,
    plan: document.querySelector("[data-plan-state]")?.getAttribute("data-plan-state") ?? null };
});
const disclose = async (text) => {
  if (process.env.QA_WAV && !text) { await page.locator("[data-testid=mic]").click(); await sleep(12000); await page.locator("[data-testid=mic]").click(); }
  else { await page.locator("[data-testid=type]").click({ timeout: 8000 }).catch(() => {}); await page.locator("[data-testid=child-input]").fill(text); await page.locator("[data-testid=send]").click(); }
  let v; for (let i = 0; i < 80; i++) { v = await view(); if (v.sheet) break; await sleep(500); }
  return v;
};
const fromHome = async () => {
  await page.goto(`${BASE}/c/${acc.cid}/`); await sleep(3000);
  const h = await view();
  await page.locator("[data-testid=start-lesson]").click();
  await waitTurn(); await sleep(1500);
  return h;
};
const REVEAL = /papa|maar|ghar|dar |darr|hurt|uncle|beat|पापा|मार|घर|डर|cut|kaat|काट/i;
const isCheckin = (v, c) => /1098/.test(v.board + v.cap + v.card) && /14416/.test(v.board + v.cap + v.card);
const out = {};
// A. a lesson, then the disclosure
await fromHome();
const lid1 = new URL(page.url()).pathname.split("/").pop();
const d1 = await disclose(process.env.QA_TEXT);
out.disclosure1 = { lid: lid1, sheet: d1.sheet, lead: d1.lead };
await shot(page, `${TAG}-1-sheet`);
// B. Back → Home → Continue/Start
await page.goBack(); await sleep(3500);
const h = await view();
out.homeAfterBack = h.plan;
await page.locator("[data-testid=start-lesson]").click();
await waitTurn(); await sleep(2500);
const s2 = calls.filter((c) => c.at === "start").at(-1);
const v2 = await view();
await shot(page, `${TAG}-2-checkin`);
out.checkin = { hint: v2.hint, mods: s2?.mods, ui: s2?.ui, req: s2?.req, lessonId: s2?.lessonId, resumed: s2?.resumed, helpLead: s2?.helpLead, opening: s2?.opening, board: v2.board, chips: v2.chips, sheetOpen: v2.sheet,
  numbersOnBoard: /1098/.test(v2.board) && /14416/.test(v2.board), numbersInLine: /1098/.test(s2?.opening ?? "") && /14416/.test(s2?.opening ?? ""),
  reveals: REVEAL.test((s2?.opening ?? "") + " " + v2.board) ? ((s2?.opening ?? "") + " " + v2.board).match(REVEAL)[0] : null };
// C. Carry on
const carry = page.locator("[data-testid=choices] button").first();
out.carryChip = await carry.innerText().catch(() => null);
await carry.click().catch(() => {}); await sleep(1000); await waitTurn(); await sleep(1500);
const v3 = await view();
out.afterCarry = { hint: v3.hint, cap: v3.cap, board: v3.board.slice(0, 120), chips: v3.chips };
await shot(page, `${TAG}-3-carry`);
// D. a second new lesson the same day
await page.getByRole("button", { name: /Pause/ }).first().click().catch(() => {}); await sleep(1500);
out.pauseButtons = await page.locator("[role=dialog] button, [role=dialog] a").allInnerTexts().catch(() => []);
await page.locator("[data-testid=pause-end]").click().catch(() => {}); await sleep(800); await page.getByRole("button", { name: "End lesson", exact: true }).last().click().catch(() => console.log("no confirm")); await sleep(6000);
await fromHome();
const s4 = calls.filter((c) => c.at === "start").at(-1);
const v4 = await view();
out.second = { lessonId: s4?.lessonId, opening: s4?.opening, checkin: isCheckin(v4) || /1098/.test(s4?.opening ?? ""), helpLead: s4?.helpLead };
// E. a NEW disclosure → Back → start: checks in again
if (process.env.QA_TEXT2 || process.env.QA_WAV) {
  const d2 = await disclose(process.env.QA_TEXT2);
  out.disclosure2 = { sheet: d2.sheet, lead: d2.lead };
  await page.goBack(); await sleep(3500);
  await page.locator("[data-testid=start-lesson]").click(); await waitTurn(); await sleep(2500);
  const s5 = calls.filter((c) => c.at === "start").at(-1); const v5 = await view();
  out.again = { resumed: s5?.resumed, opening: s5?.opening, board: v5.board.slice(0, 160), checkin: isCheckin(v5) || (/1098/.test(s5?.opening ?? "") && /14416/.test(s5?.opening ?? "")) };
  await shot(page, `${TAG}-5-again`);
}
out.calls = calls.map((c) => `${c.at} ${c.status} ${c.req ?? ""}→${c.lessonId ?? ""}${c.resumed ? " RESUMED" : ""}${c.deferred ? " deferred" : ""}${c.helpLead ? " lead=" + c.helpLead : ""}`);
out.errors = { pageerror: log.pageerror.slice(0, 3), http: log.http.slice(0, 5) };
console.log(JSON.stringify(out, null, 1));
await b.close();
