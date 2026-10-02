// Reproducible probe behind docs/research/content/sandbox-telemetry.md (2026-10-02).
// Measures, in real Chromium, what a module inside <iframe sandbox="allow-scripts"> can and cannot do under
// (a) the CSP that ships today in modules.html and (b) the proposed strict policy; whether the production
// server's headers let the real module frame boot; navigation detection; zod under strict CSP; main-thread
// coupling with and without process isolation (Android WebView has none); mount cost under CPU throttling;
// postMessage round-trip; axe on the shipped engine; scripted solve → goal_met latency.
//
//   node docs/research/content/sandbox-probe.mjs [--axe <path/to/axe.min.js>] [--out <file.json>] [--n 10]
//
// Needs: `npm run build` output in dist/, Playwright Chromium at /opt/pw-browsers/chromium (as tests/client-e2e.mjs).
// Writes nothing inside the repo except --out (default: next to this file).
import http from "http";
import dgram from "dgram";
import os from "os";
import { readFileSync, existsSync, writeFileSync, mkdtempSync } from "fs";
import { join, extname, normalize } from "path";
import { chromium } from "playwright";

const ROOT = new URL("../../../", import.meta.url).pathname;
const DIST = join(ROOT, "dist/");
const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d; };
const N = Number(arg("--n", 10));
const OUT = arg("--out", new URL("./sandbox-probe-2026-10-02.json", import.meta.url).pathname);
const AXE = arg("--axe", null);
const EXE = "/opt/pw-browsers/chromium";
const result = { date: new Date().toISOString(), n: N, notes: [] };
const log = (...a) => console.log(...a);
const median = (xs) => { const s = [...xs].sort((a, b) => a - b); return s.length ? s[Math.floor((s.length - 1) / 2)] : null; };
const p90 = (xs) => { const s = [...xs].sort((a, b) => a - b); return s.length ? s[Math.min(s.length - 1, Math.ceil(s.length * 0.9) - 1)] : null; };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ───────── zod bundles (default vs jitless), built into a temp dir ─────────
const WORK = mkdtempSync(join(os.tmpdir(), "taxila-probe-"));
{
  const { build } = await import(join(ROOT, "node_modules/rolldown/dist/index.mjs"));
  for (const [name, pre] of [["zod-default", ""], ["zod-jitless", "z.config({ jitless: true });"]]) {
    const entry = join(WORK, `${name}.entry.js`);
    writeFileSync(entry, `import { z } from "zod"; ${pre}
const s = z.object({ type: z.literal("answer"), seq: z.number().int(), value: z.string() });
window.__zod = { ok: s.safeParse({ type: "answer", seq: 1, value: "3/4" }).success };`);
    await build({ input: entry, resolve: { alias: { zod: join(ROOT, "node_modules/zod/index.js") } }, output: { file: join(WORK, `${name}.js`), format: "iife", minify: true }, logLevel: "silent" });
  }
}

// ───────── policies under test ─────────
const CURRENT_META = "connect-src 'none'; form-action 'none'; base-uri 'none'; object-src 'none'"; // modules.html today
const STRICT = "default-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; media-src 'self' data: blob:; connect-src 'none'; frame-src 'none'; worker-src blob:; form-action 'none'; base-uri 'none'; object-src 'none'; manifest-src 'none'";
const POLICIES = {
  current_meta: { meta: CURRENT_META },
  strict_header: { header: `${STRICT}; sandbox allow-scripts` },
  strict_meta: { meta: STRICT },
  strict_header_webrtc_block: { header: `${STRICT}; webrtc 'block'; sandbox allow-scripts` },
};

// ───────── servers: app (host + frames + dist), leak (a different origin), udp (STUN sink) ─────────
const state = { acao: false };
const leakHits = [];
const udpHits = [];
const TYPES = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css", ".map": "application/json", ".svg": "image/svg+xml" };

