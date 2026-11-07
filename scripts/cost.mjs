// What lessons cost (round 7, stream G: platform-cost-ledger). Reads the flight recorder's spend events and lesson.cost
// (migration 040); prices from server/cost/prices.js. The TEST branch by default (TAXILA_DB=test semantics); --prod reads
// production (read-only, main runs production reads). Never prints a connection string.
//
//   node scripts/cost.mjs --lesson ID [--write]   one lesson by meter and lane (--write stores it in lesson.cost)
//   node scripts/cost.mjs --day YYYY-MM-DD        all spend events of a UTC day by meter: in lessons vs outside them
//                                                 (worker, nightly), plus $ per lesson-minute over that day's ended lessons
//   node scripts/cost.mjs --child ID [--days 30]  that child's ended lessons: $ each, $ per minute
//   node scripts/cost.mjs --reconcile --day D     the day's ledger vs Azure Cost Management by meter (needs the service
//                                                 principal's Cost Management Reader; a live check)
import { SUB_PATH, arm, loadEnv } from "../infra/azure.mjs";

loadEnv();
const argv = process.argv.slice(2);
const flag = (f) => argv.includes(f);
const opt = (f, d) => { const i = argv.indexOf(f); return i >= 0 && argv[i + 1] && !argv[i + 1].startsWith("--") ? argv[i + 1] : d; };
if (flag("--prod")) {
  if (process.env.TAXILA_DB === "test") { console.error("cost: --prod with TAXILA_DB=test: pick one"); process.exit(2); }
  if (flag("--write")) { console.error("cost: --write is for the test branch; production lesson.cost is written by the lesson end"); process.exit(2); }
  delete process.env.TAXILA_DB;
} else process.env.TAXILA_DB = "test";
const { q, dbUrl } = await import("../server/db.js");
const { SPEND_KINDS, lessonCost, rollupLesson } = await import("../server/cost/rollup.js");
let host = "";
try { host = new URL(dbUrl()).host; } catch (e) { console.error(`cost: ${e.message}`); process.exit(2); }
console.log(`cost: ${flag("--prod") ? "PRODUCTION (read-only)" : "test branch"} ${host}`);
const usd = (x) => (x == null ? "-" : `$${x < 0.01 ? x.toFixed(5) : x.toFixed(3)}`);

function show(c) {
  console.log(`  total ${usd(c.usd)}${c.minutes ? ` over ${c.minutes} min = ${usd(c.usdPerMin)}/min (${usd(c.usdPerMin * 60)}/h)` : ""}${c.unpriced ? `; ${c.unpriced} events unpriced` : ""}`);
  for (const [m, t] of Object.entries(c.meters)) if (t.usd) console.log(`    ${m.padEnd(6)} ${usd(t.usd).padStart(10)}  ${Object.entries(t).filter(([k]) => k !== "usd").map(([k, v]) => `${k} ${v}`).join(", ")}`);
  const lanes = Object.entries(c.lanes).sort((a, b) => b[1] - a[1]);
  if (lanes.length) console.log(`    lanes: ${lanes.map(([k, v]) => `${k} ${usd(v)}`).join(" · ")}`);
}

try {
  if (opt("--lesson")) {
    const c = await rollupLesson(q, opt("--lesson"), { write: flag("--write") });
    console.log(`lesson ${opt("--lesson")}${flag("--write") ? " (stored in lesson.cost)" : ""}`);
    show(c);
  } else if (opt("--day") && !flag("--reconcile")) {
    const day = opt("--day");
    const rows = await q(`select e.kind, e.data, (l.id is not null) as in_lesson from trace_event e left join lesson l on l.id::text = e.sid
      where e.t >= $1::date and e.t < $1::date + 1 and e.kind = any($2)`, [day, SPEND_KINDS]);
    const ended = await q("select started_at, ended_at from lesson where ended_at >= $1::date and ended_at < $1::date + 1", [day]);
    const mins = ended.reduce((s, l) => s + (Date.parse(l.ended_at) - Date.parse(l.started_at)) / 60_000, 0);
    const inL = lessonCost(rows.filter((r) => r.in_lesson), { minutes: mins });
    console.log(`${day} (UTC): ${rows.length} spend events, ${ended.length} lessons ended (${Math.round(mins)} min)`);
    console.log(" in lessons:"); show(inL);
    console.log(" outside lessons (worker, jobs, unattributed):"); show(lessonCost(rows.filter((r) => !r.in_lesson)));
  } else if (opt("--child")) {
    const rows = await q(`select id, started_at, ended_at, cost from lesson where child_id = $1 and ended_at is not null
      and started_at > now() - make_interval(days => $2::int) order by started_at`, [opt("--child"), Number(opt("--days", 30))]);
    let tot = 0, min = 0;
    for (const l of rows) {
      const m = (Date.parse(l.ended_at) - Date.parse(l.started_at)) / 60_000;
      const c = l.cost ?? (await rollupLesson(q, l.id, { write: false }));
      tot += c.usd; min += m;
      console.log(`  ${new Date(l.started_at).toISOString().slice(0, 16)}  ${String(Math.round(m)).padStart(3)} min  ${usd(c.usd).padStart(9)}${l.cost ? "" : " (computed now)"}`);
    }
    console.log(`  ${rows.length} lessons, ${Math.round(min)} min, ${usd(tot)}${min ? ` = ${usd(tot / min)}/min` : ""}`);
  } else if (flag("--reconcile") && opt("--day")) {
    const day = opt("--day");
    const rows = await q("select kind, data from trace_event where t >= $1::date and t < $1::date + 1 and kind = any($2)", [day, SPEND_KINDS]);
    const ledger = lessonCost(rows);
    const body = { type: "ActualCost", timeframe: "Custom", timePeriod: { from: `${day}T00:00:00Z`, to: `${day}T23:59:59Z` },
      dataset: { granularity: "None", aggregation: { cost: { name: "Cost", function: "Sum" } },
        grouping: [{ type: "Dimension", name: "MeterSubCategory" }, { type: "Dimension", name: "Meter" }] } };
    const res = await arm("POST", `${SUB_PATH()}/providers/Microsoft.CostManagement/query?api-version=2023-03-01`, body);
    const cols = res.properties.columns.map((c) => c.name);
    const bill = res.properties.rows.map((r) => Object.fromEntries(cols.map((c, k) => [c, r[k]]))).filter((r) => r.Cost > 0).sort((a, b) => b.Cost - a.Cost);
    console.log(`${day}: ledger ${usd(ledger.usd)} (chat ${usd(ledger.meters.chat.usd)}, tts ${usd(ledger.meters.tts.usd)}, stt ${usd(ledger.meters.stt.usd)}, s2s ${usd(ledger.meters.s2s.usd)}, image ${usd(ledger.meters.image.usd)})`);
    console.log(`  billed ${usd(bill.reduce((s, r) => s + r.Cost, 0))} in this subscription (the primary AI account may bill elsewhere: stream3.md item 5):`);
    for (const r of bill.slice(0, 25)) console.log(`    ${usd(r.Cost).padStart(9)}  ${r.MeterSubCategory ?? ""} · ${r.Meter ?? ""}`);
  } else {
    console.error("usage: node scripts/cost.mjs --lesson ID [--write] | --day YYYY-MM-DD | --child ID [--days N] | --reconcile --day D  [--prod]");
    process.exit(2);
  }
} catch (e) {
  console.error(`cost: ${e.message}`);
  process.exitCode = 1;
}
process.exit(process.exitCode ?? 0);
