// 14.3.1 continuer check (TEST only): one spoken turn from QA_WAV in a fresh lesson; records POST /api/lesson/turn-ack
// (asked: continuer?, the response: kind / none) and the client's ack.outcome trace rows. env QA_ACC, QA_WAV, QA_TAG.
import fs from "fs";
import { launch, open, PHONE, BASE, sleep } from "/home/user/Taxila/tests/e2e/qa-lib.mjs";
if (!/127\.0\.0\.1|localhost/.test(BASE)) throw new Error("TEST (local) only");
const Q = process.env.QA_OUT; const ACC = process.env.QA_ACC; const acc = JSON.parse(fs.readFileSync(Q + "/accounts.json"))[ACC];
const b = await launch({ wav: process.env.QA_WAV });
const { ctx, page, log } = await open(b, PHONE, { init: () => { try { localStorage.setItem(`taxila.child.${location.pathname.split("/")[2]}.prefs`, JSON.stringify({ hello: true })); } catch {} } });
await ctx.addCookies(JSON.parse(fs.readFileSync(`${Q}/state-${ACC}.json`)).cookies);
await ctx.addInitScript(() => {
  window.__qaOnsets = []; const md = navigator.mediaDevices; if (!md?.getUserMedia) return; const orig = md.getUserMedia.bind(md); let w = false;
  md.getUserMedia = async (c) => { const st = await orig(c); if (!w && st.getAudioTracks().length) { w = true; const t = st.getAudioTracks()[0].clone(); t.enabled = true;
    const ac = new AudioContext(); const an = ac.createAnalyser(); an.fftSize = 1024; ac.createMediaStreamSource(new MediaStream([t])).connect(an); const buf = new Float32Array(an.fftSize); let q = 0;
    setInterval(() => { an.getFloatTimeDomainData(buf); let e = 0; for (const x of buf) e += x * x; if (Math.sqrt(e / buf.length) > 0.01) { if (q > 25) window.__qaOnsets.push(Date.now()); q = 0; } else q++; }, 40); } return st; };
});
const acks = []; let T0 = 0; const ev = [];
page.on("request", (r) => { const u = r.url(); if (/turn-ack|\/api\/lesson\/turn$|voice\/transcribe|tts-stream/.test(u)) ev.push(`${T0 ? Date.now() - T0 : "-"} req ${u.replace(BASE, "").replace(/\?.*/, "")}`); });
page.on("response", async (r) => {
  if (!/turn-ack/.test(r.url())) return;
  let q = {}; try { q = JSON.parse(r.request().postData() || "{}"); } catch {}
  let j = {}; try { j = await r.json(); } catch {}
  acks.push({ ms: Date.now() - T0, asked: { continuer: q.continuer ?? null }, none: j.none ?? null, kind: j.ack?.kind ?? null, phrase: j.ack?.kind === "continuer" ? j.ack?.phrase : undefined, shadow: j.ack?.shadow ?? null, keys: Object.keys(j).join(","), ackKeys: j.ack ? Object.keys(j.ack).filter((k) => k !== "pcm").join(",") : null });
});
let turnReply = null;
page.on("response", async (r) => { if (/\/api\/lesson\/turn$/.test(r.url())) { try { const j = await r.json(); turnReply = { heard: j.childText ?? null, move: j.move?.kind ?? null, reply: (j.teacherReply ?? "").slice(0, 120) }; } catch {} } });
const word = () => page.locator("[data-testid=state-word]").innerText().catch(() => "");
await page.goto(`${BASE}/c/${acc.cid}/lesson/new`);
for (let k = 0; k < 240 && !/Your turn/.test(await word()); k++) await sleep(250);
await sleep(500);
const lesson = new URL(page.url()).pathname.split("/").pop();
// press just before an utterance (the fake mic loops the WAV), release after the speech
const period = (fs.statSync(process.env.QA_WAV).size - 44) / 32000 * 1000;
let onset = null; for (let i = 0; i < 300 && !onset; i++) { onset = await page.evaluate(() => window.__qaOnsets.at(-1) ?? null); if (!onset) await sleep(100); }
if (onset) for (;;) { const pos = ((Date.now() - onset) % period + period) % period; if (pos > period - 1500 && pos < period - 900) break; await sleep(30); }
T0 = Date.now();
await page.locator("[data-testid=mic]").click();
await sleep(Number(process.env.QA_HOLD || 5500));
await page.locator("[data-testid=mic]").click();
for (let k = 0; k < 160 && !/Your turn/.test(await word()); k++) await sleep(250);
await sleep(1000);
const outcomes = log.trace.filter((e) => /^ack\./.test(String(e.k ?? e.kind ?? e.type ?? ""))).map((e) => JSON.stringify(e.data ?? e.d ?? e));
console.log(JSON.stringify({ tag: process.env.QA_TAG, lesson, onset: !!onset, acks, outcomes, turn: turnReply, ev: ev.slice(0, 12) }));
await b.close();
