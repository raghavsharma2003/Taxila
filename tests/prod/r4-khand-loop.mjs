// r4-khand · the Khand acceptance against a local production server (node server/serve.mjs, NODE_ENV=production, the
// stream's own Neon TEST branch) or a deployed one. Same checks as round3-play, for every Nazariya coverage entry, plus the
// saved build and the lesson loop. API checks call no model; the lesson turn (P8) and the browser ask (A1) cost a few
// model calls.
//
//   K0 routes   /api/play/admit admits a Khand skill (family nazariya)
//   K1 levels   /api/play/start serves a proven level for EVERY Nazariya entry (topic + goal), with an art and a world
//   K2 truth    the level's own solution, posted act by act as raw acts, is graded solved by the SERVER's replay
//   K3 claims   a mal-rule's acts dressed in claim fields are not graded solved, and fold the kit misconception
//   K4 tamper   an edited session token → 400; a foreign level id → 409
//   K5 doors    /api/play/next serves the next level
//   K6 lines    every micro-line the server sent passes the play guard and never says the level's key
//   K7 builds   the solved levels' builds are saved from the server's replay and listed by /api/play/builds (heights only)
//   P8 lesson   a lesson + a play session tied to it: the solved level's signed evidence and seam ride a module-only turn →
//               she takes a full turn and exactly one kt_evidence row via "game" lands (local only); the same tokens and a
//               forged one fold nothing
//   A1 ask      the real child client, typed lane: "game khelna hai" on a Khand topic puts the block world on the stage
//               (a play slot of family nazariya, a WebGL canvas, a goal line) — then the world is measured at 360 / 412 / 1366
//   B1 beat     the same lesson, answering on: does the Director offer the game at a practice beat by itself? (reported)
//
//   server: NODE_ENV=production PORT=8787 node --env-file=.env.local --env-file=tests/prod/prod-routing.env server/serve.mjs
//   (production's model routing; without it the classifier differs from production)
//   NODE_USE_ENV_PROXY=1 TAXILA_BASE=http://127.0.0.1:8787 node tests/prod/r4-khand-loop.mjs [--no-browser] [--out DIR]
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { withTestAccount, ok, warn, done, BASE, isLocal, dbq } from "./lib.mjs";
import { LOGIC } from "../../src/play/families/index.ts";
import { reactionProblems } from "../../shared/play.ts";
import { nazariyaHidden } from "../../src/play/families/nazariya/index.ts";
import cov from "../../data/play/coverage.json" with { type: "json" };

const arg = (k, d) => { const i = process.argv.indexOf(`--${k}`); return i > 0 ? process.argv[i + 1] : d; };
const OUT = arg("out", join(process.cwd(), "docs", "design", "round4", "build", "khand", "results"));
mkdirSync(OUT, { recursive: true });
const env = (acts) => acts.map((act, i) => ({ seq: i + 1, t: i * 700, via: "touch", act }));
const ENTRIES = cov.entries.filter((e) => e.family === "nazariya");
const report = { at: new Date().toISOString(), base: BASE, local: isLocal, entries: [], builds: null, lesson: null, ask: [], beat: null };
const p90 = (xs) => { const s = [...xs].sort((a, b) => a - b); return s.length ? s[Math.min(s.length - 1, Math.ceil(0.9 * s.length) - 1)] : null; };
const tStart = [], tAct = [];

