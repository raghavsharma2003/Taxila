// Round 4 · stream 2 (content): shots of EVERY artifact kind the tray can show, at 360 x 800, 412 x 915 and 1366 x 768,
// in the real Desk tray (the forge3 QA harness: the real desk.css tray + StudioStage + renderers) or the real module frame
// (dist/modules.html in a tray-sized sandboxed iframe), judged by the forge3 checks, and the tray gate's verdict for each.
// Kinds: whiteboard (a fresh live-style board, the fraction-of@1 "half ka half" animation, a claims board), skeleton
// (the W2 fraction activity), play (one level per play family, its certified art), module engines (one sample per
// certified engine), Studio v2 (a catalogue game: the gate refuses it; shown here so the refusal is visible).
//
//   FORGE3_QA_LOCAL=1 node tests/prod/r4-content-shots.mjs [--out docs/design/round4/build/content/shots]
// Needs a product build (npx vite build) for the module frame. No network, no model.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildHarness, serveHarness, openJudge, launchLocal } from "../../server/forge3/qa/render.js";
import { trayViewports, moduleSamples, serveDist, judgeModule } from "../../server/forge3/certify-tray.js";
import { certifyForTray, certifyModule, contractBox } from "../../server/forge3/tray-gate.js";
import { expand } from "../../server/forge/explainer/templates.js";
import { codeBoard, gateCtxFor } from "../../server/stagecraft/board-sync.js";
import { PLAY_VIEWPORTS } from "../../server/forge3/qa/viewports.js";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const argv = process.argv.slice(2);
const OUT = path.resolve(argv.includes("--out") ? argv[argv.indexOf("--out") + 1] : path.join(ROOT, "docs", "design", "round4", "build", "content", "shots"));
fs.mkdirSync(OUT, { recursive: true });
const rows = [];
const note = (kind, id, views, gate) => {
  rows.push({ kind, id, views: views.map((v) => ({ vp: v.vp, pass: v.pass, fails: v.fails })), gate });
  console.log(`${kind} ${id}: ${views.map((v) => `${v.vp}:${v.pass ? "ok" : v.fails.join("+")}`).join(" ")} | gate ${JSON.stringify(gate)}`);
};

