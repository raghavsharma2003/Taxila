// Run by tests/ship5-review-filter-face-db.test.mjs in its OWN process (adversarial review of the ship5 integration,
// 2026-10-06). Real API in-process + the Neon TEST branch; every Azure call is answered by a local fake (no model spend).
//
// Claim under test (policy.ts R6, latch.ts, relational/affect.js TA8): a safeguarding turn reaches the face as the
// calm_steady display, so the 2D puppet drops its resting warm smile while the helplines are spoken. The face reads
// ONLY ui.teacherAffect (src/face-puppet/stage.ts onCue → driver.safetyTurn; latch.ts). On the text / cascade lanes a
// reply blocked by the content filter re-plans the turn as a safeguard (brain/turn.js "fail CLOSED"), but the
// relational directive was decided BEFORE that re-plan and is never recomputed, so the safeguard turn's ui carries the
// pre-filter affect (none, or a happy one), not calm_steady. Seen live: owner-5 2026-10-06 (Zoya, "mummy bula rahi thi
// haan"): turn 2 move=safeguard with no teacherAffect; turn 3 (the same episode) carries calm_steady.
import { after, before, describe, test } from "node:test";
import assert from "node:assert/strict";
import http from "http";
import { existsSync, readFileSync } from "fs";
import { createHash, randomUUID } from "crypto";

const envFile = new URL("../.env.local", import.meta.url);
const fromEnvFile = (name) => (existsSync(envFile) ? (readFileSync(envFile, "utf8").split("\n").find((l) => l.startsWith(name + "=")) || "").slice(name.length + 1).replace(/^"(.*)"$/, "$1") : "");
const hostOf = (u) => { try { return new URL(u).hostname.replace(/-pooler\./, "."); } catch { return ""; } };
const TEST = process.env.CONDUCTOR_TEST_DATABASE_URL || fromEnvFile("CONDUCTOR_TEST_DATABASE_URL");
const PROD = process.env.DATABASE_URL || fromEnvFile("DATABASE_URL");
const SKIP = !TEST ? "CONDUCTOR_TEST_DATABASE_URL not set" : PROD && hostOf(TEST) === hostOf(PROD) ? "CONDUCTOR_TEST_DATABASE_URL is the PRODUCTION endpoint: refusing" : false;
const RUN = randomUUID().slice(0, 8);

// ── the fake Azure: JSON-schema calls get a safe, non-distress classification; plain replies get a line, or the filter ──
let filterReplies = false;
const realFetch = globalThis.fetch;
const SAFE_CLS = { match: "other_wrong", reason: "none", confidence: 0.9, off_topic: false, distress: false, asks_for_answer: false, wants_to_stop: false };
function fakeAzure(url, init) {
  let body = {};
  try { body = JSON.parse(String(init?.body ?? "{}")); } catch { /* binary */ }
  const json = !!(body.response_format || body.text?.format);
  if (!json && filterReplies) {
    return new Response(JSON.stringify({ error: { code: "content_filter", message: "The response was filtered due to the prompt triggering Azure OpenAI's content management policy.", innererror: { code: "ResponsibleAIPolicyViolation" } } }), { status: 400 });
  }
  const content = json ? JSON.stringify(SAFE_CLS) : "Achha, chalo dekhte hain. Paani dhoop mein kya karta hai?";
  return new Response(JSON.stringify({ choices: [{ finish_reason: "stop", message: { content } }], output_text: content, usage: { prompt_tokens: 10, completion_tokens: 10 } }), { status: 200 });
}

