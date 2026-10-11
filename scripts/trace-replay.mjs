#!/usr/bin/env node
// The flight recorder's replay renderer (release 12, T-client; dc-r12-flight-recorder). It renders a session's rrweb
// recording (tier 2) in headless Chromium with rrweb's own Replayer (the engine inside rrweb-player; local, from
// node_modules, nothing fetched from a CDN), pauses at each requested moment and writes a PNG of exactly what the screen
// showed then. scripts/trace.mjs --replay (T-server) calls renderReplay(); it also runs on its own:
//
//   node scripts/trace-replay.mjs --events <chunks.json|dir> --at 14:31:07[,14:31:22] [--out dir] [--base https://taxila.dev]
//     --events  one JSON array of rrweb events, or a directory of chunk files (*.json, each an array), in any order
//     --at      wall-clock times hh:mm:ss (UTC, on the recording's day), or offsets +mm:ss / +ms from its first event
//     --base    the origin the recording was made on, so its fonts, images and stylesheets load (default: the events'
//               own absolute URLs; a recording made on a dev server needs that server running)
//     --tz      read --at in this offset from UTC, e.g. +05:30 for IST (default +00:00)
//     --motion  reduce (default) | full: the replay browser's prefers-reduced-motion. Either way every CSS animation and
//               transition is jumped to its end at each moment (a paused replay would otherwise freeze a just-inserted
//               word at frame 0 of its fade-in), so the PNG is the screen as it settled
// Writes <out>/replay-<hhmmss>.png per moment and prints one JSON line per PNG (time, offset, the event index reached).
//
// From the recorder's store (what scripts/trace.mjs --replay calls; T-server's file passes the session as the first word):
//   node --env-file=.env.local scripts/trace-replay.mjs <session> --at hh:mm:ss[,…] [--out dir]
//     <session>  a lesson id, a child id prefix (their latest session) or a page-load id, resolved as trace.mjs does
//     the session's rrweb.chunk events are read from trace_event (TAXILA_DB=test for the TEST branch), and each chunk from
//     the private "trace" container by its data.blob.ref (a chunk sent by beacon at pagehide carries no ref: its path is
//     rebuilt as the server wrote it, {day}/{sid}/client-{seq}.json). TAXILA_TRACE_BLOB_DIR=<dir> reads the chunks from a
//     local directory with the same layout instead (tests; a container copied down). --base defaults to the recording's
//     own origin (its first Meta event).
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";

const require = createRequire(import.meta.url);

/** Every rrweb event from a file (an array) or a directory of chunk files, sorted by time. */
export function loadEvents(src) {
  const files = fs.statSync(src).isDirectory() ? fs.readdirSync(src).filter((f) => f.endsWith(".json")).map((f) => path.join(src, f)) : [src];
  const all = files.flatMap((f) => { const j = JSON.parse(fs.readFileSync(f, "utf8")); return Array.isArray(j) ? j : j.events ?? []; });
  return all.filter((e) => e && typeof e.timestamp === "number").sort((a, b) => a.timestamp - b.timestamp);
}

/** "14:31:07" (on the recording's UTC day, shifted by tz) | "+01:30" | "+5400" → epoch ms. */
export function resolveAt(at, firstTs, tz = "+00:00") {
  const s = String(at).trim();
  if (s.startsWith("+")) {
    const p = s.slice(1).split(":").map(Number);
    const ms = p.length === 1 ? p[0] : p.length === 2 ? (p[0] * 60 + p[1]) * 1000 : ((p[0] * 60 + p[1]) * 60 + p[2]) * 1000;
    return firstTs + ms;
  }
  const [h, m, sec = 0] = s.split(":").map(Number);
  const tzm = /^([+-])(\d\d):(\d\d)$/.exec(tz);
  const off = tzm ? (tzm[1] === "-" ? -1 : 1) * (Number(tzm[2]) * 60 + Number(tzm[3])) * 60_000 : 0;
  const day = new Date(firstTs + off);
  const local = Date.UTC(day.getUTCFullYear(), day.getUTCMonth(), day.getUTCDate(), h, m, Math.floor(sec), Math.round((sec % 1) * 1000));
  return local - off;
}

/**
 * Render the recording at each epoch-ms moment. Returns [{ at, offsetMs, file, w, h }].
 * @param {{ events: any[], at: number[], out: string, base?: string, motion?: "reduce" | "full", chromium?: any, executablePath?: string }} o
 */
