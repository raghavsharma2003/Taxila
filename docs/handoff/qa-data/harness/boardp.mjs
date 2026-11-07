// Pass 12 (14.2): board asks. Each ask typed in its own fresh lesson; per ask: does a board appear, does she point at it
// ("dekho", "board pe", "look") only while it is up, and does any line carry dash/ASCII art?
// env QA_ACC, QA_ASKS ("||"), QA_WAV + QA_SAY=1 to say instead of type (young), QA_BASE, QA_OUT. No disclosures here.
import fs from "fs";
import { launch, open, PHONE, BASE, sleep, shot } from "/home/user/Taxila/tests/e2e/qa-lib.mjs";
const Q = process.env.QA_OUT; const ACC = process.env.QA_ACC; const acc = JSON.parse(fs.readFileSync(Q + "/accounts.json"))[ACC];
const TAG = process.env.QA_TAG || ACC;
const b = await launch({ wav: process.env.QA_WAV }); const { ctx, page, log } = await open(b, PHONE, { init: () => { try { localStorage.setItem(`taxila.child.${location.pathname.split("/")[2]}.prefs`, JSON.stringify({ hello: true })); } catch {} } });
await ctx.addCookies(JSON.parse(fs.readFileSync(`${Q}/state-${ACC}.json`)).cookies);
let turns = [];
page.on("response", async (r) => { if (/\/api\/lesson\/turn$/.test(r.url())) { try { const j = await r.json(); turns.push({ heard: j.childText ?? j.heard ?? null, reply: j.teacherReply ?? "", wb: j.ui?.whiteboard ?? null, tray: j.ui?.tray ?? null, mods: (j.moduleCommands ?? []).map((m) => `${m.op}:${m.engine ?? m.moduleId ?? ""}`), studio: j.ui?.studioSlot ? "slot" : null }); } catch {} } });
page.on("request", (r) => { if (/\/api\/voice\/transcribe/.test(r.url())) turns.push({ upload: true }); });
const word = () => page.locator("[data-testid=state-word]").innerText().catch(() => "");
const POINT = /\bdekh(o|iye|ein)\b|board (pe|par)|yahan|\blook\b|on the board|देखो|देखिए|बोर्ड पर/i;
const ART = /-{3,}|—{2,}|_{3,}|\|.*\|.*\||[─━│┼]|(\d\s*[-—]\s*){4,}/;
const results = [];
const TOPICS = (process.env.QA_TOPICS || "").split("||");
for (const [i, ask] of process.env.QA_ASKS.split("||").entries()) {
  await page.goto(`${BASE}/c/${acc.cid}/lesson/new${TOPICS[i] ? `?topic=${TOPICS[i]}` : ""}`);
  for (let k = 0; k < 200 && !/Your turn/.test(await word()); k++) await sleep(250);
  await sleep(800);
  turns = [];
  const lesson = new URL(page.url()).pathname.split("/").pop();
  if (process.env.QA_SAY) { await page.locator("[data-testid=mic]").click(); await sleep(9000); await page.locator("[data-testid=mic]").click(); }
  else { await page.locator("[data-testid=type]").click({ timeout: 8000 }).catch(() => {}); await page.locator("[data-testid=child-input]").fill(ask); await page.locator("[data-testid=send]").click(); }
  const tl = []; const t0 = Date.now(); let pointNoBoard = null; let boardSeen = null; let lastCap = "";
  while (Date.now() - t0 < 40000) {
    const s = await page.evaluate(() => {
      const tray = document.querySelector("[data-testid=tray]");
      const board = document.querySelector("[data-testid=board]");
      const frame = tray?.querySelector("iframe, canvas, img, svg, [data-testid=studio-stage]");
      return { cap: [...document.querySelectorAll("[data-testid=caption]")].map((e) => e.innerText).join(" ").replace(/\s+/g, " ").trim(),
        trayKind: tray?.getAttribute("data-kind") ?? null, board: board?.innerText.replace(/\s+/g, " ").trim().slice(0, 120) ?? "", visual: !!frame,
        word: document.querySelector("[data-testid=state-word]")?.innerText ?? "" };
    }).catch(() => null);
    if (!s) { await sleep(250); continue; }
    const up = !!(s.board || s.visual || (s.trayKind && s.trayKind !== "tiles" && s.trayKind !== "pad"));
    if (up && boardSeen === null) boardSeen = ((Date.now() - t0) / 1000).toFixed(1);
    if (s.cap && s.cap !== lastCap) { lastCap = s.cap; tl.push(`${((Date.now() - t0) / 1000).toFixed(1)} ${up ? "[board]" : "[none]"} ${s.cap.slice(0, 140)}`); if (POINT.test(s.cap) && !up && pointNoBoard === null) pointNoBoard = s.cap.slice(0, 160); }
    if (/Your turn/.test(s.word) && turns.some((t) => t.reply) && Date.now() - t0 > 6000) { await sleep(1500); break; }
    await sleep(250);
  }
  await shot(page, `board-${TAG}-${i}`);
  const t = turns.filter((x) => x.reply);
  const replies = t.map((x) => x.reply).join(" / ");
  results.push({ ask, topic: TOPICS[i] || null, lesson, heard: t[0]?.heard ?? null, boardSeenAt: boardSeen, wb: t.map((x) => x.wb ? `${x.wb.kind}:${String(x.wb.value).slice(0, 80)}` : null).filter(Boolean), tray: t.map((x) => x.tray), mods: t.flatMap((x) => x.mods), studio: t.map((x) => x.studio).filter(Boolean).length,
    pointNoBoard, art: ART.test(replies) ? replies.match(ART)[0] : null, reply: replies.slice(0, 260), timeline: tl.slice(0, 8) });
}
for (const r of results) console.log(JSON.stringify(r, null, 1));
console.log("errors:", JSON.stringify({ pageerror: log.pageerror.slice(0, 3), http: log.http.slice(0, 6) }));
await b.close();
