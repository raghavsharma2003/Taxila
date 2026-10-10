// r4-khand · C9 "at a practice beat": a practice lesson on a Khand topic, typed lane, the child answering ordinarily (never
// asking for a game). Does the lesson put the block world on the stage by itself within N turns? Reported per topic with
// the turn it appeared and every slot kind seen; a real child client against a local production build (model calls).
//
//   NODE_USE_ENV_PROXY=1 TAXILA_BASE=http://127.0.0.1:8787 node tests/prod/r4-khand-beat.mjs [--turns 8]
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { withTestAccount, ok, warn, done, BASE } from "./lib.mjs";

const arg = (k, d) => { const i = process.argv.indexOf(`--${k}`); return i > 0 ? process.argv[i + 1] : d; };
const TURNS = Number(arg("turns", 8));
const OUT = join(process.cwd(), "docs", "design", "round4", "build", "khand", "results");
mkdirSync(OUT, { recursive: true });
const CASES = [
  { topic: "c6-maths-ch06-t01", cls: 6, answers: ["haan", "perimeter matlab boundary", "16", "2 x (l + b)", "pata nahi", "20", "haan samjha", "ok"] },
  { topic: "c5-maths-ch11-t01", cls: 5, answers: ["haan", "squares gin te hain", "12", "pata nahi", "9", "haan", "ok", "theek hai"] },
  { topic: "c6-maths-ch01-t01", cls: 6, answers: ["haan", "1 4 9 16", "25", "pata nahi", "8", "27", "haan", "ok"] },
];
const rows = [];
await withTestAccount(async ({ api }) => {
  const { chromium } = await import("playwright");
  const browser = await chromium.launch({ executablePath: process.env.KHAND_CHROME || "/opt/pw-browsers/chromium", args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
  try {
    for (const c of CASES) {
      const { child } = await api("POST", "/api/children", { firstName: "Kabir", classLevel: c.cls, languagePref: "hinglish", interests: ["cricket"] });
      await api("POST", "/api/consent", { childId: child.id, grants: { core_tutoring: true, learning_profile: true, memory: true } });
      await api("POST", "/api/parent/controls", { childId: child.id, hoursStart: "00:00", hoursEnd: "23:59", dailyMinutes: 120 });
      const ctx = await browser.newContext({ viewport: { width: 360, height: 800 }, hasTouch: true });
      const cookie = api.cookie?.();
      if (cookie) { const i = cookie.indexOf("="); await ctx.addCookies([{ name: cookie.slice(0, i), value: cookie.slice(i + 1), url: BASE }]); }
      const page = await ctx.newPage();
      const slots = [];
      let turn = 0;
      page.on("response", async (r) => { if (!/\/api\/(lesson\/turn|studio\/slot)/.test(r.url())) return; try { const j = await r.json(); const sl = j.slot ?? j.ui?.studioSlot ?? null; if (sl?.artifact) slots.push({ turn, kind: sl.artifact.kind, family: sl.artifact.play?.family ?? null }); } catch { /* */ } });
      const row = { topic: c.topic, turns: 0, firstPlayTurn: null, slots: [] };
      try {
        await page.goto(`${BASE}/c/${child.id}/practice/${c.topic}?mode=text&tier=3d`, { waitUntil: "domcontentloaded", timeout: 60000 });
        await page.waitForSelector('[data-testid="lesson"]', { timeout: 60000 });
        await page.waitForTimeout(2500);
        for (const text of ["namaste didi", ...c.answers].slice(0, TURNS + 1)) {
          const input = page.locator('[data-testid="child-input"]');
          for (let k = 0; k < 30 && !(await input.isVisible().catch(() => false)); k++) { const tb = page.locator('[data-testid="type"]'); if (await tb.isVisible().catch(() => false)) await tb.click().catch(() => {}); await page.waitForTimeout(1500); }
          if (!(await input.isVisible().catch(() => false))) break;
          await page.waitForFunction(() => !document.querySelector('[data-testid="child-input"]')?.disabled, null, { timeout: 45000 }).catch(() => {});
          turn++; await input.fill(text); await input.press("Enter"); await page.waitForTimeout(4000);
          const onStage = await page.evaluate(() => !!document.querySelector('[data-testid="play-stage"][data-family="nazariya"]'));
          if (onStage && row.firstPlayTurn === null) row.firstPlayTurn = turn;
        }
      } catch (e) { row.error = String(e.message ?? e).slice(0, 200); }
      row.turns = turn; row.slots = slots.map((s) => `${s.turn}:${s.kind}${s.family ? "/" + s.family : ""}`);
      rows.push(row);
      console.log(`B1 ${c.topic}: ${row.turns} turns; block world on stage ${row.firstPlayTurn ? `at turn ${row.firstPlayTurn}` : "never"}; slots ${row.slots.join(" ") || "-"}`);
      await ctx.close();
    }
  } finally { await browser.close(); }
  ok(rows.length === CASES.length, `B1 ran ${rows.length} practice lessons (${rows.filter((r) => r.firstPlayTurn).length} reached the game unasked)`);
  if (!rows.some((r) => r.firstPlayTurn)) warn("B1: no practice lesson put the block world on the stage unasked within the turns run");
}, { tag: "khandbeat", child: { classLevel: 6 } });
writeFileSync(join(OUT, "beat-local.json"), JSON.stringify({ at: new Date().toISOString(), base: BASE, turns: TURNS, rows }, null, 1));
done();
