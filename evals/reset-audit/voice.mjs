// Voice lesson through the real child UI with a controllable fake mic (TTS child clips injected into getUserMedia).
import { launch, ctxFor, watch, shot, textDump, probe, goto, save, sleep, api, BASE } from "./lib.mjs";
import fs from "fs";
const vp = process.argv[2] || "m"; const tag = process.argv[3] || "m4";
const ORDER = (process.argv[4] || "begin,dice,easy,divert,insist,diagram,diff,game,sad,end").split(",");
const acct = JSON.parse(fs.readFileSync(`${process.env.RA}/out/acct-${tag}.json`, "utf8"));
const clips = {}; for (const k of new Set(ORDER)) clips[k] = fs.readFileSync(`${process.env.RA}/wav/${k}.wav`).toString("base64");
const b = await launch(); const ctx = await ctxFor(vp);
await ctx.addInitScript((clips) => {
  let ac, dest;
  const ensure = () => { if (!ac) { ac = new AudioContext({ sampleRate: 48000 }); dest = ac.createMediaStreamDestination(); const o = ac.createConstantSource(); o.offset.value = 0; o.connect(dest); o.start(); } };
  const orig = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);
  navigator.mediaDevices.getUserMedia = async (c) => { if (c && c.audio) { ensure(); await ac.resume(); window.__micOpened = (window.__micOpened || 0) + 1; return dest.stream.clone ? dest.stream : dest.stream; } return orig(c); };
  window.__say = async (k) => { ensure(); await ac.resume(); const bin = Uint8Array.from(atob(clips[k]), (c) => c.charCodeAt(0)); const buf = await ac.decodeAudioData(bin.buffer); const s = ac.createBufferSource(); s.buffer = buf; s.connect(dest); s.start(); return buf.duration; };
}, clips);
const page = await ctx.newPage();
const log = { console: [], http: [] }; watch(page, log);
const T = `v-${tag}-${vp}${process.env.SUF||""}`; let i = 0; const steps = []; const resp = [];
page.on("response", async (r) => { const u = r.url(); if (/\/api\/(lesson|voice)/.test(u) && r.request().method() !== "GET" && !/tts-stream/.test(u)) { let j = null; try { j = await r.json(); } catch {} resp.push({ t: Date.now(), url: u.replace(BASE, ""), status: r.status(), body: j }); } });
const rec = async (label, extra = {}) => { const n = String(i++).padStart(2, "0"); await shot(page, `${T}-${n}-${label}`); steps.push({ n, label, t: Date.now(), url: page.url().replace(BASE, ""), text: (await textDump(page)).slice(0, 2500), frames: page.frames().map((f) => f.url().replace(BASE, "")).filter((u) => !u.includes("/c/")), ...extra }); };
const tid = (id) => page.getByTestId(id);
try {
  await goto(page, "/"); await api(page, "POST", "/api/auth/login", { email: acct.email, password: acct.pw });
  await api(page, "POST", "/api/parent/unlock", { pin: "1357" });
  await api(page, "POST", "/api/parent/controls", { childId: acct.cid, hoursStart: "00:00", hoursEnd: "23:59", dailyMinutes: 120 });
  await api(page, "POST", "/api/parent/lock", {});
  await goto(page, `/c/${acct.cid}`); await sleep(4500);
  await tid("start-lesson").or(tid("continue-lesson")).first().click(); await sleep(15000); await rec("start");
  await page.getByRole("button", { name: "OK" }).first().click().catch(() => {});
  for (const k of ORDER) {
    // wait for her to finish and the mic to be ready
    const tw = Date.now();
    while (Date.now() - tw < 45000) { const t = await textDump(page); if (/Your turn|Say it, or tap/.test(t) && await tid("mic").first().isVisible().catch(() => false)) break; if (/lesson-summary|summary/.test(await page.content().then((h) => h.slice(0, 0)))) break; await sleep(700); }
    const waited = Date.now() - tw;
    if (await tid("summary").isVisible().catch(() => false)) { await rec("summary-before-" + k); break; }
    const n0 = resp.length;
    await tid("mic").first().click().catch((e) => console.log("mic", e.message.slice(0, 60))); await sleep(400);
    const dur = await page.evaluate((k) => window.__say(k), k); await sleep(dur * 1000 + 700);
    await rec(`${k}-speaking`);
    await tid("mic").first().click().catch(() => {}); const tDone = Date.now();
    while (resp.slice(n0).every((r) => !/lesson\/turn|lesson\/end/.test(r.url)) && Date.now() - tDone < 30000) await sleep(150);
    const turnMs = Date.now() - tDone;
    const heard = resp.slice(n0).filter((r) => /transcribe/.test(r.url)).map((r) => r.body?.text ?? r.body?.transcript ?? JSON.stringify(r.body).slice(0, 200));
    await sleep(1200); await rec(`${k}-1s`, { turnMs, waited, heard });
    await sleep(9000); await rec(`${k}-10s`, { heard });
    if (["diagram", "game"].includes(k)) { await sleep(10000); await rec(`${k}-20s`); }
    console.log(k, "heard:", heard.join(" / "), "turnMs", turnMs);
    if (await tid("summary").isVisible().catch(() => false)) { await rec("summary"); break; }
  }
  await sleep(8000); await rec("final");
  if (await tid("summary").isVisible().catch(() => false)) { await page.mouse.wheel(0, 1200); await sleep(800); await rec("summary-scrolled"); }
} catch (e) { console.log("ERR", e.message.slice(0, 300)); await rec("error"); }
save(T, { steps, log, resp }); await b.close(); console.log("done");
