// K1 latency bar (main session 2026-10-10): the Kaksha Desk adds no latency to the turn. Drives the r4-timeline driver
// (tests/prod/r4-timeline, a LOCAL production build on real Azure models and the stream's own Neon TEST branch, a fake
// 750 ms ASR, a synthetic child clip: not a child) through four interleaved arms, n turns each:
//   kaksha on / off  ×  puppet on / off      (the device switches ?ui=kaksha|classic and ?puppet=1|0)
// Per turn, on the page clock (driver timeline()):
//   endToTurnPost  end of the child's speech → POST /api/lesson/turn leaves the page   (the client path the skin could slow)
//   turnMs         the POST's own duration                                            (server; the skin cannot touch it)
//   endToReply     end of speech → her reply's first sound
// Run (servers + driver as tests/prod/r4-timeline/README.md, with TAXILA_UI_KAKSHA naming the owner TEST account):
//   node tests/prod/r4-kaksha-latency.mjs [turnsPerArm=12] [account=owner] [child=meher]
// Writes docs/design/round4/build/kaksha/latency-k1.json. At most ONE lesson runs at a time (shared Azure quota ≤ 4).
import fs from "node:fs";
import path from "node:path";

const ROOT = new URL("../..", import.meta.url).pathname;
const N = Number(process.argv[2] || 12);
const ACCT = process.argv[3] || "owner";
const KID = process.argv[4] || "meher";
const all = JSON.parse(fs.readFileSync(path.join(ROOT, "tests/prod/r4-timeline/run/accounts.json"), "utf8"));
const cookie = all[ACCT].cookie, cid = all[ACCT].children[KID];
const cmd = async (c) => {
  const r = await fetch("http://127.0.0.1:5199/", { method: "POST", body: JSON.stringify(c), signal: AbortSignal.timeout(240_000) });
  return r.json();
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const ARMS = [
  { id: "kaksha-puppet", ui: "kaksha", puppet: 1 }, { id: "classic-puppet", ui: "classic", puppet: 1 },
  { id: "kaksha-still", ui: "kaksha", puppet: 0 }, { id: "classic-still", ui: "classic", puppet: 0 },
];
const SAYS = ["do", "mujhe lagta hai do quarters", "haan samajh gaya", "ek half", "teen", "pata nahi", "haan theek hai", "chaar", "do quarters milke ek half", "haan"];
const rows = Object.fromEntries(ARMS.map((a) => [a.id, []]));
const proof = {};
let round = 0;

async function lesson(arm) {
  const sid = `k1-${arm.id}-${round}`;
  // straight into a lesson (a fresh device would otherwise meet the first-time hello); the audio unlock is one tap
  await cmd({ op: "open", sid, cookie, url: `/c/${cid}/lesson/new?ui=${arm.ui}&puppet=${arm.puppet}`, view: "phone360" });
  for (let i = 0; i < 60; i++) {
    const st = await cmd({ op: "state", sid });
    if (st?.dom?.tapToHear) await cmd({ op: "click", sid, sel: '[data-testid="tap-to-hear"]', after: 800 });
    else if (st?.dom?.mic && !st.dom.mic.dis && st.turns >= 1) break;
    await sleep(1000);
  }
  proof[arm.id] ??= await cmd({ op: "eval", sid, js: "({ skin: document.querySelector('[data-testid=\"lesson\"]')?.getAttribute('data-skin') ?? null, frame: !!document.querySelector('.kx-lesson'), puppet: !!document.querySelector('[data-face=\"puppet2d\"]'), url: location.pathname })" });
  let got = 0;
  for (let t = 0; t < 6 && rows[arm.id].length < N; t++) {
    const r = await cmd({ op: "say", sid, text: SAYS[(round * 3 + t) % SAYS.length] });
    const tl = r?.tl;
    if (tl && tl.turnStatus === 200 && tl.endToTurnPost != null) {
      rows[arm.id].push({ round, t, endToTurnPost: tl.endToTurnPost, turnMs: tl.turnMs, endToReply: tl.endToReplySound, mode: tl.mode });
      got++;
    }
    if (r?.last?.end) break;
  }
  await cmd({ op: "close", sid });
  return got;
}

while (ARMS.some((a) => rows[a.id].length < N) && round < 8) {
  // rotate the order every round so drift in the shared models lands on every arm alike
  const order = ARMS.map((_, i) => ARMS[(i + round) % ARMS.length]);
  for (const arm of order) if (rows[arm.id].length < N) console.log(`round ${round} ${arm.id}: +${await lesson(arm)} (${rows[arm.id].length}/${N})`);
  round++;
}

const q = (xs, p) => { const s = xs.filter((x) => x != null).sort((a, b) => a - b); return s.length ? s[Math.min(s.length - 1, Math.floor(p * (s.length - 1) + 0.5))] : null; };
const sum = Object.fromEntries(ARMS.map((a) => {
  const r = rows[a.id];
  const stat = (k) => ({ p50: q(r.map((x) => x[k]), 0.5), p90: q(r.map((x) => x[k]), 0.9) });
  return [a.id, { n: r.length, endToTurnPost: stat("endToTurnPost"), turnMs: stat("turnMs"), endToReply: stat("endToReply") }];
}));
const out = { date: new Date().toISOString().slice(0, 10), method: "r4-timeline driver, local production build, real Azure models, Neon TEST (stream branch), fixed 750 ms fake ASR, synthetic child clip; arms interleaved by round; not a child, not a phone", turnsPerArm: N, proof, summary: sum, rows };
fs.writeFileSync(path.join(ROOT, "docs/design/round4/build/kaksha/latency-k1.json"), JSON.stringify(out, null, 1));
console.log(JSON.stringify({ proof, summary: sum }, null, 1));