export async function renderReplay(o) {
  const { chromium } = o.chromium ? { chromium: o.chromium } : await import("playwright");
  const events = o.events;
  if (!events.length) throw new Error("no rrweb events");
  const meta = events.find((e) => e.type === 4)?.data ?? { width: 412, height: 915 };
  const w = Math.max(200, Math.round(meta.width)), h = Math.max(200, Math.round(meta.height));
  // rrweb's package exports hide dist/: find the dist folder from its main entry (rrweb.cjs lives beside the UMD build)
  const dist = path.dirname(require.resolve("rrweb"));
  const rrwebJs = fs.readFileSync(path.join(dist, "rrweb.umd.cjs"), "utf8");
  let rrwebCss = "";
  try { rrwebCss = fs.readFileSync(path.join(dist, "style.css"), "utf8"); } catch { /* optional */ }
  fs.mkdirSync(o.out, { recursive: true });
  const browser = await chromium.launch(o.executablePath ? { executablePath: o.executablePath } : {});
  const out = [];
  try {
    const page = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 1, reducedMotion: o.motion === "full" ? "no-preference" : "reduce" });
    // the replay page lives on the recording's origin (when given) so relative fonts / images / CSS resolve as they did
    if (o.base) {
      await page.route(`${o.base}/__trace_replay__`, (r) => r.fulfill({ contentType: "text/html", body: "<!doctype html><html><head></head><body></body></html>" }));
      await page.goto(`${o.base}/__trace_replay__`);
    }
    await page.setContent(`<!doctype html><html><head><meta charset="utf-8"><style>html,body{margin:0;background:#000;overflow:hidden}${rrwebCss}
      .replayer-wrapper{position:relative}.replayer-mouse,.replayer-mouse-tail{display:none!important}iframe{border:0}</style></head><body><div id="root"></div></body></html>`);
    await page.addScriptTag({ content: `${rrwebJs}\n;window.__rr = (typeof rrweb !== "undefined" ? rrweb : window.rrweb);` });
    await page.evaluate(({ events }) => {
      const R = window.__rr;
      window.__events = events;
      window.__replayer = new R.Replayer(events, { root: document.getElementById("root"), skipInactive: false, mouseTail: false, showWarning: false, UNSAFE_replayCanvas: true, triggerFocus: true });
    }, { events });
    const first = events[0].timestamp;
    for (const t of o.at) {
      const offsetMs = Math.max(0, t - first);
      const reached = await page.evaluate(async (off) => {
        const r = window.__replayer;
        r.pause(off);
        const iframe = document.querySelector("iframe");
        // a paused replay freezes CSS animations where they are, so a node inserted just before this moment sits at
        // frame 0 of its entry animation (opacity 0: the first proof run lost the caption and the answer chip this way).
        // Every animation and transition is jumped to its END: the screen as it settled, which is what the child saw.
        const d = iframe?.contentDocument;
        if (d) {
          d.getElementById("__trace_settle")?.remove();
          const st = d.createElement("style");
          st.id = "__trace_settle";
          st.textContent = "*,*::before,*::after{animation-delay:-60s!important;animation-duration:1ms!important;animation-iteration-count:1!important;animation-play-state:running!important;transition:none!important}";
          (d.head ?? d.documentElement).appendChild(st);
        }
        // focus: the recorder's custom "trace.focus" events (src/trace/tier2.ts) say which node held focus; the last one
        // before this moment is applied, so a focused field shows its ring as it did on the device
        const fe = window.__events ?? [];
        const t0 = fe[0]?.timestamp ?? 0;
        let focusId = null;
        for (const e of fe) { if (e.timestamp - t0 > off) break; if (e.type === 5 && e.data?.tag === "trace.focus") focusId = e.data.payload?.id ?? null; }
        try {
          const node = focusId != null && focusId >= 0 ? r.getMirror().getNode(focusId) : null;
          if (node && node.focus) node.focus({ preventScroll: true }); else d?.activeElement?.blur?.();
        } catch { /* best effort */ }
        await new Promise((res) => setTimeout(res, 400)); // images / canvas frames applied
        const wrapper = document.querySelector(".replayer-wrapper");
        if (wrapper) { wrapper.style.transform = "none"; wrapper.style.left = "0"; wrapper.style.top = "0"; }
        return { w: iframe?.clientWidth ?? 0, h: iframe?.clientHeight ?? 0 };
      }, offsetMs);
      await page.waitForLoadState("networkidle").catch(() => {});
      await page.waitForTimeout(300);
      const stamp = new Date(t).toISOString().slice(11, 19).replace(/:/g, "");
      const file = path.join(o.out, `replay-${stamp}${o.at.length > 1 ? `-${out.length + 1}` : ""}.png`);
      const iframe = await page.$("iframe");
      if (iframe) await iframe.screenshot({ path: file }); else await page.screenshot({ path: file });
      out.push({ at: new Date(t).toISOString(), offsetMs, file, w: reached.w, h: reached.h });
    }
  } finally { await browser.close(); }
  return out;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const safe = (s, n) => String(s ?? "").replace(/[^\w.-]/g, "_").slice(0, n);

/** trace.mjs's session resolution: a lesson id (with the page loads that led into it), a child id prefix, or a pid. */
export async function resolveSession(q, key) {
  if (UUID.test(key)) {
    const pids = await q("select distinct pid from trace_event where sid = $1 and pid is not null", [key]);
    return { sids: [key], pids: pids.map((r) => r.pid) };
  }
  if (/^[0-9a-f-]{4,35}$/i.test(key)) {
    const r = await q("select sid from trace_event where cid::text like $1 order by t desc limit 1", [`${key}%`]);
    if (r[0]) return resolveSession(q, r[0].sid);
  }
  return { sids: [key], pids: [key] };
}

