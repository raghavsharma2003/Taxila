// BUILD-SPEC §11.4 (Kaksha acceptance "Truth"): the Debrief's "Now secure" equals the ledger diff on 20 scripted sessions
// with REAL delayed checks; 0 false "secure". Runs against a LOCAL production build on this stream's Neon TEST branch
// (tests/prod/r4-timeline/serve.sh), never production: the test clock moves learning days.
//
// Per account (10 accounts × 2 evaluated sessions = 20):
//   day 0    a scripted lesson on topic A: right answers, reasons given, the protégé taught (the generative pass that makes
//            a skill learned today, so a delayed check is due) — w1c-three-day's child (tests/prod/_w1c.mjs)
//   +1 day   EVALUATED session 1 on topic B: its opener is A's delayed check. Half the accounts answer every A item RIGHT
//            (a real secure crossing can happen), half answer A items WRONG (none may be claimed)
//   +2 days  EVALUATED session 2, a review of A, answered right
// For each evaluated session:
//   claim    = the Debrief's own function: nowSecure(map read at lesson start, map read after the lesson ends)
//              (src/ui-v3/kaksha/lesson/debrief.ts; the client reads GET /api/child/map exactly so)
//   ledger   = skills whose ONE claim-source state (server/reports/truth.js loadTruth → MAP_SHAPE) is secure after the
//              lesson and was not before, read from the database directly (not through the map route)
//   checks   T1 claim == ledger (as sets) · T2 no false secure (claim ⊆ ledger) · T3 every claimed skill was CAUSED in
//            this lesson: a scored right engine row in this lesson ≥ 20 h after the skill's first scored row (DELAY_MS)
// Run (servers as tests/prod/r4-timeline/README.md, with --env-file=tests/prod/prod-routing.env):
//   TAXILA_BASE=http://127.0.0.1:5190 NODE_USE_ENV_PROXY=1 node --env-file=.env.local tests/prod/r4-kaksha-truth.mjs [--accounts 10]
// Writes docs/design/round4/build/kaksha/truth-k.json.
import fs from "node:fs";
import path from "node:path";
import { withTestAccount, ok, warn, done, isLocal, BASE } from "./lib.mjs";
import { driveLesson, advanceClock } from "./_w1c.mjs";
import { nowSecure } from "../../src/ui-v3/kaksha/lesson/debrief.ts";

const ROOT = new URL("../..", import.meta.url).pathname;
const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i > 0 ? process.argv[i + 1] : d; };
const ACCOUNTS = Number(arg("accounts", 10));
if (!isLocal) { console.log(`refusing: ${BASE} is not a local server (this harness moves the test clock)`); process.exit(1); }
const DBURL = process.env.TEST_DATABASE_URL;
if (!DBURL) { console.log("no TEST_DATABASE_URL: the ledger cannot be read; stopping"); process.exit(1); }
if (new URL(DBURL).hostname.startsWith("ep-jolly-resonance-")) { console.log("refusing: that is the production database"); process.exit(1); }
const { neon } = await import("@neondatabase/serverless");
const sql = neon(DBURL);
const q = (text, params = []) => sql.query(text, params);
const { loadTruth, MAP_SHAPE } = await import("../../server/reports/truth.js");
const { DELAY_MS } = await import("../../server/reports/config.js");
const CAT = JSON.parse(fs.readFileSync(path.join(ROOT, "data/kaksha/catalog.json"), "utf8"));
const KIT = JSON.parse(fs.readFileSync(path.join(ROOT, "data/kits/c5-maths.json"), "utf8"));
const TOPICS = KIT.topics.filter((t) => (t.items ?? []).length >= 4).map((t) => t.topicId);

/** The map exactly as the Kaksha frame reads it (an empty read is unknown, as loadChildMap treats it). */
async function mapOf(api, childId) {
  const m = await api("GET", `/api/child/map?childId=${encodeURIComponent(childId)}`);
  if (m.hidden) return { hidden: true, skills: [] };
  return m.empty ? null : { skills: m.skills ?? [] };
}
/** The ledger's secure set, from the database (the one claim source's fold, not the map route). */
async function ledgerSecure(childId) {
  const t = await loadTruth({ id: childId }, { q });
  const ids = new Set([...t.bySkill.keys(), ...t.projection.keys()]);
  return { secure: new Set([...ids].filter((id) => MAP_SHAPE[t.state(id).key] === "secure")), truth: t };
}

