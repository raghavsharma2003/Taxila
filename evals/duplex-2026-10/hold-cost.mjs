// Round 5 verdict hold (dc-r5-verdict-hold-2500, main's 14.4 gate): what the hold costs her FIRST SOUND at today's R, on
// closed-value turns the live D5 ear actually committed. Two halves, paired per turn:
//   the ear    arms-d5 runs (live Voice Live, owner variant) record each commit's verdictHoldUntil on the engine clock
//              (evals/duplex-real/lib.mjs: [t, "commit", text, reason, holdUntil]); gap = holdUntil − commit time
//   R          the same committed words as a REAL turn against the in-process API on the stream's TEST database (Azure
//              models, no stub): a kit item with a number key is posed, POST /api/lesson/turn with the ear's words, then
//              POST /api/voice/tts-stream timed to the first PCM byte; R = turn + first byte + the player's 60 ms lead + a
//              NOMINAL 50 ms device output latency (cascade-latency.mjs's convention: commit → her first audible word)
//   cost       added = max(0, gap − R): how much later her verdict sounds because of the hold; held = added > 0
// The sandbox is not a child's phone in India: R here is the eval host's (Neon over HTTP from the sandbox, loopback TTS).
//   NODE_USE_ENV_PROXY=1 node --env-file=.env.local evals/duplex-2026-10/hold-cost.mjs --bake <dir> --arms hc1,hc2 [--variant owner] [--out f.json]
import fs from "node:fs";
import path from "node:path";
import http from "node:http";

const arg = (n, d) => { const i = process.argv.indexOf(n); return i > 0 ? process.argv[i + 1] : d; };
const BAKE = arg("--bake"), ARMS = arg("--arms", "hc1").split(","), VAR = arg("--variant", "owner"), OUT = arg("--out");
const TOPIC = arg("--topic", "c3-maths-ch08-t01");
const START_LEAD_MS = 60, OUTPUT_LATENCY_MS = 50;

// the stream's own database only (TEST branch): refuse anything else
const host = (() => { try { return new URL(process.env.DATABASE_URL).hostname; } catch { return ""; } })();
if (process.env.TAXILA_DB !== "test" || !host) throw new Error("hold-cost runs on the stream's TEST database only (TAXILA_DB=test)");

// ───────────── the ear: committed closed-value turns and their holds ─────────────
const turns = [];
for (const arm of ARMS) {
  for (const f of fs.readdirSync(path.join(BAKE, "runs")).filter((x) => x.startsWith(`${arm}.${VAR}.`))) {
    const run = JSON.parse(fs.readFileSync(path.join(BAKE, "runs", f), "utf8"));
    const meta = JSON.parse(fs.readFileSync(path.join(BAKE, `${run.id}.json`), "utf8"));
    for (const a of run.acts.filter((x) => x[1] === "commit")) {
      turns.push({ id: run.id, arm, sub: meta.sub, form: meta.ctx?.expected?.form ?? null, text: String(a[2] ?? ""), commitT: a[0],
        holdUntil: a[4] ?? null, gap: typeof a[4] === "number" ? Math.round(a[4] - a[0]) : null });
    }
  }
}
const valued = turns.filter((t) => t.text.trim());
console.log(`ear: ${turns.length} commits (${valued.length} with words), ${turns.filter((t) => t.gap !== null).length} carrying a verdict hold`);

// ───────────── R: the same words as a real turn ─────────────
const { handle } = await import("../../server/index.js");
const { promptFor } = await import("../../server/director/items.js");
const { kitFor } = await import("../../server/brain/rows.js");
const { q } = await import("../../server/db.js");
const server = http.createServer(handle);
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const base = `http://127.0.0.1:${server.address().port}`;
let cookie = "";
async function api(method, p, body, expect = [200, 201]) {
  const res = await fetch(base + p, { method, headers: { "content-type": "application/json", ...(cookie ? { cookie } : {}) }, body: body ? JSON.stringify(body) : undefined });
  const set = res.headers.get("set-cookie");
  if (set) cookie = set.split(";")[0];
  const j = await res.json().catch(() => ({}));
  if (!expect.includes(res.status)) throw new Error(`${method} ${p} → ${res.status} ${JSON.stringify(j).slice(0, 300)}`);
  return j;
}
async function firstByte(lessonId, seq) {
  const t0 = performance.now();
  const res = await fetch(base + "/api/voice/tts-stream", { method: "POST", headers: { "content-type": "application/json", cookie }, body: JSON.stringify({ lessonId, seq }) });
  if (!res.ok) throw new Error(`tts-stream ${res.status}`);
  const reader = res.body.getReader();
  let first = 0;
  for (;;) { const { done } = await reader.read(); if (!first) first = performance.now(); if (done) break; }
  return first - t0;
}

