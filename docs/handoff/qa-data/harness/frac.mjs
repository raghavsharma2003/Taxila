// 14.4 fractions: a c6-maths-ch07-t05 lesson; when the card shows the TARGET item, answer it in the form under test
// (typed QA_ANSWER, or spoken from QA_WAV); other kit items get their plain answer typed to move on; anything else gets
// a short typed nudge. Records ui.verdict / move per turn. env QA_ACC, QA_TARGET (5/7 | 3/8 | 3/4), QA_ANSWER | QA_WAV.
import fs from "fs";
import { launch, open, PHONE, BASE, sleep } from "/home/user/Taxila/tests/e2e/qa-lib.mjs";
const Q = process.env.QA_OUT; const ACC = process.env.QA_ACC; const acc = JSON.parse(fs.readFileSync(Q + "/accounts.json"))[ACC];
const ITEMS = [{ re: /2\/7[^]*3\/7/, key: "5/7" }, { re: /5\/8[^]*2\/8/, key: "3/8" }, { re: /1\/2[^]*1\/4/, key: "3/4" }, { re: /1\/3[^]*1\/6/, key: "1/2" }, { re: /5\/6[^]*1\/4/, key: "7/12" }];
const FORMS = JSON.parse(process.env.QA_FORMS || "{}"); // key → the answer in the form under test
const b = await launch({ wav: process.env.QA_WAV });
const { ctx, page } = await open(b, PHONE, { init: () => { try { localStorage.setItem(`taxila.child.${location.pathname.split("/")[2]}.prefs`, JSON.stringify({ hello: true })); } catch {} } });
await ctx.addCookies(JSON.parse(fs.readFileSync(`${Q}/state-${ACC}.json`)).cookies);
if (process.env.QA_WAV) await ctx.addInitScript(() => {
  window.__qaOnsets = []; const md = navigator.mediaDevices; if (!md?.getUserMedia) return; const orig = md.getUserMedia.bind(md); let w = false;
  md.getUserMedia = async (c) => { const st = await orig(c); if (!w && st.getAudioTracks().length) { w = true; const t = st.getAudioTracks()[0].clone(); t.enabled = true;
    const ac = new AudioContext(); const an = ac.createAnalyser(); an.fftSize = 1024; ac.createMediaStreamSource(new MediaStream([t])).connect(an); const buf = new Float32Array(an.fftSize); let q = 0;
    setInterval(() => { an.getFloatTimeDomainData(buf); let e = 0; for (const x of buf) e += x * x; if (Math.sqrt(e / buf.length) > 0.01) { if (q > 25) window.__qaOnsets.push(Date.now()); q = 0; } else q++; }, 40); } return st; };
});
let last = null;
page.on("response", async (r) => { if (/\/api\/lesson\/turn$/.test(r.url())) { try { const j = await r.json(); last = { heard: j.childText ?? j.heard ?? null, move: j.move?.kind ?? null, verdict: j.ui?.verdict ?? j.verdict ?? j.grade ?? j.move?.verdict ?? null, ui: Object.keys(j.ui ?? {}).join(','), top: Object.keys(j).join(','), reply: (j.teacherReply ?? "").slice(0, 150) }; } catch {} } });
const word = () => page.locator("[data-testid=state-word]").innerText().catch(() => "");
const waitTurn = async () => { for (let k = 0; k < 240 && !/Your turn/.test(await word()); k++) await sleep(250); };
const card = () => page.locator("[data-testid=question-card]").innerText().then((t) => t.replace(/\s+/g, " "), () => "");
const type = async (t) => { await page.locator("[data-testid=type]").click({ timeout: 8000 }).catch(() => {}); await page.locator("[data-testid=child-input]").fill(t, { timeout: 10000 }); await page.locator("[data-testid=send]").click(); };
const say = async () => {
  const period = (fs.statSync(process.env.QA_WAV).size - 44) / 32000 * 1000;
  let onset = null; for (let i = 0; i < 300 && !onset; i++) { onset = await page.evaluate(() => window.__qaOnsets.at(-1) ?? null); if (!onset) await sleep(100); }
  if (onset) for (;;) { const pos = ((Date.now() - onset) % period + period) % period; if (pos > period - 1500 && pos < period - 900) break; await sleep(30); }
  await page.locator("[data-testid=mic]").click(); await sleep(Number(process.env.QA_HOLD || 5000)); await page.locator("[data-testid=mic]").click();
};
await page.goto(`${BASE}/c/${acc.cid}/lesson/new?topic=c6-maths-ch07-t05`); await waitTurn(); await sleep(800);
const lesson = new URL(page.url()).pathname.split("/").pop();
const log = []; let result = null;
for (let n = 0; n < 12 && !result; n++) {
  const c = await card(); const it = ITEMS.find((x) => x.re.test(c));
  last = null;
  if (it && (FORMS[it.key] || (process.env.QA_WAV && it.key === process.env.QA_TARGET))) {
    if (process.env.QA_WAV) await say(); else await type(FORMS[it.key]);
    for (let k = 0; k < 120 && !last; k++) await sleep(250);
    result = { key: it.key, answered: FORMS[it.key] ?? 'spoken', card: c.slice(0, 100), ...last };
  } else {
    await type(it ? it.key : (n % 2 ? "theek hai, sawaal do" : "pata nahi"));
    for (let k = 0; k < 120 && !last; k++) await sleep(250);
    log.push(`${it ? it.key : "-"} | ${c.slice(0, 60)} → ${last?.move}/${last?.verdict}`);
  }
  await sleep(800); await waitTurn(); await sleep(800);
}
console.log(JSON.stringify({ tag: process.env.QA_TAG, lesson, target: process.env.QA_TARGET, form: process.env.QA_ANSWER ?? process.env.QA_WAV?.split("/").pop(), result, steps: log }));
await b.close();
