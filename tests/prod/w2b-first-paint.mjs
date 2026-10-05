// W2-B acceptance, production browser: the explain move's rung paints fast, inside the tray, in the REAL child client.
// A signed-in test guardian's child runs a text lesson in Chromium (360 x 800) on topics whose explain rung is the board
// (explainer@1) or an engine; the child types short replies until the explain turn. Measured from the explain turn's
// response (Playwright's response event) to the rung painted in its frame (the board's SVG or the engine's first control):
//   - the rung appears on the explain move, inside the Work tray (frame height = tray height ± 2 px);
//   - first paint p90 ≤ 300 ms (BUILD-PLAN W2-B). Measured from the response in hand to the paint, so it is client work
//     only (the pre-booted spare frame is adopted: no fetch on the path); the gate applies in the sandbox too.
// Run: NODE_USE_ENV_PROXY=1 node tests/prod/w2b-first-paint.mjs   (TAXILA_BASE for a local server)
import { withTestAccount, ok, warn, done, launch, BASE } from "./lib.mjs";

// 12 topics, as the plan says (4 maths incl. geometry, 4 science / EVS, 4 SST / languages), so p90 is not just the max
const TOPICS = process.env.W2B_TOPICS ? process.env.W2B_TOPICS.split(",") : ["c6-science-ch02-t04", "c7-sst-ch20-t01", "c5-evs-ch02-t01", "c6-maths-ch02-t01",
  "c4-maths-ch01-t02", "c5-maths-ch02-t01", "c7-maths-ch01-t02", "c6-science-ch03-t01",
  "c7-science-ch07-t02", "c4-evs-ch01-t01", "c6-sst-ch13-t01", "c5-english-ch06-t01"];
// 8 lines, as w2b-explain-rungs walks: c4-maths-ch01-t02 can take 7 turns to reach its explain move
const LINES = ["haan, main ready hoon", "ok", "haan", "samjhao na", "ok", "theek hai", "haan", "ok"];
const PROBE = process.env.TAXILA_PROBE === "1";   // set by the Azure probe fleet: the timing gate applies
const times = [];
const liveBoards = [];

for (const topicId of TOPICS) {
  const classLevel = Number(topicId.match(/^c(\d)/)[1]);
  await withTestAccount(async ({ api, child }) => {
    const { browser, page } = await launch({ viewport: { width: 360, height: 800 }, cookieFrom: api });
    try {
      let explainAt = null;
      page.on("response", async (res) => {
        if (!res.url().includes("/api/lesson/turn") || explainAt) return;
        const j = await res.json().catch(() => null);
        if (j?.move?.kind === "explain") explainAt = { t: Date.now(), mount: (j.moduleCommands ?? []).find((c) => c.op === "mount")?.engine ?? null,
          liveBoard: j.ui?.tray === "studio" && /:wb:/.test(j.ui?.studioSlot?.intentId ?? "") };
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
        const res = await page.waitForResponse((r) => r.url().includes("/api/lesson/turn"), { timeout: 45_000 }).catch(() => null);
        // the explain turn: measure at once (W2-B fixer: the 400 ms settle below used to sit INSIDE the measured span,
        // so every "first paint" was ≥ 400 ms whatever the client did)
        if (res && (await res.json().catch(() => null))?.move?.kind === "explain") {
          for (let i = 0; i < 50 && !explainAt; i++) await new Promise((r) => setTimeout(r, 2));
          break;
        }
        await page.waitForTimeout(400);
      }
      if (!explainAt) { warn(`${topicId}: no explain move reached`); return; }
      const engine = explainAt.mount;
      if (!engine && explainAt.liveBoard) {
        // W2 integration: Studio took the explain beat's whiteboard ask, so the live board (W2-E/F) replaces this rung and the
        // rung rides along as the slot's fallback. Its arrival includes the planner (W2-F bar: ≤ 6 s after the reply), so it
        // is reported apart from the 300 ms client-paint gate; it must draw INSIDE the stage box, inside the tray.
        const drawn = await page.waitForSelector('[data-testid="tray"][data-kind="studio"] [data-testid="studio-stage"][data-kind="whiteboard"] svg', { timeout: 12_000 }).catch(() => null);
        const ms = Date.now() - explainAt.t;
        ok(!!drawn, `${topicId}: the live board (or its template fallback) is drawn in the Studio stage (${drawn ? `${ms} ms after the reply` : "none in 12 s"})`);
        if (drawn) {
          liveBoards.push(ms);
          const fit = await page.evaluate(() => {
            const tray = document.querySelector('[data-testid="tray"]')?.getBoundingClientRect();
            const box = document.querySelector('[data-testid="studio-box"]')?.getBoundingClientRect();
            const svg = document.querySelector('[data-testid="studio-stage"] svg')?.getBoundingClientRect();
            const inside = (a, b) => !!a && !!b && a.left >= b.left - 1 && a.top >= b.top - 1 && a.right <= b.right + 1 && a.bottom <= b.bottom + 1;
            return { boxInTray: inside(box, tray), svgInBox: inside(svg, box), w: Math.round(svg?.width ?? 0), h: Math.round(svg?.height ?? 0) };
          });
          ok(fit.boxInTray && fit.svgInBox, `${topicId}: the board sits inside the stage and the stage inside the tray (${fit.w}x${fit.h})`);
        }
        return;
      }
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

if (liveBoards.length) console.log(`live board arrival after the explain response: n=${liveBoards.length} ${[...liveBoards].sort((a, b) => a - b).join(", ")} ms (W2-F bar ≤ 6000)`);
ok(liveBoards.every((ms) => ms <= 6000), `every live board arrived ≤ 6 s after the reply (${liveBoards.length} boards)`);
const s = [...times].sort((a, b) => a - b);
const p90 = s.length ? s[Math.min(s.length - 1, Math.ceil(0.9 * s.length) - 1)] : null;
console.log(`first paint after the explain response: n=${s.length} p50=${s[Math.floor(s.length / 2)] ?? "-"} p90=${p90 ?? "-"} ms`);
// The paint is CLIENT work (the turn response is in hand; with the spare frame adopted no fetch is on the path), so the
// 300 ms gate applies everywhere: the probe fleet adds nothing to it (W2-B fixer, major 4)
ok(p90 === null ? liveBoards.length > 0 : p90 <= 300, `first paint p90 ≤ 300 ms after the explain response (${p90} ms, n=${s.length}${PROBE ? ", probe fleet" : ""})`);
done();
