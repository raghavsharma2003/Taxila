// Round 7 audit (APP-09, JRN-03): on a held child's Home, the Help sheet's two helpline buttons ("Call Childline 1098",
// "Call Tele-MANAS 14416": the child-safety floor) must be readable in every class band and skin, and the sheet's back
// button must not promise a lesson a held child does not have. Measures the real computed colours in Chromium on the real
// route (API mocked). Styling and labels only: the helpline strings and logic are frozen and not touched.
// STUDIO_BROWSER=0 or no Chromium skips it.
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readdirSync } from "fs";

const browsersDir = process.env.PLAYWRIGHT_BROWSERS_PATH;
const haveChromium = !!browsersDir && existsSync(browsersDir) && readdirSync(browsersDir).some((d) => d.startsWith("chromium"));
const SKIP = process.env.STUDIO_BROWSER === "0" ? "STUDIO_BROWSER=0" : !haveChromium ? "no Chromium under PLAYWRIGHT_BROWSERS_PATH" : false;

let app, browser, base;
before(async () => {
  if (SKIP) return;
  app = await (await import("./support/app-server.mjs")).appServer();
  base = app.url;
  const { chromium } = await import("playwright");
  browser = await chromium.launch();
});
after(async () => { await browser?.close(); await app?.close(); });

const lum = (rgb) => { const [r, g, b] = rgb.map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };

async function measure(classLevel, skin) {
  const kid = { id: "kid-held", first_name: "Riya", class_level: classLevel, language_pref: "hinglish", teacher_id: "asha" };
  const ctx = await browser.newContext({ viewport: { width: 360, height: 640 }, hasTouch: true, isMobile: true });
  const page = await ctx.newPage();
  await page.addInitScript(([id, skinKey, classic]) => {
    try {
      localStorage.setItem(`taxila.child.${id}.prefs`, JSON.stringify({ hello: true }));
      if (classic) localStorage.setItem(skinKey, "0");
    } catch { /* storage blocked */ }
  }, [kid.id, "tx.flag.ui.kaksha.r11", skin === "classic"]);
  await page.route("**/api/**", async (route) => {
    const p = new URL(route.request().url()).pathname;
    const json = (status, body) => route.fulfill({ status, contentType: "application/json", body: JSON.stringify(body) });
    if (p === "/api/me") return json(200, { guardian: { id: "g1", email: "g@test.invalid", name: "Grown-up" }, children: [kid] });
    if (p === "/api/child/plan" || p === "/api/child/boot") return json(200, { state: "safety_hold", day: "2026-11-10", surfaces: {} });
    if (p.startsWith("/api/tts") || p.startsWith("/api/voice")) return route.fulfill({ status: 503, body: "" });
    return json(200, {});
  });
  await page.goto(`${base}/c/${kid.id}`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector('[data-testid="hold-help"], [data-testid="home-hold-help"], [data-plan-state="safety_hold"] button', { timeout: 30_000 });
  const opener = (await page.$('[data-testid="hold-help"]')) ?? (await page.$('[data-plan-state="safety_hold"] button'));
  await opener.click();
  await page.waitForSelector('[data-testid="help-sheet"]', { timeout: 15_000 });
  const out = await page.evaluate(() => {
    const parse = (c) => (c.match(/[\d.]+/g) ?? []).slice(0, 3).map(Number);
    const bgOf = (el) => { // the first non-transparent background up the tree
      for (let e = el; e; e = e.parentElement) {
        const c = getComputedStyle(e).backgroundColor, m = c.match(/[\d.]+/g) ?? [];
        if (m.length >= 3 && !(m.length === 4 && Number(m[3]) === 0)) return parse(c);
      }
      return [255, 255, 255];
    };
    const read = (id) => { const el = document.querySelector(`[data-testid="${id}"]`); return el ? { fg: parse(getComputedStyle(el).color), bg: bgOf(el), text: el.textContent.trim() } : null; };
    return { a: read("help-1098"), b: read("help-14416"), back: read("help-back") };
  });
  await ctx.close();
  return out;
}

for (const classLevel of [2, 5]) {
  for (const skin of ["kaksha", "classic"]) {
    test(`held Help sheet, class ${classLevel}, ${skin} skin: both helpline buttons read at 4.5:1 or better; Close, not "Back to the lesson"`, { skip: SKIP, timeout: 120_000 }, async () => {
      const m = await measure(classLevel, skin);
      for (const k of ["a", "b"]) {
        assert.ok(m[k], `helpline button ${k} is on the sheet`);
        const r = ratio(m[k].fg, m[k].bg);
        assert.ok(r >= 4.5, `"${m[k].text}" contrast ${r.toFixed(2)} (fg ${m[k].fg}, bg ${m[k].bg})`);
      }
      assert.ok(m.back, "the sheet's back button is there");
      assert.doesNotMatch(m.back.text, /lesson/i);
    });
  }
}
