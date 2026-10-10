// Round 3 · stream forge acceptance (docs/design/round3/forge/). Same file before and after, against a local production build
// (node server/serve.mjs, NODE_ENV=production, Neon TEST) or taxila.dev. Drives the REAL child client: a fresh child per
// case, the practice page of the case's topic on the typed lane, two ordinary turns, then the child's visual ask; when
// something real is on the stage, the SAME page is measured at 360 x 800, 412 x 915 and 1366 x 768 with the forge3 visual
// QA (server/forge3/qa/measure.js + checks.js: the verdict the gate uses), and every board drawn is re-gated against her
// real line with the meaning checks (wb-gate@3 W10-W13, server/studio/qa/semantics.js).
//
// Checks (all must pass):
//   R1 real      every ask puts something real on the stage (a Studio piece painted, a board drawn, an engine in the tray)
//   R2 do        a game / animation / simulation ask ends with something the child can DO on the stage (an engine in the
//                tray, a Stagecraft piece, a play piece), never a static board that replaced an engine
//   R3 meaning   every board shown passes W10-W13 against the line she said over it (no nonsense board reaches the child)
//   R4 view      every view at the three sizes passes the forge3 layout verdict (legible ≥ 14 px, whole, apart, touchable)
//   R5 variety   ≥ 2 distinct board grounds over the run when ≥ 4 boards were drawn
//   T1 piece     request → piece on stage (API time from this machine) p90 ≤ 3000 ms
//   T2 board     board lateness after her audio starts p90 ≤ 1500 ms (= board on the slot − reply received − 700 ms)
//
//   NODE_USE_ENV_PROXY=1 node tests/prod/round3-forge.mjs [--base URL] [--cases a,b] [--nss-home DIR] [--out DIR]
// Browser trust: Chromium is launched with HOME pointing at an NSS db that trusts the sandbox proxy CA (--nss-home; never
// ignoreHTTPSErrors). Costs production model calls (one lesson per case). File name is not a node --test pattern.
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { arg, withTestAccount, ok, warn, done, BASE, isLocal, PERSONAS, GREET, freshChild, OUT as OWNER_OUT } from "./_owner.mjs";
import { measureStage, measureDocument, canvasTextProbe } from "../../server/forge3/qa/measure.js";
import { judgeView, judgeFrame } from "../../server/forge3/qa/checks.js";
import { claimsNotDrawn, placeholderBoard, nextStepRevealed, fractionsDisagree } from "../../server/studio/qa/semantics.js";

const OUT = arg("out", join(OWNER_OUT, "round3-forge"));
const NSS_HOME = arg("nss-home", process.env.FORGE_NSS_HOME || "");
const ONLY = arg("cases", "");
const SHOTS = !process.argv.includes("--no-shots");
const AUDIO_MS = Number(process.env.W2F_AUDIO_MS) || 700;
mkdirSync(OUT, { recursive: true });

const VIEWPORTS = [{ id: "p360", width: 360, height: 800 }, { id: "p412", width: 412, height: 915 }, { id: "l1366", width: 1366, height: 768 }];
const CASES = [
  { id: "picture", ask: "picture dikhao", persona: "aarav", topic: "c5-maths-ch02-t01" },
  { id: "diagram", ask: "show me a diagram", persona: "meher", topic: "c6-maths-ch07-t01" },
  { id: "draw", ask: "draw it", persona: "zoya", topic: "c5-evs-ch01-t01" },
  { id: "whiteboard", ask: "whiteboard pe bana ke samjhao", persona: "kabir", topic: "c7-maths-ch08-t01" },
  { id: "game", ask: "game khelna hai", persona: "aarav", topic: "c4-maths-ch05-t01", interactive: true },
  { id: "animation", ask: "animation dikhao na", persona: "ishaan", topic: "c6-science-ch01-t01", interactive: true },
  { id: "game-perimeter", ask: "game khelna hai", persona: "meher", topic: "c6-maths-ch06-t01", interactive: true },
  { id: "sim-science", ask: "simulation dikhao", persona: "kabir", topic: "c7-science-ch01-t01", interactive: true },
  { id: "picture-evs", ask: "picture dikhao", persona: "zoya", topic: "c4-evs-ch01-t01" },
  { id: "diagram-science", ask: "show me a diagram", persona: "meher", topic: "c6-science-ch02-t01" },
  { id: "game-sst", ask: "can we play a game?", persona: "meher", topic: "c6-sst-ch01-t01", interactive: true },
  { id: "animation-maths", ask: "animation dikhao na", persona: "aarav", topic: "c5-maths-ch01-t01", interactive: true },
].filter((c) => !ONLY || ONLY.split(",").includes(c.id));

