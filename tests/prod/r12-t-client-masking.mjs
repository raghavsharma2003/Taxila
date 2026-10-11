// Release 12 · T-client, masking in a real page (brief §Masking, gate-tested): on the recorder harness at tier 2, a form
// with a password, an email, a phone, a PIN and a plain field is typed into and tapped, and a /api call carries the same
// secrets in its body and headers. No secret value may appear anywhere in what the recorder produced: the tier-1 events
// (taps, keys, net bodies) and the tier-2 rrweb stream. The plain field's value is not recorded either (rrweb masks all
// inputs). Writes docs/design/round4/build/r12/t-client/masking.json; exit 1 on any leak.
//   PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers node tests/prod/r12-t-client-masking.mjs
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";
import { startVite } from "./r4-kaksha-inpage.mjs";

const ROOT = new URL("../..", import.meta.url).pathname, PORT = 5207, ORIGIN = `http://localhost:${PORT}`;
const OUT = path.join(ROOT, "docs/design/round4/build/r12/t-client");
const SECRETS = { password: "Hunter2-secret!", email: "riya.parent@example.in", tel: "9876543210", pin: "4729", plain: "my-plain-typed-words" };
const stop = await startVite(ROOT, PORT);
const browser = await chromium.launch();
let out;
try {
  const p = await browser.newPage({ viewport: { width: 412, height: 915 } });
  // the dev server has no /api/x: answer it, so the wrapped fetch records a real response
  await p.route(`${ORIGIN}/api/x/**`, (r) => r.fulfill({ contentType: "application/json", body: JSON.stringify({ ok: true, email: SECRETS.email, token: "tok_abcdefghijklmnopqrstu" }) }));
  await p.goto(`${ORIGIN}/src/trace/dev/lesson.html?class=7&fixture=your_turn&look=volt&tier=2`);
  await p.waitForSelector('[data-testid="rec-chip"]', { timeout: 60000 });
  await p.evaluate(() => {
    const f = document.createElement("form");
    f.innerHTML = `<label>Password <input id="pw" type="password" name="password"></label><label>Email <input id="em" type="email" name="email"></label>
      <label>Phone <input id="tel" type="tel" name="phone"></label><label>PIN <input id="pin" inputmode="numeric" name="pin" autocomplete="one-time-code"></label>
      <label>Note <input id="plain" type="text" name="note"></label><button type="button" id="go">Continue</button>`;
    f.style.cssText = "position:fixed;left:0;top:0;z-index:99;background:#fff;color:#000;padding:8px;display:grid;gap:6px";
    document.body.appendChild(f);
  });
  for (const [id, v] of [["pw", SECRETS.password], ["em", SECRETS.email], ["tel", SECRETS.tel], ["pin", SECRETS.pin], ["plain", SECRETS.plain]]) {
    await p.click(`#${id}`);
    await p.keyboard.type(v, { delay: 5 });
    await p.keyboard.press("Enter");
  }
  await p.click("#go");
  await p.evaluate((s) => fetch("/api/x/login", { method: "POST", headers: { "content-type": "application/json", authorization: "Bearer abcdefghijklmnop", cookie: "tx=1" }, body: JSON.stringify({ email: s.email, password: s.password, pin: s.pin, phone: s.tel, note: "call me on " + s.tel }) }), SECRETS);
  await p.waitForTimeout(800);
  await p.evaluate(() => window.__traceStop());
  await p.waitForTimeout(800);
  const dump = await p.evaluate(() => JSON.stringify({ events: window.__traceEvents, rrweb: window.__rrweb }));
  const leaks = Object.entries(SECRETS).filter(([, v]) => dump.includes(v)).map(([k]) => k);
  for (const extra of ["abcdefghijklmnop", "tok_abcdefghijklmnopqrstu", "Hunter2"]) if (dump.includes(extra)) leaks.push(extra);
  const taps = JSON.parse(dump).events.filter((e) => e.kind === "ui.tap").map((e) => ({ label: e.data.label, field: e.data.field, type: e.data.type }));
  const req = JSON.parse(dump).events.find((e) => e.kind === "net.req" && e.data.path === "/api/x/login");
  out = { date: new Date().toISOString(), method: "recorder harness (tier 2) + a typed form + a /api call carrying the same secrets; the recorder's whole output searched for each secret", leaks, taps, requestBody: req?.data?.body ?? null, events: JSON.parse(dump).events.length, rrwebEvents: JSON.parse(dump).rrweb.length, ok: leaks.length === 0 && !!req };
} finally { await browser.close(); stop(); }
fs.writeFileSync(path.join(OUT, "masking.json"), JSON.stringify(out, null, 1));
console.log(JSON.stringify({ leaks: out.leaks, taps: out.taps, requestBody: out.requestBody, ok: out.ok }, null, 1));
process.exit(out.ok ? 0 : 1);
