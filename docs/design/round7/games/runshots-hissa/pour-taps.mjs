// hissa pour run shots (GAMES-08): drive the play dev harness by REAL input only: page.mouse clicks at the centre of the
// canvas targets in window.__play.audit.targets, and the DOM buttons by getByTestId(play-ctl-<id>). The act list is read
// from the law's own solve / mal acts (never dispatched). 360 × 640, deviceScaleFactor 1.
//   PLAY_OUT=<dir> PLAY_PUBLIC=public npx vite build --config src/play/dev/vite.play.config.mjs
//   node docs/design/round7/games/runshots-hissa/pour-taps.mjs <dir> docs/design/round7/games/runshots-hissa
import { createServer } from "node:http";
import { readFileSync, existsSync, statSync, mkdirSync, writeFileSync } from "node:fs";
import { join, extname, resolve } from "node:path";
import { chromium } from "playwright";

const DIR = resolve(process.argv[2]), OUT = resolve(process.argv[3]);
mkdirSync(OUT, { recursive: true });
const TYPES = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".woff2": "font/woff2", ".svg": "image/svg+xml", ".json": "application/json", ".webp": "image/webp", ".png": "image/png", ".mp3": "audio/mpeg", ".ogg": "audio/ogg" };
const server = createServer((req, res) => {
  const path = decodeURIComponent(new URL(req.url, "http://x").pathname), f = join(DIR, path);
  if (!f.startsWith(DIR) || !existsSync(f) || statSync(f).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { "content-type": TYPES[extname(f)] ?? "application/octet-stream" }); res.end(readFileSync(f));
});
await new Promise((r) => server.listen(0, r));
const BASE = `http://localhost:${server.address().port}/src/play/dev/index.html`;
const browser = await chromium.launch({ executablePath: existsSync("/opt/pw-browsers/chromium") ? "/opt/pw-browsers/chromium" : undefined });

const results = [];
async function open(q, lang) {
  const ctx = await browser.newContext({ viewport: { width: 360, height: 640 }, deviceScaleFactor: 1 });
  const page = await ctx.newPage(), errors = [];
  page.on("pageerror", (e) => errors.push(String(e.message)));
  await page.goto(`${BASE}?family=hissa&mode=pour&class=7&reduced=1&lang=${lang}&${q}`);
  await page.waitForFunction(() => window.__play && window.__play.audit.targets.length > 0, null, { timeout: 15000 });
  await page.waitForTimeout(400);
  return { ctx, page, errors };
}
const st = (page) => page.evaluate(() => { const s = window.__play.state(); return { say: s.say, lock: s.lock, cups: s.cups, tag: s.tag, ended: s.ended, done: s.done }; });
async function tapTarget(page, id) {
  const box = await page.evaluate((tid) => { window.__play.invalidate(); const t = window.__play.audit.targets.find((x) => x.id === tid); if (!t) return null; const c = document.querySelector("[data-testid=play-world] canvas").getBoundingClientRect(); return { x: c.left + t.x + t.w / 2, y: c.top + t.y + t.h / 2 }; }, id);
  if (!box) throw new Error(`no target ${id}`);
  await page.mouse.click(box.x, box.y);
  await page.waitForTimeout(60);
}
const press = async (page, id) => { await page.getByTestId(`play-ctl-${id}`).click(); await page.waitForTimeout(60); };
/** perform one law act through the UI only */
async function doAct(page, a) {
  if (a.kind === "count") { for (let k = 0; k < 40; k++) { const s = await st(page); if (s.say === a.n) return; await tapTarget(page, s.say < a.n ? "count-up" : "count-dn"); } throw new Error("count"); }
  if (a.kind === "pour") return press(page, "pour");
  if (a.kind === "run") return press(page, "run");
  if (a.kind === "tag") { for (let k = 0; k < 120; k++) { const s = await st(page); if (s.tag[a.part] === a.v) return; await tapTarget(page, `tag-${a.part}-${s.tag[a.part] < a.v ? "up" : "dn"}`); } throw new Error("tag"); }
  throw new Error(`act ${a.kind}`);
}
async function audit(page, errors) {
  await page.waitForTimeout(1600);
  await page.evaluate(() => window.__play.invalidate());
  await page.waitForTimeout(200);
  return page.evaluate((errs) => {
    const au = window.__play.audit, texts = au.texts.map((t) => t.px), targets = au.targets.map((t) => Math.min(t.w, t.h));
    const left = (t) => (t.align === "left" || t.align === "start" ? t.x : t.align === "right" || t.align === "end" ? t.x - t.w : t.x - t.w / 2);
    const out = au.texts.filter((t) => left(t) < -2 || left(t) + t.w > au.box.w + 2).length;
    const root = document.querySelector("[data-testid=play-stage]");
    const btns = [...root.querySelectorAll("button")].filter((b) => b.getClientRects().length);
    const goal = document.querySelector("[data-testid=play-goal]");
    return { canvasTextMin: Math.min(...texts), targetMin: Math.min(...targets), targetIds: au.targets.map((t) => t.id), canvasClipped: au.clipped, textOutOfBox: out,
      buttonMin: Math.min(...btns.map((b) => { const r = b.getBoundingClientRect(); return Math.min(r.width, r.height); })),
      buttonsClipped: btns.filter((b) => b.scrollWidth > b.clientWidth + 2).map((b) => b.textContent),
      goalClipped: goal ? goal.scrollWidth > goal.clientWidth + 2 || goal.scrollHeight > goal.clientHeight + 2 : null, goalText: goal?.textContent ?? "",
      hOverflow: document.scrollingElement.scrollWidth > innerWidth + 1, errors: errs };
  }, errors);
}
const ok = (a) => a.canvasTextMin >= 14 && a.targetMin >= 44 && a.buttonMin >= 44 && !a.canvasClipped && !a.textOutOfBox && !a.buttonsClipped.length && !a.goalClipped && !a.hOverflow && !a.errors.length;
async function shot(page, errors, file, extra = {}) {
  const a = await audit(page, errors);
  await page.screenshot({ path: join(OUT, file) });
  const s = await st(page);
  results.push({ file, pass: ok(a), state: s, ...extra, ...a, targetIds: undefined });
  console.log(`${ok(a) ? "PASS" : "FAIL"} ${file} say=${s.say} cups=${s.cups} tag=${s.tag} done=${s.done} text>=${a.canvasTextMin} target>=${a.targetMin} btn>=${a.buttonMin} clip=${a.canvasClipped}/${a.buttonsClipped.length}/${a.goalClipped} out=${a.textOutOfBox} err=${a.errors.length}`);
}