const q = (xs, p) => { const s = [...xs].sort((a, b) => a - b); return s.length ? s[Math.min(s.length - 1, Math.ceil(p * s.length) - 1)] : null; };
const meaningOf = (line, ops) => [...claimsNotDrawn(line, ops).map((x) => `W10 ${x}`), ...placeholderBoard(ops).map((x) => `W11 ${x}`),
  ...nextStepRevealed(line, ops).map((x) => `W12 ${x}`), ...fractionsDisagree(line, ops).map((x) => `W13 ${x}`)];

async function launchBrowser() {
  process.env.PLAYWRIGHT_BROWSERS_PATH ||= "/opt/pw-browsers";
  const { chromium } = await import("playwright");
  const env = { ...process.env };
  if (NSS_HOME) env.HOME = NSS_HOME;
  const proxy = !isLocal && process.env.HTTPS_PROXY ? { server: process.env.HTTPS_PROXY } : undefined;
  return chromium.launch({ env, ...(proxy ? { proxy } : {}), args: ["--autoplay-policy=no-user-gesture-required"] });
}

const results = [];
const pieceMs = [], boardLate = [], pieceDom = [];
await withTestAccount(async ({ api }) => {
  const browser = await launchBrowser();
  try {
    for (const c of CASES) {
      const persona = PERSONAS[c.persona];
      const child = await freshChild(api, persona);
      const ctx = await browser.newContext({ viewport: { width: 360, height: 800 }, deviceScaleFactor: 2, hasTouch: true });
      // text drawn on canvases (play pieces, Studio v2 engines) is measured like DOM text (measure.js canvasTextProbe)
      await ctx.addInitScript(canvasTextProbe);
      // round 4 content: T1 from what the PAGE shows (a piece can now arrive on the Studio stream before the turn's
      // response): the first time after the ask that a piece the child can act on is in the tray (a Studio piece other than
      // a board, or an engine frame); window.__askAt is set by the harness when it presses Enter
      await ctx.addInitScript(() => {
        const look = () => {
          if (!window.__askAt || window.__pieceAt) return;
          const st = document.querySelector('[data-testid="studio-stage"]');
          const k = st?.getAttribute("data-kind");
          if ((k && k !== "whiteboard" && st.getAttribute("data-legible") !== "twin") || document.querySelector(".dk-module iframe")) window.__pieceAt = performance.now();
        };
        new MutationObserver(look).observe(document, { subtree: true, childList: true, attributes: true, attributeFilter: ["data-kind"] });
      });
      const cookie = api.cookie();
      if (cookie) { const i = cookie.indexOf("="); await ctx.addCookies([{ name: cookie.slice(0, i), value: cookie.slice(i + 1), url: BASE }]); }
      const page = await ctx.newPage();
      const net = [];
      page.on("response", async (r) => {
        const u = r.url();
        if (!/\/api\/(lesson\/turn|studio\/slot)/.test(u)) return;
        const at = Date.now();
        try { const j = await r.json(); net.push({ at, turn: /lesson\/turn/.test(u), slot: j.slot ?? j.ui?.studioSlot ?? null, tray: j.ui?.tray ?? null, reply: j.teacherReply ?? null, moduleCommands: j.moduleCommands ?? null, lessonId: j.lessonId ?? null }); } catch { /* not json */ }
      });
      const rec = { case: c.id, topic: c.topic, ask: c.ask, interactive: !!c.interactive, views: [], boards: [], errors: [] };
      results.push(rec);
      try {
        await page.goto(`${BASE}/c/${child.id}/practice/${c.topic}?mode=text`, { waitUntil: "domcontentloaded", timeout: 60_000 });
        await page.waitForSelector('[data-testid="lesson"]', { timeout: 60_000 });
        const send = async (text) => {
          const input = page.locator('[data-testid="child-input"]');
          for (let k = 0; k < 30 && !(await input.isVisible().catch(() => false)); k++) {
            const typeBtn = page.locator('[data-testid="type"]');
            if (await typeBtn.isVisible().catch(() => false)) await typeBtn.click().catch(() => {});
            await page.waitForTimeout(1500);
          }
          await input.waitFor({ state: "visible", timeout: 45_000 });
          await page.waitForFunction(() => !document.querySelector('[data-testid="child-input"]')?.disabled, null, { timeout: 45_000 }).catch(() => {});
          await input.fill(text);
          const t0 = Date.now();
          await page.evaluate(() => { window.__askAt = performance.now(); window.__pieceAt = 0; }).catch(() => {});
          await input.press("Enter");
          await page.waitForTimeout(2500);
          return t0;
        };
        await page.waitForTimeout(2500);
        await send(GREET[persona.style] ?? GREET.hinglish);
        await send(persona.style === "english" ? "okay" : "haan");
        const before = await page.evaluate(measureStage);
        const trayBefore = before.tray ? await page.evaluate(() => document.querySelector('[data-testid="tray"]')?.getAttribute("data-kind")) : null;
        const tAsk = await send(c.ask);
        // a real visual: a Studio piece painted (phase live / reveal) or a tray with media
        let real = false;
        for (let k = 0; k < 14 && !real; k++) {
          const m = await page.evaluate(measureStage);
          const kind = await page.evaluate(() => document.querySelector('[data-testid="tray"]')?.getAttribute("data-kind") ?? null);
          real = !!m.box && ((kind === "studio" && ["live", "reveal"].includes(m.phase ?? "") && (m.svg || m.canvas)) || kind === "module" || kind === "board");
          if (!real) await page.waitForTimeout(1500);
        }
        rec.real = real;
        rec.pieceDomMs = await page.evaluate(() => (window.__pieceAt ? Math.round(window.__pieceAt - window.__askAt) : null)).catch(() => null);
        rec.trayBefore = trayBefore;
        await page.waitForTimeout(6000);
        const kindAfter = await page.evaluate(() => ({ tray: document.querySelector('[data-testid="tray"]')?.getAttribute("data-kind") ?? null, stage: document.querySelector('[data-testid="studio-stage"]')?.getAttribute("data-kind") ?? null }));
        rec.after = kindAfter;
        // R2: something to DO — an engine in the tray, a Stagecraft or play piece on the slot (what the server sent for the
        // ask; whether THIS device's box could hold it, or showed its board twin, is counted per view below as R2b)
        const slotKinds = net.filter((n) => n.at >= tAsk && n.slot?.artifact).map((n) => n.slot.artifact.kind);
        rec.slotKinds = [...new Set(slotKinds)];
        rec.doable = kindAfter.tray === "module" || ["stagecraft", "play", "frame"].includes(kindAfter.stage ?? "") || rec.slotKinds.some((k) => ["stagecraft", "play", "frame"].includes(k));
        // round 4 content, brief item 4 (reported beside R2, never instead of it): an animation / simulation ask may also end
        // in "the whiteboard player drawing on her clause": a board that DRAWS over her line (≥ 3 timed ops spread over
        // ≥ 1.5 s). A game ask never counts a board.
        const animatedBoard = net.filter((n) => n.at >= tAsk && n.slot?.artifact?.kind === "whiteboard").some((n) => {
          const ops = n.slot.artifact.script?.ops ?? [];
          const starts = ops.map((o) => Number(o.startMs) || 0);
          return ops.length >= 3 && Math.max(...starts) - Math.min(...starts) >= 1500;
        });
        rec.doableBrief = rec.doable || (!/game/.test(c.id) && animatedBoard);
        // timings: the ask's turn response; a slot carrying a piece or a board
        const askTurn = net.find((n) => n.turn && n.at >= tAsk);
        const firstArt = net.find((n) => n.at >= tAsk && n.slot?.artifact);
        if (firstArt?.slot?.artifact?.kind === "whiteboard") { if (askTurn) boardLate.push(firstArt.at - askTurn.at - AUDIO_MS); }
        else if (firstArt) pieceMs.push(firstArt.at - tAsk);
        else if (askTurn && (askTurn.moduleCommands ?? []).some((m) => m.op === "mount")) pieceMs.push(askTurn.at - tAsk);
        // boards that arrived on the Studio stream (not in a response): fetch each slot this lesson opened since the ask,
        // in the page (same-origin cookies), so every board drawn is re-gated, whichever path drew it
        const lessonId = await page.evaluate(() => { try { return JSON.parse(sessionStorage.getItem("taxila.lesson") ?? "null")?.lessonId ?? null; } catch { return null; } }).catch(() => null);
        for (const n of net.filter((x) => x.turn && x.at >= tAsk && x.slot?.intentId && !x.slot?.artifact)) {
          const lid = String(n.slot.intentId).split(":")[0] || lessonId;
          const got = await page.evaluate(async ([l, i]) => { try { const r = await fetch(`/api/studio/slot?lessonId=${l}&intentId=${encodeURIComponent(i)}`, { credentials: "same-origin" }); return r.ok ? await r.json() : null; } catch { return null; } }, [lid, n.slot.intentId]).catch(() => null);
          const slot = got?.slot ?? got;
          if (slot?.artifact) net.push({ at: n.at + 1, turn: false, slot, reply: n.reply, viaStream: true });
        }
        // R3: every board drawn since the ask, against the line she said over it
        const seen = new Set();
        for (const n of net.filter((x) => x.at >= tAsk && x.slot?.artifact?.kind === "whiteboard")) {
          const s = n.slot.artifact.script;
          if (seen.has(s.scriptId)) continue;
          seen.add(s.scriptId);
          const line = n.reply ?? net.filter((x) => x.turn && x.at <= n.at).at(-1)?.reply ?? "";
          rec.boards.push({ scriptId: s.scriptId, ground: s.board?.ground ?? null, line: line.slice(0, 200), problems: meaningOf(line, s.ops ?? []) });
        }
        // R4: the same page at three sizes
        for (const vp of VIEWPORTS) {
          await page.setViewportSize({ width: vp.width, height: vp.height });
          await page.waitForTimeout(1400);
          let verdict;
          if (kindAfter.tray === "module") {
            // an engine in its sandboxed frame: measured inside the frame (the child's view of it)
            let fr = null, area = 0;
            for (const f of page.frames()) {
              if (f === page.mainFrame()) continue;
              const b = await (await f.frameElement().catch(() => null))?.boundingBox().catch(() => null);
              if (b && b.width * b.height > area) { area = b.width * b.height; fr = f; }
            }
            const d = fr ? await fr.evaluate(measureDocument).catch(() => null) : null;
            verdict = judgeFrame(d ?? {});
          } else {
            const m = await page.evaluate(measureStage);
            verdict = judgeView(m, { artifactKind: kindAfter.stage ?? undefined });
            // no tray at all (the Desk gave it back: nothing to show, she answers by voice) is not a BROKEN view; the ask
            // is counted as not answered by R1 instead
            if (!m.tray) verdict = { ...verdict, pass: true, none: true, fails: [] };
            verdict.raw = { overlaps: (m.overlaps ?? []).slice(0, 6), duplicates: m.duplicates ?? 0, writing: m.writing ?? 0, minPx: verdict.stats?.minPx ?? null };
          }
          let file = null;
          if (SHOTS) { file = join(OUT, `${c.id}-${vp.id}.png`); await page.screenshot({ path: file }).catch(() => { file = null; }); }
          const shown = await page.evaluate(() => { const st = document.querySelector('[data-testid="studio-stage"]'); return { kind: st?.getAttribute("data-kind") ?? null, legible: st?.getAttribute("data-legible") ?? null, tray: document.querySelector('[data-testid="tray"]')?.getAttribute("data-kind") ?? null }; }).catch(() => ({}));
          rec.views.push({ vp: vp.id, pass: verdict.pass, none: !!verdict.none, fails: verdict.fails, stats: verdict.stats, raw: verdict.raw ?? null, file, shown,
            playable: shown.tray === "module" || (["stagecraft", "play", "frame"].includes(shown.kind ?? "") && shown.legible !== "twin"),
            detail: Object.fromEntries(verdict.hard.filter((x) => !x.pass).map((x) => [x.id, x.detail ?? ""])) });
        }
      } catch (e) {
        rec.error = String(e.message).slice(0, 300);
      } finally {
        await ctx.close().catch(() => {});
      }
      if (rec.pieceDomMs != null) pieceDom.push(rec.pieceDomMs);
      const nonsense = rec.boards.filter((b) => b.problems.length).length;
      ok(!rec.error && rec.real, `R1 ${c.id} (${c.topic}) "${c.ask}": something real on the stage${rec.error ? ` — ${rec.error}` : ""}`);
      if (c.interactive) {
        ok(!!rec.doable, `R2 ${c.id}: a game / animation / simulation ask ends with something to DO (slot ${rec.slotKinds?.join("+") || "-"}; after: tray ${rec.after?.tray ?? "-"}, stage ${rec.after?.stage ?? "-"}; before: tray ${rec.trayBefore ?? "-"})`);
        if (!rec.doable) warn(`R2-brief ${c.id}: ${rec.doableBrief ? "ends in a board drawing over her line (item 4 accepts it for an animation / simulation ask)" : "no piece and no animated board"}`);
        const pl = rec.views.filter((v) => v.playable).map((v) => v.vp);
        const msg = `R2b ${c.id}: playable on the device at ${pl.length}/${rec.views.length} sizes (${pl.join(", ") || "none"}; elsewhere its board twin or a board)`;
        if (pl.length === rec.views.length) ok(true, msg); else warn(msg);
      }
      ok(nonsense === 0, `R3 ${c.id}: ${rec.boards.length} board(s), ${nonsense} with a meaning failure${nonsense ? `: ${rec.boards.find((b) => b.problems.length).problems[0]}` : ""}`);
      const broken = rec.views.filter((v) => !v.pass);
      ok(rec.views.length === 3 && !broken.length, `R4 ${c.id}: views passing the forge3 verdict ${rec.views.length - broken.length}/${rec.views.length}${broken.length ? ` (${broken.map((v) => `${v.vp}:${v.fails.join("+")}`).join(", ")})` : ""}`);
    }
  } finally { await browser.close().catch(() => {}); }
}, { tag: "r3forge", child: { firstName: "Riya" } });