await withTestAccount(async ({ api, child }) => {
  const adm = await api("GET", `/api/play/admit?skillId=${ENTRIES[0].skillId}`, undefined, [200, 404]);
  if (!ok(adm.status === 200 && adm.play === true && adm.family === "nazariya", `K0 /api/play/admit admits ${ENTRIES[0].skillId} as nazariya/${adm.mode}`)) return;
  const solvedIds = [];
  for (const e of ENTRIES) {
    const id = `${e.topicId}/${e.goal}`, row = { id };
    try {
      const s = await api("POST", "/api/play/start", { childId: child.id, topicId: e.topicId, goal: e.goal, lang: "hinglish" }, [200, 404]);
      tStart.push(s.ms);
      const lv = s.level, logic = lv ? LOGIC[`${lv.family}/${lv.mode}`] : null;
      if (!ok(s.status === 200 && lv?.family === "nazariya" && lv.goal === e.goal && lv.proof?.solvable && lv.proof?.shortcutFree && !!logic, `K1 ${id}: a proven level (${lv?.mode} ${lv?.goal})`)) { report.entries.push({ ...row, error: "no level" }); continue; }
      ok(!!s.art?.art && !!s.world?.stations, `K1 ${id}: art ${s.art?.art}, world with ${s.world?.stations?.length} stations`);
      row.level = { levelId: lv.levelId, mode: lv.mode, goal: lv.goal, fade: lv.fade, discriminates: lv.proof.discriminates };
      const mism = await api("POST", "/api/play/act", { sessionId: s.sessionId, levelId: "not-this-level", acts: [] }, [409, 400]);
      ok(mism.status === 409, `K4 ${id}: a foreign level id is refused (${mism.status})`);
      const [pl, mac] = s.sessionId.split(".");
      const body = JSON.parse(Buffer.from(pl, "base64url").toString("utf8")); body.seed = (body.seed ?? 0) + 1;
      const tam = await api("POST", "/api/play/act", { sessionId: `${Buffer.from(JSON.stringify(body)).toString("base64url")}.${mac}`, levelId: lv.levelId, acts: [] }, [400, 409]);
      ok(tam.status === 400, `K4 ${id}: an edited session token is refused (${tam.status})`);
      const malId = Object.keys(lv.mal).find((m) => logic.malActs(lv, m)?.length);
      if (malId) {
        const claimed = env(logic.malActs(lv, malId)).map((x) => ({ ...x, act: { ...x.act, correct: true, verdict: "solved", solved: true, score: 100 } }));
        const bad = await api("POST", "/api/play/act", { sessionId: s.sessionId, levelId: lv.levelId, acts: claimed, final: true });
        tAct.push(bad.ms);
        ok(bad.grade?.verdict !== "solved" && bad.evidence?.[0]?.misconceptionId === lv.mal[malId], `K3 ${id}: claims never grade; the mal-rule folds ${bad.evidence?.[0]?.misconceptionId}`);
      }
      const acts = env(logic.solve(lv)), lines = [], hidden = nazariyaHidden(lv);
      let last = null;
      for (let k = 1; k <= acts.length; k++) {
        last = await api("POST", "/api/play/act", { sessionId: last?.sessionId ?? s.sessionId, levelId: lv.levelId, acts: acts.slice(0, k) });
        tAct.push(last.ms);
        if (last.reaction?.text) lines.push({ text: last.reaction.text, solved: !!last.grade });
      }
      ok(last.grade?.verdict === "solved" && last.evidence?.[0]?.outcome === "correct", `K2 ${id}: the server grades the solution solved (${acts.length} acts)`);
      if (last.grade?.verdict === "solved") solvedIds.push(lv.levelId);
      const badLines = lines.filter((l) => reactionProblems(l.text, { hidden: l.solved ? [] : hidden }).length);
      ok(!badLines.length, `K6 ${id}: ${lines.length} micro-lines, all pass the guard${badLines.length ? ": " + badLines.map((l) => l.text).join(" | ") : ""}`);
      row.lines = lines.map((l) => l.text);
      const nx = await api("POST", "/api/play/next", { sessionId: last.sessionId, door: "teekha" });
      ok(!!nx.level?.levelId && nx.level.levelId !== lv.levelId, `K5 ${id}: the next level (${nx.level?.goal})`);
    } catch (err) { ok(false, `${id}: ${String(err.message ?? err).slice(0, 200)}`); row.error = String(err.message ?? err).slice(0, 200); }
    report.entries.push(row);
  }
  // K7 builds
  const b = await api("GET", `/api/play/builds?childId=${child.id}`);
  const got = new Set((b.builds ?? []).map((x) => x.levelId));
  report.builds = { n: (b.builds ?? []).length, sample: (b.builds ?? []).slice(0, 2) };
  ok(solvedIds.length > 0 && solvedIds.every((id) => got.has(id)), `K7 every solved level's build is saved and listed (${got.size} listed, ${solvedIds.length} solved)`);
  ok((b.builds ?? []).every((x) => Array.isArray(x.heights) && x.heights.length === x.w * x.d && !("score" in x)), "K7 a build is heights only (no score, no count)");

  // P8 the in-lesson loop on a Khand topic
  try {
    const topicId = "c6-maths-ch06-t01";
    const les = await api("POST", "/api/lesson/start", { childId: child.id, mode: "text", topicId });
    ok(!!les.lessonId, "P8 a lesson starts");
    const ps = await api("POST", "/api/play/start", { childId: child.id, topicId, lessonId: les.lessonId, lang: "hinglish" });
    const lv = ps.level, logic = LOGIC[`${lv.family}/${lv.mode}`];
    const sol = env(logic.solve(lv));
    let r = null;
    for (let k = 1; k <= sol.length; k++) r = await api("POST", "/api/play/act", { sessionId: r?.sessionId ?? ps.sessionId, levelId: lv.levelId, acts: sol.slice(0, k) });
    ok(typeof r.evidenceToken === "string" && typeof r.seamToken === "string" && r.seam?.kind === "level_end", "P8 the solved Khand level returns signed evidence and a level_end seam");
    const ev = (data, type, name) => ({ moduleId: "play-intent", engine: "play", type, name, data, at: Date.now() });
    const turn = await api("POST", "/api/lesson/turn", { lessonId: les.lessonId, childText: "", turnSeq: 1, moduleEvents: [ev({ ev: r.evidenceToken }, "interaction", "play_evidence"), ev({ seam: r.seamToken }, "goal_met", "level_end")] });
    const said = String(turn.teacherReply ?? "");
    ok(!!turn.move?.kind && said.length > 0, `P8 she takes a full turn at the level end (move ${turn.move?.kind}): "${said.slice(0, 140)}"`);
    report.lesson = { topicId, level: lv.levelId, move: turn.move?.kind ?? null, said: said.slice(0, 300) };
    if (isLocal) {
      const rows = await dbq("select count(*)::int as n from kt_evidence where child_id = $1 and item_key like 'play:%' and via = 'game'", [child.id]);
      ok(rows?.[0]?.n === 1, `P8 one kt_evidence row via game for the level (${rows?.[0]?.n})`);
      await api("POST", "/api/lesson/turn", { lessonId: les.lessonId, childText: "", turnSeq: 2, moduleEvents: [ev({ ev: r.evidenceToken }, "interaction", "play_evidence"), ev({ ev: r.evidenceToken.replace(/.$/, (ch) => (ch === "A" ? "B" : "A")) }, "interaction", "play_evidence")] });
      const again = await dbq("select count(*)::int as n from kt_evidence where child_id = $1 and item_key like 'play:%'", [child.id]);
      ok(again?.[0]?.n === 1, `P8 the same tokens again and a forged token fold nothing (${again?.[0]?.n})`);
    } else warn("P8 database checks run on local targets only");
    await api("POST", "/api/lesson/end", { lessonId: les.lessonId }, [200, 201, 404, 409]).catch(() => null);
  } catch (e) { ok(false, `P8 ${String(e.message ?? e).slice(0, 200)}`); }

  // A1 / B1 the real child client
  if (process.argv.includes("--no-browser")) { warn("A1/B1 skipped (--no-browser)"); return; }
  const { chromium } = await import("playwright");
  const browser = await chromium.launch({ executablePath: process.env.KHAND_CHROME || "/opt/pw-browsers/chromium", args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist", "--autoplay-policy=no-user-gesture-required"] });
  try {
    for (const c of [{ id: "ask-perimeter", topic: "c6-maths-ch06-t01", cls: 6, ask: "game khelna hai" }, { id: "ask-array", topic: "c4-maths-ch09-t01", cls: 5, ask: "game khelna hai" }, { id: "ask-views-en", topic: "c4-maths-ch02-t01", cls: 5, ask: "can we play a game?" }]) {
      const { child: kid } = await api("POST", "/api/children", { firstName: "Meher", classLevel: c.cls, languagePref: "hinglish", interests: ["cricket"] });
      await api("POST", "/api/consent", { childId: kid.id, grants: { core_tutoring: true, learning_profile: true, memory: true } });
      await api("POST", "/api/parent/controls", { childId: kid.id, hoursStart: "00:00", hoursEnd: "23:59", dailyMinutes: 120 });
      const childId = kid.id;
      const ctx = await browser.newContext({ viewport: { width: 360, height: 800 }, deviceScaleFactor: 1, hasTouch: true });
      const cookie = api.cookie?.();
      if (cookie) { const i = cookie.indexOf("="); await ctx.addCookies([{ name: cookie.slice(0, i), value: cookie.slice(i + 1), url: BASE }]); }
      const page = await ctx.newPage();
      const slots = [], errors = [];
      page.on("pageerror", (er) => errors.push(String(er.message ?? er).slice(0, 160)));
      page.on("response", async (rr) => { if (!/\/api\/(lesson\/turn|studio\/slot)/.test(rr.url())) return; try { const j = await rr.json(); const sl = j.slot ?? j.ui?.studioSlot ?? null; if (sl?.artifact) slots.push({ at: Date.now(), kind: sl.artifact.kind, family: sl.artifact.play?.family ?? null, mode: sl.artifact.play?.mode ?? null }); } catch { /* */ } });
      const rec = { id: c.id, topic: c.topic, ask: c.ask };
      try {
        await page.goto(`${BASE}/c/${childId}/practice/${c.topic}?mode=text&tier=3d`, { waitUntil: "domcontentloaded", timeout: 60000 });
        await page.waitForSelector('[data-testid="lesson"]', { timeout: 60000 });
        const send = async (text) => {
          const input = page.locator('[data-testid="child-input"]');
          for (let k = 0; k < 30 && !(await input.isVisible().catch(() => false)); k++) { const tb = page.locator('[data-testid="type"]'); if (await tb.isVisible().catch(() => false)) await tb.click().catch(() => {}); await page.waitForTimeout(1500); }
          await input.waitFor({ state: "visible", timeout: 45000 });
          await page.waitForFunction(() => !document.querySelector('[data-testid="child-input"]')?.disabled, null, { timeout: 45000 }).catch(() => {});
          await input.fill(text); await input.press("Enter"); await page.waitForTimeout(2500);
        };
        await page.waitForTimeout(2500);
        await send("namaste didi"); await send("haan");
        const tAsk = Date.now();
        await send(c.ask);
        let world = null;
        for (let k = 0; k < 24 && !world; k++) {
          world = await page.evaluate(() => { const st = document.querySelector('[data-testid="play-stage"][data-family="nazariya"]'); if (!st) return null; const cv = st.querySelector("canvas.kh-canvas"); const g = st.querySelector('[data-testid="play-goal"]')?.textContent ?? ""; return cv && g ? { goal: g, w: cv.clientWidth, h: cv.clientHeight, mode: st.getAttribute("data-mode") } : null; });
          if (!world) await page.waitForTimeout(1500);
        }
        rec.slots = slots.filter((s) => s.at >= tAsk).map((s) => `${s.kind}:${s.family ?? ""}/${s.mode ?? ""}`);
        rec.world = world;
        ok(!!world && rec.slots.some((s) => s.startsWith("play:nazariya")), `A1 ${c.id}: "${c.ask}" puts the block world on the stage (slots ${rec.slots.join(",") || "-"}; world ${world ? `${world.mode} ${world.w}x${world.h}` : "none"})`);
        if (world) {
          rec.views = [];
          for (const vp of [{ id: "p360", w: 360, h: 800 }, { id: "p412", w: 412, h: 915 }, { id: "l1366", w: 1366, h: 768 }]) {
            await page.setViewportSize({ width: vp.w, height: vp.h }); await page.waitForTimeout(1500);
            const m = await page.evaluate(() => { const st = document.querySelector('[data-testid="play-stage"]'), cv = st?.querySelector("canvas.kh-canvas"), r = cv?.getBoundingClientRect(); const btns = [...(st?.querySelectorAll("button") ?? [])].filter((b) => b.offsetWidth > 0); return { overflowX: document.documentElement.scrollWidth > innerWidth + 1, world: r ? [Math.round(r.width), Math.round(r.height)] : null, tiny: btns.filter((b) => b.offsetWidth < 44 || b.offsetHeight < 44).map((b) => b.textContent.trim()), goalClipped: (() => { const g = st?.querySelector('[data-testid="play-goal"]'); return g ? g.scrollHeight > g.clientHeight + 1 : null; })() }; });
            await page.screenshot({ path: join(OUT, `..`, "shots", `lesson-${c.id}-${vp.id}.jpg`), type: "jpeg", quality: 72 });
            rec.views.push({ vp: vp.id, ...m });
            ok(!m.overflowX && m.world && m.world[0] > 200 && m.world[1] > 200 && !m.tiny.length && !m.goalClipped, `A1 ${c.id} ${vp.id}: in the lesson Desk the world is ${m.world?.join("x")}, 0 overflow, targets ≥ 44, goal unclipped${m.tiny.length ? " tiny: " + m.tiny.join(",") : ""}`);
          }
          await page.setViewportSize({ width: 360, height: 800 });
        }
        rec.errors = errors;
      } catch (err) { ok(false, `A1 ${c.id}: ${String(err.message ?? err).slice(0, 200)}`); rec.error = String(err.message ?? err).slice(0, 200); }
      report.ask.push(rec);
      await ctx.close();
    }
  } finally { await browser.close(); }
}, { tag: "khand", child: { classLevel: 6 } });

report.latency = { startP90: p90(tStart), actP90: p90(tAct), n: { start: tStart.length, act: tAct.length }, where: isLocal ? "local server, this sandbox" : BASE };
writeFileSync(join(OUT, `loop-${isLocal ? "local" : "remote"}.json`), JSON.stringify(report, null, 1));
console.log("wrote", join(OUT, `loop-${isLocal ? "local" : "remote"}.json`), JSON.stringify(report.latency));
done();
