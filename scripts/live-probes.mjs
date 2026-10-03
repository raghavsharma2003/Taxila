// Production probes that cost nothing (no model call): run by scripts/verify-release.mjs --live <base-url>.
//   NODE_USE_ENV_PROXY=1 node scripts/live-probes.mjs <base-url>
// A 200 is not enough: each probe checks the body says what it should. The auth fences are probed because
// a child's lesson, voice and parent data must never answer an unauthenticated request.
const BASE = (process.argv[2] || "").replace(/\/$/, "");
if (!/^https?:\/\//.test(BASE)) { console.error("usage: live-probes.mjs <base-url>"); process.exit(2); }

let failed = 0;
const ok = (c, m) => { console.log(`${c ? "PASS" : "FAIL"} ${m}`); if (!c) failed++; };
async function probe(name, method, path, body, check) {
  const t0 = performance.now();
  try {
    const r = await fetch(BASE + path, { method, headers: body ? { "content-type": "application/json" } : {}, body: body ? JSON.stringify(body) : undefined, signal: AbortSignal.timeout(20_000) });
    const text = await r.text();
    let j = {}; try { j = JSON.parse(text); } catch { /* html */ }
    const why = check(r, j, text);
    ok(why === true, `${name} · ${r.status} · ${Math.round(performance.now() - t0)} ms${why === true ? "" : ` · ${why}`}`);
  } catch (e) {
    ok(false, `${name} · ${e.message}`);
  }
}

await probe("health", "GET", "/api/health", null, (r, j) => (r.status === 200 && j.ok === true ? true : `body ${JSON.stringify(j).slice(0, 120)}`));
await probe("health reaches the database", "GET", "/api/health?db=1", null, (r, j) => (r.status === 200 && Array.isArray(j.dbMs) && j.dbMs.length === 5 ? true : `no dbMs: ${JSON.stringify(j).slice(0, 120)}`));
await probe("app shell serves", "GET", "/", null, (r, _j, t) => (r.status === 200 && /<div id="root"|<html/i.test(t) ? true : "no app shell"));
for (const [method, path, body] of [
  ["POST", "/api/lesson/turn", { lessonId: "00000000-0000-0000-0000-000000000000", childText: "hi" }],
  ["POST", "/api/lesson/start", { childId: "00000000-0000-0000-0000-000000000000" }],
  ["POST", "/api/tts", { lessonId: "00000000-0000-0000-0000-000000000000", seq: 1 }],
  ["POST", "/api/realtime/token", { lessonId: "00000000-0000-0000-0000-000000000000" }],
  ["GET", "/api/parent/overview?childId=00000000-0000-0000-0000-000000000000", null],
  ["GET", "/api/me", null],
]) {
  // Without a session nothing may answer 2xx. A random lesson id may come back 404 "lesson not found" (the lesson
  // routes look the lesson up before the session: an existence oracle on an unguessable uuid, logged as open).
  await probe(`auth fence ${method} ${path.split("?")[0]}`, method, path, body, (r, j) => (r.status === 401 || (r.status === 404 && /lesson not found/.test(j.error ?? ""))
    ? true : `expected 401 (or 404 for an unknown lesson) without a session, got ${r.status} ${JSON.stringify(j).slice(0, 80)}`));
}
await probe("unknown route is a JSON 404", "GET", "/api/no-such-route", null, (r, j) => (r.status === 404 && typeof j.error === "string" ? true : `got ${r.status}`));

console.log(failed ? `\n${failed} live probe(s) FAILED` : "\nlive probes: PASS");
process.exitCode = failed ? 1 : 0;