const boards = results.flatMap((r) => r.boards);
const grounds = new Set(boards.map((b) => b.ground).filter(Boolean));
if (boards.length >= 4) ok(grounds.size >= 2, `R5 variety: ${grounds.size} distinct board grounds over ${boards.length} boards (${[...grounds].join(", ")})`);
else warn(`R5 variety: only ${boards.length} boards drawn`);
const p90p = q(pieceMs, 0.9), p90b = q(boardLate, 0.9);
if (pieceDom.length) ok(q(pieceDom, 0.9) <= 3000, `T1dom request → piece in the tray (what the page shows) p50 ${q(pieceDom, 0.5)} ms, p90 ${q(pieceDom, 0.9)} ms ≤ 3000 (n = ${pieceDom.length})`);
if (pieceMs.length) ok(p90p <= 3000, `T1 request → piece p50 ${q(pieceMs, 0.5)} ms, p90 ${p90p} ms ≤ 3000 (n = ${pieceMs.length}; API time from this machine)`);
else warn("T1: no piece timings (no Stagecraft / play piece or mount after an ask)");
if (boardLate.length) ok(p90b <= 1500, `T2 board lateness after her audio starts p50 ${q(boardLate, 0.5)} ms, p90 ${p90b} ms ≤ 1500 (n = ${boardLate.length})`);
const views = results.flatMap((r) => r.views);
const summary = { base: BASE, at: new Date().toISOString(), cases: results.length, real: results.filter((r) => r.real).length,
  interactive: results.filter((r) => r.interactive).length, doable: results.filter((r) => r.interactive && r.doable).length,
  doableBrief: results.filter((r) => r.interactive && r.doableBrief).length,
  playableViews: results.filter((r) => r.interactive).flatMap((r) => r.views).filter((v) => v.playable).length, interactiveViews: results.filter((r) => r.interactive).flatMap((r) => r.views).length,
  slotKinds: Object.fromEntries(results.map((r) => [r.case, r.slotKinds ?? []])),
  boards: boards.length, nonsenseBoards: boards.filter((b) => b.problems.length).length, views: views.length, brokenViews: views.filter((v) => !v.pass).length,
  emptyHanded: views.filter((v) => v.none).length,
  grounds: [...grounds], pieceMs: { n: pieceMs.length, p50: q(pieceMs, 0.5), p90: p90p }, pieceDomMs: { n: pieceDom.length, p50: q(pieceDom, 0.5), p90: q(pieceDom, 0.9) }, boardLate: { n: boardLate.length, p50: q(boardLate, 0.5), p90: p90b } };
writeFileSync(join(OUT, "round3-forge.json"), JSON.stringify({ summary, results }, null, 1));
console.log("summary", JSON.stringify(summary));
done();
