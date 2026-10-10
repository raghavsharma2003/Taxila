// r4-khand · C9 "at a practice beat": a LESSON on a Khand topic (the lesson route, purpose "lesson": Quick Practice at
// /practice/ carries no Studio pieces by design, so it can never reach the beat; --route practice runs it anyway), typed
// lane, the child answering ordinarily (never asking for a game). Does the lesson put the block world on the stage by itself within N turns? Reported per topic with
// the turn it appeared and every slot kind seen; a real child client against a local production build (model calls).
//
//   NODE_USE_ENV_PROXY=1 TAXILA_BASE=http://127.0.0.1:8787 node tests/prod/r4-khand-beat.mjs [--turns 8]
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { withTestAccount, ok, warn, done, BASE } from "./lib.mjs";

const arg = (k, d) => { const i = process.argv.indexOf(`--${k}`); return i > 0 ? process.argv[i + 1] : d; };
const TURNS = Number(arg("turns", 10)), ROUTE = arg("route", "lesson");
const OUT = join(process.cwd(), "docs", "design", "round4", "build", "khand", "results");
mkdirSync(OUT, { recursive: true });
const CASES = [
  { topic: "c6-maths-ch06-t01", cls: 6, answers: ["haan", "perimeter matlab boundary", "16", "2 x (l + b)", "480", "pata nahi", "20", "haan samjha", "24", "ok"] },
  { topic: "c5-maths-ch11-t01", cls: 5, answers: ["haan", "squares gin te hain", "12", "7", "pata nahi", "9", "haan", "10", "ok", "theek hai"] },
  { topic: "c6-maths-ch01-t01", cls: 6, answers: ["haan", "1 4 9 16", "25", "pata nahi", "8", "27", "13", "haan", "36", "ok"] },
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
      const slots = [], net = [], consoleErr = [];
      let turn = 0;
      page.on("console", (m) => { if (m.type() === "error") consoleErr.push({ turn, text: m.text().slice(0, 200) }); });
      page.on("pageerror", (e) => consoleErr.push({ turn, text: `pageerror ${String(e.message ?? e).slice(0, 200)}` }));
      page.on("response", async (r) => {
        const u = r.url();
        if (!/\/api\//.test(u)) return;
        const path = new URL(u).pathname;
        let j = null; try { j = await r.json(); } catch { /* not json */ }
        net.push({ turn, path, status: r.status(), move: j?.move?.kind ?? null, ended: j?.ended ?? j?.lessonEnded ?? j?.end ?? null, phase: j?.phase ?? j?.ui?.phase ?? null, reply: typeof j?.teacherReply === "string" ? j.teacherReply.slice(0, 80) : null, err: j?.error ?? null, ...(/lesson\/start/.test(path) ? { topic: j?.topicId ?? j?.topic?.id ?? j?.lesson?.topicId ?? null, purpose: j?.purpose ?? null } : {}) });
        const sl = j?.slot ?? j?.ui?.studioSlot ?? null; if (sl?.artifact) slots.push({ turn, kind: sl.artifact.kind, family: sl.artifact.play?.family ?? null });
      });
      const row = { topic: c.topic, route: ROUTE, turns: 0, firstPlayTurn: null, slots: [] };
      try {
        await page.goto(ROUTE === "practice" ? `${BASE}/c/${child.id}/practice/${c.topic}?mode=text&tier=3d` : `${BASE}/c/${child.id}/lesson/new?topic=${c.topic}&mode=text&tier=3d`, { waitUntil: "domcontentloaded", timeout: 60000 });
        await page.waitForSelector('[data-testid="lesson"]', { timeout: 60000 });
        await page.waitForTimeout(2500);
        for (const text of ["namaste didi", ...c.answers].slice(0, TURNS + 1)) {
          const input = page.locator('[data-testid="child-input"]');
          const pad = page.locator('[data-testid="number-pad"]');
          for (let k = 0; k < 30 && !(await input.isVisible().catch(() => false)) && !(await pad.isVisible().catch(() => false)); k++) { const tb = page.locator('[data-testid="type"]'); if (await tb.isVisible().catch(() => false)) await tb.click().catch(() => {}); await page.waitForTimeout(1500); }
          // a numeric practice item swaps the text field for the NumberPad (the client's design): answer there
          if (!(await input.isVisible().catch(() => false)) && await pad.isVisible().catch(() => false)) {
            const digits = (text.match(/\d+/)?.[0] ?? "12").split("");
            turn++;
            for (const d of digits) await page.locator('[data-testid="number-pad"] button', { hasText: new RegExp(`^${d}$`) }).first().click().catch(() => {});
            await page.locator('[data-testid="pad-send"]').click().catch(() => {});
            row.padTurns = (row.padTurns ?? 0) + 1;
            await page.waitForTimeout(4000);
            const onStage = await page.evaluate(() => !!document.querySelector('[data-testid="play-stage"][data-family="nazariya"]'));
            if (onStage && row.firstPlayTurn === null) row.firstPlayTurn = turn;
            continue;
          }
          if (!(await input.isVisible().catch(() => false))) {
            // the input is gone: record what the client shows, for the root cause
            row.stuck = await page.evaluate(() => {
              const ids = [...document.querySelectorAll("[data-testid]")].filter((e) => e.offsetWidth > 0).map((e) => e.getAttribute("data-testid"));
              const dock = document.querySelector('[data-testid="answer-dock"], .dk-dock');
              return { url: location.pathname + location.search, visibleTestids: [...new Set(ids)].slice(0, 60), dock: dock ? { cls: dock.className, html: dock.outerHTML.slice(0, 600) } : null, body: document.body.innerText.slice(0, 600) };
            }).catch((e) => ({ error: String(e) }));
            await page.screenshot({ path: join(OUT, `beat-stuck-${c.topic}.png`) }).catch(() => {});
            break;
          }
          await page.waitForFunction(() => !document.querySelector('[data-testid="child-input"]')?.disabled, null, { timeout: 45000 }).catch(() => {});
          turn++; await input.fill(text); await input.press("Enter"); await page.waitForTimeout(4000);
          const onStage = await page.evaluate(() => !!document.querySelector('[data-testid="play-stage"][data-family="nazariya"]'));
          if (onStage && row.firstPlayTurn === null) row.firstPlayTurn = turn;
        }
      } catch (e) { row.error = String(e.message ?? e).slice(0, 200); }
      row.turns = turn; row.slots = slots.map((s) => `${s.turn}:${s.kind}${s.family ? "/" + s.family : ""}`);
      row.net = net.filter((n) => !/\/api\/(health|tts|voice|metrics|log)/.test(n.path)).slice(-40); row.consoleErr = consoleErr.slice(-20);
      rows.push(row);
      console.log(`B1 ${c.topic}: ${row.turns} turns; block world on stage ${row.firstPlayTurn ? `at turn ${row.firstPlayTurn}` : "never"}; slots ${row.slots.join(" ") || "-"}`);
      await ctx.close();
    }
  } finally { await browser.close(); }
  ok(rows.length === CASES.length, `B1 ran ${rows.length} practice lessons (${rows.filter((r) => r.firstPlayTurn).length} reached the game unasked)`);
  if (!rows.some((r) => r.firstPlayTurn)) warn("B1: no practice lesson put the block world on the stage unasked within the turns run");
}, { tag: "khandbeat", child: { classLevel: 6 } });
writeFileSync(join(OUT, process.env.BEAT_TAG ? `beat-local-${process.env.BEAT_TAG}.json` : "beat-local.json"), JSON.stringify({ at: new Date().toISOString(), base: BASE, route: ROUTE, turns: TURNS, rows }, null, 1));
done();