const HOST_HTML = `<!doctype html><meta charset="utf-8"><title>probe host</title><body style="margin:0"><script>
window.__msgs = []; window.__loads = {};
addEventListener("message", (e) => { const frames=[...document.querySelectorAll("iframe")]; const i = frames.findIndex((f) => f.contentWindow === e.source);
  window.__msgs.push({ t: performance.now(), origin: e.origin, data: e.data, frame: i >= 0 ? frames[i].id : null }); });
window.mount = (id, src, sandbox, allow) => { const f = document.createElement("iframe"); f.id = id;
  if (sandbox !== null) f.setAttribute("sandbox", sandbox); if (allow != null) f.setAttribute("allow", allow);
  f.style.cssText = "display:block;width:360px;height:420px;border:0"; window.__loads[id] = 0;
  f.addEventListener("load", () => window.__loads[id]++); f.src = src; document.body.appendChild(f); return performance.timeOrigin + performance.now(); };
window.unmountAll = () => document.querySelectorAll("iframe").forEach((f) => f.remove());
window.gap = { max: 0, last: 0, on: false };
window.startGap = () => { gap.max = 0; gap.last = performance.now(); gap.on = true;
  const tick = () => { if (!gap.on) return; const n = performance.now(); gap.max = Math.max(gap.max, n - gap.last); gap.last = n; setTimeout(tick, 10); }; tick(); };
</script>`;

const PROBE_JS = String.raw`(async () => {
  const P = new URLSearchParams(location.hash.slice(1));
  const mode = P.get("mode"), LEAKO = P.get("leak"), tag = P.get("tag"), stun = P.get("stun");
  const send = (m) => parent.postMessage(m, "*");
  const out = { selfOrigin: self.origin, locationOrigin: location.origin, isSecureContext: self.isSecureContext, violations: [] };
  document.addEventListener("securitypolicyviolation", (e) => out.violations.push(e.effectiveDirective));
  const u = (k) => LEAKO + "/" + k + "?tag=" + tag;
  const tryit = async (name, fn) => { try { out[name] = String(await fn()); } catch (e) { out[name] = "ERR:" + ((e && e.name) || e); } };
  const ev = (el, ms = 900) => new Promise((res) => { el.onload = () => res("load"); el.onerror = () => res("error"); setTimeout(() => res("timeout"), ms); });
  if (mode === "nav") { send({ probe: "armed" }); setTimeout(() => { location.href = u("nav"); }, 200); return; }
  if (mode === "busy") { send({ probe: "busy-armed" }); setTimeout(() => { const t = performance.now(); while (performance.now() - t < 1500) {} send({ probe: "busy-end" }); }, 300); return; }
  if (mode === "rtc") {
    for (const k of ["RTCPeerConnection", "webkitRTCPeerConnection", "RTCDataChannel", "RTCSessionDescription", "RTCIceCandidate"]) { try { delete window[k]; } catch {} }
    const r = { afterDelete: typeof window.RTCPeerConnection };
    const f = document.createElement("iframe"); document.body.appendChild(f);
    let PC = null; try { PC = f.contentWindow && f.contentWindow.RTCPeerConnection; } catch (e) { r.childErr = e.name; }
    r.recoveredViaAboutBlankChild = typeof PC;
    if (PC) { const pc = new PC({ iceServers: [{ urls: stun }] }); pc.createDataChannel("x"); await pc.setLocalDescription(await pc.createOffer()); await new Promise((q) => setTimeout(q, 1200)); pc.close(); r.usedRecovered = true; }
    send({ probe: "rtc", r }); return;
  }
  if (mode === "pong") { addEventListener("message", (e) => { if (e.data && typeof e.data.ping === "number") send({ pong: e.data.ping }); }); send({ probe: "pong-ready" }); return; }
  if (mode === "zod") {
    const s = document.createElement("script"); s.src = "/" + P.get("variant") + ".js"; document.head.appendChild(s); await ev(s, 3000);
    await new Promise((r) => setTimeout(r, 300)); send({ probe: "zod", zod: window.__zod || null, violations: out.violations }); return;
  }
  await tryit("fetch", () => fetch(u("fetch"), { mode: "no-cors" }).then((r) => r.type));
  await tryit("img", () => { const i = new Image(); const p = ev(i); i.src = u("img"); return p; });
  await tryit("css", () => { const l = document.createElement("link"); l.rel = "stylesheet"; const p = ev(l); l.href = u("css"); document.head.appendChild(l); return p; });
  await tryit("script", () => { const s = document.createElement("script"); const p = ev(s); s.src = u("script"); document.head.appendChild(s); return p; });
  await tryit("import", () => import(u("import")).then(() => "load"));
  await tryit("beacon", () => navigator.sendBeacon(u("beacon"), "x"));
  await tryit("websocket", () => new Promise((res) => { const w = new WebSocket(u("ws").replace(/^http/, "ws")); w.onopen = () => res("open"); w.onerror = () => res("error"); setTimeout(() => res("timeout"), 900); }));
  await tryit("prefetch", () => { const l = document.createElement("link"); l.rel = "prefetch"; l.href = u("prefetch"); document.head.appendChild(l); return "appended"; });
  await tryit("font", () => new FontFace("x", "url(" + u("font") + ")").load().then(() => "load"));
  await tryit("media", () => new Promise((res) => { const a = new Audio(); a.onerror = () => res("error"); a.oncanplay = () => res("ok"); a.src = u("media"); a.load(); setTimeout(() => res("timeout"), 900); }));
  await tryit("subframe", () => { const f = document.createElement("iframe"); const p = ev(f); f.src = u("frame"); document.body.appendChild(f); return p; });
  await tryit("popup", () => String(window.open(u("popup"))));
  await tryit("worker_blob", () => new Promise((res) => { const w = new Worker(URL.createObjectURL(new Blob(["postMessage('hi')"], { type: "text/javascript" }))); w.onmessage = (e) => res("msg:" + e.data); w.onerror = () => res("error"); setTimeout(() => res("timeout"), 900); }));
  await tryit("worker_fetch", () => new Promise((res) => { const src = "fetch(" + JSON.stringify(u("wfetch")) + ",{mode:'no-cors'}).then(()=>postMessage('ok'),(e)=>postMessage('ERR:'+e.name))";
    const w = new Worker(URL.createObjectURL(new Blob([src], { type: "text/javascript" }))); w.onmessage = (e) => res(e.data); w.onerror = () => res("error"); setTimeout(() => res("timeout"), 900); }));
  await tryit("eval", () => eval("1+1"));
  await tryit("newFunction", () => new Function("return 2")());
  await tryit("localStorage", () => localStorage.length);
  await tryit("indexedDB", () => new Promise((res) => { const r = indexedDB.open("x"); r.onsuccess = () => res("open"); r.onerror = () => res("error:" + (r.error && r.error.name)); }));
  await tryit("cookie", () => document.cookie);
  await tryit("topHref", () => top.location.href);
  await tryit("parentDom", () => parent.document.title);
  await tryit("gum", () => navigator.mediaDevices.getUserMedia({ audio: true }).then((s) => "granted:" + s.getAudioTracks().length));
  await tryit("webrtc", async () => { const pc = new RTCPeerConnection({ iceServers: [{ urls: stun }] }); pc.createDataChannel("x");
    await pc.setLocalDescription(await pc.createOffer()); await new Promise((r) => setTimeout(r, 1200)); const st = pc.iceGatheringState; pc.close(); return st; });
  await new Promise((r) => setTimeout(r, 300));
  send({ probe: "battery", out });
  setTimeout(() => {
    try { const a = document.createElement("a"); a.href = u("topnav"); a.target = "_top"; document.body.appendChild(a); a.click(); } catch {}
    try { const f = document.createElement("form"); f.action = u("form"); f.method = "GET"; document.body.appendChild(f); f.submit(); } catch {}
  }, 50);
})();`;

