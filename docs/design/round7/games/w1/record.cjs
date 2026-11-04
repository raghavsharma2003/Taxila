// Headless recording of new r7 levels being played (dev harness). Usage: node record.cjs <playdev dir> <out dir>
const http = require("http"), fs = require("fs"), path = require("path");
const { chromium } = require("playwright");
const [root, out] = process.argv.slice(2);
const types = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".woff2": "font/woff2", ".svg": "image/svg+xml", ".png": "image/png", ".webp": "image/webp" };
const srv = http.createServer((req, res) => {
  const p = path.join(root, decodeURIComponent(req.url.split("?")[0]));
  fs.readFile(p, (e, b) => { if (e) { res.writeHead(404); res.end(); return; } res.writeHead(200, { "content-type": types[path.extname(p)] || "application/octet-stream" }); res.end(b); });
}).listen(0);
const port = srv.address().port;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const ONLY = process.env.ONLY;
const SCENES = [
  { name: "pendulum-match", q: "family=yantra&mode=pendulum&goal=match&class=7&fade=1&seed=4&art=raat&lang=hinglish&topic=c7-science-ch08-t01" },
  { name: "measure-total", q: "family=nazariya&mode=measure&goal=total&class=4&fade=1&seed=3&art=kagaz&lang=hinglish&topic=c4-maths-ch08-t01&grammar=" + encodeURIComponent(JSON.stringify({})) },
  { name: "measure-compare", q: "family=nazariya&mode=measure&goal=compare&class=5&fade=1&seed=5&art=chalk&lang=hinglish&topic=c5-maths-ch08-t01" },
  { name: "yantra-beam", q: "family=yantra&mode=beam&goal=route&class=7&fade=1&seed=4&art=blueprint&lang=hinglish&grammar=" + encodeURIComponent(JSON.stringify({ mirrors: [2] })) },
  { name: "yantra-periscope", q: "family=yantra&mode=beam&goal=periscope&class=7&fade=1&seed=3&art=raat&lang=hinglish" },
  { name: "stambh-bars", q: "family=stambh&mode=bars&goal=draw&class=5&fade=1&seed=3&art=kagaz&lang=hinglish&topic=c5-maths-ch15-t02&grammar=" + encodeURIComponent(JSON.stringify({ steps: [5] })) },
  { name: "stambh-picto", q: "family=stambh&mode=picto&goal=draw&class=4&fade=1&seed=2&art=chalk&lang=hinglish&topic=c4-maths-ch14-t01&grammar=" + encodeURIComponent(JSON.stringify({ steps: [2] })) },
  { name: "kon-close-tri", q: "family=kon&mode=close&goal=tri&class=7&fade=1&seed=5&art=blueprint&lang=hinglish" },
  { name: "kon-zone-kind", q: "family=kon&mode=zone&goal=kind&class=6&fade=1&seed=4&art=raat&lang=hinglish&grammar=" + encodeURIComponent(JSON.stringify({ kinds: ["reflex"] })) },
  { name: "nishana-hop", q: "family=nishana&mode=hop&goal=hop&class=6&fade=1&seed=7&art=kagaz&lang=hinglish&grammar=" + encodeURIComponent(JSON.stringify({ ops: ["+", "-"] })) },
];