const sessions = [];
for (let a = 0; a < ACCOUNTS; a++) {
  const A = TOPICS[(a * 2) % TOPICS.length], B = TOPICS[(a * 2 + 1) % TOPICS.length];
  const answersA = a % 2 === 0 ? "right" : "wrong";
  await withTestAccount(async ({ api, child }) => {
    // day 0: learn A (right answers, reasons, the protégé taught)
    await driveLesson(api, child.id, { topicId: A, maxTurns: 18, explain: true, teach: true });
    for (const [n, days, topicId, wrongOn] of [[1, 1, B, answersA === "wrong" ? A : null], [2, 2, A, null]]) {
      await advanceClock(api, days);
      const before = await mapOf(api, child.id);
      const lb = await ledgerSecure(child.id);
      const isA = (ui) => !!ui?.ask?.itemId && String(ui.ask.itemId).startsWith(`${A}-`);
      const run = await driveLesson(api, child.id, { topicId, maxTurns: 14, explain: true, wrong: (_i, ui) => !!wrongOn && isA(ui) });
      const after = await mapOf(api, child.id);
      const la = await ledgerSecure(child.id);
      const claim = nowSecure(before, after, CAT);
      const ledger = [...la.secure].filter((id) => !lb.secure.has(id)).sort();
      const claimed = (claim ?? []).map((k) => k.skillId).sort();
      // T3: each claimed skill has a scored right row in THIS lesson, ≥ 20 h after the skill's first scored row
      const caused = claimed.map((id) => {
        const rows = la.truth.rowsOf(id).filter((r) => r.scored);
        const first = rows.length ? Math.min(...rows.map((r) => Date.parse(r.at))) : Infinity;
        return rows.some((r) => r.lessonId === run.lessonId && r.result === "right" && Date.parse(r.at) - first >= DELAY_MS);
      });
      const s = { account: a, session: n, topic: topicId, answersA: n === 1 ? answersA : "right", lessonId: run.lessonId, turns: run.turns.length,
        claim: claim === null ? null : claimed, ledger, falseSecure: claimed.filter((id) => !ledger.includes(id)), missed: claim === null ? null : ledger.filter((id) => !claimed.includes(id)), caused };
      sessions.push(s);
      ok(claim !== null, `a${a} s${n}: the map was readable before and after (the Debrief can speak)`);
      ok(s.falseSecure.length === 0, `a${a} s${n}: no false "secure" (claimed ${claimed.length}, ledger ${ledger.length})`);
      ok(claim === null || s.missed.length === 0, `a${a} s${n}: Now secure == the ledger diff${s.missed?.length ? ` (missed ${s.missed.join(", ")})` : ""}`);
      ok(caused.every(Boolean), `a${a} s${n}: every claimed skill was caused in this lesson by a delayed success`);
    }
  }, { tag: "r4k-truth", child: { classLevel: 5, languagePref: "hinglish" } });
}

const positives = sessions.filter((s) => (s.claim ?? []).length > 0).length;
if (!positives) warn("no session crossed to secure: T1/T2 held, but nothing was claimed (the positive path is untested)");
fs.writeFileSync(path.join(ROOT, "docs/design/round4/build/kaksha/truth-k.json"), JSON.stringify({
  date: new Date().toISOString().slice(0, 10), base: "local production build on the stream's Neon TEST branch; test clock (+1, +2 learning days); scripted text child from data/kits (tests/prod/_w1c.mjs)",
  accounts: ACCOUNTS, sessions: sessions.length, positives, falseSecure: sessions.reduce((n, s) => n + s.falseSecure.length, 0),
  missed: sessions.reduce((n, s) => n + (s.missed?.length ?? 0), 0), unreadable: sessions.filter((s) => s.claim === null).length, rows: sessions,
}, null, 1));
done();