const app = http.createServer((req, res) => {
  const url = new URL(req.url, "http://x");
  const p = url.pathname;
  if (p === "/host.html") return res.writeHead(200, { "content-type": TYPES[".html"] }).end(HOST_HTML);
  if (p === "/probe.js") return res.writeHead(200, { "content-type": TYPES[".js"] }).end(PROBE_JS);
  if (p === "/zod-default.js" || p === "/zod-jitless.js") return res.writeHead(200, { "content-type": TYPES[".js"] }).end(readFileSync(join(WORK, p.slice(1))));
  if (p === "/probe.html") {
    const pol = POLICIES[url.searchParams.get("policy")] ?? {};
    const headers = { "content-type": TYPES[".html"] };
    if (pol.header) headers["content-security-policy"] = pol.header;
    const meta = pol.meta ? `<meta http-equiv="Content-Security-Policy" content="${pol.meta}">` : "";
    return res.writeHead(200, headers).end(`<!doctype html><meta charset="utf-8">${meta}<title>probe</title><body>probe<script src="/probe.js"></script></body>`);
  }
  // dist/ exactly as server/serve.mjs serves it (content-type + cache-control only), optionally + ACAO
  const file = normalize(join(DIST, p === "/modules.html" ? "modules.html" : p));
  if (file.startsWith(DIST) && existsSync(file)) {
    const h = { "content-type": TYPES[extname(file)] || "application/octet-stream", "cache-control": "no-cache" };
    if (state.acao) h["access-control-allow-origin"] = "*";
    return res.writeHead(200, h).end(readFileSync(file));
  }
  res.writeHead(404).end("no");
});
const leak = http.createServer((req, res) => {
  const url = new URL(req.url, "http://x");
  leakHits.push({ kind: url.pathname.slice(1), tag: url.searchParams.get("tag"), method: req.method });
  const k = url.pathname.slice(1);
  const ct = k === "css" ? "text/css" : k === "img" ? "image/gif" : /script|import|wimport/.test(k) ? "text/javascript" : "text/html";
  const body = k === "img" ? Buffer.from("R0lGODlhAQABAAAAACw=", "base64") : /script|import/.test(k) ? "/*leak*/" : "";
  res.writeHead(200, { "content-type": ct, "access-control-allow-origin": "*" }).end(body);
});
leak.on("upgrade", (req, sock) => { const url = new URL(req.url, "http://x"); leakHits.push({ kind: url.pathname.slice(1), tag: url.searchParams.get("tag"), method: "UPGRADE" }); sock.destroy(); });
const udp = dgram.createSocket("udp4");
udp.on("message", (m) => udpHits.push({ at: Date.now(), bytes: m.length }));
const listen = (s) => new Promise((r) => s.listen(0, "127.0.0.1", () => r(s.address().port)));
const APP = `http://127.0.0.1:${await listen(app)}`;
const LEAK = `http://127.0.0.1:${await listen(leak)}`;
await new Promise((r) => udp.bind(0, "127.0.0.1", r));
const STUN = `stun:127.0.0.1:${udp.address().port}`;
log(`app ${APP} leak ${LEAK} ${STUN}`);

