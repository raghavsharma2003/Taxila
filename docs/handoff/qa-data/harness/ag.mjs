// 14.4 affirmation check (agent lane): a lesson on QA_TOPIC; when her question matches a rule, answer it and record how her
// reply OPENS; other turns get a short nudge. env QA_ACC, QA_TOPIC, QA_RULES (JSON [[regex, answer, label], ...]), QA_BASE.
import fs from "fs";
import { launch, open, PHONE, BASE, sleep } from "/home/user/Taxila/tests/e2e/qa-lib.mjs";
const Q = process.env.QA_OUT; const ACC = process.env.QA_ACC; const acc = JSON.parse(fs.readFileSync(Q + "/accounts.json"))[ACC];
const RULES = JSON.parse(process.env.QA_RULES).map(([re, a, l]) => ({ re: new RegExp(re, "i"), a, l }));
const b = await launch(); const { ctx, page } = await open(b, PHONE, { init: () => { try { localStorage.setItem(`taxila.child.${location.pathname.split("/")[2]}.prefs`, JSON.stringify({ hello: true })); } catch {} } });
await ctx.addCookies(JSON.parse(fs.readFileSync(`${Q}/state-${ACC}.json`)).cookies);
let last = null; let lane = null;
page.on("response", async (r) => {
  if (/\/api\/lesson\/start$/.test(r.url())) { try { const j = await r.json(); lane = j.lane ?? j.mode ?? j.debug?.lane ?? null; } catch {} }
  if (/\/api\/lesson\/turn$/.test(r.url())) { try { const j = await r.json(); last = { move: j.move?.kind ?? null, verdict: j.ui?.verdict ?? null, reply: (j.teacherReply ?? "").slice(0, 200) }; } catch {} }
});
const word = () => page.locator("[data-testid=state-word]").innerText().catch(() => "");
const waitTurn = async () => { for (let k = 0; k < 240 && !/Your turn/.test(await word()); k++) await sleep(250); };
const card = () => page.locator("[data-testid=question-card]").innerText().then((t) => t.replace(/\s+/g, " "), () => "");
const type = async (t) => { await page.locator("[data-testid=type]").click({ timeout: 8000 }).catch(() => {}); await page.locator("[data-testid=child-input]").fill(t, { timeout: 10000 }); await page.locator("[data-testid=send]").click(); };
await page.goto(`${BASE}/c/${acc.cid}/lesson/new?topic=${process.env.QA_TOPIC}`); await waitTurn(); await sleep(800);
const lesson = new URL(page.url()).pathname.split("/").pop();
const hits = []; const steps = [];
for (let n = 0; n < Number(process.env.QA_TURNS || 10) && hits.length < RULES.length; n++) {
  const c = await card(); const rule = RULES.find((r) => r.re.test(c) && (process.env.QA_REPEAT || !hits.some((h) => h.label === r.l)));
  last = null;
  const NUDGES = JSON.parse(process.env.QA_NUDGES || '["pata nahi","theek hai, aage poochiye"]'); // QA_NUDGES: the lines for non-matching turns, in turn
  try { await type(rule ? rule.a : NUDGES[Math.min(n, NUDGES.length - 1)] ?? NUDGES[n % NUDGES.length]); } catch { steps.push(`no type field | ${c.slice(0, 60)}`); await page.locator("[data-testid=choices] button").first().click().catch(() => {}); }
  for (let k = 0; k < 120 && !last; k++) await sleep(250);
  if (rule) hits.push({ label: rule.l, asked: c.slice(0, 120), answered: rule.a, ...last, opens: (last?.reply ?? "").split(/[\s,.!—–-]+/).slice(0, 2).join(" ") });
  else steps.push(`${c.slice(0, 70)} → ${last?.move}`);
  await sleep(800); await waitTurn(); await sleep(800);
}
console.log(JSON.stringify({ lesson, lane, hits, steps }));
await b.close();
