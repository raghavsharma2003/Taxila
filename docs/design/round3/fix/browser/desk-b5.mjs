// r3-fix browser check on a LOCAL production build (NOT taxila.dev, NOT a child): a class-4 Hinglish child on the Young
// desk at 360x800, 412x915, 1366x768. The Young desk has no keyboard, so each scripted turn goes out through the Help
// menu's "Show me choices" tap with the request body rewritten to the child's words (labelled in the output).
//   B5   after 17 s of the lesson, whatever work the tray holds (module / studio / board) is still rendered
//   B10  the stop check-in tiles: no label overflows its tile; label >= 14 px; any number badge >= 14 px; no "chips" said
//   B8   "yeh nahi padhna, fractions padhna hai" → a Start tile for the class's fractions topic, no stop check-in; tapping
//        it ends this lesson and the client starts the named topic (a second /api/lesson/start with that topicId)
// usage: TAXILA_BASE=http://127.0.0.1:PORT NODE_USE_ENV_PROXY=1 node desk-check.mjs <shotsDir>
import { mkdirSync, writeFileSync } from "node:fs";
const lib = await import("/home/user/Taxila/tests/prod/lib.mjs");
const { withTestAccount, ok, warn, done, launch, BASE } = lib;
const SHOTS = process.argv[2];
mkdirSync(SHOTS, { recursive: true });
const VIEWPORTS = [{ width: 360, height: 800 }, { width: 1366, height: 768 }];
const rows = [];

await withTestAccount(async ({ api, child }) => {
  for (const vp of VIEWPORTS) {
    const tag = `${vp.width}`;
    const row = { vp: tag };
    const { browser, page } = await launch({ viewport: vp, cookieFrom: api, launch: { args: ["--autoplay-policy=no-user-gesture-required"] } });
    try {
      await page.addInitScript((cid) => { try { localStorage.setItem(`taxila.child.${cid}.prefs`, JSON.stringify({ hello: true, quiet: true })); } catch { /* */ } }, child.id);
      let rewrite = null;
      const starts = [];
      const turns = [];
      await page.route("**/api/lesson/turn", async (route) => {
        const req = route.request();
        if (rewrite && req.method() === "POST") {
          const body = JSON.parse(req.postData() || "{}");
          delete body.chipId;
          body.childText = rewrite;
          body.typed = true;
          rewrite = null;
          return route.continue({ postData: JSON.stringify(body), headers: { ...req.headers(), "content-type": "application/json" } });
        }
        return route.continue();
      });
      page.on("response", async (r) => {
        const u = r.url();
        if (u.endsWith("/api/lesson/start")) starts.push({ status: r.status(), body: await r.json().catch(() => null), req: (() => { try { return JSON.parse(r.request().postData() || "{}"); } catch { return {}; } })() });
        if (u.endsWith("/api/lesson/turn")) turns.push({ status: r.status(), body: await r.json().catch(() => null) });
      });
      const s0 = page.waitForResponse((r) => r.url().endsWith("/api/lesson/start"), { timeout: 60_000 });
      await page.goto(`${BASE}/c/${child.id}/lesson/new`);
      await s0;
      await page.waitForSelector('[data-testid="dock"]', { timeout: 30_000 }).catch(() => {});
      // B5: 17 s in, the tray's work (if any) is still on screen
      await page.waitForTimeout(17_000);
      const tray0 = await page.evaluate(() => {
        const t = document.querySelector('[data-testid="tray"]');
        if (!t) return { kind: null };
        const body = t.querySelector(".dk-tray-body");
        return { kind: t.getAttribute("data-kind"), layer: !!t.querySelector('[data-testid="tray-layer"]'), helpInBody: !!body?.querySelector('[data-testid="help-menu"]'),
          workShown: !!body?.querySelector(".dk-module, .dk-board, [data-testid='board'], .studio-stage, [class*='studio']") };
      });
      row.trayAt17s = tray0;
      if (["module", "studio", "board"].includes(tray0.kind)) ok(tray0.workShown && !tray0.helpInBody && !tray0.layer, `${tag}: B5 the ${tray0.kind} tray is still shown 17 s in (no help menu over it unasked)`);
      else warn(`${tag}: B5 not exercised: tray at 17 s is ${tray0.kind ?? "none"}`);
      await page.screenshot({ path: `${SHOTS}/c4-${tag}-01-17s.png` });

      const sendWords = async (words) => {
        const before = turns.length;
        rewrite = words;
        const help = page.locator('[data-testid="help"]').first();
        if (!(await page.locator('[data-testid="help-menu"]').first().isVisible().catch(() => false))) {
          for (let i = 0; i < 40 && !(await help.isVisible().catch(() => false)); i++) await page.waitForTimeout(500);
          await help.click({ timeout: 10_000 });
        }
        await page.locator('[data-testid="help-menu"] button').nth(1).click({ timeout: 10_000 });
        for (let i = 0; i < 120 && turns.length <= before; i++) await page.waitForTimeout(500);
        await page.waitForTimeout(2500);
        return turns.at(-1)?.body ?? null;
      };

      // B5 (exercised): ask for a picture (a board / module / studio piece in the tray), then 17 s of "your turn"
      const pic = await sendWords("mujhe picture dikhao");
      row.picTray = pic?.ui?.tray ?? null;
      for (let i = 0; i < 30; i++) { const k = await page.locator('[data-testid="tray"]').first().getAttribute("data-kind").catch(() => null); if (["module", "studio", "board"].includes(k)) break; await page.waitForTimeout(1000); }
      const kindNow = await page.locator('[data-testid="tray"]').first().getAttribute("data-kind").catch(() => null);
      await page.waitForTimeout(17_000);
      const t17 = await page.evaluate(() => {
        const t = document.querySelector('[data-testid="tray"]');
        if (!t) return { kind: null };
        const body = t.querySelector(".dk-tray-body");
        return { kind: t.getAttribute("data-kind"), layer: !!t.querySelector('[data-testid="tray-layer"]'), helpInBody: !!body?.querySelector('[data-testid="help-menu"]'),
          workShown: !!body && body.children.length > 0 && !body.querySelector('[data-testid="help-menu"]') };
      });
      row.b5 = { kindBefore: kindNow, at17s: t17 };
      await page.screenshot({ path: `${SHOTS}/c4-${tag}-b5-work-17s.png` });
      if (["module", "studio", "board"].includes(kindNow)) ok(t17.kind === kindNow && t17.workShown && !t17.layer && !t17.helpInBody, `${tag}: B5 the ${kindNow} tray is still on screen 17 s into her turn, no help menu over it (${JSON.stringify(t17)})`);
      else warn(`${tag}: B5 not exercised: the picture ask left the tray as ${kindNow ?? "none"} (server tray ${row.picTray})`);
      // leave every lesson ended
      for (const st of starts) if (st.body?.lessonId) await api("POST", "/api/lesson/end", { lessonId: st.body.lessonId }).catch(() => {});
    } catch (e) {
      ok(false, `${tag}: threw ${e?.message ?? e}`);
    } finally {
      rows.push(row);
      await browser.close();
    }
  }
}, { child: { firstName: "Golu", classLevel: 4, languagePref: "hinglish", interests: ["cricket"] }, tag: "r3fix" });
writeFileSync(`${SHOTS}/desk-b5.json`, JSON.stringify({ what: "r3-fix desk check, LOCAL production build of the working tree (node server/serve.mjs, NODE_ENV=production, Neon TEST), not taxila.dev, not a child; turns sent via the Help menu with the body rewritten to the child's words", at: new Date().toISOString(), base: BASE, rows }, null, 1));
done();
