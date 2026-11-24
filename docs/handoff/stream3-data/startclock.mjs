// page clock: lesson start -> her first sound, per stage. Opens /c/{cid}/lesson/new (plain account), clicks "tap to hear"
// the moment it shows, then reads the page's own timeline: start POST, tts-stream request/first byte, first audio scheduled.
import { execFileSync } from "node:child_process";
const N = Number(process.argv[2] || 20), PREFIX = process.argv[3] || "st";
const cmd = async (c) => (await fetch("http://127.0.0.1:5199/", { method: "POST", body: JSON.stringify(c) })).json();
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
for (let i = 0; i < N; i++) {
  const sid = `${PREFIX}${i}`;
  const open = JSON.parse(execFileSync("node", ["openchild.mjs", "plain", "kabir", sid, "phone360", "/c/{cid}/lesson/new"], { cwd: "/home/user/Taxila/tests/prod/r4-timeline", encoding: "utf8" }));
  await cmd(open);
  let clicked = null;
  try { await cmd({ op: "click", sid, sel: '[data-testid="tap-to-hear"]', timeout: 30000, after: 0 }); clicked = await cmd({ op: "eval", sid, js: "performance.now()" }); } catch { /* no gate */ }
  let tl = null;
  for (let k = 0; k < 60; k++) { await sleep(250); tl = await cmd({ op: "timeline", sid }); if (tl.audio?.length) break; }
  const start = tl.net.find((n) => /\/api\/lesson\/start$/.test(n.path));
  const tts = tl.net.find((n) => /tts-stream$/.test(n.path) && start && n.t0 >= start.t0);
  const audio = tl.audio?.[0] ?? null;
  const r = (x) => (x == null ? null : Math.round(x));
  console.log(JSON.stringify({ i, startMs: start?.t1 ? r(start.t1 - start.t0) : null, gateClickAfterStart: clicked != null && start?.t1 ? r(clicked - start.t1) : null,
    ttsReqAfterStart: tts && start?.t1 ? r(tts.t0 - start.t1) : null, ttsHeaders: tts?.t1 ? r(tts.t1 - tts.t0) : null,
    firstSoundAfterStartReq: audio && start ? r(audio.t - start.t0) : null, firstSoundAfterTts: audio && tts ? r(audio.t - tts.t0) : null, status: start?.status ?? null }));
  await cmd({ op: "close", sid });
}
