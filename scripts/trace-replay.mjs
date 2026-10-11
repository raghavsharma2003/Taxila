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

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  const arg = (k, d) => { const i = process.argv.indexOf(`--${k}`); return i > 0 ? process.argv[i + 1] : d; };
  const src = arg("events");
  const ats = arg("at");
  if (!src || !ats) {
    console.error("usage: node scripts/trace-replay.mjs --events <file|dir> --at hh:mm:ss[,…] [--out dir] [--base origin] [--tz +05:30]");
    process.exit(2);
  }
  const events = loadEvents(src);
  const at = ats.split(",").map((s) => resolveAt(s, events[0].timestamp, arg("tz", "+00:00")));
  const res = await renderReplay({ events, at, out: arg("out", "trace-replay"), base: arg("base"), motion: arg("motion", "reduce"), executablePath: process.env.CHROMIUM });
  for (const r of res) console.log(JSON.stringify(r));
}
