// duplex r4: the HANDS-FREE mid-sentence pause check on a LOCAL PRODUCTION BUILD through tests/prod/r4-timeline (driver.mjs,
// with patch 01: a client commit closes the open item and the rest of the utterance is a new item, as gpt-live-transcribe
// does). Starts the driver with one clip (synthetic child-like TTS with controlled mid-sentence pauses; NOT a child), opens
// a fresh hands-free lesson for the owner-cohort TEST child, says `--turns` utterances, and records per turn: the words the
// turn was sent with vs the words said (a truncated turn = a premature floor commit), the engine's STT probes inside the
// utterance, speech end → turn POST, and whether the eager prefetch fired. Fake ASR: FIXED 750 ms commit → final.
//   node evals/duplex-r4/timeline-midpause.mjs --clip <wav> --label p450 [--turns 6] --out <file.json>
import { spawn, execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const argv = process.argv.slice(2);
const opt = (f, d) => { const i = argv.indexOf(f); return i >= 0 ? argv[i + 1] : d; };
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../..");
const clip = opt("--clip"), label = opt("--label", "clip"), turns = Number(opt("--turns", 6)), out = opt("--out");
const clipMs = Math.round(Number(execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", clip]).toString()) * 1000);
const TEXTS = [
  "Mujhe lagta hai dabbe mein chaar corner hote hain",
  "Achha aur corner woh kya hota hai didi",
  "Mujhe nahi pata ek kilo mein kitne gram",
  "Ek kilo mein ek hazaar gram hote hain na",
  "Haan didi samajh gaya ab agla sawaal puchho",
  "Mera bag bahut bhaari hai uska wajan kitna hoga",
  "Do kilo aur paanch sau gram matlab dhai kilo",
  "Main soch raha hoon ki aata zyada bhaari hai",
];
const drv = spawn(process.execPath, [path.join(ROOT, opt("--driver", "tests/prod/r4-timeline/driver.mjs"))], { env: { ...process.env, RV_SPEECH: clip }, stdio: ["ignore", "pipe", "pipe"] });
await new Promise((res, rej) => { drv.stdout.on("data", (d) => { if (/driver on/.test(String(d))) res(); }); drv.on("exit", (c) => rej(new Error("driver exit " + c))); setTimeout(() => rej(new Error("driver timeout")), 60000); });
const rv = async (cmd) => { const r = await fetch("http://127.0.0.1:5199/", { method: "POST", body: JSON.stringify(cmd) }); return r.json(); };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const acct = JSON.parse(fs.readFileSync(path.join(ROOT, "tests/prod/r4-timeline/run/accounts.json"), "utf8")).owner;
const sid = `${label}-${Date.now()}`;
const rows = [];
try {
  await rv({ op: "open", sid, cookie: acct.cookie, url: `/c/${acct.children.golu}/lesson/new`, view: "phone360" });
  for (let k = 0; k < 60; k++) { const st = await rv({ op: "state", sid }); if (st.turns >= 1 && !/Getting the lesson ready/.test(st.dom?.bodyText ?? "")) break; await sleep(1000); }
  for (let i = 0; i < turns; i++) {
    const text = TEXTS[i % TEXTS.length];
    const r = await rv({ op: "say", sid, text, ms: clipMs });
    const tl = r.tl ?? {};
    const net = await rv({ op: "eval", sid, js: "(() => { const t = window.__rv.net.filter((n) => /\\/api\\/lesson\\/turn$/.test(n.path)).at(-1); try { return JSON.parse(t.body).duplex ?? null; } catch { return null; } })()" });
    const row = { i, said: text, duplex: net && { reasons: net.engineSummary?.reasons ?? null, decidedAfterEndMs: net.engineSummary?.decidedAfterEndMs ?? null }, sent: tl.sent ?? null, whole: !!tl.sent && tl.sent.trim() === text, truncated: !!tl.sent && tl.sent.trim() !== text, sttItems: tl.sttItems, probesInUtterance: tl.earlyCommits,
      endToFinal: tl.endToFinal, endToTurnPost: tl.endToTurnPost, finalToPost: tl.endToTurnPost != null && tl.endToFinal != null ? tl.endToTurnPost - tl.endToFinal : null,
      prefetch: tl.prefetch, ackStatus: tl.ackStatus, endToAckDone: tl.endToAck, decideToPost: net?.engineSummary?.decidedAfterEndMs != null && tl.endToTurnPost != null ? tl.endToTurnPost - net.engineSummary.decidedAfterEndMs : null, endToReplySound: tl.endToReplySound, reply: (r.last?.reply ?? "").slice(0, 120), got: r.got };
    rows.push(row);
    console.log(JSON.stringify(row));
    if (r.last?.end) break;
  }
} finally {
  await rv({ op: "quit" }).catch(() => {});
  drv.kill();
}
const q = (a, p) => { const z = a.filter((x) => x != null).sort((x, y) => x - y); return z.length ? z[Math.min(z.length - 1, Math.floor((z.length - 1) * p))] : null; };
const sum = { label, clip: path.basename(clip), clipMs, n: rows.length, truncated: rows.filter((r) => r.truncated).length, noTurn: rows.filter((r) => !r.got).length,
  endToTurnPost: { p50: q(rows.map((r) => r.endToTurnPost), 0.5), p90: q(rows.map((r) => r.endToTurnPost), 0.9) }, finalToPost: { p50: q(rows.map((r) => r.finalToPost), 0.5) },
  prefetched: rows.filter((r) => (r.prefetch ?? []).length).length,
  decidedAfterEnd: { p50: q(rows.map((r) => r.duplex?.decidedAfterEndMs), 0.5), p90: q(rows.map((r) => r.duplex?.decidedAfterEndMs), 0.9) },
  decideToPost: { p50: q(rows.map((r) => r.decideToPost), 0.5), p90: q(rows.map((r) => r.decideToPost), 0.9) },
  byReason: rows.reduce((a, r) => { const k = r.duplex?.reasons?.[0] ?? "none"; a[k] = (a[k] ?? 0) + 1; return a; }, {}),
  note: "LOCAL production build, owner-cohort TEST child (hands-free), synthetic child-like TTS clip (not a child), fake ASR with FIXED 750 ms commit->final (driver.mjs + duplex patch 01)" };
console.log(JSON.stringify(sum));
if (out) fs.writeFileSync(out, JSON.stringify({ ...sum, rows }, null, 1));
