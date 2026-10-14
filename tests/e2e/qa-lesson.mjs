// QA pass: a live lesson on the real Azure models. Records a timeline (what she says, the chips, the state word, the
// mic) every 300 ms and drives it with a SCRIPT of actions (env QA_SCRIPT, ';'-separated):
//   wait:<ms> | tap:<n|text> | type:<text> | talk | ask:<text typed> | end | pause | back | reload | offline:<ms> | shot:<name>
// QA_OPEN=1 first opens lessons for an hour from the parent corner (the class-time window is still live on base).
import fs from "fs";
import { launch, open, PHONE, LAPTOP, shot, dump, OUT, BASE, sleep, btn } from "./qa-lib.mjs";
const DEV = process.env.QA_DEV === "laptop" ? LAPTOP : PHONE;
const TAG = `lesson-${DEV.name}-${process.env.QA_TAG || "run"}`;
const acc = JSON.parse(fs.readFileSync(`${OUT}/accounts.json`, "utf8"))[process.env.QA_ACC || DEV.name];
const browser = await launch({ wav: process.env.QA_WAV });
const { ctx, page, log } = await open(browser, DEV, { init: process.env.QA_INIT ? new Function(`try { ${process.env.QA_INIT} } catch { /* the sandboxed module frame has no storage */ }`) : undefined });
await ctx.addCookies(JSON.parse(fs.readFileSync(`${OUT}/state-${process.env.QA_ACC || DEV.name}.json`, "utf8")).cookies);
// The fake mic loops its WAV per capture source: clone the app's own track (same source, same loop position, its own
// `enabled`) and log speech onsets, so a "say" press lands in the silence just before the utterance.
await ctx.addInitScript(() => {
  window.__qaOnsets = [];
  const md = navigator.mediaDevices; if (!md?.getUserMedia) return;
  const orig = md.getUserMedia.bind(md);
  let watching = false;
  md.getUserMedia = async (c) => {
    const st = await orig(c);
    if (!watching && st.getAudioTracks().length) {
      watching = true;
      const t = st.getAudioTracks()[0].clone(); t.enabled = true;
      const ac = new AudioContext(); const an = ac.createAnalyser(); an.fftSize = 1024; ac.createMediaStreamSource(new MediaStream([t])).connect(an);
      const buf = new Float32Array(an.fftSize); let quiet = 0;
      setInterval(() => { an.getFloatTimeDomainData(buf); let e = 0; for (const x of buf) e += x * x;
        if (Math.sqrt(e / buf.length) > 0.01) { if (quiet > 25) window.__qaOnsets.push(Date.now()); quiet = 0; } else quiet++; }, 40);
    }
    return st;
  };
});
const T0 = Date.now();
const ts = () => ((Date.now() - T0) / 1000).toFixed(1);
const timeline = [];
let last = "";
let stop = false;
const poll = (async () => {
  while (!stop) {
    const s = await page.evaluate(() => {
      const q = (sel) => [...document.querySelectorAll(sel)].map((e) => e.innerText.replace(/\s+/g, " ").trim()).filter(Boolean);
      return JSON.stringify({ path: location.pathname.replace(/\/c\/[^/]+/, ""), cap: q("[data-testid=caption]").join(" | ").slice(0, 300),
        word: q("[data-testid=state-word]").join(" "), chips: q("[data-testid=choices] button").slice(0, 6), ans: q("[data-testid=answer-row]").join(" ").slice(0, 80), card: q("[data-testid=question-card]").join(" ").slice(0, 160),
        mic: document.querySelector("[data-testid=mic]")?.getAttribute("aria-label") || document.querySelector("[data-testid=mic]")?.innerText || null,
        trouble: q("[data-testid=trouble-strip], [data-testid=trouble-screen], [data-testid=lesson-refused]").join(" ").slice(0, 200),
        board: q("[data-testid=board]").join(" ").slice(0, 160) });
    }).catch(() => null);
    if (s && s !== last) { last = s; timeline.push(`${ts()} ${s}`); console.log(`${ts()} ${s}`); }
    await sleep(300);
  }
})();

