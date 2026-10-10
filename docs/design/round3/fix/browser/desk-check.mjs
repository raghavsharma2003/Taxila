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
const VIEWPORTS = [{ width: 360, height: 800 }, { width: 412, height: 915 }, { width: 1366, height: 768 }];
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

      // B10: the stop check-in
      const stop = await sendWords("mujhe ab yeh nahi padhna");
      row.stopChips = stop?.ui?.chips?.map((c) => c.label) ?? null;
      row.stopReply = String(stop?.teacherText ?? stop?.reply ?? stop?.text ?? "").slice(0, 160);
      await page.waitForSelector('[data-testid="choices"] .dk-tile', { timeout: 15_000 }).catch(() => {});
      const tiles = await page.evaluate(() => [...document.querySelectorAll('[data-testid="choices"] .dk-tile')].map((b) => {
        const l = b.querySelector(".dk-tile-label"), k = b.querySelector(".dk-tile-key");
        return { text: l?.textContent ?? "", overflowX: l ? l.scrollWidth > l.clientWidth + 1 || b.scrollWidth > b.clientWidth + 1 : false, overflowY: b.scrollHeight > b.clientHeight + 1,
          labelPx: l ? parseFloat(getComputedStyle(l).fontSize) : null, keyPx: k ? parseFloat(getComputedStyle(k).fontSize) : null };
      }));
      row.stopTiles = tiles;
      await page.screenshot({ path: `${SHOTS}/c4-${tag}-02-stop-checkin.png` });
      ok(tiles.length >= 2, `${tag}: B10 the stop check-in shows ${tiles.length} tiles (${tiles.map((x) => x.text).join(" / ")})`);
      ok(tiles.every((x) => !x.overflowX && !x.overflowY), `${tag}: B10 no tile label overflows its tile`);
      ok(tiles.every((x) => (x.labelPx ?? 0) >= 14), `${tag}: B10 tile labels >= 14 px (${tiles.map((x) => x.labelPx).join(",")})`);
      ok(tiles.every((x) => x.keyPx == null || x.keyPx >= 14), `${tag}: B10 number badges >= 14 px (${tiles.map((x) => x.keyPx).join(",")})`);
      ok(!/\bchips?\b/i.test(row.stopReply), `${tag}: B10 her words never say "chips" ("${row.stopReply.slice(0, 80)}")`);

      // B8: a named subject → a Start tile, then the next lesson
      const sw = await sendWords("yeh nahi padhna, fractions padhna hai");
      const swChip = sw?.ui?.chips?.find((c) => String(c.id).startsWith("switch:"));
      row.switchChips = sw?.ui?.chips?.map((c) => `${c.id}=${c.label}`) ?? null;
      row.switchReply = String(sw?.teacherText ?? sw?.reply ?? sw?.text ?? "").slice(0, 200);
      ok(swChip?.id === "switch:c4-maths-ch05-t01", `${tag}: B8 the switch offers the class-4 fractions topic (${swChip?.id ?? "none"}: ${swChip?.label ?? ""})`);
      ok(sw?.move?.checkin !== "stop" && !(sw?.ui?.chips ?? []).some((c) => /stop for today/i.test(c.label)), `${tag}: B8 no stop check-in for a named subject`);
      await page.screenshot({ path: `${SHOTS}/c4-${tag}-03-switch-offer.png` });
      if (swChip) {
        const nStarts = starts.length;
        await page.locator('[data-testid="choices"] .dk-tile', { hasText: swChip.label }).first().click({ timeout: 10_000 }).catch(() => {});
        for (let i = 0; i < 90 && starts.length <= nStarts; i++) await page.waitForTimeout(500);
        const next = starts.at(-1);
        row.nextStart = starts.length > nStarts ? { status: next.status, topicId: next.req?.topicId ?? next.body?.topicId ?? null } : null;
        ok(starts.length > nStarts && (next.req?.topicId === "c4-maths-ch05-t01" || next.body?.topicId === "c4-maths-ch05-t01"), `${tag}: B8 Start → the next lesson starts on c4-maths-ch05-t01 (${JSON.stringify(row.nextStart)})`);
        await page.waitForTimeout(3000);
        await page.screenshot({ path: `${SHOTS}/c4-${tag}-04-next-lesson.png` });
      }
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
writeFileSync(`${SHOTS}/desk-check.json`, JSON.stringify({ what: "r3-fix desk check, LOCAL production build of the working tree (node server/serve.mjs, NODE_ENV=production, Neon TEST), not taxila.dev, not a child; turns sent via the Help menu with the body rewritten to the child's words", at: new Date().toISOString(), base: BASE, rows }, null, 1));
done();
