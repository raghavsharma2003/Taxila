// round2 truth (V1 "the delayed check leads the next lesson every time it is due"): a deterministic simulator of the
// session-open pipeline lesson.js runs, on REAL kits and the REAL ledger fold, no network and no DB:
//   ledger (fold of synthetic evidence) → dueForChecks → planChecks (band openers) → warmupItemsFor → initLessonState →
//   step(start)
// A child carries 1-4 skills learned_today (anchored 1-5 learning days ago, no delayed pass yet) and 0-8 older skills
// that already passed their certifying check (mastered, FSRS reviews coming due), in maths classes 1-9.
//
// Measured per lesson-purpose start:
//   due      the skills whose delayed check is due (display ≥ learned_today, no delayed pass, ≥ 20 h past the anchor)
//   led      the opening move poses an item on a due skill
//   covered  every due skill (up to the warm-up cap) gets an opener item this lesson
//   lost     a due skill gets no opener although the warm-up had room (or was taken by a non-due review)
//
// usage: node evals/next-day-check/sim.mjs [--n 2000] [--seed 7] [--json out.json]
// SIM_ROOT=<tree> runs the same harness against another tree's server code (e.g. a patched copy); default: this repo.
import { readFileSync, writeFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
const ROOT = process.env.SIM_ROOT ? pathToFileURL(process.env.SIM_ROOT.replace(/\/?$/, "/")) : new URL("../../", import.meta.url);
const imp = (p) => import(new URL(p, ROOT).href);
const { fold, newLedger, rank } = await imp("server/learner/kt/ledger.js");
const { dueForChecks } = await imp("server/learner/live.js");
const { warmupItemsFor } = await imp("server/learner/checks.js");
const { planChecks } = await imp("server/comprehension/weave.js");
const { BAND_BUDGET, bandOf } = await imp("server/comprehension/params.js");
const { initLessonState, step, LIMITS } = await imp("server/director/state.js");
const { getKit } = await imp("server/content/index.js");

const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d; };
const N = Number(arg("--n", 2000)), SEED = Number(arg("--seed", 7)), OUT = arg("--json", null);
// --exhaust: day 0 answers EVERY practice-eligible check-kind item of the skill (practice paths skip the reserve,
// director/items.js checkReserveIds), as a long lesson does; default: two items, the kinder case.
const EXHAUST = process.argv.includes("--exhaust");
const { checkReserveIds } = await imp("server/director/items.js");
const { checkDayOk } = await imp("server/learner/kt/ledger.js");
let rs = SEED >>> 0;
const rnd = () => { rs = (rs * 1664525 + 1013904223) >>> 0; return rs / 2 ** 32; };
const pick = (xs) => xs[Math.floor(rnd() * xs.length)];
const H = 3600_000, DAY = 24 * H;
const NOW = Date.UTC(2026, 9, 20, 4, 30);   // 10:00 IST
const CHECK = ["near_transfer", "practice", "retrieval"];

const kitsByClass = {};
for (let c = 1; c <= 9; c++) {
  const raw = JSON.parse(readFileSync(new URL(`data/kits/c${c}-maths.json`, ROOT), "utf8"));
  kitsByClass[c] = raw.topics.map((t) => t.topicId);
}

let n = 0;
const ev = (sid, t, skillId, o) => ({ id: `${sid}-${++n}`, seq: n, sessionId: sid, sessionStartAt: new Date(t).toISOString(), at: new Date(t).toISOString(),
  episodeId: `${sid}-ep${n}`, skillIds: [skillId], target: skillId, cls: "item.open", outcome: 0, grader: "code", graderVersion: "g", topicType: "T3", ...o });

/** Events that make one skill learned_today at t (5 unaided right on its check-kind items + a why), and optionally certify it at t2. */
function learnEvents(kit, skillId, t, t2) {
  const items = kit.items.filter((i) => i.skillId === skillId && CHECK.includes(i.kind)).sort((a, b) => (a.difficulty ?? 3) - (b.difficulty ?? 3));
  const reserve = checkReserveIds(kit);
  let used;
  if (EXHAUST) { used = items.filter((i) => !reserve.has(i.id)); if (!used.length) return null; }
  else { if (items.length < 3) return null; used = items.slice(0, 2); }
  const u = (k) => used[k % used.length].id;
  const sid = `L${n}`;
  const out = [ev(sid, t, skillId, { itemKey: u(0) }), ev(sid, t, skillId, { itemKey: u(1) }), ev(sid, t, skillId, { itemKey: u(2) }),
    ev(sid, t, skillId, { cls: "probe.why", grader: "llm", itemKey: u(1) }), ev(sid, t, skillId, { itemKey: u(3) })];
  for (let k = 4; k < used.length; k++) out.push(ev(sid, t, skillId, { itemKey: u(k) }));
  if (t2) { const fresh = items.find((i) => !used.includes(i)) ?? items[items.length - 1]; out.push(ev(`M${n}`, t2, skillId, { itemKey: fresh.id })); }
  return out;
}