// ───────── helpers ─────────
async function launch(isolated) {
  const args = ["--use-fake-ui-for-media-stream", "--use-fake-device-for-media-stream", "--autoplay-policy=no-user-gesture-required"];
  // Android WebView has no Site Isolation (chromium.org/Home/chromium-security/site-isolation). Emulate it.
  if (!isolated) args.push("--disable-site-isolation-trials", "--disable-features=IsolateSandboxedIframes,site-per-process,IsolateOrigins");
  const browser = await chromium.launch({ executablePath: EXE, args });
  const context = await browser.newContext({ viewport: { width: 360, height: 800 } });
  await context.grantPermissions(["microphone"], { origin: APP });
  await context.addInitScript(() => {
    if (!location.pathname.endsWith("/modules.html")) return;
    new MutationObserver((_, o) => { if (document.querySelector(".fb")) { window.__fbAt = performance.timeOrigin + performance.now(); o.disconnect(); } })
      .observe(document, { subtree: true, childList: true });
  });
  const page = await context.newPage();
  const consoleErrors = [];
  page.on("console", (m) => { if (m.type() === "error") consoleErrors.push(m.text().slice(0, 200)); });
  page.on("pageerror", (e) => consoleErrors.push("pageerror: " + e.message.slice(0, 200)));
  await page.goto(`${APP}/host.html`);
  const cdp = await context.newCDPSession(page);
  return { browser, context, page, cdp, consoleErrors };
}
const waitMsg = async (page, pred, ms = 5000, a = undefined) => {
  const t = Date.now();
  while (Date.now() - t < ms) {
    const hit = await page.evaluate(pred, a);
    if (hit) return hit;
    await sleep(25);
  }
  return null;
};
const INIT = (id) => ({ type: "init", moduleId: id, engine: "fraction-bars@1", params: { denominators: [4], mode: "shade", target: "3/4" }, lang: "english", ageBand: "6-9" });

