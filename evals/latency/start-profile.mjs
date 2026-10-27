// Round 5, stream 3 (latency): where a lesson START's time goes, stage by stage, on the real server code against the Neon
// TEST branch and real Azure (production model routing from tests/prod/prod-routing.env).
//   - POST /api/lesson/start on a FRESH child each time (a first lesson, the owner's case), cascade mode, the stage marks
//     (server/routes/lesson.js `mark`) and every model call from the debug response's `timings`;
//   - then POST /api/voice/tts-stream for the opening's seq (framed, as the phone asks): first PCM byte = her first sound
//     on the server's side (+ the device's player lead, not modelled here).
//
//   node evals/latency/start-profile.mjs [--n 10] [--out file.json] [--class 4] [--gap 1500] [--label text]
// In-process server (the router's handle on a local port), US container: the absolute numbers carry this host's RTT to
// eastus2 / southindia and to Neon; the STAGE SHAPE (what runs serially behind what) is the finding.
import http from "node:http";
import fs from "node:fs";
import { createHash, randomUUID } from "node:crypto";

const REPO = new URL("../..", import.meta.url).pathname;
const argv = process.argv;
const arg = (k, d) => { const i = argv.indexOf(k); return i > 0 ? argv[i + 1] : d; };
const N = Number(arg("--n", 10)), CLASS = Number(arg("--class", 4)), GAP = Number(arg("--gap", 1500)), OUT = arg("--out"), LABEL = arg("--label", "");
const envFile = (f) => { for (const line of fs.readFileSync(f, "utf8").split("\n")) { const m = line.match(/^([A-Z0-9_]+)=(.*)$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^"(.*)"$/, "$1"); } };
envFile(REPO + ".env.local");
// production's model routing wins over .env.local (tests/prod/prod-routing.env says so)
for (const line of fs.readFileSync(REPO + "tests/prod/prod-routing.env", "utf8").split("\n")) { const m = line.match(/^([A-Z0-9_]+)=(.*)$/); if (m) process.env[m[1]] = m[2]; }
process.env.TAXILA_DB = "test";
process.env.TAXILA_DEBUG = "1";

const { handle } = await import(REPO + "server/index.js");
const { q, one } = await import(REPO + "server/db.js");
const { hashPassword } = await import(REPO + "server/auth.js");
// as server/serve.mjs boots (--no-warm: as before round 5)
if (!argv.includes("--no-warm")) { const { warmSync, warmAsync } = await import(REPO + "server/boot-warm.js"); console.log("[warm]", JSON.stringify(await warmSync()), JSON.stringify(await warmAsync())); }
const server = http.createServer(handle);
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const BASE = `http://127.0.0.1:${server.address().port}`;
const RUN = randomUUID().slice(0, 8);

const email = `r5-start+${RUN}@test.invalid`;
const g = (await one("insert into guardian (email, pw_hash, name) values ($1, $2, 'r5 start') returning id", [email, hashPassword("pw-" + RUN)])).id;
const tok = randomUUID() + randomUUID();
await q("insert into auth_session (token_hash, guardian_id, expires_at) values ($1, $2, now() + interval '1 day')", [createHash("sha256").update(tok).digest("hex"), g]);
for (const p of ["core_tutoring", "memory", "learning_profile"]) await q("insert into consent (guardian_id, child_id, purpose, version, granted, method) values ($1, null, $2, 't', true, 't')", [g, p]);
const cookie = `tx_session=${tok}`;