const GOALS = [
  { goal: "fit", q: "goal=fit&fade=1&seed=3", topic: "c7-maths-ch08-t02" },
  { goal: "part", q: "goal=part&fade=2&seed=5", topic: "c7-maths-ch08-t02" },
  { goal: "deci", q: "goal=deci&fade=1&seed=3", topic: "c7-maths-ch12-t02" },
];
for (const lang of ["en", "hi", "hinglish"]) for (const g of GOALS) {
  const tag = `${g.goal}-${lang}`;
  // 1. the start: the count is asked first; pour is off until it is said
  let { ctx, page, errors } = await open(g.q, lang);
  const pourOff = await page.getByTestId("play-ctl-pour").isDisabled();
  if (lang === "en" || g.goal === "fit") await shot(page, errors, `pour-${tag}-start-p360.png`, { pourDisabledAtStart: pourOff });
  // 2. the audit's replay through the UI: pour pressed 8 times and Run without a count: nothing pours, nothing wins
  for (let i = 0; i < 8; i++) { if (!(await page.getByTestId("play-ctl-pour").isDisabled())) await press(page, "pour"); }
  if (!(await page.getByTestId("play-ctl-run").isDisabled())) await press(page, "run");
  const s8 = await st(page);
  results.push({ file: `(${tag} pour×8+run)`, pass: !s8.done && s8.cups === 0, state: s8, pourDisabledAtStart: pourOff });
  console.log(`${!s8.done && s8.cups === 0 ? "PASS" : "FAIL"} ${tag} pour×8+run without a count: cups=${s8.cups} done=${s8.done} pour disabled=${pourOff}`);
  // 3. the solve by taps: say the count, then pour, tag, run
  const sol = await page.evaluate(() => window.__play.solve());
  await doAct(page, sol[0]);
  if (lang === "en") await shot(page, errors, `pour-${tag}-said-p360.png`);
  for (const a of sol.slice(1)) await doAct(page, a);
  await shot(page, errors, `pour-${tag}-solved-p360.png`, { solvedByTaps: true });
  await ctx.close();
  // 4. a wrong count (one more than fit): the jug refuses the extra cup, the count stands, the run misses
  ({ ctx, page, errors } = await open(g.q, lang));
  const sol2 = await page.evaluate(() => window.__play.solve());
  const mal = await page.evaluate(() => { for (const m of window.__play.mal()) { const a = window.__play.malActs(m); if (a) return { id: m, acts: a }; } return null; });
  const wrongActs = mal ? mal.acts : [{ kind: "count", n: sol2[0].n + 1 }, ...sol2.slice(1)];
  for (const a of wrongActs) await doAct(page, a);
  if (lang === "en") await shot(page, errors, `pour-${tag}-${mal ? `mal-${mal.id}` : "wrong-count"}-p360.png`, { malId: mal?.id ?? null });
  else { const s = await st(page); results.push({ file: `(${tag} wrong count)`, pass: s.ended && !s.done, state: s }); }
  await ctx.close();
}
// 5. a part-cup level (the garam door serves whole counts; the teekha door after part seed 3 serves 1/2 ÷ 1/3): the count,
// one cup, the part-cup tagged, solved; and the same level with the cups said as the jug's halves (no-flip) for a look
for (const lang of ["en", "hi", "hinglish"]) {
  const { ctx, page, errors } = await open("goal=part&fade=1&seed=3", lang);
  for (const a of await page.evaluate(() => window.__play.solve())) await doAct(page, a);
  await page.waitForTimeout(300);
  await page.getByTestId("play-door-teekha").click();
  await page.waitForTimeout(500);
  const sol = await page.evaluate(() => window.__play.solve());
  await doAct(page, sol[0]);
  for (const a of sol.slice(1)) { await doAct(page, a); if (a.kind === "pour" && lang === "en") await shot(page, errors, `pour-part-${lang}-partcup-poured-p360.png`); }
  await shot(page, errors, `pour-part-${lang}-partcup-solved-p360.png`, { solvedByTaps: true, params: await page.evaluate(() => window.__play.level.params) });
  await ctx.close();
}
writeFileSync(join(OUT, "results.json"), JSON.stringify(results, null, 1));
console.log(`${results.filter((r) => r.pass).length}/${results.length} pass`);
await browser.close(); server.close();
