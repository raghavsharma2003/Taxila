// r12 T-voice evidence: ONE scripted voice turn on a LOCAL production build, through the r4-timeline driver (Chromium fake mic;
// the transcription WebRTC call is the driver's fake, which sends gpt-live-transcribe's events with the words given and a
// fixed 750 ms commit -> final). Everything else is the product. A test-only bus collects the voice events in the page
// (window.__taxilaTrace, the same shape src/voice/trace.ts reads), so the run shows the full voice sequence before the
// client bus (src/trace/**) lands; with it, `scripts/trace.mjs --session <lessonId>` prints the same events.
// TEST accounts on this stream's Neon branch only. Not a child.
//
//   node docs/design/round4/build/r12/t-voice/voice-turn.mjs <account> <name> [--child <key>] [--full] [--text "..."]
//   (servers: tests/prod/r4-timeline/README.md; the cohort is TAXILA_DUPLEX_LIVE_FOR=<owner account email>)

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "../../../../../..");
const H = join(ROOT, "tests/prod/r4-timeline");
const argv = process.argv.slice(2);
const [acct, name] = argv;
const FULL = argv.includes("--full");
const ti = argv.indexOf("--text");
const TEXT = ti >= 0 ? argv[ti + 1] : "Mujhe lagta hai yeh recursive rule hai";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function rv(cmd) {
  const res = await fetch("http://127.0.0.1:5199/", { method: "POST", body: JSON.stringify(cmd), signal: AbortSignal.timeout(240_000) });
  return res.json();
}

const SINK = `(() => { window.__vtr = []; window.__vtb = []; window.__vtFull = ${FULL};
  window.__taxilaTrace = { emit(kind, data, opts) { window.__vtr.push({ t: Date.now(), mono: Math.round(performance.now()), kind, tier: opts?.tier ?? 1, data: JSON.parse(JSON.stringify(data)) }); },
    full() { return !!window.__vtFull; },
    blob(kind, blob, data) { window.__vtb.push({ t: Date.now(), kind, bytes: blob.size, type: blob.type, data }); } };
  return true; })()`;

const accounts = JSON.parse(readFileSync(join(H, "run/accounts.json"), "utf8"));
const a = accounts[acct];
const ki = argv.indexOf("--child");
const cid = ki >= 0 ? a.children[argv[ki + 1]] : Object.values(a.children)[0];
const sid = `${name}-${Date.now() % 100000}`;
await rv({ op: "open", sid, cookie: a.cookie, url: `/c/${cid}`, view: "phone360" });
await sleep(5000);
await rv({ op: "eval", sid, js: SINK });
// START (a tap at the button's centre: the Kaksha home's start button)
let box = null;
for (let i = 0; i < 30 && !box; i++) {
  box = await rv({ op: "eval", sid, js: "(() => { const b = document.querySelector('[data-testid=start-lesson], #start-lesson'); if (!b) return null; const r = b.getBoundingClientRect(); return [r.x + r.width / 2, r.y + r.height / 2]; })()" });
  if (!box) await sleep(1000);
}
if (!box) throw new Error("no #start-lesson on the child home (onboarding not finished for this account?)");
await rv({ op: "tap", sid, x: Math.round(box[0]), y: Math.round(box[1]), after: 12_000 });
const said = await rv({ op: "say", sid, text: TEXT });
await sleep(12_000);
const dump = await rv({ op: "eval", sid, js: "JSON.stringify({ events: window.__vtr, blobs: window.__vtb, url: location.pathname })" });
await rv({ op: "close", sid });
const d = JSON.parse(dump);
const out = { run: name, account: acct, tier: FULL ? 2 : 1, text: TEXT, at: new Date().toISOString(), lessonUrl: d.url, driverTimeline: said?.timeline ?? said?.tl ?? null, events: d.events, blobs: d.blobs };
mkdirSync(join(HERE, "evidence"), { recursive: true });
writeFileSync(join(HERE, "evidence", `run-${name}.json`), JSON.stringify(out, null, 1));
const t0 = d.events[0]?.t ?? 0;
const line = (e) => {
  const x = e.data;
  const pick = (k) => (x[k] === undefined || x[k] === null ? "" : `${k}=${typeof x[k] === "object" ? JSON.stringify(x[k]) : x[k]}`);
  const keys = ["mode", "reasons", "source", "state", "transport", "live", "why", "step", "verdict", "action", "text", "confidence", "msFromSpeechEnd", "msFromRequest", "status", "playedFully", "msUnplayed", "kind", "by", "reason", "bytes"];
  return `+${String(e.t - t0).padStart(6)} ms  ${e.kind.padEnd(18)} ${keys.map(pick).filter(Boolean).join("  ").slice(0, 220)}`;
};
const txt = [`# r12 T-voice scripted turn: ${name} (account ${acct}, tier ${FULL ? 2 : 1}), ${out.at}`, `# said: "${TEXT}"`, ...d.events.map(line), ...d.blobs.map((b) => `+${String(b.t - t0).padStart(6)} ms  ${b.kind.padEnd(18)} BLOB bytes=${b.bytes} type=${b.type} ${JSON.stringify(b.data).slice(0, 120)}`)].join("\n");
writeFileSync(join(HERE, "evidence", `run-${name}.txt`), txt + "\n");
console.log(txt);