if (process.env.QA_OPEN) {
  await page.goto(`${BASE}/parent/controls?c=${acc.cid}`);
  await sleep(2000);
  if (await btn(page, "OK").count()) { for (const d of "2580") await btn(page, d).first().click(); await btn(page, "OK").first().click(); await sleep(1500); }
  await page.evaluate(() => { history.pushState({}, "", location.pathname + location.search); dispatchEvent(new PopStateEvent("popstate")); });
  // release 14: with the day limits off there is nothing to open (the button is hidden)
  const openNow = page.getByRole("button", { name: /Open now for 1 hour/ });
  if (await openNow.count()) await openNow.click(); else console.log(ts(), "no Open-now button (day limits off)");
  await sleep(1500);
  console.log(ts(), "opened lessons for an hour");
}
await page.goto(`${BASE}/c/${acc.cid}/${process.env.QA_START || ""}`);
await sleep(2500);
await shot(page, `${TAG}-00-home`);
if (!process.env.QA_START) {
  const primary = page.locator("[data-testid=primary-card] button, [data-testid=primary-card] a, [data-testid=primary-card]").first();
  console.log(ts(), "home primary:", (await primary.innerText().catch(() => "?")).replace(/\s+/g, " "));
  await primary.click().catch((e) => console.log("no primary", String(e).slice(0, 100)));
}
for (const a of (process.env.QA_SCRIPT || "wait:20000").split(";")) {
  const [k, ...rest] = a.split(":"); const v = rest.join(":");
  console.log(ts(), "ACT", a);
  try {
    if (k === "wait") await sleep(+v);
    else if (k === "tap") { const chips = page.locator("[data-testid=choices] button, [data-testid=choices] [role=radio]"); if (/^\d+$/.test(v)) await chips.nth(+v).click({ timeout: 15000 }); else await chips.filter({ hasText: v }).first().click({ timeout: 15000 }); }
    else if (k === "type") { await page.locator("[data-testid=type]").click({ timeout: 8000 }).catch(() => {}); const inp = page.locator("[data-testid=child-input]"); await inp.fill(v, { timeout: 8000 }); await page.locator("[data-testid=send]").click({ timeout: 8000 }); }
    else if (k === "talk") await page.locator("[data-testid=mic]").click({ timeout: 8000 });
    else if (k === "turn") { // wait for her to hand the floor over (Your turn), at most v ms
      const t1 = Date.now();
      while (Date.now() - t1 < (+v || 40000) && !/Your turn/.test(await page.locator("[data-testid=state-word]").innerText().catch(() => ""))) await sleep(200);
      console.log(ts(), "turn after", Date.now() - t1, "ms");
    }
    else if (k === "say") {
      // press ~1.2 s before the next utterance (onsets from the clone of the app's own mic track, see the init script)
      const period = (fs.statSync(process.env.QA_WAV).size - 44) / 32000 * 1000;
      let onset = null;
      for (let i = 0; i < 300 && !onset; i++) { onset = await page.evaluate(() => window.__qaOnsets.at(-1) ?? null); if (!onset) await sleep(100); }
      if (!onset) throw new Error("no speech onset heard on the fake mic");
      for (;;) { const pos = ((Date.now() - onset) % period + period) % period; if (pos > period - 1500 && pos < period - 900) break; await sleep(30); }
      await page.locator("[data-testid=mic]").click({ timeout: 8000 });
    }
    else if (k === "hold") { const m = page.locator("[data-testid=mic]"); const b = await m.boundingBox(); await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2); await page.mouse.down(); await sleep(+v || 4000); await page.mouse.up(); }
    else if (k === "end") { await page.locator("[data-testid=pause]").click(); await sleep(600); await page.locator("[data-testid=pause-end]").click(); await sleep(600); await page.locator("[data-testid=end-end]").click({ timeout: 8000 }); }
    else if (k === "pause") await page.locator("[data-testid=pause]").click();
    else if (k === "continue") await page.locator("[data-testid=pause-continue]").click();
    else if (k === "back") await page.goBack();
    else if (k === "reload") await page.reload();
    else if (k === "offline") { await ctx.setOffline(true); await sleep(+v || 10000); await ctx.setOffline(false); }
    else if (k === "hide") { await page.evaluate(() => { Object.defineProperty(document, "visibilityState", { value: "hidden", configurable: true }); document.dispatchEvent(new Event("visibilitychange")); }); await sleep(+v || 5000); await page.evaluate(() => { Object.defineProperty(document, "visibilityState", { value: "visible", configurable: true }); document.dispatchEvent(new Event("visibilitychange")); }); }
    else if (k === "rotate") { await page.setViewportSize({ width: DEV.viewport.height, height: DEV.viewport.width }); await sleep(3000); await shot(page, `${TAG}-rotated`);
      const m = await page.evaluate(() => { const b = document.querySelector("[data-testid=mic]")?.getBoundingClientRect(); const se = document.scrollingElement; return { mic: b ? { top: Math.round(b.top), bottom: Math.round(b.bottom) } : null, vh: innerHeight, scrollH: se.scrollHeight, overflowY: getComputedStyle(document.body).overflowY }; });
      console.log(ts(), "landscape:", JSON.stringify(m));
      await page.locator("[data-testid=mic]").scrollIntoViewIfNeeded({ timeout: 3000 }).catch(() => {}); await shot(page, `${TAG}-rotated-scrolled`);
      console.log(ts(), "mic in view after scroll:", await page.evaluate(() => { const b = document.querySelector("[data-testid=mic]")?.getBoundingClientRect(); return b ? b.bottom <= innerHeight : null; })); await page.setViewportSize(DEV.viewport); }
    else if (k === "shot") await shot(page, `${TAG}-${v}`);
    else if (k === "goto") await page.goto(`${BASE}/c/${acc.cid}/${v}`);
    else if (k === "home") { await page.goto(`${BASE}/c/${acc.cid}/`); await sleep(2500); console.log(ts(), "home:", (await page.locator("body").innerText()).replace(/\s+/g, " ").slice(0, 200)); }
    else if (k === "dbl") { const m = page.locator(v || "[data-testid=mic]"); await m.dblclick({ timeout: 8000 }); }
    else if (k === "click") await page.locator(v).first().click({ timeout: 8000 });
  } catch (e) { console.log(ts(), "ACT FAILED", a, String(e).split("\n")[0].slice(0, 200)); await shot(page, `${TAG}-actfail-${k}`); }
}
await shot(page, `${TAG}-99-end`);
stop = true; await poll;
fs.writeFileSync(`${OUT}/${TAG}-timeline.txt`, timeline.join("\n"));
console.log(JSON.stringify(dump(log, TAG)));
const kinds = {}; for (const e of log.trace) kinds[e.kind] = (kinds[e.kind] || 0) + 1;
console.log("trace kinds:", JSON.stringify(kinds));
await browser.close();
