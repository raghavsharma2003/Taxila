// r3-integrator: phone + laptop screenshots of a full lesson with a game, one class 4, 6 and 7 topic, on a LOCAL production
// build (node server/serve.mjs, NODE_ENV=production, Neon TEST). Adult-scripted child (typed lane), real Azure models.
//   TAXILA_BASE=http://127.0.0.1:PORT node shots.mjs --out DIR
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { arg, withTestAccount, ok, warn, done, BASE, PERSONAS, GREET, freshChild, kitOf, itemOf, answersFor } from "/home/user/Taxila/tests/prod/_owner.mjs";
import { measureStage, measureDocument, canvasTextProbe } from "/home/user/Taxila/server/forge3/qa/measure.js";
import { judgeView, judgeFrame } from "/home/user/Taxila/server/forge3/qa/checks.js";

const OUT = arg("out", "./shots");
mkdirSync(OUT, { recursive: true });
const VIEWS = [{ id: "phone360", width: 360, height: 800 }, { id: "phone412", width: 412, height: 915 }, { id: "laptop1366", width: 1366, height: 768 }];
const CASES = [
  { id: "c4", topic: "c4-maths-ch05-t01", persona: { ...PERSONAS.golu, style: "hinglish" }, ask: "game khelna hai", young: true },
  { id: "c6", topic: "c6-maths-ch07-t03", persona: PERSONAS.meher, ask: "can we play a game?" },
  { id: "c7", topic: "c7-science-ch10-t01", persona: PERSONAS.kabir, ask: "game khelte hain na" },
].filter((c) => !arg("cases", "") || arg("cases", "").split(",").includes(c.id));

process.env.PLAYWRIGHT_BROWSERS_PATH ||= "/opt/pw-browsers";
const { chromium } = await import("/home/user/Taxila/node_modules/playwright/index.mjs");
const results = [];