const pct = (a, p) => { const s = [...a].sort((x, y) => x - y); return s.length ? s[Math.min(s.length - 1, Math.floor(p * s.length))] : null; };
const rows = [];
try {
  for (let i = 0; i < N; i++) {
    const kid = (await one("insert into child (guardian_id, first_name, class_level, language_pref, teacher_id) values ($1, $2, $3, 'hinglish', 'asha') returning id", [g, ["Riya", "Aarav", "Meera", "Kabir"][i % 4], CLASS])).id;
    await q(`insert into child_controls (child_id, daily_minutes, hours_start, hours_end) values ($1, 45, '00:00', '23:59')
      on conflict (child_id) do update set hours_start = '00:00', hours_end = '23:59', daily_minutes = 45`, [kid]);
    const t0 = performance.now();
    const r = await fetch(`${BASE}/api/lesson/start`, { method: "POST", headers: { cookie, "content-type": "application/json" }, body: JSON.stringify({ childId: kid, mode: "cascade" }) });
    const startMs = performance.now() - t0;
    const j = await r.json();
    if (r.status !== 201) { console.log(`[${i}] start ${r.status} ${JSON.stringify(j).slice(0, 200)}`); continue; }
    // her opening, as the phone asks for it (framed TTS v2)
    const t1 = performance.now();
    const a = await fetch(`${BASE}/api/voice/tts-stream`, { method: "POST", headers: { cookie, "content-type": "application/json", accept: "application/x-taxila-pcm-frames; v=2" },
      body: JSON.stringify({ lessonId: j.lessonId, seq: j.teacherOpeningSeq }) });
    const reader = a.body.getReader();
    let firstByte = null;
    for (;;) { const { done, value } = await reader.read(); if (firstByte == null && value?.length) firstByte = performance.now() - t1; if (done) break; }
    const marks = Object.fromEntries((j.debug?.timings ?? []).filter((t) => String(t.kind).startsWith("@")).map((t) => [t.kind.slice(1), t.ms]));
    const models = (j.debug?.timings ?? []).filter((t) => !String(t.kind).startsWith("@")).map((t) => ({ kind: t.kind, deployment: t.deployment, ms: t.ms, status: t.status, attempt: t.attempt ?? 0, ttft: t.ttft ?? null }));
    const row = { i, outsideMs: Math.round(startMs - (marks.respond ?? 0)), startMs: Math.round(startMs), ttsFirstMs: Math.round(firstByte ?? -1), startToSoundMs: Math.round(startMs + (firstByte ?? 0)),
      engine: a.headers.get("x-tts-engine") ?? "oai", prewarmedMs: Number(a.headers.get("x-tts-prewarmed-ms") ?? NaN), marks, models, move: j.debug?.move?.kind ?? null };
    rows.push(row);
    console.log(`[${i}] start ${row.startMs} ms (outside the handler ${row.outsideMs}), tts first ${row.ttsFirstMs} ms → ${row.startToSoundMs} ms | ${Object.entries(marks).map(([k, v]) => `${k}@${v}`).join(" ")} | ${models.map((m) => `${m.deployment}:${m.ms}`).join(" ")}`);
    await new Promise((res) => setTimeout(res, GAP));
  }
} finally {
  await q("delete from guardian where id = $1", [g]).catch(() => {});
  server.close();
}
const col = (f) => rows.map(f).filter((x) => Number.isFinite(x));
const summary = { label: LABEL, n: rows.length, at: new Date().toISOString(),
  start: { p50: pct(col((r) => r.startMs), 0.5), p90: pct(col((r) => r.startMs), 0.9) },
  ttsFirst: { p50: pct(col((r) => r.ttsFirstMs), 0.5), p90: pct(col((r) => r.ttsFirstMs), 0.9) },
  startToSound: { p50: pct(col((r) => r.startToSoundMs), 0.5), p90: pct(col((r) => r.startToSoundMs), 0.9) } };
// stage deltas: each mark minus the previous one
const order = ["auth", "reads1", "topic", "plan", "kit", "reads2", "warmup", "reads3", "state", "opening", "tx", "respond"];
summary.stages = Object.fromEntries(order.map((k, ix) => [k, pct(col((r) => (r.marks[k] ?? NaN) - (ix ? r.marks[order[ix - 1]] ?? NaN : 0)), 0.5)]));
summary.outside = pct(col((r) => r.startMs - (r.marks.respond ?? NaN)), 0.5); // before the handler + the response on the wire
console.log(JSON.stringify(summary, null, 1));
if (OUT) fs.writeFileSync(OUT, JSON.stringify({ summary, rows }, null, 1));
process.exit(0);