const kit = await kitFor(TOPIC, {});
const items = kit.items.filter((i) => /^\d+$/.test(String(i.answer ?? "").trim()));
const st = Date.now(), password = `hc-pw-${st}`;
await api("POST", "/api/auth/signup", { email: `hold-cost+${st}@taxila.test`, password, name: "HoldCost", isGuardianAdult: true });
const { child } = await api("POST", "/api/children", { firstName: "Riya", classLevel: 3, languagePref: "hinglish", interests: ["cricket"] });
await api("POST", "/api/consent", { childId: child.id, grants: { core_tutoring: true, learning_profile: true, memory: true } });
await q(`insert into child_controls (child_id, daily_minutes, hours_start, hours_end) values ($1, 45, '00:00', '23:59')
  on conflict (child_id) do update set hours_start = '00:00', hours_end = '23:59', daily_minutes = 45`, [child.id]);
const rows = [];
let lesson = null, inLesson = 0;
try {
  for (const [k, t] of valued.entries()) {
    // a fresh lesson every 8 turns (a long lesson wraps up; the turn must stay a closed-value check)
    if (!lesson || inLesson >= 8) {
      const s = await api("POST", "/api/lesson/start", { childId: child.id, mode: "cascade", topicId: TOPIC, purpose: "practice" });
      lesson = s.lessonId; inLesson = 0;
      await firstByte(lesson, s.teacherOpeningSeq).catch(() => 0); // warm, outside the window
    }
    const item = items[k % items.length];
    await q("update lesson set state = state || jsonb_build_object('activeItemId', $2::text, 'hintLevel', 0, 'phase', 'practice') - 'pendingWhy' where id = $1", [lesson, item.id]);
    const t0 = performance.now();
    const r = await api("POST", "/api/lesson/turn", { lessonId: lesson, childText: t.text, teacherText: promptFor(item, "hinglish"), asrConfidence: 0.9 });
    const director = performance.now() - t0;
    inLesson++;
    if (!r.teacherReplySeq) { console.log(`  ${t.id}: no reply (${r.move?.kind})`); continue; }
    const tts = await firstByte(lesson, r.teacherReplySeq);
    const R = Math.round(director + tts) + START_LEAD_MS + OUTPUT_LATENCY_MS;
    const added = t.gap === null ? 0 : Math.max(0, t.gap - R);
    rows.push({ ...t, move: r.move?.kind ?? null, director: Math.round(director), tts: Math.round(tts), R, added, held: added > 0 });
    console.log(`  ${t.arm} ${t.id} "${t.text.slice(0, 40)}" gap=${t.gap ?? "-"} R=${R} (director ${Math.round(director)} + tts ${Math.round(tts)}) added=${added} ${r.move?.kind}`);
  }
} finally {
  await api("DELETE", "/api/children", { childId: child.id, password }).catch((e) => console.log(`could not delete the test child: ${e.message}`));
  server.close();
}

const pct = (xs, p) => { const s = [...xs].sort((a, b) => a - b); return s.length ? s[Math.min(s.length - 1, Math.floor((p / 100) * s.length))] : null; };
const withHold = rows.filter((x) => x.gap !== null);
const summary = {
  turns: rows.length, withHold: withHold.length, held: rows.filter((x) => x.held).length,
  R: { p50: pct(rows.map((x) => x.R), 50), p90: pct(rows.map((x) => x.R), 90) },
  RwithHold: { p50: pct(withHold.map((x) => x.R), 50), p90: pct(withHold.map((x) => x.R), 90) },
  gap: { p50: pct(withHold.map((x) => x.gap), 50), p90: pct(withHold.map((x) => x.gap), 90), max: Math.max(...withHold.map((x) => x.gap)) },
  added: { p50: pct(rows.map((x) => x.added), 50), p90: pct(rows.map((x) => x.added), 90), max: Math.max(0, ...rows.map((x) => x.added)) },
  // the curve main decides G from: the added first-sound p50 / p90 if R were faster, on the same gaps
  curve: [1000, 1250, 1500, 1750, 2000, 2250, 2500, 2700].map((Rm) => ({ R: Rm, p50: pct(withHold.map((x) => Math.max(0, x.gap - Rm)), 50), p90: pct(withHold.map((x) => Math.max(0, x.gap - Rm)), 90) })),
};
console.log(JSON.stringify(summary, null, 1));
if (OUT) fs.writeFileSync(OUT, JSON.stringify({ method: { date: new Date().toISOString().slice(0, 10), arms: ARMS, variant: VAR, topic: TOPIC, note: "ear: live Voice Live (D5) on the owner recordings, closed-value scenarios (no self-repair); R: real /api/lesson/turn + tts-stream first byte from the sandbox + 60 ms lead + 50 ms nominal output; added = max(0, holdUntil - commit - R)" }, summary, rows }, null, 1));
process.exit(0);