// ───────── E1 exfiltration / capability battery per policy (isolated desktop config) ─────────
{
  const B = await launch(true);
  const hostGum = await B.page.evaluate(() => navigator.mediaDevices.getUserMedia({ audio: true }).then((s) => "granted:" + s.getAudioTracks().length, (e) => "ERR:" + e.name));
  result.hostGetUserMedia = hostGum;
  result.battery = {};
  for (const pol of Object.keys(POLICIES)) {
    const tag = `b_${pol}`;
    const udpBefore = udpHits.length;
    await B.page.evaluate(([src]) => window.mount("f_" + Math.random().toString(36).slice(2), src, "allow-scripts", ""), [`${APP}/probe.html?policy=${pol}#mode=battery&leak=${encodeURIComponent(LEAK)}&tag=${tag}&stun=${encodeURIComponent(STUN)}`]);
    const msg = await waitMsg(B.page, () => window.__msgs.find((m) => m.data && m.data.probe === "battery"), 20000);
    await sleep(800);
    const hits = [...new Set(leakHits.filter((h) => h.tag === tag).map((h) => h.kind))].sort();
    result.battery[pol] = { frame: msg?.data?.out ?? null, hostSawOrigin: msg?.origin ?? null, leakServerSaw: hits, stunPackets: udpHits.length - udpBefore };
    log(pol, "leaked via:", hits.join(",") || "(none)", "stun:", udpHits.length - udpBefore);
    await B.page.evaluate(() => { window.unmountAll(); window.__msgs = []; });
  }
  // E1b can module code recover a deleted RTCPeerConnection through an about:blank child (frame-src 'none' in strict)?
  result.webrtcRecovery = {};
  for (const pol of ["current_meta", "strict_header"]) {
    const udpBefore = udpHits.length;
    await B.page.evaluate(([src]) => window.mount("rtc", src, "allow-scripts", ""), [`${APP}/probe.html?policy=${pol}#mode=rtc&stun=${encodeURIComponent(STUN)}`]);
    const m = await waitMsg(B.page, () => window.__msgs.find((m) => m.data && m.data.probe === "rtc"), 8000);
    await sleep(500);
    result.webrtcRecovery[pol] = { ...(m?.data?.r ?? {}), stunPackets: udpHits.length - udpBefore };
    log("rtc recovery", pol, result.webrtcRecovery[pol]);
    await B.page.evaluate(() => { window.unmountAll(); window.__msgs = []; });
  }
  // E2 self-navigation + iframe load counting (navigation is not covered by CSP: navigate-to was dropped from CSP3)
  result.navigation = {};
  for (const pol of ["current_meta", "strict_header"]) {
    const tag = `nav_${pol}`;
    const id = `nav_${pol}`;
    await B.page.evaluate(([id, src]) => window.mount(id, src, "allow-scripts", ""), [id, `${APP}/probe.html?policy=${pol}#mode=nav&leak=${encodeURIComponent(LEAK)}&tag=${tag}`]);
    await sleep(1500);
    const loads = await B.page.evaluate((id) => window.__loads[id], id);
    result.navigation[pol] = { iframeLoadEvents: loads, leakServerSawNav: leakHits.some((h) => h.tag === tag && h.kind === "nav") };
    log("nav", pol, result.navigation[pol]);
  }
  await B.page.evaluate(() => { window.unmountAll(); window.__msgs = []; });
  // E3 zod v4 under strict CSP (no 'unsafe-eval')
  result.zod = {};
  for (const variant of ["zod-default", "zod-jitless"]) {
    await B.page.evaluate(([src]) => window.mount("z", src, "allow-scripts", ""), [`${APP}/probe.html?policy=strict_header#mode=zod&variant=${variant}`]);
    const m = await waitMsg(B.page, () => window.__msgs.find((m) => m.data && m.data.probe === "zod"), 8000);
    result.zod[variant] = { parsed: m?.data?.zod?.ok ?? null, violations: m?.data?.violations ?? null };
    log(variant, result.zod[variant]);
    await B.page.evaluate(() => { window.unmountAll(); window.__msgs = []; });
  }
  // E4 the real module frame under the production server's headers (no ACAO) vs with ACAO
  result.realFrameBoot = {};
  for (const acao of [false, true]) {
    state.acao = acao;
    const before = B.consoleErrors.length;
    const id = acao ? "acao" : "noacao";
    await B.page.evaluate((id) => window.mount(id, `/modules.html#${id}`, "allow-scripts", ""), id);
    const ready = await waitMsg(B.page, (id) => window.__msgs.find((m) => m.data && m.data.type === "ready" && m.data.moduleId === id), 6000, id);
    result.realFrameBoot[acao ? "with_acao_star" : "serve_mjs_headers"] = { ready: !!ready, consoleErrors: B.consoleErrors.slice(before).slice(0, 4) };
    log("real frame boot acao=", acao, !!ready);
    await B.page.evaluate(() => { window.unmountAll(); window.__msgs = []; });
  }
  await B.browser.close();
}

