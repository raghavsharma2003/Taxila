// Round 4 · stream 2 (content), brief item 5 (VALUES V3.3): request → piece on stage ≤ 3 s p90 at n ≥ 20.
// The REAL child client (Chromium, 360 x 800 phone, typed lane): a fresh child per ask, the practice page of a topic that
// has a certified interactive answer (a play level certified at the 360 phone box, or a certified engine), two ordinary
// turns, then the child's interactive ask; the time is from the Enter press to the first frame in which a piece the child
// can act on is in the tray (a Studio piece other than a board or its twin, or an engine frame), observed in the page.
// Also reported: the ask's turn response time (the old network measure), and what was shown.
//
//   NODE_USE_ENV_PROXY=1 node tests/prod/r4-content-speed.mjs --base http://localhost:8795 [--n 24] [--conc 2] [--out DIR]
// Costs model calls (one short lesson per ask). Adult-scripted turns on a local machine shared with other sessions:
// timings include this machine's load and are labelled with it.
import { mkdirSync, writeFileSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { loadavg } from "node:os";
import { arg, withTestAccount, ok, warn, done, BASE, isLocal, PERSONAS, GREET, freshChild, OUT as OWNER_OUT, ROOT } from "./_owner.mjs";
import { playPassed } from "../../server/forge3/compose.js";

const OUT = arg("out", join(OWNER_OUT, "r4-content-speed"));
const N = Math.max(20, Number(arg("n", "24")) || 24);
const CONC = Math.max(1, Math.min(4, Number(arg("conc", "2")) || 2));
mkdirSync(OUT, { recursive: true });
const ASKS = ["game khelna hai", "animation dikhao na", "can we play a game?", "simulation dikhao", "koi game khilao", "show me an animation"];

// topics with a certified play level at the 360 phone (the commonest box), spread across families
const cov = JSON.parse(readFileSync(join(ROOT, "data", "play", "coverage.json"), "utf8"));
const certs = JSON.parse(readFileSync(join(ROOT, "server", "forge3", "certs", "play.json"), "utf8"));
const byFamily = new Map();
for (const e of cov.entries ?? []) {
  const band = e.classLevel <= 5 ? 4 : 7;
  const arts = (e.arts ?? []).filter((a) => playPassed(certs, e.family, e.mode, a, "p360", band, e.topicId) === true);
  if (!arts.length || cov.excluded?.[e.topicId]) continue;
  const k = `${e.family}/${e.mode}`;
  if (!byFamily.has(k)) byFamily.set(k, []);
  if (!byFamily.get(k).includes(e.topicId)) byFamily.get(k).push(e.topicId);
}
const topics = [];
for (let i = 0; topics.length < N && i < 50; i++) for (const list of byFamily.values()) if (list[i] && topics.length < N) topics.push(list[i]);
if (topics.length < N) warn(`only ${topics.length} topics have a play level certified at the 360 phone`);

async function launchBrowser() {
  process.env.PLAYWRIGHT_BROWSERS_PATH ||= "/opt/pw-browsers";
  const { chromium } = await import("playwright");
  const proxy = !isLocal && process.env.HTTPS_PROXY ? { server: process.env.HTTPS_PROXY } : undefined;
  return chromium.launch({ ...(proxy ? { proxy } : {}), args: ["--autoplay-policy=no-user-gesture-required"] });
}

const rows = [];
const load0 = loadavg()[0];
const browser = await launchBrowser();
try {
  const queue = topics.map((t, i) => ({ topicId: t, ask: ASKS[i % ASKS.length] }));
  await Promise.all(Array.from({ length: CONC }, async () => {
    while (queue.length) {
      const c = queue.shift();
      const classLevel = Number(c.topicId.match(/^c(\d)/)[1]);
      await withTestAccount(async ({ api }) => {
        const persona = { ...PERSONAS.aarav, classLevel, topics: [c.topicId] };
        const child = await freshChild(api, persona);
        const ctx = await browser.newContext({ viewport: { width: 360, height: 800 }, deviceScaleFactor: 2, hasTouch: true });
        await ctx.addInitScript(() => {
          const look = () => {
            if (!window.__askAt || window.__pieceAt) return;
            const st = document.querySelector('[data-testid="studio-stage"]');
            const k = st?.getAttribute("data-kind");
            if ((k && k !== "whiteboard" && st.getAttribute("data-legible") !== "twin") || document.querySelector(".dk-module iframe")) { window.__pieceAt = performance.now(); window.__pieceKind = k ?? "module"; }
          };
          new MutationObserver(look).observe(document, { subtree: true, childList: true, attributes: true, attributeFilter: ["data-kind", "data-legible"] });
        });
        const cookie = api.cookie();
        if (cookie) { const i = cookie.indexOf("="); await ctx.addCookies([{ name: cookie.slice(0, i), value: cookie.slice(i + 1), url: BASE }]); }
        const page = await ctx.newPage();
        let turnMs = null;
        page.on("response", (r) => { if (/\/api\/lesson\/turn$/.test(r.url()) && turnMs === -1) turnMs = Date.now(); });
        const rec = { topicId: c.topicId, ask: c.ask, pieceMs: null, kind: null, turnMs: null, error: null };
        try {
          await page.goto(`${BASE}/c/${child.id}/practice/${c.topicId}?mode=text`, { waitUntil: "domcontentloaded", timeout: 60_000 });
          await page.waitForSelector('[data-testid="lesson"]', { timeout: 60_000 });
          const send = async (text, mark) => {
            const input = page.locator('[data-testid="child-input"]');
            for (let k = 0; k < 30 && !(await input.isVisible().catch(() => false)); k++) {
              const typeBtn = page.locator('[data-testid="type"]');
              if (await typeBtn.isVisible().catch(() => false)) await typeBtn.click().catch(() => {});
              await page.waitForTimeout(1500);
            }
            await page.waitForFunction(() => !document.querySelector('[data-testid="child-input"]')?.disabled, null, { timeout: 45_000 }).catch(() => {});
            await input.fill(text);
            if (mark) { await page.evaluate(() => { window.__askAt = performance.now(); window.__pieceAt = 0; }); turnMs = -1; }
            const t0 = Date.now();
            await input.press("Enter");
            await page.waitForTimeout(2500);
            return t0;
          };
          await page.waitForTimeout(2500);
          await send(GREET.hinglish);
          await send("haan");
          const tAsk = await send(c.ask, true);
          for (let k = 0; k < 20; k++) { if (await page.evaluate(() => !!window.__pieceAt)) break; await page.waitForTimeout(500); }
          const r = await page.evaluate(() => ({ ms: window.__pieceAt ? Math.round(window.__pieceAt - window.__askAt) : null, kind: window.__pieceKind ?? null }));
          rec.pieceMs = r.ms; rec.kind = r.kind; rec.turnMs = turnMs > 0 ? turnMs - tAsk : null;
          await page.screenshot({ path: join(OUT, `${c.topicId}.png`) }).catch(() => {});
        } catch (e) { rec.error = String(e.message).slice(0, 200); }
        finally { await ctx.close().catch(() => {}); }
        rows.push(rec);
        console.log(`${c.topicId} "${c.ask}": piece ${rec.pieceMs ?? "none"} ms (${rec.kind ?? "-"}), turn ${rec.turnMs ?? "-"} ms${rec.error ? ` ERROR ${rec.error}` : ""}`);
      }, { tag: "r4cs", child: { firstName: "Riya" } });
    }
  }));
} finally { await browser.close().catch(() => {}); }

const q = (xs, p) => { const s = [...xs].sort((a, b) => a - b); return s.length ? s[Math.min(s.length - 1, Math.ceil(p * s.length) - 1)] : null; };
const got = rows.filter((r) => r.pieceMs != null).map((r) => r.pieceMs);
const none = rows.filter((r) => r.pieceMs == null);
// an ask that never got a piece counts as > 3 s (it is in the denominator, never dropped)
const all = [...got, ...none.map(() => Infinity)];
ok(rows.length >= 20, `asks run ${rows.length} ≥ 20`);
ok(q(all, 0.9) <= 3000, `request → piece in the tray p50 ${q(all, 0.5)} ms, p90 ${q(all, 0.9)} ms ≤ 3000 (n = ${all.length}; ${none.length} asks with no piece count as > 3 s; load avg ${load0.toFixed(1)} → ${loadavg()[0].toFixed(1)} on this machine)`);
const turns = rows.filter((r) => r.turnMs != null).map((r) => r.turnMs);
if (turns.length) warn(`the ask's turn response (network): p50 ${q(turns, 0.5)} ms, p90 ${q(turns, 0.9)} ms (n = ${turns.length})`);
writeFileSync(join(OUT, "r4-content-speed.json"), JSON.stringify({ base: BASE, at: new Date().toISOString(), load: [load0, loadavg()[0]], rows }, null, 1));
done();