await withTestAccount(async ({ api }) => {
  const browser = await chromium.launch({ args: ["--autoplay-policy=no-user-gesture-required"] });
  try {
    for (const c of CASES) {
      const rec = { case: c.id, topic: c.topic, steps: [], transcript: [], errors: [] };
      results.push(rec);
      const child = await freshChild(api, c.persona);
      const kit = kitOf(c.topic);
      const ctx = await browser.newContext({ viewport: { width: 360, height: 800 }, deviceScaleFactor: 2, hasTouch: true });
      await ctx.addInitScript(canvasTextProbe);
      const cookie = api.cookie();
      if (cookie) { const i = cookie.indexOf("="); await ctx.addCookies([{ name: cookie.slice(0, i), value: cookie.slice(i + 1), url: BASE }]); }
      const page = await ctx.newPage();
      let last = null;
      page.on("response", async (r) => {
        if (!/\/api\/lesson\/(turn|start)/.test(r.url())) return;
        try { const j = await r.json(); last = j; rec.transcript.push({ at: Date.now(), reply: j.teacherReply ?? j.teacherOpening ?? null, ask: j.ui?.ask?.text ?? null, itemId: j.ui?.ask?.itemId ?? null, tray: j.ui?.tray ?? null, slot: j.ui?.studioSlot?.artifact?.kind ?? null, verdict: j.ui?.verdict ?? null, ended: !!j.ended }); } catch { /* not json */ }
      });
      page.on("pageerror", (e) => rec.errors.push(String(e.message).slice(0, 200)));
      const shoot = async (step) => {
        const views = [];
        for (const v of VIEWS) {
          await page.setViewportSize({ width: v.width, height: v.height });
          await page.waitForTimeout(1500);
          const m = await page.evaluate(measureStage).catch(() => null);
          const shown = await page.evaluate(() => { const st = document.querySelector('[data-testid="studio-stage"]'); return { tray: document.querySelector('[data-testid="tray"]')?.getAttribute("data-kind") ?? null, stage: st?.getAttribute("data-kind") ?? null, legible: st?.getAttribute("data-legible") ?? null }; }).catch(() => ({}));
          let verdict = null;
          if (shown.tray === "module") {
            // an engine in its sandboxed frame: measured inside the frame, as tests/prod/round3-forge.mjs does
            let fr = null, area = 0;
            for (const f of page.frames()) {
              if (f === page.mainFrame()) continue;
              const b = await (await f.frameElement().catch(() => null))?.boundingBox().catch(() => null);
              if (b && b.width * b.height > area) { area = b.width * b.height; fr = f; }
            }
            const d = fr ? await fr.evaluate(measureDocument).catch(() => null) : null;
            const j = judgeFrame(d ?? {}); verdict = { pass: j.pass, fails: j.fails, minPx: j.stats?.minPx ?? null, frame: true };
          } else if (m?.tray) { const j = judgeView(m, { artifactKind: shown.stage ?? undefined }); verdict = { pass: j.pass, fails: j.fails, minPx: j.stats?.minPx ?? null }; }
          const file = join(OUT, `${c.id}-${step}-${v.id}.png`);
          await page.screenshot({ path: file }).catch((e) => rec.errors.push(`shot ${file}: ${e.message}`));
          const overflowX = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1).catch(() => null);
          views.push({ view: v.id, file, shown, verdict, overflowX });
        }
        await page.setViewportSize({ width: 360, height: 800 });
        await page.waitForTimeout(600);
        rec.steps.push({ step, views });
      };
      // The young desk (classes 1-4) has no keyboard: a class-4 child SPEAKS ("game khelna hai"). With no real voice in this
      // sandbox, a young turn is sent by the desk's own Help → "show me how" button (a real turn request from the client)
      // and its body is rewritten to the words the child would have said (childText, typed) before it leaves the page.
      // Labelled in shots.json (rec.injected). Everything the screen shows is the real client's response to that turn.
      let rewrite = null;
      if (c.young) {
        rec.injected = [];
        await page.route("**/api/lesson/turn", async (route) => {
          const req = route.request();
          let body = null; try { body = JSON.parse(req.postData() ?? "null"); } catch { /* not json */ }
          if (rewrite && body && /^help_/.test(String(body.chipId ?? ""))) {
            const { chipId: _c, chipLabel: _l, ...rest } = body;
            const nb = { ...rest, childText: rewrite, typed: true };
            rec.injected.push(rewrite); rewrite = null;
            return route.continue({ postData: JSON.stringify(nb), headers: { ...req.headers(), "content-type": "application/json" } });
          }
          return route.continue();
        });
      }
      const sendYoung = async (text) => {
        const help = page.locator('[data-testid="help"]');
        await help.waitFor({ state: "visible", timeout: 60_000 });
        const before = rec.transcript.length;
        rewrite = text;
        await help.click();
        await page.locator('[data-testid="help-menu"] [data-help="how"]').click({ timeout: 10_000 });
        for (let k = 0; k < 60 && rec.transcript.length === before; k++) await page.waitForTimeout(500);
        await page.waitForTimeout(3500);
        rec.transcript.at(-1) && (rec.transcript.at(-1).child = `${text} (young desk: injected)`);
      };
      const send = async (text) => {
        if (c.young) return sendYoung(text);
        const input = page.locator('[data-testid="child-input"]');
        for (let k = 0; k < 30 && !(await input.isVisible().catch(() => false)); k++) {
          const typeBtn = page.locator('[data-testid="type"]');
          if (await typeBtn.isVisible().catch(() => false)) await typeBtn.click().catch(() => {});
          await page.waitForTimeout(1500);
        }
        await input.waitFor({ state: "visible", timeout: 60_000 });
        await page.waitForFunction(() => !document.querySelector('[data-testid="child-input"]')?.disabled, null, { timeout: 60_000 }).catch(() => {});
        const before = rec.transcript.length;
        await input.fill(text);
        await input.press("Enter");
        for (let k = 0; k < 60 && rec.transcript.length === before; k++) await page.waitForTimeout(500);
        await page.waitForTimeout(3500);
        rec.transcript.at(-1) && (rec.transcript.at(-1).child = text);
      };
      const answerCurrent = async () => {
        const item = last?.ui?.ask?.itemId ? itemOf(kit, last.ui.ask.itemId) : null;
        const key = last?.debug?.item?.answer ?? (item ? answersFor(item, kit, c.persona).correct : null);
        if (key == null) { await send(c.persona.style === "english" ? "okay" : "haan"); return false; }
        await send(String(key));
        return true;
      };
      try {
        await page.goto(`${BASE}/c/${child.id}/practice/${c.topic}?mode=text`, { waitUntil: "domcontentloaded", timeout: 60_000 });
        await page.waitForSelector('[data-testid="lesson"]', { timeout: 60_000 });
        await page.waitForTimeout(4000);
        await shoot("01-open");
        await send(GREET[c.persona.style] ?? GREET.hinglish);
        await shoot("02-first-question");
        await answerCurrent();
        await shoot("03-answered");
        await answerCurrent();
        await send(c.ask);
        let game = false;
        for (let k = 0; k < 20 && !game; k++) {
          const s = await page.evaluate(() => ({ tray: document.querySelector('[data-testid="tray"]')?.getAttribute("data-kind") ?? null, stage: document.querySelector('[data-testid="studio-stage"]')?.getAttribute("data-kind") ?? null })).catch(() => ({}));
          game = s.tray === "module" || ["play", "stagecraft", "frame"].includes(s.stage ?? "");
          if (!game) await page.waitForTimeout(1000);
        }
        rec.game = game;
        await page.waitForTimeout(3000);
        await shoot("04-game");
        // one touch on the game (the middle of the stage), then the state after it
        const box = await page.locator('[data-testid="studio-stage"]').boundingBox().catch(() => null);
        if (box) { await page.mouse.click(box.x + box.width / 2, box.y + box.height * 0.55).catch(() => {}); await page.waitForTimeout(2000); await shoot("05-game-touched"); }
        await send(c.persona.style === "english" ? "okay, next question" : "achha, aage chalo");
        await answerCurrent();
        await shoot("06-after-game");
        await send(c.persona.style === "english" ? "I want to stop for today" : "bas, aaj ke liye itna hi");
        await shoot("07-stop-checkin");
        await send(c.persona.style === "english" ? "yes, stop" : "haan, bas");
        await page.waitForTimeout(4000);
        await shoot("08-end");
      } catch (e) {
        rec.errors.push(String(e.message).slice(0, 300));
      } finally {
        await ctx.close().catch(() => {});
      }
      const views = rec.steps.flatMap((s) => s.views);
      const judged = views.filter((v) => v.verdict);
      ok(rec.steps.length >= 7 && !rec.errors.some((e) => !/^shot/.test(e) && !/ResizeObserver/.test(e)), `${c.id} ${c.topic}: lesson walked, ${rec.steps.length} steps shot at ${VIEWS.length} sizes${rec.errors.length ? ` (errors: ${rec.errors.slice(0, 2).join(" | ")})` : ""}`);
      ok(!!rec.game, `${c.id}: the game ask put something to DO on the stage`);
      ok(judged.every((v) => v.verdict.pass), `${c.id}: forge3 view verdict ${judged.filter((v) => v.verdict.pass).length}/${judged.length} trays pass${judged.some((v) => !v.verdict.pass) ? ` (${judged.filter((v) => !v.verdict.pass).map((v) => `${v.view}:${v.verdict.fails.join("+")}`).slice(0, 6).join(", ")})` : ""}`);
      const ovx = views.filter((v) => v.overflowX);
      ok(!ovx.length, `${c.id}: no horizontal page overflow (${ovx.length}/${views.length})`);
    }
  } finally { await browser.close().catch(() => {}); }
}, { tag: "r3integ-shots", child: { firstName: "Riya" } });

writeFileSync(join(OUT, "shots.json"), JSON.stringify({ base: BASE, at: new Date().toISOString(), results }, null, 1));
done();