// ───────── E5 main-thread coupling: busy module vs host timer, isolated vs WebView-like ─────────
result.mainThread = {};
for (const isolated of [true, false]) {
  const B = await launch(isolated);
  const gaps = [];
  for (let i = 0; i < 3; i++) {
    await B.page.evaluate(() => window.startGap());
    await B.page.evaluate((src) => window.mount("busy", src, "allow-scripts", ""), `${APP}/probe.html?policy=current_meta#mode=busy`);
    await waitMsg(B.page, () => window.__msgs.find((m) => m.data && m.data.probe === "busy-end"), 8000);
    await sleep(200);
    gaps.push(Math.round(await B.page.evaluate(() => { window.gap.on = false; return window.gap.max; })));
    await B.page.evaluate(() => { window.unmountAll(); window.__msgs = []; });
  }
  result.mainThread[isolated ? "desktop_default_isolation" : "no_isolation_webview_like"] = { hostMaxTimerGapMs: gaps, frameBusyLoopMs: 1500 };
  log("main-thread", isolated ? "isolated" : "shared", gaps);
  await B.browser.close();
}

// ───────── E6 mount cost, memory, RTT, solve latency, axe — WebView-like config, real engine, ACAO on ─────────
state.acao = true;
{
  const B = await launch(false);
  result.mount = {};
  for (const rate of [1, 4, 6]) {
    await B.cdp.send("Emulation.setCPUThrottlingRate", { rate });
    const toReady = [], toRender = [];
    for (let i = 0; i < N; i++) {
      const id = `m${rate}_${i}`;
      const t0 = await B.page.evaluate((id) => window.mount(id, `/modules.html#${id}`, "allow-scripts", ""), id);
      const ready = await waitMsg(B.page, (id) => window.__msgs.find((m) => m.data && m.data.type === "ready" && m.data.moduleId === id), 15000, id);
      if (!ready) continue;
      const readyAbs = await B.page.evaluate((t) => performance.timeOrigin + t, ready.t);
      await B.page.evaluate(([id, init]) => document.getElementById(id).contentWindow.postMessage(init, "*"), [id, INIT(id)]);
      const frame = B.page.frames().find((f) => f.url().endsWith(`#${id}`));
      let fbAt = null;
      for (let k = 0; k < 400 && !fbAt; k++) { fbAt = await frame.evaluate(() => window.__fbAt ?? null).catch(() => null); if (!fbAt) await sleep(10); }
      toReady.push(Math.round(readyAbs - t0));
      if (fbAt) toRender.push(Math.round(fbAt - t0));
      await B.page.evaluate(() => { window.unmountAll(); window.__msgs = []; });
    }
    result.mount[`cpu_x${rate}`] = { n: toReady.length, readyMs: { median: median(toReady), p90: p90(toReady) }, firstEngineDomMs: { median: median(toRender), p90: p90(toRender) } };
    log("mount x" + rate, result.mount[`cpu_x${rate}`]);
  }
  await B.cdp.send("Emulation.setCPUThrottlingRate", { rate: 1 });
  // memory: host only, then 1 and 3 live engine frames
  await B.cdp.send("Performance.enable");
  const heap = async () => { await B.cdp.send("HeapProfiler.collectGarbage"); const { metrics } = await B.cdp.send("Performance.getMetrics"); const g = (n) => metrics.find((m) => m.name === n)?.value; return { jsHeapUsedMB: +(g("JSHeapUsedSize") / 1048576).toFixed(2), documents: g("Documents"), frames: g("Frames"), nodes: g("Nodes") }; };
  result.memory = { hostOnly: await heap() };
  for (const count of [1, 3]) {
    for (let i = 0; i < count; i++) {
      const id = `mem${count}_${i}`;
      await B.page.evaluate((id) => window.mount(id, `/modules.html#${id}`, "allow-scripts", ""), id);
      await waitMsg(B.page, (id) => window.__msgs.find((m) => m.data && m.data.type === "ready" && m.data.moduleId === id), 8000, id);
      await B.page.evaluate(([id, init]) => document.getElementById(id).contentWindow.postMessage(init, "*"), [id, INIT(id)]);
    }
    await sleep(800);
    result.memory[`frames_${count}`] = await heap();
    await B.page.evaluate(() => { window.unmountAll(); window.__msgs = []; });
    await sleep(300);
  }
  log("memory", result.memory);
  // postMessage round trip (host → frame → host), 200 sequential pings
  result.rtt = {};
  for (const rate of [1, 6]) {
    await B.cdp.send("Emulation.setCPUThrottlingRate", { rate });
    await B.page.evaluate((src) => window.mount("pong", src, "allow-scripts", ""), `${APP}/probe.html?policy=strict_header#mode=pong`);
    await waitMsg(B.page, () => window.__msgs.find((m) => m.data && m.data.probe === "pong-ready"), 8000);
    const rtts = await B.page.evaluate(async () => {
      const w = document.getElementById("pong").contentWindow; const out = [];
      for (let i = 0; i < 200; i++) {
        const t = performance.now();
        await new Promise((res) => { const h = (e) => { if (e.data && e.data.pong === i) { removeEventListener("message", h); res(); } }; addEventListener("message", h); w.postMessage({ ping: i }, "*"); });
        out.push(performance.now() - t);
      }
      return out;
    });
    result.rtt[`cpu_x${rate}`] = { n: rtts.length, medianMs: +median(rtts).toFixed(3), p90Ms: +p90(rtts).toFixed(3), maxMs: +Math.max(...rtts).toFixed(3) };
    log("rtt x" + rate, result.rtt[`cpu_x${rate}`]);
    await B.page.evaluate(() => { window.unmountAll(); window.__msgs = []; });
  }
  await B.cdp.send("Emulation.setCPUThrottlingRate", { rate: 1 });
  // scripted solve: shade 3 of 4 → goal_met at the host; then axe on the same frame
  {
    const id = "solve";
    await B.page.evaluate((id) => window.mount(id, `/modules.html#${id}`, "allow-scripts", ""), id);
    await waitMsg(B.page, (id) => window.__msgs.find((m) => m.data && m.data.type === "ready" && m.data.moduleId === id), 8000, id);
    await B.page.evaluate(([id, init]) => document.getElementById(id).contentWindow.postMessage(init, "*"), [id, INIT(id)]);
    const frame = B.page.frames().find((f) => f.url().endsWith(`#${id}`));
    await frame.locator("[data-part]").first().waitFor({ timeout: 8000 });
    const parts = frame.locator("[data-part]");
    for (let k = 0; k < 2; k++) await parts.nth(k).click();
    const tClick = await B.page.evaluate(() => performance.now());
    await parts.nth(2).click();
    const goal = await waitMsg(B.page, () => window.__msgs.find((m) => m.data && m.data.type === "goal_met"), 5000);
    const events = await B.page.evaluate(() => window.__msgs.map((m) => m.data && (m.data.type + (m.data.name ? ":" + m.data.name : ""))));
    result.solve = { goalMet: !!goal, clickToGoalMetMs: goal ? Math.round(goal.t - tClick) : null, eventsSeen: events, note: "click time includes Playwright actionability checks; upper bound" };
    log("solve", result.solve);
    if (AXE && existsSync(AXE)) {
      await frame.evaluate(readFileSync(AXE, "utf8"));
      result.axe = await frame.evaluate(() => window.axe.run(document, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"] } })
        .then((r) => ({ violations: r.violations.map((v) => ({ id: v.id, impact: v.impact, nodes: v.nodes.length })), passes: r.passes.length, incomplete: r.incomplete.map((v) => v.id) })));
      log("axe", JSON.stringify(result.axe));
    } else result.notes.push("axe skipped (pass --axe path/to/axe.min.js)");
  }
  result.consoleErrorsWebViewLike = B.consoleErrors.slice(0, 10);
  await B.browser.close();
}

result.chromium = (await (async () => { const b = await chromium.launch({ executablePath: EXE }); const v = b.version(); await b.close(); return v; })());
writeFileSync(OUT, JSON.stringify(result, null, 2));
log("wrote", OUT);
app.close(); leak.close(); udp.close();