const dir = await buildHarness(path.join(ROOT, "node_modules", ".cache", "forge3-harness"));
const { server, base } = await serveHarness(dir);
const browser = await launchLocal();
const judge = await openJudge({ browser, base });
try {
  // ── whiteboards ──
  const boards = [
    ["fraction-of-half-ka-half", expand({ template: "fraction-of@1", a: 1, b: 2, c: 1, d: 2 }).script],
    ["fraction-of-3-5-of-2-3", expand({ template: "fraction-of@1", a: 3, b: 5, c: 2, d: 3 }).script],
    ["fraction-parts", expand({ template: "fraction-parts@1", parts: 5, shade: 3, whole: "roti" }).script],
  ];
  const claimAsk = { intent: { intentId: "L:wb:1", lessonId: "L", kind: "whiteboard" }, line: { lessonId: "L", text: "Meher, look at the screen: 15 dots in 3 equal groups, with 5 dots in each. How many dots are in one group?" }, kit: null, mode: "fresh" };
  const claims = codeBoard(claimAsk, { lessonId: "L" }, gateCtxFor(claimAsk, {}));
  if (claims?.script) boards.push(["claims-board-groups", claims.script]);
  for (const [id, script] of boards) {
    const art = { kind: "whiteboard", stage: { w: script.board.w, h: script.board.h }, script };
    const r = await judge.judge(art, { viewports: trayViewports(false), shotDir: path.join(OUT, "whiteboard"), shotTag: id });
    note("whiteboard", id, r.views.map((v) => ({ vp: v.vp, pass: v.verdict.pass, fails: v.verdict.fails })), Object.fromEntries(["p360", "p412", "l1366"].map((vp) => [vp, certifyForTray(art, { vp }).ok])));
  }
  // ── skeleton ──
  const sk = { kind: "skeleton", stage: { w: 360, h: 320 }, skeleton: "fraction-parts", archetype: "shade_fraction", intentId: "qa:sk", params: { items: [{ id: "i1", n: 3, d: 4 }], picture: "pizza" }, strings: {} };
  const rs = await judge.judge(sk, { viewports: trayViewports(false), shotDir: path.join(OUT, "skeleton"), shotTag: "shade_fraction" });
  note("skeleton", "shade_fraction", rs.views.map((v) => ({ vp: v.vp, pass: v.verdict.pass, fails: v.verdict.fails })), Object.fromEntries(["p360", "p412", "l1366"].map((vp) => [vp, certifyForTray(sk, { vp }).ok])));
  // ── play: one level per family, in the Desk's play-mode box ──
  try {
    const { coverage } = await import("../../server/play/levels.js");
    const { coverageLevels } = await import("../../server/forge3/play-cert.js");
    const seen = new Set();
    for (const e of coverage().entries ?? []) {
      const key = `${e.family}/${e.mode}`;
      if (seen.has(key)) continue;
      seen.add(key);
      const [level] = await coverageLevels(e, 1);
      if (!level) continue;
      const art0 = e.arts?.[0] ?? "kagaz";
      const artifact = { kind: "play", stage: { w: 360, h: 576 }, play: { sessionId: "qa", family: level.family, mode: level.mode, skillId: level.skillId, topicId: level.topicId, art: art0, levelId: level.levelId } };
      const r = await judge.judge(artifact, { viewports: PLAY_VIEWPORTS, young: e.classLevel <= 5, playLevel: { level, art: { art: art0, reason: "shots" } }, shotDir: path.join(OUT, "play"), shotTag: `${key.replace("/", "_")}-${art0}` });
      note("play", `${key} ${e.topicId} ${art0}`, r.views.map((v) => ({ vp: v.vp, pass: v.verdict.pass, fails: v.verdict.fails })), Object.fromEntries(["p360", "p412", "l1366"].map((vp) => [vp, certifyForTray(artifact, { vp, classLevel: e.classLevel }).ok])));
    }
  } catch (err) { console.log(`play shots skipped: ${String(err.message).slice(0, 120)}`); }
  // ── Studio v2 (refused by the gate: shown so the refusal is visible) ──
  try {
    const t = JSON.parse(fs.readFileSync(path.join(ROOT, "data", "studio-catalogue", "topics", "c6-maths-ch07-t01.json"), "utf8"));
    if (t.game?.spec) {
      const artifact = { kind: "stagecraft", stage: { w: 1000, h: 625 }, stagecraft: { rung: "engine_default", archetype: t.game.archetype, spec: t.game.spec, boardTwin: null } };
      const r = await judge.judge(artifact, { viewports: trayViewports(false), shotDir: path.join(OUT, "studio-v2-refused"), shotTag: t.game.archetype });
      note("stagecraft", `${t.game.archetype} c6-maths-ch07-t01`, r.views.map((v) => ({ vp: v.vp, pass: v.verdict.pass, fails: v.verdict.fails })), Object.fromEntries(["p360", "p412", "l1366"].map((vp) => [vp, certifyForTray(artifact, { vp, topicId: "c6-maths-ch07-t01", factsKind: "game" }).ok])));
    }
  } catch (err) { console.log(`studio v2 shot skipped: ${String(err.message).slice(0, 120)}`); }
} finally { await judge.close(); server.close(); }

// ── module engines: one sample per engine, the real frame in a tray-sized iframe ──
if (fs.existsSync(path.join(ROOT, "dist", "modules.html"))) {
  const { server: ds, base: db } = await serveDist(path.join(ROOT, "dist"));
  const ctx = await browser.newContext({ viewport: { width: 360, height: 800 }, deviceScaleFactor: 2, hasTouch: true });
  const page = await ctx.newPage();
  await page.goto(`${db}/host.html`);
  const seen = new Set();
  for (const s of await moduleSamples(1)) {
    if (seen.has(s.engine) || s.band !== "older") continue;
    seen.add(s.engine);
    const views = await judgeModule(page, s, false, path.join(OUT, "modules"));
    note("module", `${s.engine} ${s.mode} ${s.topicId}`, views.map((v) => ({ vp: v.vp, pass: v.serve, fails: v.fails })), Object.fromEntries(["p360", "p412", "l1366"].map((vp) => [vp, certifyModule({ engine: s.engine, params: s.params }, { vp }).ok])));
  }
  await ctx.close(); ds.close();
} else console.log("module shots skipped: no dist/modules.html (npx vite build)");
await browser.close();
fs.writeFileSync(path.join(OUT, "shots.json"), JSON.stringify({ at: new Date().toISOString(), boxes: { tray: Object.fromEntries(["p360", "p412", "l1366"].map((v) => [v, contractBox(v)])) }, rows }, null, 1));
console.log(`${rows.length} pieces; views passing ${rows.flatMap((r) => r.views).filter((v) => v.pass).length}/${rows.flatMap((r) => r.views).length} → ${OUT}`);
