// W1-B acceptance, production Playwright at 360 x 800 (the real child route, text lane, a real lesson):
//   1. once the Director mounts an activity, the iframe's height equals the Work tray's (±2 px) and every engine
//      control lies inside the frame (live-content audit 3: a 150 px frame in a 404 px tray, Check out of view);
//   2. a forced unknown engine (one turn response rewritten in the browser to mount "nope@1" in the tray; route
//      interception is for correctness only, never timing) leaves no visible empty tray after that turn, and the
//      server lets go of it (the mechanism, not a sampled reply): the next turn carries no module tray, and the lesson's
//      stored state holds no module with that id and lists its engine as failed (TAXILA_DB_URL; WARN without it).
//      The next 3 teacher lines have no screen reference (server/director/say.js refersToScreen): a sample, reported
//      beside the mechanism because an unwired server passed it once simply by not mentioning the screen.
// Run: NODE_USE_ENV_PROXY=1 node tests/prod/w1b-tray.mjs   (TAXILA_BASE for a local server)
import { withTestAccount, launch, ok, warn, done, BASE } from "./lib.mjs";
const db = process.env.TAXILA_DB_URL ? (await import("@neondatabase/serverless")).neon(process.env.TAXILA_DB_URL) : null;
import { refersToScreen } from "../../server/director/say.js";

const TOPIC = "c5-maths-ch02-t01";   // number-line@1 (explain show) and item-bound read plans
const LINES = ["haan, main ready hoon", "mujhe nahi pata", "ek example se samjhao", "ok", "1/2", "1/4", "ok", "pata nahi", "2", "ok"];

async function send(page, text) {
  const input = page.locator('[data-testid="child-input"]');
  await input.waitFor({ state: "visible", timeout: 30_000 });
  await page.waitForFunction(() => !document.querySelector('[data-testid="child-input"]')?.disabled, null, { timeout: 30_000 }).catch(() => {});
  await input.fill(text);
  await input.press("Enter");
}

