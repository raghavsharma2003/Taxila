// W2-B acceptance, production browser: the explain move's rung paints fast, inside the tray, in the REAL child client.
// A signed-in test guardian's child runs a text lesson in Chromium (360 x 800) on topics whose explain rung is the board
// (explainer@1) or an engine; the child types short replies until the explain turn. Measured from the explain turn's
// response (Playwright's response event) to the rung painted in its frame (the board's SVG or the engine's first control):
//   - the rung appears on the explain move, inside the Work tray (frame height = tray height ± 2 px);
//   - first paint p90 ≤ 300 ms (BUILD-PLAN W2-B: a TIMING gate, meaningful only from the Azure probe fleet with no route
//     interception; from the sandbox it is reported, and checked only as ≤ 1500 ms so a broken pre-warm still fails).
// Run: NODE_USE_ENV_PROXY=1 node tests/prod/w2b-first-paint.mjs   (TAXILA_BASE for a local server)
import { withTestAccount, ok, warn, done, launch, BASE } from "./lib.mjs";

const TOPICS = ["c6-science-ch02-t04", "c7-sst-ch20-t01", "c5-evs-ch02-t01", "c6-maths-ch02-t01"];
const LINES = ["haan, main ready hoon", "ok", "haan", "samjhao na", "ok", "theek hai"];
const PROBE = process.env.TAXILA_PROBE === "1";   // set by the Azure probe fleet: the timing gate applies
const times = [];

for (const topicId of TOPICS) {
  const classLevel = Number(topicId.match(/^c(\d)/)[1]);
  await withTestAccount(async ({ api, child }) => {
    const { browser, page } = await launch({ viewport: { width: 360, height: 800 }, cookieFrom: api });
    try {
      let explainAt = null;
      page.on("response", async (res) => {
        if (!res.url().includes("/api/lesson/turn") || explainAt) return;
        const j = await res.json().catch(() => null);
        if (j?.move?.kind === "explain") explainAt = { t: Date.now(), mount: (j.moduleCommands ?? []).find((c) => c.op === "mount")?.engine ?? null };
      });
      await page.goto(`${BASE}/c/${child.id}/lesson/new?mode=text&topic=${topicId}`, { waitUntil: "domcontentloaded" });
      await page.waitForSelector('[data-testid="lesson"]', { timeout: 45_000 });
      for (const line of LINES) {
        if (explainAt) break;
        const input = await page.waitForSelector("input.dk-input, textarea.dk-input", { timeout: 30_000 }).catch(() => null);
        if (!input) {
          const type = await page.$('[data-testid="type"]');
          if (type) await type.click();
        }
        await page.fill("input.dk-input, textarea.dk-input", line).catch(() => {});
        await page.keyboard.press("Enter");
        await page.waitForResponse((r) => r.url().includes("/api/lesson/turn"), { timeout: 45_000 }).catch(() => null);
        await page.waitForTimeout(400);
      }
      if (!explainAt) { warn(`${topicId}: no explain move reached`); return; }
      const engine = explainAt.mount;
      ok(!!engine, `${topicId}: the explain turn mounts a rung (${engine ?? "none"})`);
      if (!engine) return;
      const iframe = await page.waitForSelector(`[data-testid="tray"][data-kind="module"] iframe[data-engine="${engine}"]`, { timeout: 15_000 }).catch(() => null);
      ok(!!iframe, `${topicId}: the rung's frame is in the Work tray`);
      if (!iframe) return;
      const frame = await iframe.contentFrame();
      await frame.waitForSelector(engine === "explainer@1" ? '[data-testid="explainer"] svg rect' : "button, svg", { timeout: 15_000, state: "attached" });
      const ms = Date.now() - explainAt.t;
      times.push(ms);
      const [box, tray] = await Promise.all([iframe.boundingBox(), page.$eval('[data-testid="tray"] .dk-tray-body', (e) => e.getBoundingClientRect().height)]);
      ok(Math.abs(box.height - tray) <= 2, `${topicId}: the frame fills the tray (${Math.round(box.height)} vs ${Math.round(tray)} px)`);
      console.log(`${topicId}: ${engine} painted ${ms} ms after the explain turn's response`);
    } finally { await browser.close(); }
  }, { child: { classLevel }, tag: "w2b-paint" });
}

const s = [...times].sort((a, b) => a - b);
const p90 = s.length ? s[Math.min(s.length - 1, Math.ceil(0.9 * s.length) - 1)] : null;
console.log(`first paint after the explain response: n=${s.length} p50=${s[Math.floor(s.length / 2)] ?? "-"} p90=${p90 ?? "-"} ms`);
if (PROBE) ok(p90 !== null && p90 <= 300, `first paint p90 ≤ 300 ms from the probe fleet (${p90} ms)`);
else ok(p90 !== null && p90 <= 1500, `first paint p90 ≤ 1500 ms from the sandbox (${p90} ms; the 300 ms gate runs on the probe fleet)`);
done();