/** One chunk's bytes: a local directory (TAXILA_TRACE_BLOB_DIR) or a SharedKey-signed GET on the private container. */
export async function readTraceBlob(ref) {
  const dir = process.env.TAXILA_TRACE_BLOB_DIR;
  if (dir) { const f = path.join(dir, ref); return fs.existsSync(f) ? fs.readFileSync(f, "utf8") : null; }
  const account = process.env.AZURE_STORAGE_ACCOUNT, key = process.env.AZURE_STORAGE_KEY;
  if (!account || !key) throw new Error("AZURE_STORAGE_ACCOUNT / AZURE_STORAGE_KEY not set (or TAXILA_TRACE_BLOB_DIR)");
  const { signRequest } = await import("../server/forge/blob.js");
  const { TRACE_CONTAINER } = await import("../server/trace/blob.js");
  const headers = { "x-ms-date": new Date().toUTCString(), "x-ms-version": "2021-08-06" };
  headers.authorization = `SharedKey ${account}:${signRequest({ method: "GET", account, container: TRACE_CONTAINER, blob: ref, headers, key })}`;
  const res = await fetch(`https://${account}.blob.core.windows.net/${TRACE_CONTAINER}/${ref}`, { headers });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`trace blob GET ${res.status} ${ref}`);
  return res.text();
}

/** Every rrweb event of a session, from its rrweb.chunk rows and their blobs, in time order. */
export async function eventsForSession(key, { q, read = readTraceBlob, log = () => {} } = {}) {
  const { sids, pids } = await resolveSession(q, key);
  const rows = await q(`select sid, pid, t, data from trace_event where kind = 'rrweb.chunk' and (sid = any($1::text[]) or (pid is not null and pid = any($2::text[])))
    order by t, seq`, [sids, pids]);
  const events = [];
  let missing = 0;
  for (const r of rows) {
    const d = r.data ?? {};
    const day = (ms) => new Date(ms).toISOString().slice(0, 10);
    const t = new Date(r.t).getTime();
    // a beacon chunk has no ref: the server wrote it at {day}/{sid}/client-{seq}.json (the day it arrived: same day, or the next)
    const refs = d.blob?.ref ? [d.blob.ref] : [day(t), day(t + 86_400_000)].map((dd) => `${dd}/${safe(r.sid, 80)}/client-${safe(d.seq, 12)}.json`);
    let text = null;
    for (const ref of refs) { text = await read(ref); if (text) break; }
    if (!text) { missing++; log(`chunk ${d.seq} missing (${refs.join(" | ")})`); continue; }
    try { const arr = JSON.parse(text); if (Array.isArray(arr)) events.push(...arr); } catch { missing++; }
  }
  log(`${rows.length} chunks, ${missing} missing, ${events.length} events`);
  return events.filter((e) => e && typeof e.timestamp === "number").sort((a, b) => a.timestamp - b.timestamp);
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  const arg = (k, d) => { const i = process.argv.indexOf(`--${k}`); return i > 0 ? process.argv[i + 1] : d; };
  const src = arg("events");
  const ats = arg("at");
  // the session: --session <key>, or the first bare word (scripts/trace.mjs --replay <session> passes it that way)
  const valued = new Set(["--events", "--at", "--out", "--base", "--tz", "--motion", "--session"]);
  const words = process.argv.slice(2).filter((a, i, all) => !a.startsWith("--") && !valued.has(all[i - 1]));
  const sessionKey = arg("session") ?? words[0];
  if ((!src && !sessionKey) || !ats) {
    console.error("usage: node scripts/trace-replay.mjs (--events <file|dir> | <session>) --at hh:mm:ss[,…] [--out dir] [--base origin] [--tz +05:30]");
    process.exit(2);
  }
  let events;
  if (src) events = loadEvents(src);
  else {
    const { q, closeDb } = await import("../server/db.js");
    try { events = await eventsForSession(sessionKey, { q, log: (m) => console.error(`[replay] ${m}`) }); } finally { await closeDb?.(); }
  }
  if (!events.length) { console.error(`[replay] no rrweb events for ${src ?? sessionKey} (tier 2 only: was the account in TAXILA_TRACE_FULL_FOR?)`); process.exit(1); }
  const metaHref = events.find((e) => e.type === 4)?.data?.href;
  const base = arg("base") ?? (metaHref ? new URL(metaHref).origin : undefined);
  const at = ats.split(",").map((s) => resolveAt(s, events[0].timestamp, arg("tz", "+00:00")));
  const res = await renderReplay({ events, at, out: arg("out", "trace-replay"), base, motion: arg("motion", "reduce"), executablePath: process.env.CHROMIUM });
  for (const r of res) console.log(JSON.stringify(r));
  process.exit(0);
}
