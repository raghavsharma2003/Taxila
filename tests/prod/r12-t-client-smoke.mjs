// r12 T-client smoke: the scripted lesson with the recorder (tier 2), a few turns; prints the event kinds and REC chip.
import { chromium } from "playwright";
import { startVite } from "./r4-kaksha-inpage.mjs";
const ROOT = new URL("../..", import.meta.url).pathname, PORT = 5203;
const stop = await startVite(ROOT, PORT);
const b = await chromium.launch();
try {
  const p = await b.newPage({ viewport: { width: 412, height: 915 } });
  const errs = []; p.on("pageerror", (e) => errs.push(String(e)));
  await p.goto(`http://localhost:${PORT}/src/trace/dev/lesson.html?class=7&live=1&look=volt&tier=2`);
  await p.waitForSelector('[data-testid="lesson"]', { timeout: 60000 });
  for (let i = 0; i < 3; i++) {
    const ok = await p.waitForFunction(() => window.__k1?.floor === "your_turn", null, { timeout: 30000 }).then(() => true, () => false);
    if (!ok) break;
    await p.evaluate(() => window.__k1.send("two"));
    await p.waitForTimeout(1500);
  }
  await p.waitForTimeout(11000);
  const r = await p.evaluate(() => ({ kinds: Object.entries(window.__traceEvents.reduce((a, e) => ((a[e.kind] = (a[e.kind] ?? 0) + 1), a), {})), rec: !!document.querySelector('[data-testid="rec-chip"]'), rr: window.__rrweb.length, sent: window.__traceSent, stats: window.__trace.stats(),
    sample: window.__traceEvents.filter((e) => /ui\.render|ui\.state|net\.req/.test(e.kind)).slice(0, 6) }));
  console.log(JSON.stringify({ kinds: r.kinds, rec: r.rec, rr: r.rr, sent: r.sent, stats: r.stats }));
  console.log("pageerrors", errs.slice(0, 5));
} finally { await b.close(); stop(); }
