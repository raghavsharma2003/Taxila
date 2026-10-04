// W1-A acceptance (BUILD-PLAN §3 W1-A item 10; smooth G4): the text lane's voice. After each /turn response the client
// asks /api/voice/tts-stream for the stored reply (src/lesson/textLink.ts); /turn prewarmed it (x-tts-prewarmed-ms).
// Bar: first teacher audio byte within 400 ms of the turn response, p50, n ≥ 20 — a TIMING gate, so it is enforced only
// from the Azure probe fleet (TAXILA_PROBE=1; BUILD-PLAN §1.7, b4-rejected-perf-with-route-interception). From the
// sandbox it checks correctness (audio streams for every reply, prewarm hits) and reports the numbers.
//   NODE_USE_ENV_PROXY=1 node tests/prod/w1a-text-voice.mjs [--n 20]        (TAXILA_BASE for a local server)
import { withTestAccount, ok, warn, done, BASE } from "./lib.mjs";
// Self-contained (only ./lib.mjs, no server code), so the probe image can run it: infra/probes/Dockerfile copies
// tests/prod/lib.mjs and the files listed there, and `deploy.mjs --adhoc "node tests/prod/w1a-text-voice.mjs"` runs it.

/** Typed turns for one lesson (the same body as _w1a.mjs turner, inlined to keep server imports out of the probe image). */
function turner(api, lessonId) {
  let seq = 0;
  return { say: (childText) => api("POST", "/api/lesson/turn", { lessonId, typed: true, asrConfidence: 0.95, turnSeq: ++seq, childText }) };
}

const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d; };
const N = Number(arg("--n", "20"));
const PROBE = process.env.TAXILA_PROBE === "1";
const LINES = ["haan", "7", "pata nahi", "12", "mujhe lagta hai 100", "yes"];

await withTestAccount(async ({ api, child }) => {
  const firstByte = async (lessonId, seq) => {
    for (let attempt = 0; attempt < 3; attempt++) {
      const t0 = performance.now();
      const res = await fetch(`${BASE}/api/voice/tts-stream`, { method: "POST", headers: { "content-type": "application/json", cookie: api.cookie() }, body: JSON.stringify({ lessonId, seq }) });
      if (res.status === 429) { await new Promise((r) => setTimeout(r, 15_000)); continue; }
      if (!res.ok || !res.body) return { status: res.status };
      const reader = res.body.getReader();
      const { value } = await reader.read();
      const ms = Math.round(performance.now() - t0);
      let bytes = value?.length ?? 0;
      for (;;) { const { done: d, value: v } = await reader.read(); if (d) break; bytes += v.length; }
      return { status: res.status, ms, bytes, prewarmed: res.headers.get("x-tts-prewarmed-ms") };
    }
    return { status: 429 };
  };
  const out = [];
  let lessons = 0;
  while (out.length < N) {
    let s;
    try { s = await api("POST", "/api/lesson/start", { childId: child.id, mode: "text" }); }
    catch (e) { if (e.status !== 409) throw e; s = await api("POST", "/api/lesson/start", { childId: child.id, mode: "text", purpose: "practice" }); }
    lessons += 1;
    const t = turner(api, s.lessonId);
    for (let i = 0; out.length < N; i++) {
      const r = await t.say(LINES[i % LINES.length]);
      if (!r.teacherReplySeq) { if (r.end) break; continue; }
      const fb = await firstByte(s.lessonId, r.teacherReplySeq);
      out.push(fb);
      if (r.end) break;
    }
    await api("POST", "/api/lesson/end", { lessonId: s.lessonId }).catch(() => {});
  }
  const okOnes = out.filter((x) => x.status === 200 && x.bytes > 0);
  ok(okOnes.length === out.length, `audio streamed for ${okOnes.length}/${out.length} text-lane replies (${lessons} lesson(s))`);
  const hits = okOnes.filter((x) => x.prewarmed != null).length;
  ok(hits > 0, `the turn prewarmed the text-lane reply (${hits}/${okOnes.length} hits on x-tts-prewarmed-ms)`);
  const ms = okOnes.map((x) => x.ms).sort((a, b) => a - b);
  const p50 = ms[Math.floor(ms.length / 2)], p90 = ms[Math.floor(ms.length * 0.9)];
  console.log(`first audio byte after the turn response: p50 ${p50} ms, p90 ${p90} ms, n = ${ms.length}`);
  if (PROBE) ok(ms.length >= 20 && p50 <= 400, `p50 ${p50} ms ≤ 400 ms (n = ${ms.length}, probe)`);
  else warn(`timing bar (p50 ≤ 400 ms) is enforced only from the Azure probe (TAXILA_PROBE=1); measured here: p50 ${p50} ms`);
}, { tag: "w1a-tv" });
done();
