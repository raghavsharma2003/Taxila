// D35 evidence: "number line pe dikhao" in a fresh lesson; every turn response (ui.tray, ui.studioSlot), every Studio
// stream message, and the tray's DOM state, each with ms since the ask was sent. env QA_ACC, QA_ASK, QA_BASE, QA_OUT.
import fs from "fs";
import { launch, open, PHONE, BASE, sleep, shot } from "/home/user/Taxila/tests/e2e/qa-lib.mjs";
const Q = process.env.QA_OUT; const ACC = process.env.QA_ACC; const acc = JSON.parse(fs.readFileSync(Q + "/accounts.json"))[ACC];
const ASK = process.env.QA_ASK || "number line pe dikhao";
const b = await launch(); const { ctx, page, log } = await open(b, PHONE, { init: () => { try { localStorage.setItem(`taxila.child.${location.pathname.split("/")[2]}.prefs`, JSON.stringify({ hello: true })); } catch {} } });
await ctx.addCookies(JSON.parse(fs.readFileSync(`${Q}/state-${ACC}.json`)).cookies);
await ctx.addInitScript(() => {
  window.__es = [];
  const ES = window.EventSource; if (!ES) return;
  window.EventSource = class extends ES {
    constructor(u, o) { super(u, o); const url = String(u);
      this.addEventListener("message", (e) => { let m = null; try { m = JSON.parse(e.data); } catch {} window.__es.push({ at: Date.now(), url: url.replace(/\?.*/, ""), t: m?.t ?? null, intentId: m?.intentId ?? m?.slot?.intentId ?? null, state: m?.state ?? m?.slot?.state ?? null, raw: String(e.data).slice(0, m?.t === "script" ? 20000 : 240) }); });
      this.addEventListener("error", () => window.__es.push({ at: Date.now(), url: url.replace(/\?.*/, ""), t: "ES_ERROR" }));
    }
  };
});
let T0 = 0; const ev = [];
page.on("request", (r) => { if (/\/api\/(lesson\/turn|studio\/|voice\/|tts)/.test(r.url())) ev.push({ ms: T0 ? Date.now() - T0 : null, k: "req", u: r.url().replace(BASE, "").replace(/\?.*/, "") }); });
page.on("response", async (r) => {
  if (!/\/api\/(lesson\/turn|studio\/(?!stream))/.test(r.url())) return;
  let j = null; try { j = await r.json(); } catch {}
  const ui = j?.ui ?? {};
  ev.push({ ms: T0 ? Date.now() - T0 : null, k: "res", u: r.url().replace(BASE, "").replace(/\?.*/, ""), status: r.status(), seq: j?.teacherReplySeq ?? j?.seq ?? null, tray: ui.tray ?? null,
    slot: ui.studioSlot ? { slotId: ui.studioSlot.slotId, intentId: ui.studioSlot.intentId, state: ui.studioSlot.state, kind: ui.studioSlot.artifact?.kind ?? ui.studioSlot.kind ?? null } : null,
    wb: ui.whiteboard ? `${ui.whiteboard.kind}:${String(ui.whiteboard.value).slice(0, 60)}` : null, reply: (j?.teacherReply ?? "").slice(0, 160) });
});
const word = () => page.locator("[data-testid=state-word]").innerText().catch(() => "");
await page.goto(`${BASE}/c/${acc.cid}/lesson/new`);
for (let k = 0; k < 200 && !/Your turn/.test(await word()); k++) await sleep(250);
await sleep(800);
const lesson = new URL(page.url()).pathname.split("/").pop();
await page.evaluate(() => { window.__es = []; });
await page.locator("[data-testid=type]").click({ timeout: 8000 }).catch(() => {});
await page.locator("[data-testid=child-input]").fill(ASK);
T0 = Date.now();
await page.locator("[data-testid=send]").click();
let last = ""; const dom = [];
while (Date.now() - T0 < 30000) {
  const s = await page.evaluate(() => { const tray = document.querySelector("[data-testid=tray]");
    return JSON.stringify({ tray: tray?.getAttribute("data-kind") ?? null, visual: !!tray?.querySelector("iframe, canvas, img, svg"), cap: [...document.querySelectorAll("[data-testid=caption]")].map((e) => e.innerText).join(" ").replace(/\s+/g, " ").slice(0, 70), word: document.querySelector("[data-testid=state-word]")?.innerText ?? "" }); }).catch(() => null);
  if (s && s !== last) { last = s; dom.push(`${Date.now() - T0} ${s}`); }
  await sleep(150);
}
await shot(page, `d35-${process.env.QA_TAG || ACC}`);
const es = (await page.evaluate(() => window.__es)).map((e) => ({ ms: e.at - T0, ...e, at: undefined }));
const tr = log.trace.filter((e) => /studio|tray|turn|slot|wb|board|tts|audio|speak/i.test(String(e.k ?? e.kind ?? e.type ?? ""))).map((e) => JSON.stringify(e).slice(0, 200)).slice(0, 80);
console.log(JSON.stringify({ lesson, ask: ASK, net: ev, studioStream: es, dom, trace: tr }, null, 1));
await b.close();