describe("ship5 review: content-filter safeguard reaches the face as calm_steady (test branch)", { skip: SKIP, concurrency: false, timeout: 200_000 }, () => {
  let server, base, q, one, guardian, kid, token;
  const call = async (path, { method = "GET", body } = {}) => {
    const r = await realFetch(base + path, { method, headers: { cookie: `tx_session=${token}`, ...(body ? { "content-type": "application/json" } : {}) }, body: body ? JSON.stringify(body) : undefined });
    return { status: r.status, body: await r.json().catch(() => null) };
  };

  before(async () => {
    process.env.DATABASE_URL = TEST;
    process.env.AZURE_OPENAI_ENDPOINT = "https://example.test/openai/v1";
    process.env.AZURE_OPENAI_API_KEY = "test-key";
    globalThis.fetch = async (url, init) => {
      const u = String(url?.url ?? url);
      if (/neon\.tech|127\.0\.0\.1|localhost/.test(u)) return realFetch(url, init);
      return fakeAzure(u, init);
    };
    ({ q, one } = await import("../server/db.js"));
    const { handle } = await import("../server/index.js");
    server = http.createServer(handle);
    await new Promise((r) => server.listen(0, "127.0.0.1", r));
    base = `http://127.0.0.1:${server.address().port}`;
    guardian = (await one("insert into guardian (email, pw_hash, name) values ($1, 'x', 'ship5-review') returning id", [`ship5-review+${RUN}@test.invalid`])).id;
    token = randomUUID() + randomUUID();
    await q("insert into auth_session (token_hash, guardian_id, expires_at) values ($1, $2, now() + interval '1 day')", [createHash("sha256").update(token).digest("hex"), guardian]);
    kid = (await one("insert into child (guardian_id, first_name, class_level, language_pref, teacher_id) values ($1, 'Zoya', 5, 'hinglish', 'asha') returning id", [guardian])).id;
    for (const p of ["core_tutoring", "memory", "learning_profile"]) await q("insert into consent (guardian_id, child_id, purpose, version, granted, method) values ($1, null, $2, 't', true, 't')", [guardian, p]);
    await q(`insert into child_controls (child_id, daily_minutes, hours_start, hours_end) values ($1, 45, '00:00', '23:59')
      on conflict (child_id) do update set hours_start = '00:00', hours_end = '23:59', daily_minutes = 45`, [kid]);
  });
  after(async () => {
    // a safeguarding incident holds the account by design; the test guardian is removed with its rows where the guard allows
    if (guardian) await q("delete from guardian where id = $1", [guardian]).catch((e) => console.warn("cleanup:", e.message));
    server?.close();
    globalThis.fetch = realFetch;
  });

  test("control: a predicate disclosure on the same lane DOES carry calm_steady (so the gap is the filter re-plan only)", async () => {
    const s = await call("/api/lesson/start", { method: "POST", body: { childId: kid, mode: "text", purpose: "practice" } });
    assert.equal(s.status, 201, JSON.stringify(s.body));
    const r = await call("/api/lesson/turn", { method: "POST", body: { lessonId: s.body.lessonId, childText: "I want to die", typed: true, turnSeq: 1 } });
    assert.equal(r.status, 200, JSON.stringify(r.body));
    assert.equal(r.body.move?.kind, "safeguard");
    assert.equal(r.body.ui?.teacherAffect?.display, "calm_steady");
  });

  test("a reply blocked by the content filter: move=safeguard AND ui.teacherAffect = calm_steady (the face goes neutral)", async () => {
    const s = await call("/api/lesson/start", { method: "POST", body: { childId: kid, mode: "text", purpose: "practice" } });
    assert.equal(s.status, 201, JSON.stringify(s.body));
    filterReplies = true;
    const r = await call("/api/lesson/turn", { method: "POST", body: { lessonId: s.body.lessonId, childText: "mummy bula rahi thi haan", typed: true, turnSeq: 1 } });
    filterReplies = false;
    assert.equal(r.status, 200, JSON.stringify(r.body));
    assert.equal(r.body.move?.kind, "safeguard", "the filter fails closed (pre-existing floor)");
    assert.match(r.body.teacherReply ?? "", /1098/);
    assert.match(r.body.teacherReply ?? "", /14416/, "both helplines on a filter safeguard");
    // the child disclosed nothing: never the DISCLOSURE opening, and each helpline once (review B1, related)
    assert.doesNotMatch(r.body.teacherReply ?? "", /batakar bilkul sahi kiya|right thing by telling/i, r.body.teacherReply);
    assert.equal((r.body.teacherReply.match(/1098/g) ?? []).length, 1, r.body.teacherReply);
    assert.equal(r.body.ui?.teacherAffect?.display, "calm_steady",
      `the face gets no safety cue on this safeguard turn: ui.teacherAffect = ${JSON.stringify(r.body.ui?.teacherAffect ?? null)}; the puppet keeps its resting warm smile over the helplines`);
  });
});