async function child(i) {
  const cls = 1 + Math.floor(rnd() * 9);
  const topics = kitsByClass[cls];
  let L = newLedger({ childId: `c${i}`, classLevel: cls });
  const events = [];
  const nL = 1 + Math.floor(rnd() * 4), nM = Math.floor(rnd() * 9);
  const used = new Set();
  const plan = [...Array(nL).fill("L"), ...Array(nM).fill("M")];
  for (const kind of plan) {
    const topicId = pick(topics);
    const kit = await getKit(topicId, { generate: false });
    if (!kit) continue;
    const sk = pick(kit.skills).id;
    if (used.has(sk)) continue;
    used.add(sk);
    const t = kind === "L" ? NOW - pick([1, 1, 2, 3, 5]) * DAY - pick([0, 2, 6]) * H : NOW - (8 + Math.floor(rnd() * 50)) * DAY;
    const evs = learnEvents(kit, sk, t, kind === "M" ? t + (2 + Math.floor(rnd() * 3)) * DAY : null);
    if (evs) events.push(...evs.map((e) => ({ ...e, _t: t })));
  }
  events.sort((a, b) => a._t - b._t || a.seq - b.seq);
  events.forEach((e, k) => { e.seq = k + 1; delete e._t; });
  L = fold(L, events);
  return { cls, L, today: pick(topics) };
}

const CTX = { firstName: "Riya", teacherName: "Asha", teacherId: "asha", protege: { name: "Bittu", what: "a puppy" }, lang: "english",
  interests: [], firstMeeting: false, hasCallback: false, topicTitle: "Today", address: "tum" };

const tally = { exhaust: EXHAUST, certDue: 0, certPosed: 0, certifiableLessons: 0, certLed: 0, uncertifiableSkills: 0, lessons: 0, withDue: 0, led: 0, covered: 0, dueSkills: 0, dueSkillsPosed: 0, lostWithRoom: 0, noItem: 0, byBand: {} };
const misses = [];
for (let i = 0; i < N; i++) {
  const { cls, L, today } = await child(i);
  const due = Object.values(L.skills).filter((s) => rank(s.display) >= rank("learned_today") && !s.flags.delayed && s.anchorAt && NOW - Date.parse(s.anchorAt) >= 20 * H)
    .map((s) => s.skillId);
  const band = bandOf(cls);
  const checks = planChecks({ q: [], due: dueForChecks(L, NOW), beliefs: {}, now: new Date(NOW).toISOString(), openers: BAND_BUDGET[band].openers });
  const warm = await warmupItemsFor(checks.openers, { ledger: L, now: NOW });
  const kit = await getKit(today, { generate: false });
  const s0 = initLessonState({ topicId: kit.topicId, kit, warmupItems: warm, openers: warm.map((w) => w.skillId), seed: 7, now: NOW,
    ctx: { ...CTX, classLevel: cls, ageBand: cls <= 4 ? "6-9" : "10-15", sessionId: `s${i}` } });
  const r0 = step(s0, { event: "start", kit, now: NOW });
  const posed = s0.warmup.map((w) => w.skillId);
  const b = (tally.byBand[band] ??= { withDue: 0, led: 0, covered: 0 });
  tally.lessons += 1;
  if (!due.length) continue;
  tally.withDue += 1; b.withDue += 1;
  const firstSkill = r0.move.itemId ? s0.warmup.find((w) => w.id === r0.move.itemId)?.skillId : null;
  const led = !!firstSkill && due.includes(firstSkill);
  const want = Math.min(due.length, LIMITS.warmupMax, BAND_BUDGET[band].openers);
  const got = due.filter((d) => posed.includes(d)).length;
  tally.led += led; b.led += led;
  tally.covered += got >= want; b.covered += got >= want;
  tally.dueSkills += due.length; tally.dueSkillsPosed += got;
  // V1.3: lessons where at least one due skill CAN be certified (≥ 2 days, an unseen check-kind item exists): does the
  // first opener certify? And how many due skills can never be (no unseen item left: content, not scheduling).
  let certifiable = false;
  for (const d of due) if (checkDayOk(L.skills[d].anchorAt, new Date(NOW).toISOString())) {
    const k = await getKit(d.replace(/-s\d+$/, ""), { generate: false });
    const seen = new Set(L.skills[d].items ?? []);
    if (k?.items.some((it) => it.skillId === d && CHECK.includes(it.kind) && !seen.has(it.id))) certifiable = true; else tally.uncertifiableSkills += 1;
  }
  if (certifiable) { tally.certifiableLessons += 1; const w0 = s0.warmup[0]; if (w0 && !w0.review && r0.move.itemId === w0.id) tally.certLed += 1; }
  // V1.3: of the due skills ≥ 2 learning days past the anchor, how many got a CERTIFYING opener (an item never met)
  for (const d of due) if (checkDayOk(L.skills[d].anchorAt, new Date(NOW).toISOString())) {
    tally.certDue += 1;
    const w = s0.warmup.find((x) => x.skillId === d);
    if (w && !w.review && !(L.skills[d].items ?? []).includes(w.id)) tally.certPosed += 1;
  }
  if (got < want) {
    const planned = due.filter((d) => checks.openers.includes(d));
    if (planned.length > due.filter((d) => posed.includes(d)).length) tally.noItem += 1; else tally.lostWithRoom += 1;
    if (misses.length < 12) misses.push({ cls, band, due, openers: checks.openers, posed, first: firstSkill });
  }
}
const pct = (a, b) => (b ? Math.round((1000 * a) / b) / 10 : null);
const res = { n: N, seed: SEED, ...tally, ledPct: pct(tally.led, tally.withDue), coveredPct: pct(tally.covered, tally.withDue), misses };
console.log(JSON.stringify({ ...res, misses: misses.slice(0, 4) }, null, 1));
if (OUT) writeFileSync(OUT, JSON.stringify(res, null, 1));
