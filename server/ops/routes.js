// Round 7, stream G (platform-observability-gaps): the owner's ops page. One view of what is live and what it costs:
// live lessons, lesson-turn latency p50/p90, 5xx by route, and $ per lesson-minute from lesson.cost (migration 040).
//   GET /api/ops           the page (HTML; reads the JSON below every 30 s)
//   GET /api/ops/summary   ?hours=24 (1-168) → the numbers
// Who: a signed-in guardian whose email (or its sha256) is in TAXILA_OPS_FOR, the same list shape as the other owner
// cohorts (TAXILA_ACK_CONTINUER_FOR), so the owner's account is keyed by env without a code change. Anyone else gets 404.
// The trace numbers read server rows only (src = 'server'): POST /api/trace/batch takes any client `kind`, so a client
// row of kind srv.res would otherwise add a fake live lesson, 5xx or latency sample (PLAT-14).
// Counts and timings only: no child names, no text; a live lesson shows as the first 8 characters of its id.
import { createHash } from "node:crypto";
import { requireGuardian } from "../auth.js";
import { q } from "../db.js";
import { notFound, send } from "../http.js";

const sha256 = (s) => createHash("sha256").update(s).digest("hex");

/** Is this email on the ops list (TAXILA_OPS_FOR: emails or sha256 hex of them, comma-separated)? PURE given env. */
export function opsAllowed(email, env = process.env) {
  const e = String(email ?? "").trim().toLowerCase();
  if (!e) return false;
  const h = sha256(e);
  return String(env.TAXILA_OPS_FOR ?? "").split(",").map((v) => v.trim().toLowerCase()).some((v) => v && (v === e || v === h));
}

async function owner(req) {
  let g;
  try { g = await requireGuardian(req); } catch { throw notFound(); }
  if (!opsAllowed(g.email)) throw notFound();
  return g;
}

const TURN = "POST /api/lesson/turn";

/** The numbers. `query` = server/db.js q (injected for tests). */
export async function opsSummary(query, { hours = 24 } = {}) {
  const h = Math.min(168, Math.max(1, Math.round(Number(hours) || 24)));
  const [live, turns, errs, cost, meters] = await Promise.all([
    query(`select sid, min(t) as first, max(t) as last, count(*)::int as calls from trace_event
      where kind = 'srv.res' and src = 'server' and data->>'route' like 'POST /api/lesson/%' and t > now() - interval '15 minutes'
      and sid ~ '^[0-9a-f-]{36}$' group by sid having max(t) > now() - interval '5 minutes' order by max(t) desc limit 50`),
    query(`select count(*)::int as n,
        percentile_cont(0.5) within group (order by (data->>'ms')::numeric) as p50,
        percentile_cont(0.9) within group (order by (data->>'ms')::numeric) as p90,
        count(*) filter (where (data->>'status')::int >= 500)::int as errors
      from trace_event where kind = 'srv.res' and src = 'server' and data->>'route' = $2 and t > now() - make_interval(hours => $1::int)`, [h, TURN]),
    query(`select data->>'route' as route, count(*)::int as n from trace_event
      where kind = 'srv.res' and src = 'server' and (data->>'status')::int >= 500 and t > now() - make_interval(hours => $1::int)
      group by 1 order by 2 desc limit 10`, [h]),
    query(`select count(*)::int as lessons, coalesce(sum((cost->>'usd')::numeric), 0)::float8 as usd,
        coalesce(sum(extract(epoch from ended_at - started_at) / 60), 0)::float8 as minutes,
        count(*) filter (where cost is null)::int as uncosted,
        coalesce(sum(extract(epoch from ended_at - started_at) / 60) filter (where cost is not null), 0)::float8 as costed_minutes
      from lesson where ended_at > now() - make_interval(hours => $1::int)`, [h]),
    query(`select m.key as meter, coalesce(sum((m.value->>'usd')::numeric), 0)::float8 as usd
      from lesson, jsonb_each(cost->'meters') m where ended_at > now() - make_interval(hours => $1::int) and cost is not null
      group by 1 order by 2 desc`, [h]),
  ]);
  const t = turns[0] ?? {}, c = cost[0] ?? {};
  // $ per minute over the costed lessons' minutes only (PLAT-42): dividing costed $ by every lesson's minutes understated it
  const costedMin = Number(c.costed_minutes) || 0;
  return {
    at: new Date().toISOString(), hours: h,
    live: { lessons: live.length, list: live.map((r) => ({ id: String(r.sid).slice(0, 8), minutes: Math.round((Date.parse(r.last) - Date.parse(r.first)) / 6000) / 10, calls: r.calls, lastSecAgo: Math.round((Date.now() - Date.parse(r.last)) / 1000) })) },
    turn: { n: t.n ?? 0, p50: t.p50 == null ? null : Math.round(t.p50), p90: t.p90 == null ? null : Math.round(t.p90), errors: t.errors ?? 0 },
    errors: errs.map((r) => ({ route: r.route, n: r.n })),
    cost: { lessons: c.lessons ?? 0, uncosted: c.uncosted ?? 0, minutes: Math.round((c.minutes ?? 0) * 10) / 10, usd: Math.round((c.usd ?? 0) * 1e5) / 1e5,
      usdPerMin: costedMin ? Math.round((c.usd / costedMin) * 1e6) / 1e6 : null, meters: Object.fromEntries(meters.map((m) => [m.meter, Math.round(m.usd * 1e5) / 1e5])) },
  };
}

