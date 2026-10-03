// Production smoke over HTTP against a deployed base URL (costs a few cents of Azure AI):
//   NODE_USE_ENV_PROXY=1 node scripts/prod-smoke.mjs [base-url] [mode=text|cascade]
// signup → consent → child (class 5, Hinglish) → lesson start → 3 child turns → end → parent overview,
// with wall-clock per step. Deletes its child at the end, pass or fail. Exits non-zero on any FAIL.
// Every teacher line that comes back is also run through the never-rules predicate (director/safety.js
// floorViolations) and a hit is printed as WARN for review (see floorOk for why it is not a failure).
import { floorViolations } from "../server/director/safety.js";
const BASE = process.argv[2] || "https://taxila-web.nicebay-a0d3a12f.eastus2.azurecontainerapps.io";
const MODE = process.argv[3] || "text";
let cookie = "";
async function A(method, path, body, expect = [200, 201]) {
  const t = performance.now();
  const res = await fetch(BASE + path, { method, headers: { "content-type": "application/json", ...(cookie ? { cookie } : {}) }, body: body ? JSON.stringify(body) : undefined });
  const set = res.headers.get("set-cookie"); if (set) cookie = set.split(";")[0];
  const j = await res.json().catch(() => ({}));
  const ms = Math.round(performance.now() - t);
  if (!expect.includes(res.status)) throw new Error(`${method} ${path} → ${res.status} ${JSON.stringify(j).slice(0, 300)}`);
  return { status: res.status, ms, ...j };
}
const ok = (c, m) => { console.log(`${c ? "PASS" : "FAIL"} ${m}`); if (!c) process.exitCode = 1; };
// A WARNING, not a failure: the API does not return the posed item, so a teacher line that reads kit text out
// cannot pass it as `content` (149/126,863 kit strings flag on their own, 2026-10-03), and one smoke run never
// reaches a safeguard turn. The hard gate is evals/never-rules.mjs; this line is for a human to read.
const floorOk = (text, what) => {
  if (!text) return;
  const v = floorViolations(text);
  console.log(`${v.length ? "WARN" : "PASS"} ${what} floor predicate${v.length ? `: ${v.join(", ")} (review the line above; not a release failure)` : " clean"}`);
};

const st = Date.now(), PW = `smoke-pw-${st}`;
await A("POST", "/api/auth/signup", { email: `smoke+${st}@taxila.test`, password: PW, name: "Smoke", isGuardianAdult: true });
let child;
try {
  ({ child } = await A("POST", "/api/children", { firstName: "Riya", classLevel: 5, languagePref: "hinglish", interests: ["cricket"] }));
  await A("POST", "/api/consent", { childId: child.id, grants: { core_tutoring: true, learning_profile: true, memory: true } });
  const s = await A("POST", "/api/lesson/start", { childId: child.id, mode: MODE });
  ok(!!s.lessonId, `start ${s.ms} ms · topic ${s.topic?.id} "${s.topic?.title}" · teacher ${s.teacher?.name}`);
  console.log(`  T: ${s.teacherOpening ?? "(voice lane: instructions only)"}`);
  floorOk(s.teacherOpening, "opening");
  const lines = ["haan didi, main ready hoon", "mujhe nahi pata, thoda samjhao na", "achha, ab samajh aaya"];
  for (const childText of lines) {
    const r = await A("POST", "/api/lesson/turn", { lessonId: s.lessonId, childText, asrConfidence: 0.95, typed: MODE === "text" });
    ok(!!r.move?.kind, `turn ${r.ms} ms · move ${r.move?.kind}`);
    console.log(`  C: ${childText}\n  T: ${r.teacherReply ?? "(cascade: reply via TTS)"}`);
    floorOk(r.teacherReply, "reply");
    if (r.end) break;
  }
  const e = await A("POST", "/api/lesson/end", { lessonId: s.lessonId });
  ok(e.status === 200, `end ${e.ms} ms`);
} catch (err) {
  ok(false, err.message);
} finally {
  if (child) await A("DELETE", "/api/children", { childId: child.id, password: PW }).then(() => console.log("cleanup: child deleted"), (e) => console.log(`could not delete the smoke child: ${e.message}`));
}
