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

const SCENES = [
  { name: "kon-close-tri", q: "family=kon&mode=close&goal=tri&class=7&fade=1&seed=5&art=blueprint&lang=hinglish" },
  { name: "kon-zone-kind", q: "family=kon&mode=zone&goal=kind&class=6&fade=1&seed=4&art=raat&lang=hinglish&grammar=" + encodeURIComponent(JSON.stringify({ kinds: ["reflex"] })) },
  { name: "nishana-hop", q: "family=nishana&mode=hop&goal=hop&class=6&fade=1&seed=7&art=kagaz&lang=hinglish&grammar=" + encodeURIComponent(JSON.stringify({ ops: ["+", "-"] })) },
];

(async () => {
  const browser = await chromium.launch();
  for (const sc of SCENES) {
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
    if (sc.name.startsWith("kon")) {
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