async function summary(req, res) {
  await owner(req);
  const hours = new URL(req.url || "/", "http://x").searchParams.get("hours");
  send(res, 200, await opsSummary(q, { hours }));
}

export const PAGE = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Taxila ops</title><meta name="robots" content="noindex">
<style>
:root{--bg:#fbfaf7;--fg:#1d1b17;--mute:#6b665c;--line:#e6e1d6;--ok:#2f7d4f;--bad:#b4402c;--card:#fff}
@media (prefers-color-scheme:dark){:root{--bg:#141310;--fg:#ece8df;--mute:#a19b8f;--line:#2c2a25;--card:#1c1b17}}
body{margin:0;background:var(--bg);color:var(--fg);font:15px/1.45 system-ui,sans-serif}main{max-width:960px;margin:0 auto;padding:16px}
h1{font-size:18px;margin:4px 0 12px}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px}
.card{background:var(--card);border:1px solid var(--line);border-radius:10px;padding:12px}.k{color:var(--mute);font-size:12px;text-transform:uppercase;letter-spacing:.04em}
.v{font-size:26px;font-variant-numeric:tabular-nums;margin-top:2px}.s{color:var(--mute);font-size:13px}table{width:100%;border-collapse:collapse;font-variant-numeric:tabular-nums}
td,th{text-align:left;padding:4px 6px;border-bottom:1px solid var(--line);font-size:13px}.bad{color:var(--bad)}select{font:inherit}
</style></head><body><main>
<h1>Taxila ops <span class="s" id="at"></span> <select id="h"><option>1</option><option selected>24</option><option>168</option></select> <span class="s">hours</span></h1>
<div class="grid">
<div class="card"><div class="k">Live lessons</div><div class="v" id="live">–</div><div class="s">a lesson call in the last 5 min</div></div>
<div class="card"><div class="k">Turn p50 / p90</div><div class="v" id="turn">–</div><div class="s" id="turnN"></div></div>
<div class="card"><div class="k">Cost per lesson-minute</div><div class="v" id="cpm">–</div><div class="s" id="cost"></div></div>
<div class="card"><div class="k">Server errors (5xx)</div><div class="v" id="err">–</div><div class="s">all routes</div></div>
</div>
<h2 class="k" style="margin-top:20px">Live now</h2><table id="list"><tr><th>lesson</th><th>minutes</th><th>calls</th><th>last call</th></tr></table>
<h2 class="k" style="margin-top:20px">Cost by meter</h2><table id="meters"></table>
<h2 class="k" style="margin-top:20px">5xx by route</h2><table id="errs"></table>
</main><script>
const $=(i)=>document.getElementById(i),usd=(x)=>x==null?"–":"$"+(x<0.01?x.toFixed(5):x.toFixed(3));
const row=(cells)=>"<tr>"+cells.map((c)=>"<td>"+String(c).replace(/[<&]/g,(m)=>m==="<"?"&lt;":"&amp;")+"</td>").join("")+"</tr>";
async function load(){try{const r=await fetch("/api/ops/summary?hours="+$("h").value,{credentials:"same-origin"});if(!r.ok)throw new Error(r.status);const d=await r.json();
$("at").textContent=new Date(d.at).toLocaleTimeString();$("live").textContent=d.live.lessons;
$("turn").textContent=d.turn.p50==null?"–":(d.turn.p50/1000).toFixed(2)+" / "+(d.turn.p90/1000).toFixed(2)+" s";$("turnN").textContent=d.turn.n+" turns, "+d.turn.errors+" failed";
$("cpm").textContent=d.cost.usdPerMin==null?"–":usd(d.cost.usdPerMin);$("cost").textContent=(d.cost.usdPerMin==null?"":usd(d.cost.usdPerMin*60)+"/h · ")+d.cost.lessons+" lessons, "+d.cost.minutes+" min, "+usd(d.cost.usd)+(d.cost.uncosted?" ("+d.cost.uncosted+" not costed)":"");
const e=d.errors.reduce((s,x)=>s+x.n,0);$("err").textContent=e;$("err").className="v"+(e?" bad":"");
$("list").innerHTML="<tr><th>lesson</th><th>minutes</th><th>calls</th><th>last call</th></tr>"+d.live.list.map((l)=>row([l.id,l.minutes,l.calls,l.lastSecAgo+" s ago"])).join("");
$("meters").innerHTML=Object.entries(d.cost.meters).map(([k,v])=>row([k,usd(v)])).join("")||row(["no costed lessons in the window",""]);
$("errs").innerHTML=d.errors.map((x)=>row([x.route,x.n])).join("")||row(["none",""]);}catch(err){$("at").textContent="could not load ("+err.message+")";}}
$("h").onchange=load;load();setInterval(load,30000);
</script></body></html>`;

async function page(req, res) {
  await owner(req);
  res.statusCode = 200;
  res.setHeader("content-type", "text/html; charset=utf-8");
  res.setHeader("cache-control", "no-store");
  res.setHeader("x-robots-tag", "noindex");
  res.end(PAGE);
}

export const routes = {
  "GET /api/ops": page,
  "GET /api/ops/summary": summary,
};
