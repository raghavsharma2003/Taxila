// Forge G1, the WIRED configuration (forge-g1 review fixes, 2026-10-03). Two parts:
//  A. Prefetch hit rate on real lesson item sequences (offline, pure plan(); no model, no DB): for every c4-c7
//     maths/science/EVS/English topic, the items a lesson reaches are the Director's own practice queue
//     (server/director/items.js buildPracticeQueue, <= 12). Hit rate = mountable queue items that the lesson-start
//     prefetch warmed / mountable queue items. Old algorithm (first `max` candidates, unplanned) vs new (planned).
//  B. The turn path on live Azure + Neon (+ Blob): requestFill({ lessonId, childId, kit, item, move, needByMs: 2000 })
//     with NO learner argument and DATABASE_URL set, exactly as call site 2 wires it, walking each topic's queue in
//     order. Arms: B1 no prefetch (learner memo cold, fill cache cold), B2 Neon warm (new process memory, new child),
//     B3 after an awaited lesson-start prefetch (new child, cold memory, cold Neon). Child ids are random UUIDs with
//     no child row: the 4 learner selects still run (same query cost), the profile falls back to the defaults.
// Run: NODE_USE_ENV_PROXY=1 node --env-file=.env.local evals/forge-g1-turn.mjs [--topics 8] [--seed 5] [--offline]
import { readFileSync, writeFileSync, readdirSync, mkdirSync } from "node:fs";
import { randomUUID } from "node:crypto";

const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d; };
const TOPICS = +arg("--topics", 8); const SEED = +arg("--seed", 5);
const OFFLINE = process.argv.includes("--offline");
const ROOT = new URL("../", import.meta.url);

const { requestFill, prefetchLessonFills, practiceOrder, findKitItem, flushUpgrades, _learnerMemoClear, TURN_NEED_BY_MS } = await import("../server/forge/index.js");
const { plan, liveRenderers } = await import("../server/forge/planner.js");
const { buildPracticeQueue } = await import("../server/director/items.js");
const { getKit } = await import("../server/content/index.js");
const { _memClear, flushWrites } = await import("../server/forge/cache.js");
const { rng } = await import("../server/forge/kitmath.js");

const pct = (xs, p) => { const s = [...xs].sort((a, b) => a - b); return s.length ? s[Math.min(s.length - 1, Math.ceil((p / 100) * s.length) - 1)] : null; };
const stats = (xs) => ({ n: xs.length, p50: pct(xs, 50), p95: pct(xs, 95), max: xs.length ? Math.max(...xs) : null });

// ── A. prefetch hit rate (offline) ──
const files = readdirSync(new URL("data/kits/", ROOT)).filter((f) => /^c[4-7]-(maths|science|evs|english)\.json$/.test(f)).sort();
const kits = [];
for (const f of files) for (const t of JSON.parse(readFileSync(new URL(`data/kits/${f}`, ROOT), "utf8")).topics) { const k = await getKit(t.topicId, { generate: false }); if (k) kits.push(k); }
const L0 = { child: null, recentWrong: [], activeMisconceptions: [], pKnown: {} };
function simulate(renderers, max = 6) {
  const out = { topics: 0, topicsWithMountable: 0, queueItems: 0, mountable: 0, oldWarm: 0, newWarm: 0, oldSlotsOnGaps: 0, newSlotsOnGaps: 0 };
  for (const kit of kits) {
    out.topics++;
    const ok = (item) => !!(item && plan({ item, kit, move: "practice", renderers }).primary);
    const queue = buildPracticeQueue(kit).map((id) => findKitItem(kit, id)).filter(Boolean);
    const mountable = new Set(queue.filter(ok).map((i) => i.id));
    out.queueItems += queue.length; out.mountable += mountable.size; if (mountable.size) out.topicsWithMountable++;
    // old: the first `max` non-teach-back kit items, unplanned (each gap item spent a slot and wrote a gap row)
    const old = kit.items.filter((i) => i.kind !== "teachback").slice(0, max);
    out.oldSlotsOnGaps += old.filter((i) => !ok(i)).length;
    out.oldWarm += old.filter((i) => mountable.has(i.id)).length;
    // new: practice order (the queue first), planned before counting
    const picks = [];
    for (const id of practiceOrder(kit, L0)) { const it = findKitItem(kit, id); if (picks.length < max && ok(it)) picks.push(it); }
    out.newWarm += picks.filter((i) => mountable.has(i.id)).length;
  }
  return { ...out, oldHitRate: +(out.oldWarm / out.mountable).toFixed(3), newHitRate: +(out.newWarm / out.mountable).toFixed(3) };
}
const prefetchSim = { liveToday: simulate(liveRenderers({})), withScene: simulate(new Set(["fraction-bars@1", "scene@1"])) };
console.log("A. prefetch hit rate", JSON.stringify(prefetchSim, null, 1));
if (OFFLINE) { console.log(JSON.stringify({ prefetchSim })); process.exit(0); }