(async () => {
  const browser = await chromium.launch();
  for (const sc of SCENES.filter((x) => !ONLY || x.name.startsWith(ONLY))) {
    const ctx = await browser.newContext({ viewport: { width: 412, height: 860 }, recordVideo: { dir: path.join(out, sc.name), size: { width: 412, height: 860 } } });
    const page = await ctx.newPage();
    page.on("pageerror", (e) => console.log(sc.name, "pageerror", e.message));
    await page.goto(`http://127.0.0.1:${port}/src/play/dev/index.html?${sc.q}`);
    await page.waitForFunction(() => window.__play && window.__play.level, null, { timeout: 20000 });
    await sleep(1200);
    const info = await page.evaluate(() => ({ level: window.__play.level, solve: window.__play.solve() }));
    const solve = info.solve;
    const shot = async (k) => page.screenshot({ path: path.join(out, `${sc.name}-${k}.png`) });
    await shot("0-start");
    const press = (id) => page.evaluate((i) => window.__play.press(i), id);
    if (sc.name.startsWith("pendulum")) {
      const d = (x) => page.evaluate((a) => { window.__play.dispatch(a); window.__play.invalidate(); }, x);
      // the belief first: a heavier bob, run (the period does not move), then the length that keeps the beat
      const st0 = await page.evaluate(() => window.__play.state());
      await d({ kind: "set", knob: "mass", value: st0.mass >= 100 ? 50 : 200 }); await sleep(300);
      await shot("1-aim"); await press("run"); await sleep(2600); await shot("2-miss");
      for (const a of solve.filter((x) => x.kind !== "run")) { await d(a); await sleep(300); }
      await press("run"); await sleep(3200); await shot("3-solved");
      console.log(sc.name, JSON.stringify(st0).slice(0, 160), JSON.stringify(solve));
    } else if (sc.name.startsWith("measure")) {
      const d = (x) => page.evaluate((a) => { window.__play.dispatch(a); window.__play.invalidate(); }, x);
      const acts = solve; const half = Math.max(1, Math.floor(acts.length / 2));
      for (const a of acts.slice(0, half)) { await d(a); await sleep(250); }
      await shot("1-aim"); await shot("2-miss");
      for (const a of acts.slice(half)) { await d(a); await sleep(250); }
      await sleep(1500); await shot("3-solved");
      console.log(sc.name, "acts", JSON.stringify(acts).slice(0, 200));
    } else if (sc.name.startsWith("yantra-beam") || sc.name.startsWith("yantra-periscope")) {
      const sol = info.level.params.sol, step = info.level.params.step;
      const d = (x) => page.evaluate((a) => { window.__play.dispatch(a); window.__play.invalidate(); }, x);
      for (const m of sol) { await d({ kind: "place", part: "mirror", x: m.x, y: m.y, rot: 0 }); await sleep(300); }
      await shot("1-aim"); await press("run"); await sleep(1400); await shot("2-miss");
      const placed = await page.evaluate(() => window.__play.state().placed);
      for (let i = 0; i < sol.length; i++) for (let r = 0; r !== sol[i].rot; r = (r + step) % 180) { await d({ kind: "rotate", id: placed[i].id, rot: r + step }); await sleep(90); }
      await press("run"); await sleep(1600); await shot("3-solved");
    } else if (sc.name.startsWith("stambh")) {
      // the solver's acts one by one (each crate drops and settles), a check part-way (a wrong bar), then the rest and check
      const acts = solve.filter((a) => a.kind !== "check"), half = Math.floor(acts.length / 2);
      for (const a of acts.slice(0, half)) { await page.evaluate((x) => { window.__play.dispatch(x); window.__play.invalidate(); }, a); await sleep(220); }
      await shot("1-aim"); await press("done"); await sleep(1300); await shot("2-miss");
      for (const a of acts.slice(half)) { await page.evaluate((x) => { window.__play.dispatch(x); window.__play.invalidate(); }, a); await sleep(220); }
      await press("done"); await sleep(1500); await shot("3-solved");
    } else if (sc.name.startsWith("kon")) {
      const target = solve.find((a) => a.kind === "turn").deg;
      const wrong = (target + (sc.name.includes("kind") ? 200 : 25)) % 360;
      // sweep the arm to a wrong angle, commit (the miss and its gap are drawn), then sweep to the truth and commit
      const sweep = async (from, to, steps) => { for (let i = 0; i <= steps; i++) { const d = from + ((to - from) * i) / steps; await page.evaluate((deg) => { window.__play.dispatch({ kind: "turn", deg }); window.__play.invalidate(); }, d); await sleep(40); } };
      const start = info.level.params.start;
      await sweep(start, wrong, 25); await shot("1-aim"); await press("commit"); await sleep(1300); await shot("2-miss");
      await sweep(wrong, target, 25); await press("commit"); await sleep(1500); await shot("3-solved");
    } else {
      const truth = solve.find((a) => a.kind === "place").x, p = info.level.params, wrongX = p.hop ? (p.hop.op === "-" ? p.hop.a + p.hop.b : -truth) : truth + 3;
      const slide = async (from, to, steps) => { for (let i = 0; i <= steps; i++) { const x = from + ((to - from) * i) / steps; await page.evaluate((v) => { window.__play.dispatch({ kind: "place", which: 0, x: v }); window.__play.invalidate(); }, x); await sleep(40); } };
      const a0 = p.hop ? p.hop.a : 0;
      await slide(a0, wrongX, 25); await shot("1-aim"); await press("commit"); await sleep(1300); await shot("2-miss");
      await slide(wrongX, truth, 25); await press("commit"); await sleep(1500); await shot("3-solved");
    }
    console.log(sc.name, JSON.stringify(info.level.params).slice(0, 200));
    await ctx.close();
  }
  await browser.close(); srv.close();
})().catch((e) => { console.error(e); process.exit(1); });
