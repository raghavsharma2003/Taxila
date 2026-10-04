// Reset audit harness (DEFECTS.md, 2026-10-04). Moved from the session scratchpad into the repo so the RS-0 defect re-walk can re-run it
// (scratchpad gates live nowhere). Run with RA=<scratch dir> so out/ (test-account credentials) never lands in the repo.
// Routes same-origin requests through Node fetch because the sandbox proxy breaks Chromium.
import { chromium } from "/home/user/Taxila/node_modules/playwright/index.mjs";
import fs from "fs";
export const BASE = (process.env.TAXILA_BASE || "https://taxila.dev").replace(/\/+$/, "");
export const SHOTS = "/home/user/Taxila/docs/design/reset/audit/shots";
export const OUT = (process.env.RA || new URL(".", import.meta.url).pathname) + "/out"; // RA = a scratch dir; out/ holds test-account credentials and must never be committed
fs.mkdirSync(SHOTS, { recursive: true }); fs.mkdirSync(OUT, { recursive: true });
export const VP = {
  m: { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
  t: { viewport: { width: 820, height: 1180 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true },
  d: { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 },
};
let browser;
export async function launch() {
  browser = await chromium.launch({ args: ["--use-fake-ui-for-media-stream", "--use-fake-device-for-media-stream", "--autoplay-policy=no-user-gesture-required"] });
  return browser;
}
export async function ctxFor(vp, opts = {}) {
  const ctx = await browser.newContext({ ...VP[vp], ignoreHTTPSErrors: true, locale: "en-IN", timezoneId: "Asia/Kolkata", permissions: ["microphone"], ...opts });
  const origin = new URL(BASE).origin;
  await ctx.route((u) => u.origin === origin, async (route) => {
    const req = route.request();
    const h = { ...(await req.allHeaders()) };
    for (const k of Object.keys(h)) if (k.startsWith(":") || ["host", "content-length", "accept-encoding", "connection"].includes(k)) delete h[k];
    for (let k = 0; k < 4; k++) {
      try {
        const r = await fetch(req.url(), { method: req.method(), headers: h, body: ["GET", "HEAD"].includes(req.method()) ? undefined : req.postDataBuffer() ?? undefined, redirect: "manual" });
        const body = Buffer.from(await r.arrayBuffer());
        const headers = {};
        r.headers.forEach((v, key) => { if (!["content-encoding", "content-length", "transfer-encoding", "set-cookie"].includes(key)) headers[key] = v; });
        const sc = r.headers.getSetCookie?.() ?? []; if (sc.length) headers["set-cookie"] = sc.join("\n");
        return await route.fulfill({ status: r.status, headers, body });
      } catch (e) { if (k === 3) return route.abort("failed").catch(() => {}); await new Promise((z) => setTimeout(z, 700)); }
    }
  });
  return ctx;
}
export function watch(page, log) {
  page.on("console", (m) => { if (["error", "warning"].includes(m.type())) log.console.push(`${m.type()}: ${m.text().slice(0, 240)}`); });
  page.on("pageerror", (e) => log.console.push(`pageerror: ${String(e).slice(0, 240)}`));
  page.on("response", (r) => { if (r.status() >= 400) log.http.push(`${r.status()} ${r.request().method()} ${r.url().replace(BASE, "")}`); });
}
export async function shot(page, name, { full = false } = {}) {
  await page.screenshot({ path: `${SHOTS}/${name}.png`, fullPage: full }).catch((e) => console.log("shot fail", name, e.message.slice(0, 80)));
}
export async function textDump(page) {
  return page.evaluate(() => document.body.innerText).catch(() => "");
}
/** Layout probe: horizontal overflow, tiny tap targets, tiny text, offscreen buttons. */
export async function probe(page) {
  return page.evaluate(() => {
    const vw = innerWidth, vh = innerHeight;
    const out = { vw, vh, scrollW: document.documentElement.scrollWidth, scrollH: document.documentElement.scrollHeight, smallTargets: [], tinyText: [], overflowEls: [], fonts: {} };
    for (const el of document.querySelectorAll("button, a, [role=button], input, select, textarea, [tabindex]")) {
      const r = el.getBoundingClientRect(); if (!r.width || !r.height) continue;
      const cs = getComputedStyle(el); if (cs.visibility === "hidden" || cs.display === "none") continue;
      if ((r.width < 40 || r.height < 40) && r.top < vh * 3) out.smallTargets.push(`${el.tagName.toLowerCase()} "${(el.innerText || el.getAttribute("aria-label") || el.getAttribute("placeholder") || el.type || "").trim().slice(0, 30)}" ${Math.round(r.width)}x${Math.round(r.height)}`);
      if (!el.innerText?.trim() && !el.getAttribute("aria-label") && !el.getAttribute("title") && ["BUTTON", "A"].includes(el.tagName) && !el.querySelector("img[alt]")) out.overflowEls.push(`unlabelled ${el.tagName.toLowerCase()} ${Math.round(r.width)}x${Math.round(r.height)}`);
      if (r.right > vw + 2) out.overflowEls.push(`offright ${el.tagName.toLowerCase()} "${(el.innerText || "").trim().slice(0, 20)}" right=${Math.round(r.right)}`);
    }
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    let n; const seen = new Set();
    while ((n = walker.nextNode())) {
      const t = n.textContent.trim(); if (!t || !n.parentElement) continue;
      const el = n.parentElement; if (seen.has(el)) continue; seen.add(el);
      const cs = getComputedStyle(el); const fs = parseFloat(cs.fontSize);
      const fam = cs.fontFamily.split(",")[0].replace(/"/g, ""); out.fonts[fam] = (out.fonts[fam] || 0) + 1;
      const r = el.getBoundingClientRect(); if (!r.width) continue;
      if (fs < 12) out.tinyText.push(`${fs}px "${t.slice(0, 40)}"`);
    }
    out.smallTargets = out.smallTargets.slice(0, 25); out.tinyText = out.tinyText.slice(0, 25);
    return out;
  });
}
export async function api(page, method, path, body) {
  for (let k = 0; k < 4; k++) {
    try {
      return await page.evaluate(async ([method, path, body]) => {
        const r = await fetch(path, { method, headers: { "content-type": "application/json" }, body: body ? JSON.stringify(body) : undefined, credentials: "include" });
        return { s: r.status, j: await r.json().catch(() => ({})) };
      }, [method, path, body]);
    } catch (e) { if (k === 3) throw e; await page.waitForTimeout(1200); }
  }
}
export async function goto(page, url, opts = {}) {
  for (let k = 0; k < 3; k++) { try { return await page.goto(url.startsWith("http") ? url : BASE + url, { waitUntil: "load", timeout: 45000, ...opts }); } catch (e) { console.log("goto retry", e.message.slice(0, 100)); } }
}
export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
export function save(name, obj) { fs.writeFileSync(`${OUT}/${name}.json`, JSON.stringify(obj, null, 2)); }