// ── B. the turn path on the live stack ──
const R = new Set(["fraction-bars@1", "scene@1"]);   // exercise the scene path too (flag-off production mounts bars only)
const rand = rng(SEED);
const candidates = kits.map((kit) => ({ kit, queue: buildPracticeQueue(kit).map((id) => findKitItem(kit, id)).filter((it) => it && plan({ item: it, kit, move: "practice", renderers: R }).primary) }))
  .filter((x) => x.queue.length >= 2);
const chosen = candidates.map((x) => [rand(), x]).sort((a, b) => a[0] - b[0]).slice(0, TOPICS).map((x) => x[1]);
const { q } = await import("../server/db.js");
const dropped = await q("delete from asset_cache where kind = 'g1_fill' and body->>'v' = 'g1@2' returning key");
console.log(`dropped ${dropped.length} g1@2 rows`);
const runs = [];
async function walk(arm, { prefetch = false } = {}) {
  for (const { kit, queue } of chosen) {
    const childId = randomUUID(), lessonId = randomUUID();
    let prefetchMs = null;
    if (prefetch) { const t0 = performance.now(); await prefetchLessonFills({ lessonId, childId, kit, renderers: R }); prefetchMs = Math.round(performance.now() - t0); }
    for (const [i, item] of queue.entries()) {
      const r = await requestFill({ lessonId, childId, kit, item, move: "practice", needByMs: TURN_NEED_BY_MS, renderers: R });
      runs.push({ arm, topicId: kit.topicId, itemId: item.id, turn: i, status: r.status, cached: r.cached ?? null, total: r.timings?.total, learner: r.timings?.learner, cache: r.timings?.cache ?? 0,
        model: r.timings?.model ?? 0, flavour: r.flavour?.by ?? null, flavourError: r.flavour?.error ?? null, prefetchMs: i === 0 ? prefetchMs : null });
    }
  }
}
// B1 cold: nothing warmed anywhere
_memClear(); _learnerMemoClear();
await walk("B1_cold");
await flushWrites(); await flushUpgrades(); await flushWrites();
// B2 Neon warm: a fresh process (memory and learner memo empty), new children; the B1 rows (now upgraded) are in Neon
_memClear(); _learnerMemoClear();
await walk("B2_neon_warm");
const upgradedSeen = runs.filter((r) => r.arm === "B2_neon_warm" && r.flavour === "model").length;
// B3 prefetch: cold Neon and memory again, the lesson-start prefetch awaited before the first turn
await flushWrites(); await flushUpgrades();
const dropped2 = await q("delete from asset_cache where kind = 'g1_fill' and body->>'v' = 'g1@2' returning key");
_memClear(); _learnerMemoClear();
await walk("B3_after_prefetch", { prefetch: true });
await flushWrites(); await flushUpgrades(); await flushWrites();

const arms = {};
for (const arm of ["B1_cold", "B2_neon_warm", "B3_after_prefetch"]) {
  const rs = runs.filter((r) => r.arm === arm);
  arms[arm] = {
    turns: rs.length, ready: rs.filter((r) => r.status === "ready").length,
    total: stats(rs.map((r) => r.total)), firstTurn: stats(rs.filter((r) => r.turn === 0).map((r) => r.total)), laterTurns: stats(rs.filter((r) => r.turn > 0).map((r) => r.total)),
    learnerFirstTurn: stats(rs.filter((r) => r.turn === 0).map((r) => r.learner)), learnerLaterTurns: stats(rs.filter((r) => r.turn > 0).map((r) => r.learner)),
    cached: Object.fromEntries(["memory", "db", null].map((c) => [String(c), rs.filter((r) => r.cached === c).length])),
    modelOnRequestPath: rs.filter((r) => r.model > 0).length, flavour: { code: rs.filter((r) => r.flavour === "code").length, model: rs.filter((r) => r.flavour === "model").length },
    flavourErrors: [...new Set(rs.map((r) => r.flavourError).filter(Boolean))], prefetchMs: stats(rs.map((r) => r.prefetchMs).filter((x) => x !== null)),
  };
}
const summary = { at: new Date().toISOString(), host: "dev container (US), neon-http driver over the agent proxy; no India RTT; pg pool not measured",
  topics: chosen.map((c) => c.kit.topicId), queueTurnsPerTopic: chosen.map((c) => c.queue.length), dropped: [dropped.length, dropped2.length], prefetchSim, arms, upgradedSeenInB2: upgradedSeen };
mkdirSync(new URL("evals/results/", ROOT), { recursive: true });
writeFileSync(new URL(`evals/results/forge-g1-turn-${summary.at.slice(0, 10)}.json`, ROOT), JSON.stringify({ summary, runs }, null, 1));
console.log(JSON.stringify(summary, null, 1));
process.exit(0);
