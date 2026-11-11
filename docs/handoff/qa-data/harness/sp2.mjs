// Two spoken turns from ONE looping WAV (TEST only): segment A (low mood) on turn 1, segment B ("पता नहीं") on turn 2.
// The fake mic loops the file; onsets come from a clone of the app's own track. A→B gap ~11.17 s, B→A ~6.33 s, period
// 17.5 s. env QA_ACC, QA_WAV, QA_TOPIC, QA_BASE (local), QA_OUT.
import fs from "fs";
import { launch, open, PHONE, BASE, sleep, shot } from "/home/user/Taxila/tests/e2e/qa-lib.mjs";
if (!/127\.0\.0\.1|localhost/.test(BASE)) throw new Error("TEST (local) only");
const Q = process.env.QA_OUT; const ACC = process.env.QA_ACC; const acc = JSON.parse(fs.readFileSync(Q + "/accounts.json"))[ACC];
const SEG = { A: { start: 1.5, len: 4.17 }, B: { start: 12.67, len: 1.83 } }; const PERIOD = 17.5;
const b = await launch({ wav: process.env.QA_WAV });
const { ctx, page } = await open(b, PHONE, { init: () => { try { localStorage.setItem(`taxila.child.${location.pathname.split("/")[2]}.prefs`, JSON.stringify({ hello: true })); } catch {} } });
await ctx.addCookies(JSON.parse(fs.readFileSync(`${Q}/state-${ACC}.json`)).cookies);
await ctx.addInitScript(() => {
  window.__qaOnsets = []; const md = navigator.mediaDevices; if (!md?.getUserMedia) return; const orig = md.getUserMedia.bind(md); let w = false;
  md.getUserMedia = async (c) => { const st = await orig(c); if (!w && st.getAudioTracks().length) { w = true; const t = st.getAudioTracks()[0].clone(); t.enabled = true;
    const ac = new AudioContext(); const an = ac.createAnalyser(); an.fftSize = 1024; ac.createMediaStreamSource(new MediaStream([t])).connect(an); const buf = new Float32Array(an.fftSize); let q = 0;
    setInterval(() => { an.getFloatTimeDomainData(buf); let e = 0; for (const x of buf) e += x * x; if (Math.sqrt(e / buf.length) > 0.01) { if (q > 25) window.__qaOnsets.push(Date.now()); q = 0; } else q++; }, 40); } return st; };
});
let last = null;
page.on("response", async (r) => { if (/\/api\/lesson\/turn$/.test(r.url())) { try { const j = await r.json(); last = { move: j.move?.kind ?? null, reply: j.teacherReply ?? "" }; } catch {} } });
const word = () => page.locator("[data-testid=state-word]").innerText().catch(() => "");
const waitTurn = async () => { for (let k = 0; k < 280 && !/Your turn/.test(await word()); k++) { if (await page.locator("[data-testid=help-sheet]").count()) return; await sleep(250); } };
await page.goto(`${BASE}/c/${acc.cid}/lesson/new${process.env.QA_TOPIC ? `?topic=${process.env.QA_TOPIC}` : ""}`); await waitTurn(); await sleep(800);
const lesson = new URL(page.url()).pathname.split("/").pop();
// find the loop phase: an onset followed ~11.17 s later by another is segment A
let tA = null;
for (let k = 0; k < 400 && tA === null; k++) {
  const on = await page.evaluate(() => window.__qaOnsets.slice());
  for (let i = 0; i + 1 < on.length; i++) { const d = (on[i + 1] - on[i]) / 1000; if (Math.abs(d - 11.17) < 0.8) { tA = on[i] - SEG.A.start * 1000; break; } }
  if (tA === null) await sleep(250);
}
if (tA === null) throw new Error("loop phase not found");
const press = async (seg) => {
  const s = SEG[seg];
  for (;;) { const pos = (((Date.now() - tA) / 1000) % PERIOD + PERIOD) % PERIOD; if (pos > s.start - 1.1 && pos < s.start - 0.7) break; await sleep(20); }
  await page.locator("[data-testid=mic]").click(); await sleep((s.len + 1.6) * 1000); await page.locator("[data-testid=mic]").click();
};
const turns = [];
for (const seg of ["A", "B"]) {
  last = null; await press(seg);
  for (let k = 0; k < 200 && !last; k++) await sleep(250);
  await sleep(1500); await waitTurn(); await sleep(1500);
  const sheet = !!(await page.locator("[data-testid=help-sheet], [data-testid=grownup-card]").count());
  turns.push({ seg, move: last?.move, sheet, helpline: /1098|14416/.test(last?.reply ?? "") || sheet, safeWord: /\bsafe\b|surakshit|सुरक्षित/i.test(last?.reply ?? ""), reply: (last?.reply ?? "").slice(0, 240) });
  if (sheet) break;
}
await shot(page, `sp2-${ACC}`);
console.log(JSON.stringify({ lesson, turns }));
await b.close();