await withTestAccount(async ({ api, child }) => {
  const { browser, page } = await launch({ viewport: { width: 360, height: 800 }, cookieFrom: api });
  try {
    // ── 1. frame geometry in a real lesson ──
    const turns = [];
    page.on("response", async (r) => {
      if (!/\/api\/lesson\/(turn|start)$/.test(new URL(r.url()).pathname)) return;
      try { turns.push(await r.json()); } catch { /* not json */ }
    });
    await page.goto(`${BASE}/c/${child.id}/practice/${TOPIC}?mode=text`, { waitUntil: "domcontentloaded" });
    await page.waitForSelector('[data-testid="lesson"]', { timeout: 45_000 });
    let measured = null;
    for (const line of LINES) {
      const iframe = await page.waitForSelector('[data-testid="tray"][data-kind="module"] iframe', { timeout: 4000 }).catch(() => null);
      if (iframe) {
        const frame = await iframe.contentFrame();
        await frame.waitForSelector("button", { timeout: 20_000 });
        await page.waitForTimeout(400);
        const box = await iframe.boundingBox();
        const tray = await page.$eval('[data-testid="tray"] .dk-tray-body', (e) => e.getBoundingClientRect().height);
        const out = await frame.evaluate(() => [...document.querySelectorAll("button, input")].filter((e) => {
          const r = e.getBoundingClientRect();
          return r.width > 0 && (r.bottom > innerHeight + 1 || r.right > innerWidth + 1 || r.top < -1 || r.left < -1);
        }).length);
        measured = { engine: await iframe.getAttribute("data-engine"), frame: Math.round(box.height), tray: Math.round(tray), out };
        break;
      }
      await send(page, line);
      await page.waitForTimeout(1500);
    }
    if (measured) {
      ok(Math.abs(measured.frame - measured.tray) <= 2, `${measured.engine}: iframe ${measured.frame} px = tray ${measured.tray} px (±2)`);
      ok(measured.out === 0, `${measured.engine}: every engine control inside the frame (${measured.out} outside)`);
    } else ok(false, `no activity mounted in ${LINES.length} turns on ${TOPIC} (mounts seen: ${turns.flatMap((t) => (t.moduleCommands ?? []).filter((c) => c.op === "mount").map((c) => c.engine)).join(", ") || "none"})`);

    // ── 2. a forced unknown engine: rewrite ONE turn response ──
    // The mount reuses the moduleId the SERVER holds (the last mount not unmounted since), so the frame's `unknown
    // engine` error names the server's own module and the Director must clear it (modules.js noteModuleEvents). With
    // nothing mounted server-side the tray check still runs; the screen-reference check then proves less (WARN).
    let forced = false, forcedId = null, heldEngine = null;
    await page.route("**/api/lesson/turn", async (route) => {
      const res = await route.fetch();
      if (forced) return route.fulfill({ response: res });
      forced = true;
      const body = await res.json();
      let held = null;
      for (const c of [...turns.flatMap((t) => t.moduleCommands ?? []), ...(body.moduleCommands ?? [])]) {
        if (c.op === "mount") { held = c.moduleId; heldEngine = c.engine; } else if (c.op === "unmount" && c.moduleId === held) { held = null; heldEngine = null; }
      }
      forcedId = held ?? "forced-x";
      body.moduleCommands = [...(body.moduleCommands ?? []), { op: "mount", moduleId: forcedId, engine: "nope@1", params: {} }];
      body.ui = { ...(body.ui ?? {}), tray: "module" };
      return route.fulfill({ response: res, json: body });
    });
    const before = turns.length;
    await send(page, "ok");
    for (let i = 0; i < 40 && turns.length <= before; i++) await page.waitForTimeout(500);
    await page.waitForTimeout(4000);   // the frame boots, gets init, posts `unknown engine nope@1`
    const empty = await page.evaluate(() => {
      const t = document.querySelector('[data-testid="tray"][data-kind="module"]');
      if (!t) return false;
      const frames = [...t.querySelectorAll("iframe")].filter((f) => f.getAttribute("data-engine") !== "nope@1" && f.getBoundingClientRect().height > 0);
      const m = t.querySelector(".dk-module");
      return !frames.length && (!m || getComputedStyle(m).display !== "none");
    });
    ok(!empty, "a forced unknown engine leaves no visible empty tray after one turn");
    await page.unroute("**/api/lesson/turn");
    const lessonId = turns.find((t) => t.lessonId)?.lessonId ?? null;
    const lines = [];
    for (const [k, said] of ["theek hai", "ok", "aage chalo"].entries()) {
      const n0 = turns.length;
      await send(page, said);
      for (let i = 0; i < 40 && turns.length <= n0; i++) await page.waitForTimeout(500);
      if (turns.length <= n0) break;
      const next = turns.at(-1);
      if (k === 0) {
        // the turn that carried the frame's `error` event: the mechanism
        ok(next.ui?.tray !== "module" || (next.moduleCommands ?? []).some((c) => c.op === "mount" && c.engine !== "nope@1"),
          `the next turn carries no module tray without a mount (tray ${next.ui?.tray ?? "none"})`);
        if (forcedId === "forced-x") warn("the server held no module when the unknown engine was forced: the state check proves nothing");
        else if (!db || !lessonId) warn(`TAXILA_DB_URL ${db ? "set" : "not set"}, lesson id ${lessonId ?? "unknown"}: the stored state not read`);
        else {
          const st = (await db.query("select state from lesson where id = $1", [lessonId]))[0]?.state ?? {};
          ok(st.module?.id !== forcedId, `the server cleared the failed module ${forcedId} (state.module ${st.module ? `${st.module.id} ${st.module.engine}` : "null"})`);
          ok((st.failedEngines ?? []).includes(heldEngine), `the failed engine ${heldEngine} is not mounted again in this lesson (failedEngines ${JSON.stringify(st.failedEngines ?? [])})`);
        }
      }
      // only lines with nothing on screen to point at (no new mount, no module tray, no chips) are fair samples
      const target = (next.moduleCommands ?? []).some((c) => c.op === "mount") || next.ui?.tray === "module" || next.ui?.chips?.length > 0;
      if (typeof next?.teacherReply === "string" && !target) lines.push(next.teacherReply);
    }
    if (!lines.length) warn("no next teacher line captured");
    for (const line of lines) ok(!refersToScreen(line), `a following teacher line has no screen reference: "${line.slice(0, 90)}"`);
  } finally { await browser.close(); }
}, { tag: "w1b-tray", child: { classLevel: 5, firstName: "Riya" } });
done();
